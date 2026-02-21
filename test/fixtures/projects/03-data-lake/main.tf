# Project 3: Data Lake with Glue + Athena + S3

resource "aws_s3_bucket" "raw_data" {
  bucket = "datalake-raw-zone"
  tags   = { Name = "raw-zone", Project = "data-lake", Zone = "raw" }
}

resource "aws_s3_bucket" "processed_data" {
  bucket = "datalake-processed-zone"
  tags   = { Name = "processed-zone", Project = "data-lake", Zone = "processed" }
}

resource "aws_s3_bucket" "curated_data" {
  bucket = "datalake-curated-zone"
  tags   = { Name = "curated-zone", Project = "data-lake", Zone = "curated" }
}

resource "aws_s3_bucket" "athena_results" {
  bucket = "datalake-athena-results"
  tags   = { Name = "athena-results", Project = "data-lake" }
}

resource "aws_glue_catalog_database" "main" {
  name = "datalake_catalog"
}

resource "aws_glue_crawler" "raw_crawler" {
  name          = "raw-data-crawler"
  role          = aws_iam_role.glue.arn
  database_name = aws_glue_catalog_database.main.name

  s3_target {
    path = "s3://${aws_s3_bucket.raw_data.bucket}"
  }

  tags = { Name = "raw-crawler", Project = "data-lake" }
}

resource "aws_glue_job" "etl_transform" {
  name     = "etl-raw-to-processed"
  role_arn = aws_iam_role.glue.arn

  command {
    script_location = "s3://${aws_s3_bucket.raw_data.bucket}/scripts/etl.py"
    python_version  = "3"
  }

  default_arguments = {
    "--source_bucket" = aws_s3_bucket.raw_data.bucket
    "--target_bucket" = aws_s3_bucket.processed_data.bucket
  }

  tags = { Name = "etl-job", Project = "data-lake" }
}

resource "aws_glue_job" "curate" {
  name     = "curate-processed-data"
  role_arn = aws_iam_role.glue.arn

  command {
    script_location = "s3://${aws_s3_bucket.processed_data.bucket}/scripts/curate.py"
    python_version  = "3"
  }

  tags = { Name = "curate-job", Project = "data-lake" }
}

resource "aws_iam_role" "glue" {
  name = "glue-service-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "glue.amazonaws.com" } }]
  })
  tags = { Name = "glue-role", Project = "data-lake" }
}

resource "aws_kinesis_stream" "ingest" {
  name             = "data-ingest-stream"
  shard_count      = 4
  retention_period = 168
  tags             = { Name = "ingest-stream", Project = "data-lake" }
}

resource "aws_kinesis_firehose_delivery_stream" "s3_delivery" {
  name        = "ingest-to-raw"
  destination = "s3"

  s3_configuration {
    role_arn   = aws_iam_role.glue.arn
    bucket_arn = aws_s3_bucket.raw_data.arn
  }

  tags = { Name = "firehose-to-s3", Project = "data-lake" }
}

resource "aws_lambda_function" "trigger_etl" {
  function_name = "trigger-etl"
  runtime       = "python3.12"
  handler       = "index.handler"
  role          = aws_iam_role.glue.arn
  filename      = "lambda.zip"
  tags          = { Name = "etl-trigger", Project = "data-lake" }
}

resource "aws_sns_topic" "data_alerts" {
  name = "data-pipeline-alerts"
  tags = { Name = "data-alerts", Project = "data-lake" }
}

resource "aws_cloudwatch_dashboard" "datalake" {
  dashboard_name = "datalake-metrics"
  dashboard_body = jsonencode({ widgets = [] })
}
