# Project 9: ML Training Pipeline with SageMaker + Step Functions

resource "aws_sagemaker_notebook_instance" "research" {
  name          = "ml-research"
  instance_type = "ml.t3.xlarge"
  role_arn      = aws_iam_role.sagemaker.arn
  tags          = { Name = "research-notebook", Project = "ml-pipeline" }
}

resource "aws_sagemaker_model" "production" {
  name               = "prod-model"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    image          = "123456789.dkr.ecr.us-east-1.amazonaws.com/ml-model:latest"
    model_data_url = "s3://${aws_s3_bucket.models.bucket}/models/latest/model.tar.gz"
  }

  tags = { Name = "prod-model", Project = "ml-pipeline" }
}

resource "aws_sagemaker_endpoint_configuration" "production" {
  name = "prod-endpoint-config"

  production_variants {
    variant_name           = "primary"
    model_name             = aws_sagemaker_model.production.name
    initial_instance_count = 2
    instance_type          = "ml.m5.xlarge"
  }

  tags = { Name = "prod-endpoint-config", Project = "ml-pipeline" }
}

resource "aws_sagemaker_endpoint" "production" {
  name                 = "prod-endpoint"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.production.name
  tags                 = { Name = "prod-endpoint", Project = "ml-pipeline" }
}

resource "aws_s3_bucket" "training_data" {
  bucket = "ml-training-data"
  tags   = { Name = "training-data", Project = "ml-pipeline" }
}

resource "aws_s3_bucket" "models" {
  bucket = "ml-models-artifact"
  tags   = { Name = "model-artifacts", Project = "ml-pipeline" }
}

resource "aws_s3_bucket" "features" {
  bucket = "ml-feature-store"
  tags   = { Name = "feature-store", Project = "ml-pipeline" }
}

resource "aws_sfn_state_machine" "training_pipeline" {
  name     = "ml-training-pipeline"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    StartAt = "PreprocessData"
    States = {
      PreprocessData = { Type = "Task", Next = "TrainModel" }
      TrainModel     = { Type = "Task", Next = "EvaluateModel" }
      EvaluateModel  = { Type = "Task", Next = "DeployModel" }
      DeployModel    = { Type = "Task", End = true }
    }
  })

  tags = { Name = "training-pipeline", Project = "ml-pipeline" }
}

resource "aws_lambda_function" "preprocess" {
  function_name = "ml-preprocess"
  runtime       = "python3.12"
  handler       = "preprocess.handler"
  role          = aws_iam_role.sagemaker.arn
  filename      = "preprocess.zip"
  memory_size   = 1024
  timeout       = 900
  tags          = { Name = "preprocess-fn", Project = "ml-pipeline" }
}

resource "aws_lambda_function" "evaluate" {
  function_name = "ml-evaluate"
  runtime       = "python3.12"
  handler       = "evaluate.handler"
  role          = aws_iam_role.sagemaker.arn
  filename      = "evaluate.zip"
  memory_size   = 512
  timeout       = 300
  tags          = { Name = "evaluate-fn", Project = "ml-pipeline" }
}

resource "aws_iam_role" "sagemaker" {
  name = "sagemaker-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "sagemaker.amazonaws.com" } }]
  })
  tags = { Name = "sagemaker-role", Project = "ml-pipeline" }
}

resource "aws_iam_role" "step_functions" {
  name = "step-functions-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "states.amazonaws.com" } }]
  })
  tags = { Name = "sfn-role", Project = "ml-pipeline" }
}

resource "aws_ecr_repository" "ml_model" {
  name = "ml-model"
  tags = { Name = "ml-model-repo", Project = "ml-pipeline" }
}

resource "aws_cloudwatch_metric_alarm" "model_latency" {
  alarm_name          = "model-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ModelLatency"
  namespace           = "AWS/SageMaker"
  period              = 60
  statistic           = "Average"
  threshold           = 500
  alarm_actions       = [aws_sns_topic.ml_alerts.arn]
  tags                = { Name = "latency-alarm", Project = "ml-pipeline" }
}

resource "aws_sns_topic" "ml_alerts" {
  name = "ml-pipeline-alerts"
  tags = { Name = "ml-alerts", Project = "ml-pipeline" }
}
