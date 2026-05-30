variable "aws_region" {
  description = "AWS region for the Terraform state backend resources."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name, used to prefix backend resource names."
  type        = string
  default     = "flexigom"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name that will store Terraform state for all stacks."
  type        = string
  default     = "flexigom-tfstate"
}

variable "lock_table_name" {
  description = "DynamoDB table name used for Terraform state locking."
  type        = string
  default     = "flexigom-tflock"
}
