output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic."
  value       = aws_sns_topic.alerts.arn
}

output "uptime_lambda_arn" {
  description = "ARN of the uptime canary Lambda function."
  value       = aws_lambda_function.uptime.arn
}

output "uptime_lambda_name" {
  description = "Name of the uptime Lambda — use with `aws lambda invoke` for manual testing."
  value       = aws_lambda_function.uptime.function_name
}

output "dashboard_url" {
  description = "Direct link to the CloudWatch monitoring dashboard."
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.flexigom.dashboard_name}"
}
