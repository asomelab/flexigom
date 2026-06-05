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

# ---------------------------------------------------------------------------
# Terraform CI role — assumed by the infra.yml workflow to run plan/apply
# across all stacks. Broader than the per-env ci_deploy roles (which only
# touch S3 + CloudFront). Scoped to this repo (any ref, any environment).
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "terraform_ci_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "terraform_ci" {
  name               = "${var.project}-terraform-ci"
  assume_role_policy = data.aws_iam_policy_document.terraform_ci_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "terraform_ci" {
  # State backend: full access to tfstate bucket and DynamoDB lock table.
  statement {
    sid     = "TFStateBucket"
    actions = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [
      "arn:aws:s3:::${var.project}-tfstate",
      "arn:aws:s3:::${var.project}-tfstate/*",
    ]
  }

  statement {
    sid       = "TFStateLock"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:UpdateItem", "dynamodb:DescribeTable"]
    resources = ["arn:aws:dynamodb:*:*:table/${var.project}-tflock"]
  }

  # CloudFront: manage distributions and functions.
  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  # S3: create and manage site buckets (bucket names are project-prefixed).
  statement {
    sid = "S3SiteBuckets"
    actions = [
      "s3:CreateBucket", "s3:DeleteBucket", "s3:GetBucketPolicy", "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy", "s3:GetBucketVersioning", "s3:PutBucketVersioning",
      "s3:GetBucketPublicAccessBlock", "s3:PutBucketPublicAccessBlock",
      "s3:GetBucketOwnershipControls", "s3:PutBucketOwnershipControls",
      "s3:GetBucketAcl", "s3:GetBucketLocation", "s3:ListBucket",
      "s3:PutObject", "s3:GetObject", "s3:DeleteObject",
    ]
    resources = ["*"]
  }

  # Route53: manage hosted zones and records.
  statement {
    sid       = "Route53"
    actions   = ["route53:*"]
    resources = ["*"]
  }

  # ACM: manage certificates (must be in us-east-1 for CloudFront).
  statement {
    sid       = "ACM"
    actions   = ["acm:*"]
    resources = ["*"]
  }

  # SES: manage sending identities, DKIM, MAIL FROM.
  statement {
    sid       = "SES"
    actions   = ["ses:*"]
    resources = ["*"]
  }

  # IAM: create the per-env ci_deploy roles and the ses_sender user.
  statement {
    sid = "IAM"
    actions = [
      "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:ListRoles",
      "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy", "iam:ListRolePolicies",
      "iam:TagRole", "iam:UntagRole", "iam:UpdateAssumeRolePolicy",
      "iam:CreateUser", "iam:DeleteUser", "iam:GetUser", "iam:TagUser", "iam:UntagUser",
      "iam:CreateAccessKey", "iam:DeleteAccessKey", "iam:ListAccessKeys",
      "iam:PutUserPolicy", "iam:DeleteUserPolicy", "iam:GetUserPolicy",
      "iam:CreateOpenIDConnectProvider", "iam:DeleteOpenIDConnectProvider",
      "iam:GetOpenIDConnectProvider", "iam:ListOpenIDConnectProviders",
      "iam:TagOpenIDConnectProvider", "iam:UpdateOpenIDConnectProviderThumbprint",
      "iam:AddClientIDToOpenIDConnectProvider", "iam:RemoveClientIDFromOpenIDConnectProvider",
    ]
    resources = ["*"]
  }

  # TLS data source (used in global stack for OIDC thumbprint).
  statement {
    sid       = "STSGetCallerIdentity"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "terraform_ci" {
  name   = "${var.project}-terraform-ci"
  role   = aws_iam_role.terraform_ci.id
  policy = data.aws_iam_policy_document.terraform_ci.json
}
