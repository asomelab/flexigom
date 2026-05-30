locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Stack       = var.environment
  }
}

# Read shared resources (OIDC provider, hosted zone) created by the global stack.
data "terraform_remote_state" "global" {
  backend = "s3"

  config = {
    bucket = var.remote_state_bucket
    key    = "global/terraform.tfstate"
    region = var.aws_region
  }
}

# ---------------------------------------------------------------------------
# Static frontend: S3 + CloudFront(OAC) + ACM + Route53.
# ---------------------------------------------------------------------------
module "static_site" {
  source = "../../modules/static-site"

  name           = var.site_bucket_name
  domain_aliases = var.domain_aliases
  hosted_zone_id = data.terraform_remote_state.global.outputs.hosted_zone_id
  tags           = local.common_tags
}

# ---------------------------------------------------------------------------
# IAM role assumed by GitHub Actions (OIDC) to deploy this environment.
# Least privilege: only this bucket + this distribution, only from the
# configured branch of this repo.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "ci_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [data.terraform_remote_state.global.outputs.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${data.terraform_remote_state.global.outputs.github_org}/${data.terraform_remote_state.global.outputs.github_repo}:ref:refs/heads/${var.deploy_branch}",
      ]
    }
  }
}

resource "aws_iam_role" "ci_deploy" {
  name               = "${var.project}-frontend-deploy-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ci_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "ci_deploy" {
  statement {
    sid       = "ListSiteBucket"
    actions   = ["s3:ListBucket"]
    resources = [module.static_site.bucket_arn]
  }

  statement {
    sid       = "ReadWriteSiteObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${module.static_site.bucket_arn}/*"]
  }

  statement {
    sid       = "InvalidateDistribution"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [module.static_site.distribution_arn]
  }
}

resource "aws_iam_role_policy" "ci_deploy" {
  name   = "${var.project}-frontend-deploy-${var.environment}"
  role   = aws_iam_role.ci_deploy.id
  policy = data.aws_iam_policy_document.ci_deploy.json
}
