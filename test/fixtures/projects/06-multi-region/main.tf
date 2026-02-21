# Project 6: Multi-Region Active-Active Setup

resource "aws_vpc" "primary" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "primary-vpc", Region = "us-east-1", Project = "multi-region" }
}

resource "aws_subnet" "primary_app" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.20.1.0/24"
  availability_zone = "us-east-1a"
  tags              = { Name = "primary-app-subnet", Tier = "private" }
}

resource "aws_subnet" "primary_public" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.20.10.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "primary-public", Tier = "public" }
}

resource "aws_vpc" "secondary" {
  cidr_block           = "10.30.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "secondary-vpc", Region = "eu-west-1", Project = "multi-region" }
}

resource "aws_subnet" "secondary_app" {
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.30.1.0/24"
  availability_zone = "eu-west-1a"
  tags              = { Name = "secondary-app-subnet", Tier = "private" }
}

resource "aws_subnet" "secondary_public" {
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.30.10.0/24"
  availability_zone       = "eu-west-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "secondary-public", Tier = "public" }
}

resource "aws_vpc_peering_connection" "cross_region" {
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  tags        = { Name = "cross-region-peering", Project = "multi-region" }
}

resource "aws_db_instance" "primary_db" {
  identifier           = "primary-mysql"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 500
  multi_az             = true
  db_name              = "appdb"
  username             = "admin"
  password             = "changeme"
  vpc_security_group_ids = [aws_security_group.primary_db.id]
  tags                 = { Name = "primary-db", Project = "multi-region" }
}

resource "aws_db_instance" "replica_db" {
  identifier          = "replica-mysql"
  replicate_source_db = aws_db_instance.primary_db.arn
  instance_class      = "db.r6g.xlarge"
  tags                = { Name = "replica-db", Project = "multi-region" }
}

resource "aws_security_group" "primary_db" {
  name   = "primary-db-sg"
  vpc_id = aws_vpc.primary.id
  tags   = { Name = "primary-db-sg", Project = "multi-region" }
}

resource "aws_route53_health_check" "primary" {
  fqdn              = "primary.example.com"
  port               = 443
  type               = "HTTPS"
  request_interval   = 10
  failure_threshold  = 3
  tags               = { Name = "primary-healthcheck", Project = "multi-region" }
}

resource "aws_route53_record" "failover_primary" {
  zone_id = "Z123456"
  name    = "app.example.com"
  type    = "A"
  ttl     = 60

  failover_routing_policy {
    type = "PRIMARY"
  }
  health_check_id = aws_route53_health_check.primary.id
  set_identifier  = "primary"
  records         = ["10.20.1.100"]
}

resource "aws_route53_record" "failover_secondary" {
  zone_id = "Z123456"
  name    = "app.example.com"
  type    = "A"
  ttl     = 60

  failover_routing_policy {
    type = "SECONDARY"
  }
  set_identifier = "secondary"
  records        = ["10.30.1.100"]
}

resource "aws_globalaccelerator_accelerator" "main" {
  name            = "global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true
  tags            = { Name = "global-accelerator", Project = "multi-region" }
}

resource "aws_lb" "primary" {
  name               = "primary-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.primary_public.id]
  tags               = { Name = "primary-alb", Project = "multi-region" }
}

resource "aws_lb" "secondary" {
  name               = "secondary-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.secondary_public.id]
  tags               = { Name = "secondary-alb", Project = "multi-region" }
}
