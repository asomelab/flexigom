output "state_bucket_name" {
  description = "S3 bucket name for Terraform state. Use this in each stack's backend.tf."
  value       = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking. Use this in each stack's backend.tf."
  value       = aws_dynamodb_table.tflock.id
}

output "aws_region" {
  description = "Region where the backend lives."
  value       = var.aws_region
}
