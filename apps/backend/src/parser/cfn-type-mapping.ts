// ─── CloudFormation → Terraform Type Mapping ─────────────────────────────────
//
// Maps AWS CloudFormation resource types to the Terraform resource types already
// supported by the AWS ProviderConfig. This lets CFN-sourced resources reuse the
// existing graph builder, layout engine, and frontend node components.

/** Maps CloudFormation type → Terraform type */
export const cfnTypeMap: Record<string, string> = {
  // Networking
  'AWS::EC2::VPC': 'aws_vpc',
  'AWS::EC2::Subnet': 'aws_subnet',
  'AWS::EC2::InternetGateway': 'aws_internet_gateway',
  'AWS::EC2::NatGateway': 'aws_nat_gateway',
  'AWS::EC2::RouteTable': 'aws_route_table',
  'AWS::EC2::Route': 'aws_route',
  'AWS::EC2::SubnetRouteTableAssociation': 'aws_route_table_association',
  'AWS::EC2::SecurityGroup': 'aws_security_group',
  'AWS::EC2::EIP': 'aws_eip',

  // Compute
  'AWS::EC2::Instance': 'aws_instance',
  'AWS::Lambda::Function': 'aws_lambda_function',

  // Containers
  'AWS::ECS::Cluster': 'aws_ecs_cluster',
  'AWS::ECS::Service': 'aws_ecs_service',
  'AWS::ECS::TaskDefinition': 'aws_ecs_task_definition',
  'AWS::EKS::Cluster': 'aws_eks_cluster',

  // Database
  'AWS::RDS::DBInstance': 'aws_db_instance',
  'AWS::ElastiCache::CacheCluster': 'aws_elasticache_cluster',

  // Storage
  'AWS::S3::Bucket': 'aws_s3_bucket',

  // Load Balancing
  'AWS::ElasticLoadBalancingV2::LoadBalancer': 'aws_lb',
  'AWS::ElasticLoadBalancingV2::TargetGroup': 'aws_lb_target_group',
  'AWS::ElasticLoadBalancingV2::Listener': 'aws_lb_listener',

  // Messaging
  'AWS::SQS::Queue': 'aws_sqs_queue',
  'AWS::SNS::Topic': 'aws_sns_topic',

  // CDN / API
  'AWS::CloudFront::Distribution': 'aws_cloudfront_distribution',
  'AWS::ApiGateway::RestApi': 'aws_api_gateway_rest_api',
};

/**
 * Maps CloudFormation property names → Terraform attribute names per CFN type.
 * Only includes properties where the naming differs between CFN and Terraform.
 */
export const cfnPropertyMap: Record<string, Record<string, string>> = {
  'AWS::EC2::VPC': {
    CidrBlock: 'cidr_block',
    EnableDnsHostnames: 'enable_dns_hostnames',
    EnableDnsSupport: 'enable_dns_support',
  },
  'AWS::EC2::Subnet': {
    VpcId: 'vpc_id',
    CidrBlock: 'cidr_block',
    AvailabilityZone: 'availability_zone',
    MapPublicIpOnLaunch: 'map_public_ip_on_launch',
  },
  'AWS::EC2::Instance': {
    InstanceType: 'instance_type',
    ImageId: 'ami',
    SubnetId: 'subnet_id',
    SecurityGroupIds: 'vpc_security_group_ids',
  },
  'AWS::EC2::SecurityGroup': {
    GroupDescription: 'description',
    VpcId: 'vpc_id',
    GroupName: 'name',
  },
  'AWS::EC2::NatGateway': {
    SubnetId: 'subnet_id',
    AllocationId: 'allocation_id',
  },
  'AWS::EC2::RouteTable': {
    VpcId: 'vpc_id',
  },
  'AWS::EC2::EIP': {
    Domain: 'domain',
    InstanceId: 'instance_id',
  },
  'AWS::S3::Bucket': {
    BucketName: 'bucket',
  },
  'AWS::Lambda::Function': {
    FunctionName: 'function_name',
    Runtime: 'runtime',
    Handler: 'handler',
    MemorySize: 'memory_size',
    Timeout: 'timeout',
  },
  'AWS::RDS::DBInstance': {
    Engine: 'engine',
    EngineVersion: 'engine_version',
    DBInstanceClass: 'instance_class',
    AllocatedStorage: 'allocated_storage',
    MultiAZ: 'multi_az',
    DBSubnetGroupName: 'db_subnet_group_name',
    VPCSecurityGroups: 'vpc_security_group_ids',
  },
  'AWS::ElasticLoadBalancingV2::LoadBalancer': {
    Type: 'load_balancer_type',
    Scheme: 'internal',
    Subnets: 'subnets',
    SecurityGroups: 'security_groups',
  },
  'AWS::ElasticLoadBalancingV2::TargetGroup': {
    Port: 'port',
    Protocol: 'protocol',
    VpcId: 'vpc_id',
    TargetType: 'target_type',
  },
  'AWS::ElasticLoadBalancingV2::Listener': {
    Port: 'port',
    Protocol: 'protocol',
    LoadBalancerArn: 'load_balancer_arn',
  },
  'AWS::ECS::Cluster': {
    ClusterName: 'name',
  },
  'AWS::SQS::Queue': {
    QueueName: 'name',
  },
  'AWS::SNS::Topic': {
    TopicName: 'name',
  },
  'AWS::EC2::SubnetRouteTableAssociation': {
    SubnetId: 'subnet_id',
    RouteTableId: 'route_table_id',
  },
};

/**
 * CFN resource types that act as "glue" resources — they express a relationship
 * between two other resources. The parser merges these into the target resource.
 * Key = CFN type, value = { targetRef, mergeAttr, mergeValue }
 */
export interface CfnGlueResource {
  /** CFN property on the glue resource that references the target to merge into */
  targetRef: string;
  /** Terraform attribute name to set on the target */
  mergeAttr: string;
  /** CFN property on the glue resource that provides the value */
  valueRef: string;
}

export const cfnGlueResources: Record<string, CfnGlueResource> = {
  'AWS::EC2::VPCGatewayAttachment': {
    targetRef: 'InternetGatewayId',
    mergeAttr: 'vpc_id',
    valueRef: 'VpcId',
  },
};
