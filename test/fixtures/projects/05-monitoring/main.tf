# Project 5: Centralized Monitoring & Alerting

resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/app/production"
  retention_in_days = 90
  tags              = { Name = "app-logs", Project = "monitoring" }
}

resource "aws_cloudwatch_log_group" "access_logs" {
  name              = "/app/access-logs"
  retention_in_days = 365
  tags              = { Name = "access-logs", Project = "monitoring" }
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = { Name = "cpu-alarm", Project = "monitoring" }
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "high-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = { Name = "memory-alarm", Project = "monitoring" }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  tags                = { Name = "error-alarm", Project = "monitoring" }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "production-overview"
  dashboard_body = jsonencode({ widgets = [] })
}

resource "aws_cloudwatch_dashboard" "services" {
  dashboard_name = "service-health"
  dashboard_body = jsonencode({ widgets = [] })
}

resource "aws_sns_topic" "alerts" {
  name = "monitoring-alerts"
  tags = { Name = "alerts-topic", Project = "monitoring" }
}

resource "aws_sns_topic" "critical_alerts" {
  name = "critical-alerts"
  tags = { Name = "critical-alerts", Project = "monitoring" }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = "oncall@example.com"
}

resource "aws_kinesis_firehose_delivery_stream" "log_archive" {
  name        = "log-archive-stream"
  destination = "s3"

  s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.log_archive.arn
  }

  tags = { Name = "log-archive", Project = "monitoring" }
}

resource "aws_s3_bucket" "log_archive" {
  bucket = "monitoring-log-archive"
  tags   = { Name = "log-archive", Project = "monitoring" }
}

resource "aws_iam_role" "firehose" {
  name = "firehose-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "firehose.amazonaws.com" } }]
  })
  tags = { Name = "firehose-role", Project = "monitoring" }
}

resource "aws_lambda_function" "slack_notifier" {
  function_name = "slack-alert-notifier"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = aws_iam_role.firehose.arn
  filename      = "notifier.zip"
  tags          = { Name = "slack-notifier", Project = "monitoring" }
}
