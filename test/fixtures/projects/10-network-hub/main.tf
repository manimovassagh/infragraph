# Project 10: Transit Gateway Network Hub

resource "aws_ec2_transit_gateway" "hub" {
  description                     = "Central network hub"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support                     = "enable"
  tags                            = { Name = "transit-hub", Project = "network-hub" }
}

resource "aws_vpc" "production" {
  cidr_block           = "10.100.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "production-vpc", Project = "network-hub" }
}

resource "aws_subnet" "prod_private" {
  vpc_id     = aws_vpc.production.id
  cidr_block = "10.100.1.0/24"
  tags       = { Name = "prod-private", Tier = "private" }
}

resource "aws_subnet" "prod_public" {
  vpc_id                  = aws_vpc.production.id
  cidr_block              = "10.100.10.0/24"
  map_public_ip_on_launch = true
  tags                    = { Name = "prod-public", Tier = "public" }
}

resource "aws_vpc" "development" {
  cidr_block           = "10.101.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "development-vpc", Project = "network-hub" }
}

resource "aws_subnet" "dev_private" {
  vpc_id     = aws_vpc.development.id
  cidr_block = "10.101.1.0/24"
  tags       = { Name = "dev-private", Tier = "private" }
}

resource "aws_vpc" "shared_services" {
  cidr_block           = "10.102.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "shared-services-vpc", Project = "network-hub" }
}

resource "aws_subnet" "shared_private" {
  vpc_id     = aws_vpc.shared_services.id
  cidr_block = "10.102.1.0/24"
  tags       = { Name = "shared-private", Tier = "private" }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "production" {
  subnet_ids         = [aws_subnet.prod_private.id]
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  vpc_id             = aws_vpc.production.id
  tags               = { Name = "prod-tgw-attachment", Project = "network-hub" }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "development" {
  subnet_ids         = [aws_subnet.dev_private.id]
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  vpc_id             = aws_vpc.development.id
  tags               = { Name = "dev-tgw-attachment", Project = "network-hub" }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "shared_services" {
  subnet_ids         = [aws_subnet.shared_private.id]
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  vpc_id             = aws_vpc.shared_services.id
  tags               = { Name = "shared-tgw-attachment", Project = "network-hub" }
}

resource "aws_vpn_gateway" "on_prem" {
  vpc_id = aws_vpc.shared_services.id
  tags   = { Name = "on-prem-vpn-gw", Project = "network-hub" }
}

resource "aws_customer_gateway" "on_prem" {
  bgp_asn    = 65000
  ip_address = "203.0.113.1"
  type       = "ipsec.1"
  tags       = { Name = "on-prem-cgw", Project = "network-hub" }
}

resource "aws_vpn_connection" "on_prem" {
  vpn_gateway_id      = aws_vpn_gateway.on_prem.id
  customer_gateway_id = aws_customer_gateway.on_prem.id
  type                = "ipsec.1"
  static_routes_only  = true
  tags                = { Name = "on-prem-vpn", Project = "network-hub" }
}

resource "aws_security_group" "shared_services" {
  name   = "shared-services-sg"
  vpc_id = aws_vpc.shared_services.id
  tags   = { Name = "shared-services-sg", Project = "network-hub" }
}

resource "aws_instance" "dns_forwarder" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.shared_private.id
  vpc_security_group_ids = [aws_security_group.shared_services.id]
  tags                   = { Name = "dns-forwarder", Project = "network-hub" }
}

resource "aws_instance" "bastion" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_public.id
  vpc_security_group_ids = [aws_security_group.shared_services.id]
  tags                   = { Name = "bastion-host", Project = "network-hub" }
}

resource "aws_internet_gateway" "production" {
  vpc_id = aws_vpc.production.id
  tags   = { Name = "prod-igw", Project = "network-hub" }
}

resource "aws_flow_log" "production" {
  vpc_id          = aws_vpc.production.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  tags            = { Name = "prod-flow-log", Project = "network-hub" }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/vpc/flow-logs"
  retention_in_days = 90
  tags              = { Name = "flow-logs", Project = "network-hub" }
}

resource "aws_iam_role" "flow_logs" {
  name = "vpc-flow-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "vpc-flow-logs.amazonaws.com" } }]
  })
  tags = { Name = "flow-logs-role", Project = "network-hub" }
}
