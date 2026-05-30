terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Bootstrap uses LOCAL state on purpose: it is the stack that CREATES the
  # remote backend (S3 bucket + DynamoDB lock table) used by every other stack.
  # Do not migrate this stack to the S3 backend.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
