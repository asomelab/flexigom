locals {
  common_tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Stack     = "global"
  }
}

# ---------------------------------------------------------------------------
# Route53 hosted zone — created only when root_domain is set.
# Leave root_domain empty ("") to skip DNS setup and use CloudFront default URLs.
# ---------------------------------------------------------------------------
resource "aws_route53_zone" "root" {
  count = var.root_domain != "" ? 1 : 0

  name = var.root_domain
  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# GitHub Actions OIDC provider. Lets workflows assume IAM roles WITHOUT
# long-lived AWS access keys. Created once per account (account-global).
# ---------------------------------------------------------------------------
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
  tags            = local.common_tags
}
