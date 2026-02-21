# Project 2: Microservices on EKS

resource "aws_vpc" "eks" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = "eks-vpc", Project = "microservices" }
}

resource "aws_subnet" "eks_private_1" {
  vpc_id            = aws_vpc.eks.id
  cidr_block        = "10.10.1.0/24"
  availability_zone = "us-east-1a"
  tags              = { Name = "eks-private-1", Tier = "private" }
}

resource "aws_subnet" "eks_private_2" {
  vpc_id            = aws_vpc.eks.id
  cidr_block        = "10.10.2.0/24"
  availability_zone = "us-east-1b"
  tags              = { Name = "eks-private-2", Tier = "private" }
}

resource "aws_subnet" "eks_public_1" {
  vpc_id                  = aws_vpc.eks.id
  cidr_block              = "10.10.10.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "eks-public-1", Tier = "public" }
}

resource "aws_subnet" "eks_public_2" {
  vpc_id                  = aws_vpc.eks.id
  cidr_block              = "10.10.11.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  tags                    = { Name = "eks-public-2", Tier = "public" }
}

resource "aws_eks_cluster" "main" {
  name     = "prod-eks"
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids         = [aws_subnet.eks_private_1.id, aws_subnet.eks_private_2.id]
    security_group_ids = [aws_security_group.eks_cluster.id]
  }

  tags = { Name = "prod-eks", Project = "microservices" }
}

resource "aws_eks_node_group" "workers" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "workers"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = [aws_subnet.eks_private_1.id, aws_subnet.eks_private_2.id]
  instance_types  = ["t3.large"]

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 1
  }

  tags = { Name = "eks-workers", Project = "microservices" }
}

resource "aws_security_group" "eks_cluster" {
  name   = "eks-cluster-sg"
  vpc_id = aws_vpc.eks.id
  tags   = { Name = "eks-cluster-sg", Project = "microservices" }
}

resource "aws_iam_role" "eks_cluster" {
  name = "eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "eks.amazonaws.com" } }]
  })
  tags = { Name = "eks-cluster-role" }
}

resource "aws_iam_role" "eks_nodes" {
  name = "eks-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" } }]
  })
  tags = { Name = "eks-node-role" }
}

resource "aws_lb" "eks_ingress" {
  name               = "eks-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.eks_cluster.id]
  subnets            = [aws_subnet.eks_public_1.id, aws_subnet.eks_public_2.id]
  tags               = { Name = "eks-alb", Project = "microservices" }
}

resource "aws_ecr_repository" "api" {
  name                 = "microservices/api"
  image_tag_mutability = "IMMUTABLE"
  tags                 = { Name = "api-repo", Project = "microservices" }
}

resource "aws_ecr_repository" "worker" {
  name                 = "microservices/worker"
  image_tag_mutability = "IMMUTABLE"
  tags                 = { Name = "worker-repo", Project = "microservices" }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "eks-redis"
  description          = "Redis for microservices"
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 2
  port                 = 6379
  security_group_ids   = [aws_security_group.eks_cluster.id]
  tags                 = { Name = "eks-redis", Project = "microservices" }
}

resource "aws_db_instance" "postgres" {
  identifier           = "eks-postgres"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 200
  multi_az             = true
  db_name              = "microservices"
  username             = "admin"
  password             = "changeme"
  vpc_security_group_ids = [aws_security_group.eks_cluster.id]
  tags                 = { Name = "eks-postgres", Project = "microservices" }
}
