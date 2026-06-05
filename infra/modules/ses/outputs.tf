output "domain_identity_arn" {
  description = "SES domain identity ARN."
  value       = aws_ses_domain_identity.this.arn
}

output "verification_token" {
  description = "SES domain verification token (TXT record value). Verification is automatic via DKIM when Route53 is authoritative."
  value       = aws_ses_domain_identity.this.verification_token
}

output "dkim_tokens" {
  description = "DKIM tokens — already written as CNAMEs to Route53. Exposed for manual verification if needed."
  value       = aws_ses_domain_dkim.this.dkim_tokens
}

output "mail_from_domain" {
  description = "MAIL FROM subdomain (e.g. mail.flexigomtucuman.com). Set as the SES MAIL FROM."
  value       = aws_ses_domain_mail_from.this.mail_from_domain
}

output "iam_user_name" {
  description = "IAM user name of the SES API sender."
  value       = aws_iam_user.ses_sender.name
}

output "access_key_id" {
  description = "AWS access key ID for the SES sender. Copy to Railway env as AWS_SES_ACCESS_KEY_ID."
  value       = aws_iam_access_key.ses_sender.id
}

output "secret_access_key" {
  description = "AWS secret access key for the SES sender. Copy to Railway env as AWS_SES_SECRET_ACCESS_KEY. Sensitive: never commit."
  value       = aws_iam_access_key.ses_sender.secret
  sensitive   = true
}
