locals {
  common_tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Stack     = "monitoring"
  }
}

# ---------------------------------------------------------------------------
# Read prod stack state to get the CloudFront distribution ID.
# The monitoring stack depends on prod being applied first.
# ---------------------------------------------------------------------------
data "terraform_remote_state" "prod" {
  backend = "s3"

  config = {
    bucket = var.remote_state_bucket
    key    = "prod/terraform.tfstate"
    region = var.aws_region
  }
}

# ---------------------------------------------------------------------------
# Monitoring module — SNS + uptime Lambda + alarms + dashboard.
# ---------------------------------------------------------------------------
module "monitoring" {
  source = "../../modules/monitoring"

  project    = var.project
  aws_region = var.aws_region
  alert_email = var.alert_email

  cloudfront_distribution_id = data.terraform_remote_state.prod.outputs.distribution_id

  uptime_targets = [
    {
      name   = "frontend-prod"
      url    = "https://flexigomtucuman.com"
      method = "HEAD"
    },
    {
      name   = "backend-railway"
      url    = var.backend_health_url
      method = "HEAD"
    },
  ]

  tags = local.common_tags
}
