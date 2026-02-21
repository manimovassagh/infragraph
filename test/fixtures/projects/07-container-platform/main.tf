# Project 7: ECS Fargate Container Platform

resource "aws_vpc" "ecs" {
  cidr_block           = "10.40.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "ecs-vpc", Project = "container-platform" }
}

resource "aws_subnet" "ecs_private_1" {
  vpc_id            = aws_vpc.ecs.id
  cidr_block        = "10.40.1.0/24"
  availability_zone = "us-west-2a"
  tags              = { Name = "ecs-private-1", Tier = "private" }
}

resource "aws_subnet" "ecs_private_2" {
  vpc_id            = aws_vpc.ecs.id
  cidr_block        = "10.40.2.0/24"
  availability_zone = "us-west-2b"
  tags              = { Name = "ecs-private-2", Tier = "private" }
}

resource "aws_subnet" "ecs_public_1" {
  vpc_id                  = aws_vpc.ecs.id
  cidr_block              = "10.40.10.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true
  tags                    = { Name = "ecs-public-1", Tier = "public" }
}

resource "aws_ecs_cluster" "main" {
  name = "fargate-platform"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "fargate-cluster", Project = "container-platform" }
}

resource "aws_ecs_task_definition" "web" {
  family                   = "web-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([{
    name      = "web"
    image     = "nginx:latest"
    cpu       = 256
    memory    = 512
    essential = true
    portMappings = [{ containerPort = 80, protocol = "tcp" }]
  }])

  tags = { Name = "web-task", Project = "container-platform" }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "api-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([{
    name      = "api"
    image     = "api:latest"
    cpu       = 512
    memory    = 1024
    essential = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
  }])

  tags = { Name = "api-task", Project = "container-platform" }
}

resource "aws_ecs_service" "web" {
  name            = "web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.ecs_private_1.id, aws_subnet.ecs_private_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 80
  }

  tags = { Name = "web-service", Project = "container-platform" }
}

resource "aws_ecs_service" "api" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.ecs_private_1.id, aws_subnet.ecs_private_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
  }

  tags = { Name = "api-service", Project = "container-platform" }
}

resource "aws_security_group" "ecs_tasks" {
  name   = "ecs-tasks-sg"
  vpc_id = aws_vpc.ecs.id
  tags   = { Name = "ecs-tasks-sg", Project = "container-platform" }
}

resource "aws_lb" "main" {
  name               = "ecs-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs_tasks.id]
  subnets            = [aws_subnet.ecs_public_1.id]
  tags               = { Name = "ecs-alb", Project = "container-platform" }
}

resource "aws_lb_target_group" "web" {
  name        = "web-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.ecs.id
  target_type = "ip"
  tags        = { Name = "web-tg", Project = "container-platform" }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_service_discovery_private_dns_namespace" "internal" {
  name = "internal.local"
  vpc  = aws_vpc.ecs.id
  tags = { Name = "service-discovery", Project = "container-platform" }
}

resource "aws_appautoscaling_target" "web" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.web.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
