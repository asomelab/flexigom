variable "project" {
  description = "Project name. Used to prefix resource names."
  type        = string
  default     = "flexigom"
}

variable "aws_region" {
  description = "AWS region. Must be us-east-1 for CloudFront metrics to be visible."
  type        = string
  default     = "us-east-1"
}

variable "alert_email" {
  description = "Email address to receive all CloudWatch alarm notifications via SNS. AWS sends a confirmation email — click the link before alarms can fire."
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the prod site. Used in the 5xxErrorRate alarm and dashboard."
  type        = string
}

variable "uptime_targets" {
  description = "List of uptime targets to ping every 5 minutes. Each entry: { name, url, method? (default HEAD) }."
  type = list(object({
    name   = string
    url    = string
    method = optional(string, "HEAD")
  }))
  default = []
}

variable "cloudfront_5xx_threshold" {
  description = "5xx error rate (%) that triggers the CloudFront alarm. AWS default is 5."
  type        = number
  default     = 5
}

variable "ses_bounce_rate_threshold" {
  description = "SES bounce rate fraction that triggers the alarm. AWS suspension warning is 0.10 (10%); alert at 0.05 (5%) for early warning."
  type        = number
  default     = 0.05
}

variable "ses_complaint_rate_threshold" {
  description = "SES complaint rate fraction that triggers the alarm. AWS warning threshold is 0.001 (0.1%)."
  type        = number
  default     = 0.001
}

variable "tags" {
  description = "Extra tags applied to all resources in this module."
  type        = map(string)
  default     = {}
}
