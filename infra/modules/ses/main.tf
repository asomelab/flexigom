# =============================================================================
# ses module
# Configures AWS SES for a custom domain:
#   - Domain identity + DKIM (3 CNAMEs in Route53)
#   - MAIL FROM subdomain + MX + SPF records
#   - DMARC TXT record
#   - IAM user + access key for SES API access from Railway backend
#
# NOTE: Domain verification completes automatically once Route53 becomes
# authoritative (nameserver cutover at the registrar). Do NOT add
# aws_ses_domain_identity_verification — it blocks until NS propagates
# and causes apply timeouts if DNS isn't live yet.
# =============================================================================

locals {
  mail_from_domain = "mail.${var.domain}"
}

# ---------------------------------------------------------------------------
# Configuration set — enables reputation metrics (Reputation.BounceRate /
# Reputation.ComplaintRate) published to CloudWatch. The backend sets
# ConfigurationSetName on every send so emails are attributed to this set.
# ---------------------------------------------------------------------------
resource "aws_ses_configuration_set" "this" {
  name = "${var.project}-config-set"

  reputation_metrics_enabled = true
  sending_enabled            = true
}

# ---------------------------------------------------------------------------
# Domain identity (no verification wait — see module header).
# ---------------------------------------------------------------------------
resource "aws_ses_domain_identity" "this" {
  domain = var.domain
}

# ---------------------------------------------------------------------------
# DKIM: SES generates 3 tokens; each becomes a CNAME in Route53.
# ---------------------------------------------------------------------------
resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

resource "aws_route53_record" "dkim" {
  for_each = toset(aws_ses_domain_dkim.this.dkim_tokens)

  zone_id = var.hosted_zone_id
  name    = "${each.value}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = ["${each.value}.dkim.amazonses.com"]
}

# ---------------------------------------------------------------------------
# MAIL FROM domain: sets the envelope From to mail.<domain> so SPF aligns.
# ---------------------------------------------------------------------------
resource "aws_ses_domain_mail_from" "this" {
  domain           = aws_ses_domain_identity.this.domain
  mail_from_domain = local.mail_from_domain
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.hosted_zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.${var.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.hosted_zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com -all"]
}

# ---------------------------------------------------------------------------
# DMARC (policy=none → monitor only; tighten to quarantine/reject later).
# ---------------------------------------------------------------------------
resource "aws_route53_record" "dmarc" {
  zone_id = var.hosted_zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none; rua=mailto:${var.dmarc_rua}"]
}

# ---------------------------------------------------------------------------
# IAM user + access key for the backend (Railway) to call SES API.
# State holds the secret key — ensure the state bucket is encrypted
# (flexigom-tfstate uses AES256 SSE). Copy keys to Railway; never commit.
# ---------------------------------------------------------------------------
resource "aws_iam_user" "ses_sender" {
  name = var.iam_user_name
  path = "/flexigom/"
  tags = var.tags
}

data "aws_iam_policy_document" "ses_send" {
  statement {
    sid     = "SendEmailViaSES"
    actions = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = [
      "arn:aws:ses:${var.region}:*:identity/${var.domain}",
      "arn:aws:ses:${var.region}:*:identity/*",
    ]
  }
}

resource "aws_iam_user_policy" "ses_send" {
  name   = "ses-send-${var.domain}"
  user   = aws_iam_user.ses_sender.name
  policy = data.aws_iam_policy_document.ses_send.json
}

resource "aws_iam_access_key" "ses_sender" {
  user = aws_iam_user.ses_sender.name
}
