output "bucket_name" {
  description = "S3 bucket name — set as the GitHub Environment variable S3_BUCKET."
  value       = module.static_site.bucket_id
}

output "distribution_id" {
  description = "CloudFront distribution ID — set as CLOUDFRONT_DISTRIBUTION_ID."
  value       = module.static_site.distribution_id
}

output "cloudfront_domain" {
  description = "CloudFront domain (for smoke-testing before DNS propagates)."
  value       = module.static_site.distribution_domain_name
}

output "ci_role_arn" {
  description = "IAM role ARN GitHub Actions assumes — set as AWS_ROLE_ARN."
  value       = aws_iam_role.ci_deploy.arn
}
