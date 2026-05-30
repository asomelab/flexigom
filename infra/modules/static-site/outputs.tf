output "bucket_id" {
  description = "Name of the origin S3 bucket (target of `aws s3 sync`)."
  value       = aws_s3_bucket.site.id
}

output "bucket_arn" {
  description = "ARN of the origin S3 bucket."
  value       = aws_s3_bucket.site.arn
}

output "distribution_id" {
  description = "CloudFront distribution ID (target of cache invalidations)."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}

output "distribution_domain_name" {
  description = "CloudFront-assigned domain (e.g. dxxxx.cloudfront.net)."
  value       = aws_cloudfront_distribution.site.domain_name
}
