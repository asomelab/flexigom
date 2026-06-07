# =============================================================================
# monitoring module
# Near-free CloudWatch-based monitoring for Flexigom (target: <$1/mo).
#
# Resources:
#   - SNS topic → email subscription (alert_email must confirm the subscription)
#   - Lambda + EventBridge uptime canary (every 5 min, free tier)
#   - CloudWatch alarms: per-target uptime, CloudFront 5xx, SES bounce/complaint
#   - CloudWatch dashboard with CloudFront, uptime, and SES widgets
#
# Free-tier footprint:
#   SNS email: free (first 1k notifications/mo)
#   Lambda:    free (first 1M invocations/mo; ~8.6k/mo at 5-min schedule)
#   CW metrics: free (10 custom metrics included; this module uses 1 per target)
#   CW alarms:  free (first 10 standard alarms)
#   CW dashboard: free (first 3 dashboards)
# =============================================================================

locals {
  module_tags = merge(
    {
      ManagedBy = "terraform"
      Module    = "monitoring"
    },
    var.tags,
  )
}

# ---------------------------------------------------------------------------
# SNS topic + email subscription — all alarms publish here.
# IMPORTANT: AWS will send a confirmation email to var.alert_email.
# The subscription is inactive until the link in that email is clicked.
# ---------------------------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  tags = local.module_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------------------------------------------------------------------------
# IAM execution role for the uptime Lambda.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "uptime_lambda" {
  name               = "${var.project}-uptime-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.module_tags
}

data "aws_iam_policy_document" "uptime_lambda" {
  statement {
    sid       = "CloudWatchMetrics"
    actions   = ["cloudwatch:PutMetricData"]
    resources = ["*"]
  }

  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "uptime_lambda" {
  name   = "${var.project}-uptime-lambda"
  role   = aws_iam_role.uptime_lambda.id
  policy = data.aws_iam_policy_document.uptime_lambda.json
}

# ---------------------------------------------------------------------------
# Lambda function — uptime canary.
# Zips the lambda/ subdirectory at plan time; re-deploys on source changes.
# ---------------------------------------------------------------------------
data "archive_file" "uptime_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.build/uptime.zip"
}

resource "aws_lambda_function" "uptime" {
  function_name    = "${var.project}-uptime"
  role             = aws_iam_role.uptime_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.uptime_lambda.output_path
  source_code_hash = data.archive_file.uptime_lambda.output_base64sha256
  timeout          = 30  # enough for all targets + CW PutMetricData
  tags             = local.module_tags

  environment {
    variables = {
      UPTIME_TARGETS = jsonencode(var.uptime_targets)
    }
  }
}

# ---------------------------------------------------------------------------
# EventBridge rule — triggers the uptime Lambda every 5 minutes.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_event_rule" "uptime" {
  name                = "${var.project}-uptime-schedule"
  description         = "Ping uptime targets every 5 minutes"
  schedule_expression = "rate(5 minutes)"
  tags                = local.module_tags
}

resource "aws_cloudwatch_event_target" "uptime" {
  rule = aws_cloudwatch_event_rule.uptime.name
  arn  = aws_lambda_function.uptime.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.uptime.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.uptime.arn
}

# ---------------------------------------------------------------------------
# Uptime alarms: SiteUp < 1 for 2 consecutive 5-minute periods per target.
# treat_missing_data = "breaching" ensures a silent Lambda failure also alarms.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "uptime" {
  for_each = { for t in var.uptime_targets : t.name => t }

  alarm_name          = "${var.project}-uptime-${each.key}"
  alarm_description   = "${each.key} is unreachable (${each.value.url})"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SiteUp"
  namespace           = "Flexigom/Uptime"
  period              = 300
  statistic           = "Minimum"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    Target = each.key
  }

  alarm_actions             = [aws_sns_topic.alerts.arn]
  ok_actions                = [aws_sns_topic.alerts.arn]
  insufficient_data_actions = [aws_sns_topic.alerts.arn]

  tags = local.module_tags
}

# ---------------------------------------------------------------------------
# CloudFront 5xx alarm — free default metric (no paid additional metrics).
# CloudFront metrics live only in us-east-1, Region dimension must be "Global".
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  alarm_name          = "${var.project}-cloudfront-5xx"
  alarm_description   = "CloudFront 5xx error rate exceeded ${var.cloudfront_5xx_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = var.cloudfront_5xx_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.module_tags
}

# ---------------------------------------------------------------------------
# SES reputation alarms — require reputation_metrics_enabled=true on the
# configuration set (see infra/modules/ses). Metrics are account-level
# (no dimensions needed).
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "ses_bounce" {
  alarm_name          = "${var.project}-ses-bounce-rate"
  alarm_description   = "SES bounce rate exceeded ${var.ses_bounce_rate_threshold * 100}% (AWS suspension warning at 10%)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Reputation.BounceRate"
  namespace           = "AWS/SES"
  period              = 86400  # SES updates reputation metrics daily
  statistic           = "Maximum"
  threshold           = var.ses_bounce_rate_threshold
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.module_tags
}

resource "aws_cloudwatch_metric_alarm" "ses_complaint" {
  alarm_name          = "${var.project}-ses-complaint-rate"
  alarm_description   = "SES complaint rate exceeded ${var.ses_complaint_rate_threshold * 100}% (AWS warning at 0.1%)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Reputation.ComplaintRate"
  namespace           = "AWS/SES"
  period              = 86400
  statistic           = "Maximum"
  threshold           = var.ses_complaint_rate_threshold
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.module_tags
}

# ---------------------------------------------------------------------------
# CloudWatch dashboard — single pane of glass.
# First 3 dashboards are free; this is the only one.
# ---------------------------------------------------------------------------
locals {
  uptime_metric_rows = [for t in var.uptime_targets : [
    "Flexigom/Uptime", "SiteUp", "Target", t.name, { "label" : t.name }
  ]]
}

resource "aws_cloudwatch_dashboard" "flexigom" {
  dashboard_name = "${var.project}-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      # ── Row 1 ── Uptime + CloudFront errors ──────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Uptime (1=UP, 0=DOWN)"
          view    = "timeSeries"
          region  = var.aws_region
          metrics = local.uptime_metric_rows
          period  = 300
          stat    = "Minimum"
          yAxis   = { left = { min = 0, max = 1 } }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "CloudFront Error Rates (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { "label" : "5xx", "color" : "#d62728" }],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { "label" : "4xx", "color" : "#ff7f0e" }],
          ]
          period = 300
          stat   = "Average"
        }
      },
      # ── Row 2 ── CloudFront requests + SES metrics ────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "CloudFront Requests"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { "label" : "Requests" }],
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "SES Email Events"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/SES", "Send", { "label" : "Sent", "color" : "#1f77b4" }],
            ["AWS/SES", "Delivery", { "label" : "Delivered", "color" : "#2ca02c" }],
            ["AWS/SES", "Bounce", { "label" : "Bounced", "color" : "#d62728" }],
            ["AWS/SES", "Complaint", { "label" : "Complaints", "color" : "#9467bd" }],
          ]
          period = 3600
          stat   = "Sum"
        }
      },
    ]
  })
}
