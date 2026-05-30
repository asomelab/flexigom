terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Must be us-east-1: the static-site module creates the CloudFront ACM
# certificate using this provider, and CloudFront certs live only in us-east-1.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
