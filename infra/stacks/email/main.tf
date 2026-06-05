locals {
  common_tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Stack     = "email"
  }
}

# Read the Route53 hosted zone ID created by the global stack.
data "terraform_remote_state" "global" {
  backend = "s3"

  config = {
    bucket = var.remote_state_bucket
    key    = "global/terraform.tfstate"
    region = var.aws_region
  }
}

module "ses" {
  source = "../../modules/ses"

  domain         = var.domain
  region         = var.aws_region
  hosted_zone_id = data.terraform_remote_state.global.outputs.hosted_zone_id
  dmarc_rua      = var.dmarc_rua
  iam_user_name  = "${var.project}-ses-sender"
  tags           = local.common_tags
}
