# Project 4: CI/CD Pipeline with CodePipeline + CodeBuild + ECR

resource "aws_codecommit_repository" "app" {
  repository_name = "my-application"
  description     = "Main application repository"
  tags            = { Name = "app-repo", Project = "cicd" }
}

resource "aws_codebuild_project" "build" {
  name         = "app-build"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_MEDIUM"
    image           = "aws/codebuild/amazonlinux2-x86_64-standard:4.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "ECR_REPO"
      value = aws_ecr_repository.app.repository_url
    }
  }

  source {
    type = "CODEPIPELINE"
  }

  tags = { Name = "app-build", Project = "cicd" }
}

resource "aws_codebuild_project" "test" {
  name         = "app-test"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux2-x86_64-standard:4.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type = "CODEPIPELINE"
  }

  tags = { Name = "app-test", Project = "cicd" }
}

resource "aws_codepipeline" "main" {
  name     = "app-pipeline"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]
      configuration    = { RepositoryName = aws_codecommit_repository.app.repository_name, BranchName = "main" }
    }
  }

  stage {
    name = "Build"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      configuration    = { ProjectName = aws_codebuild_project.build.name }
    }
  }

  tags = { Name = "app-pipeline", Project = "cicd" }
}

resource "aws_ecr_repository" "app" {
  name                 = "my-application"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = { Name = "app-ecr", Project = "cicd" }
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "cicd-artifacts-prod"
  tags   = { Name = "pipeline-artifacts", Project = "cicd" }
}

resource "aws_iam_role" "codebuild" {
  name = "codebuild-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "codebuild.amazonaws.com" } }]
  })
  tags = { Name = "codebuild-role", Project = "cicd" }
}

resource "aws_iam_role" "codepipeline" {
  name = "codepipeline-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "codepipeline.amazonaws.com" } }]
  })
  tags = { Name = "codepipeline-role", Project = "cicd" }
}

resource "aws_sns_topic" "pipeline_notifications" {
  name = "pipeline-notifications"
  tags = { Name = "pipeline-alerts", Project = "cicd" }
}

resource "aws_codestarnotifications_notification_rule" "pipeline" {
  name        = "pipeline-events"
  resource    = aws_codepipeline.main.arn
  detail_type = "FULL"

  event_type_ids = [
    "codepipeline-pipeline-pipeline-execution-failed",
    "codepipeline-pipeline-pipeline-execution-succeeded"
  ]

  target {
    address = aws_sns_topic.pipeline_notifications.arn
  }

  tags = { Name = "pipeline-notifications", Project = "cicd" }
}
