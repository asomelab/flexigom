output "configuration_set_name" {
  description = "SES configuration set name. Set as SES_CONFIGURATION_SET in Railway backend env."
  value       = module.ses.configuration_set_name
}

output "domain_identity_arn" {
  description = "SES domain identity ARN."
  value       = module.ses.domain_identity_arn
}

output "verification_token" {
  description = "SES domain verification token (informational — verification happens via DNS automatically)."
  value       = module.ses.verification_token
}

output "dkim_tokens" {
  description = "DKIM CNAME tokens (already written to Route53)."
  value       = module.ses.dkim_tokens
}

output "mail_from_domain" {
  description = "MAIL FROM subdomain."
  value       = module.ses.mail_from_domain
}

output "iam_user_name" {
  description = "IAM user for SES API access."
  value       = module.ses.iam_user_name
}

output "access_key_id" {
  description = "AWS_SES_ACCESS_KEY_ID — copy to Railway env. Never commit."
  value       = module.ses.access_key_id
}

output "secret_access_key" {
  description = "AWS_SES_SECRET_ACCESS_KEY — copy to Railway env. Never commit."
  value       = module.ses.secret_access_key
  sensitive   = true
}
