# Project 8: Serverless REST API with API Gateway + Lambda + DynamoDB

resource "aws_api_gateway_rest_api" "main" {
  name        = "serverless-api"
  description = "Serverless REST API"
  tags        = { Name = "serverless-api", Project = "serverless-api" }
}

resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "orders" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "orders"
}

resource "aws_lambda_function" "get_users" {
  function_name = "get-users"
  runtime       = "nodejs20.x"
  handler       = "users.getAll"
  role          = aws_iam_role.lambda.arn
  filename      = "users.zip"
  memory_size   = 256
  timeout       = 30

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.users.name
    }
  }

  tags = { Name = "get-users", Project = "serverless-api" }
}

resource "aws_lambda_function" "create_user" {
  function_name = "create-user"
  runtime       = "nodejs20.x"
  handler       = "users.create"
  role          = aws_iam_role.lambda.arn
  filename      = "users.zip"
  memory_size   = 256
  timeout       = 30

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.users.name
      EVENT_BUS  = aws_sqs_queue.events.url
    }
  }

  tags = { Name = "create-user", Project = "serverless-api" }
}

resource "aws_lambda_function" "process_orders" {
  function_name = "process-orders"
  runtime       = "python3.12"
  handler       = "orders.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "orders.zip"
  memory_size   = 512
  timeout       = 60

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    }
  }

  tags = { Name = "process-orders", Project = "serverless-api" }
}

resource "aws_lambda_function" "authorizer" {
  function_name = "api-authorizer"
  runtime       = "nodejs20.x"
  handler       = "auth.handler"
  role          = aws_iam_role.lambda.arn
  filename      = "auth.zip"
  tags          = { Name = "authorizer", Project = "serverless-api" }
}

resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = { Name = "users-table", Project = "serverless-api" }
}

resource "aws_dynamodb_table" "orders" {
  name         = "orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"
  range_key    = "userId"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  tags = { Name = "orders-table", Project = "serverless-api" }
}

resource "aws_sqs_queue" "events" {
  name                       = "api-events"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  visibility_timeout_seconds = 60
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  tags = { Name = "events-queue", Project = "serverless-api" }
}

resource "aws_sqs_queue" "dlq" {
  name = "api-events-dlq"
  tags = { Name = "events-dlq", Project = "serverless-api" }
}

resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Name = "lambda-role", Project = "serverless-api" }
}

resource "aws_cognito_user_pool" "main" {
  name = "api-users"
  tags = { Name = "user-pool", Project = "serverless-api" }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/serverless-api"
  retention_in_days = 30
  tags              = { Name = "api-logs", Project = "serverless-api" }
}
