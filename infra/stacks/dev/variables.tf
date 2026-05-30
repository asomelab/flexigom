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
  default     = "dev"
}

variable "domain_aliases" {
  description = "Domains served by the dev site, e.g. [\"dev.flexigom.com\"]. Leave empty ([]) to use the CloudFront default URL."
  type        = list(string)
  default     = []
}

variable "site_bucket_name" {
  description = "Globally-unique S3 bucket name for the dev frontend, e.g. \"flexigom-frontend-dev\"."
  type        = string
  default     = "flexigom-frontend-dev"
}

variable "deploy_branch" {
  description = "Git branch allowed to assume the CI deploy role for this environment."
  type        = string
  default     = "dev"
}

variable "github_environment_name" {
  description = "Exact GitHub Environment name used in the workflow (e.g. \"Flexigom / dev\"). When a job specifies an environment, GitHub sets the OIDC sub to repo:<org>/<repo>:environment:<name> instead of the branch-based format."
  type        = string
  default     = "Flexigom / dev"
}

variable "remote_state_bucket" {
  description = "S3 bucket holding the global stack's state."
  type        = string
  default     = "flexigom-tfstate"
}
