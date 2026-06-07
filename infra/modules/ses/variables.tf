variable "domain" {
  description = "Root sending domain, e.g. \"flexigomtucuman.com\". SES domain identity is created for this value."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for var.domain. Required to create DKIM/SPF/DMARC/MAIL FROM DNS records."
  type        = string
}

variable "region" {
  description = "AWS region where SES is configured."
  type        = string
  default     = "us-east-1"
}

variable "dmarc_rua" {
  description = "Email address to receive DMARC aggregate reports (e.g. \"dmarc-reports@flexigomtucuman.com\")."
  type        = string
}

variable "project" {
  description = "Project name. Used to name the SES configuration set."
  type        = string
  default     = "flexigom"
}

variable "iam_user_name" {
  description = "IAM user name for the SES API sender. Used by the backend (Railway) via access keys."
  type        = string
  default     = "flexigom-ses-sender"
}

variable "tags" {
  description = "Tags to apply to all resources in this module."
  type        = map(string)
  default     = {}
}
