output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic. Add subscriptions here to route alerts to Slack, WhatsApp, etc. in the future."
  value       = module.monitoring.sns_topic_arn
}

output "uptime_lambda_name" {
  description = "Uptime Lambda name — invoke manually to test: aws lambda invoke --function-name <name> /dev/stdout"
  value       = module.monitoring.uptime_lambda_name
}

output "dashboard_url" {
  description = "CloudWatch monitoring dashboard URL."
  value       = module.monitoring.dashboard_url
}
