variable "aws_region" {
  description = "AWS region. Keep us-east-1 (required for CloudFront ACM certs)."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name."
  type        = string
  default     = "flexigom"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "prod"
}

variable "domain_aliases" {
  description = "Domains served by the prod site, e.g. [\"flexigom.com\", \"www.flexigom.com\"]. Leave empty ([]) to use the CloudFront default URL."
  type        = list(string)
  default     = []
}

variable "site_bucket_name" {
  description = "Globally-unique S3 bucket name for the prod frontend, e.g. \"flexigom-frontend-prod\"."
  type        = string
  default     = "flexigom-frontend-prod"
}

variable "deploy_branch" {
  description = "Git branch allowed to assume the CI deploy role for this environment."
  type        = string
  default     = "main"
}

variable "github_environment_name" {
  description = "Exact GitHub Environment name used in the workflow (e.g. \"Flexigom / prod\"). When a job specifies an environment, GitHub sets the OIDC sub to repo:<org>/<repo>:environment:<name> instead of the branch-based format."
  type        = string
  default     = "Flexigom / prod"
}

variable "remote_state_bucket" {
  description = "S3 bucket holding the global stack's state."
  type        = string
  default     = "flexigom-tfstate"
}
