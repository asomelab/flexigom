variable "aws_region" {
  description = "AWS region for SES. Use us-east-1 to stay consistent with the rest of the infra."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name."
  type        = string
  default     = "flexigom"
}

variable "domain" {
  description = "Domain to configure SES for, e.g. \"flexigomtucuman.com\"."
  type        = string
  default     = "flexigomtucuman.com"
}

variable "dmarc_rua" {
  description = "Email address to receive DMARC aggregate reports."
  type        = string
  default     = "dmarc@flexigomtucuman.com"
}

variable "remote_state_bucket" {
  description = "S3 bucket holding the global stack's state (for the hosted zone ID)."
  type        = string
  default     = "flexigom-tfstate"
}
