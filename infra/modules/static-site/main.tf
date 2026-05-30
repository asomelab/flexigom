# =============================================================================
# static-site module
# Private S3 bucket served exclusively through CloudFront via Origin Access
# Control (OAC), optionally fronted by an ACM certificate (DNS-validated) and
# Route53 alias records.
#
# Without domain_aliases: uses the default CloudFront certificate
# (*.cloudfront.net) — ideal for initial testing before DNS is ready.
# With domain_aliases: creates ACM cert, validates via Route53, and sets
# custom aliases + HTTPS. hosted_zone_id is required in that case.
#
# IMPORTANT: CloudFront viewer certificates must live in us-east-1. This module
# uses the default AWS provider, so the calling stack MUST be configured for
# region us-east-1.
# =============================================================================

locals {
  primary_domain = length(var.domain_aliases) > 0 ? var.domain_aliases[0] : ""
  has_domain     = length(var.domain_aliases) > 0 && var.hosted_zone_id != ""

  module_tags = merge(
    {
      ManagedBy = "terraform"
      Module    = "static-site"
      Site      = var.name
    },
    var.tags,
  )
}

# ---------------------------------------------------------------------------
# Origin bucket (private — never publicly accessible).
# ---------------------------------------------------------------------------
resource "aws_s3_bucket" "site" {
  bucket = var.name
  tags   = local.module_tags
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ---------------------------------------------------------------------------
# ACM certificate — only when a custom domain is provided.
# ---------------------------------------------------------------------------
resource "aws_acm_certificate" "site" {
  count = local.has_domain ? 1 : 0

  domain_name               = local.primary_domain
  subject_alternative_names = slice(var.domain_aliases, 1, length(var.domain_aliases))
  validation_method         = "DNS"
  tags                      = local.module_tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.has_domain ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count = local.has_domain ? 1 : 0

  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ---------------------------------------------------------------------------
# Origin Access Control: lets CloudFront (and only CloudFront) read the bucket.
# ---------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.name}-oac"
  description                       = "OAC for ${var.name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS-managed cache policy: CachingOptimized.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = var.name
  default_root_object = var.default_root_object
  aliases             = local.has_domain ? var.domain_aliases : null
  price_class         = var.price_class
  tags                = local.module_tags

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.site.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy = local.has_domain ? "redirect-to-https" : "allow-all"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # SPA fallback: serve index.html for unknown paths so client-side routing works.
  dynamic "custom_error_response" {
    for_each = var.spa_fallback ? [403, 404] : []

    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/${var.default_root_object}"
      error_caching_min_ttl = 10
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.has_domain ? false : true
    acm_certificate_arn            = local.has_domain ? aws_acm_certificate_validation.site[0].certificate_arn : null
    ssl_support_method             = local.has_domain ? "sni-only" : null
    minimum_protocol_version       = local.has_domain ? "TLSv1.2_2021" : null
  }
}

# ---------------------------------------------------------------------------
# Bucket policy: allow read ONLY from this CloudFront distribution (OAC).
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "site" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json

  depends_on = [aws_s3_bucket_public_access_block.site]
}

# ---------------------------------------------------------------------------
# DNS alias records — only when a custom domain is provided.
# ---------------------------------------------------------------------------
resource "aws_route53_record" "alias_a" {
  for_each = local.has_domain ? toset(var.domain_aliases) : toset([])

  zone_id = var.hosted_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_aaaa" {
  for_each = local.has_domain ? toset(var.domain_aliases) : toset([])

  zone_id = var.hosted_zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
