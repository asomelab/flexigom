variable "name" {
  description = "Identifier used to name resources (e.g. \"flexigom-frontend-dev\"). Must be S3-bucket-safe (lowercase, hyphens)."
  type        = string
}

variable "domain_aliases" {
  description = "Domain names served by this site. Leave empty ([]) to use the default CloudFront URL (*.cloudfront.net) — useful for initial testing before DNS is configured."
  type        = list(string)
  default     = []
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID. Required only when domain_aliases is non-empty."
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 (NA+EU) is the cheapest and adequate for AR traffic."
  type        = string
  default     = "PriceClass_100"
}

variable "default_root_object" {
  description = "Object served at the distribution root."
  type        = string
  default     = "index.html"
}

variable "spa_fallback" {
  description = "When true, 403/404 responses are rewritten to /index.html with HTTP 200 (required for client-side routed SPAs)."
  type        = bool
  default     = true
}

variable "access_logs_enabled" {
  description = "When true, enables CloudFront standard access logs into a dedicated S3 bucket with 30-day expiry. Enable for prod; disable for dev to avoid log costs."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Extra tags applied to taggable resources."
  type        = map(string)
  default     = {}
}
