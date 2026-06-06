variable "aws_region" {
  description = "AWS region. Keep us-east-1 so CloudFront/ACM resources in dependent stacks work."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name."
  type        = string
  default     = "flexigom"
}

variable "root_domain" {
  description = "Root domain to create a Route53 hosted zone for (e.g. \"flexigom.com\"). Leave empty (\"\") to skip DNS and use CloudFront default URLs during initial testing."
  type        = string
  default     = "flexigomtucuman.com"
}

variable "github_org" {
  description = "GitHub organization/owner that hosts the repository."
  type        = string
  default     = "asomelab"
}

variable "github_repo" {
  description = "GitHub repository name (without owner)."
  type        = string
  default     = "flexigom"
}
