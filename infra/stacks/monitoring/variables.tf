variable "aws_region" {
  description = "AWS region. Keep us-east-1 — CloudFront metrics are only published there."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name."
  type        = string
  default     = "flexigom"
}

variable "alert_email" {
  description = "Email address for alarm notifications. Copy this to AWS Console or set via -var on first apply. AWS will send a confirmation email — click the link."
  type        = string
  default     = "flexituc@gmail.com"
}

variable "backend_health_url" {
  description = "Railway backend health check URL (HEAD /_health). Update this if the Railway URL changes or the backend migrates to EC2."
  type        = string
  default     = "https://flexigom-backoffice.up.railway.app/_health"
}

variable "remote_state_bucket" {
  description = "S3 bucket holding remote state for other stacks."
  type        = string
  default     = "flexigom-tfstate"
}
