// ─── AWS Resource Types ───────────────────────────────────────────────────────

export type AwsResourceType =
  | 'aws_vpc'
  | 'aws_subnet'
  | 'aws_internet_gateway'
  | 'aws_nat_gateway'
  | 'aws_route_table'
  | 'aws_route_table_association'
  | 'aws_security_group'
  | 'aws_instance'
  | 'aws_db_instance'
  | 'aws_lb'
  | 'aws_alb'
  | 'aws_lb_target_group'
  | 'aws_lb_listener'
  | 'aws_eip'
  | 'aws_s3_bucket'
  | 'aws_lambda_function'
  | 'aws_ecs_cluster'
  | 'aws_ecs_service'
  | 'aws_ecs_task_definition'
  | 'aws_eks_cluster'
  | 'aws_elasticache_cluster'
  | 'aws_sqs_queue'
  | 'aws_sns_topic'
  | 'aws_cloudfront_distribution'
  | 'aws_api_gateway_rest_api'
  | 'unknown';

// ─── Core Resource Model ──────────────────────────────────────────────────────

export interface AwsResource {
  /** Unique ID within the graph — e.g. "aws_vpc.main" */
  id: string;
  /** Terraform resource type */
  type: AwsResourceType;
  /** Terraform resource name (the label after the type) */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** All attributes from tfstate values block */
  attributes: Record<string, unknown>;
  /** IDs of other AwsResources this resource depends on */
  dependencies: string[];
  /** AWS region if determinable */
  region?: string;
  /** AWS tags extracted from attributes.tags */
  tags: Record<string, string>;
}

// ─── Graph Model (React Flow compatible) ─────────────────────────────────────

export type NodeType =
  | 'vpcNode'
  | 'subnetNode'
  | 'igwNode'
  | 'natNode'
  | 'routeTableNode'
  | 'securityGroupNode'
  | 'ec2Node'
  | 'rdsNode'
  | 'lbNode'
  | 'eipNode'
  | 's3Node'
  | 'lambdaNode'
  | 'genericNode';

export interface GraphNodeData {
  resource: AwsResource;
  label: string;
  /** IDs of child nodes (for VPC → subnet → resource grouping) */
  children?: string[];
}

export interface GraphNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: GraphNodeData;
  /** Parent node ID for grouped layout */
  parentNode?: string;
  extent?: 'parent';
  style?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** Relationship type for styling */
  label?: string;
  animated?: boolean;
  type?: string;
}

// ─── API Contracts ────────────────────────────────────────────────────────────

export interface ParseRequest {
  /** Raw .tfstate file content as string */
  tfstate: string;
}

export interface ParseResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  resources: AwsResource[];
  /** Parsing warnings (non-fatal issues) */
  warnings: string[];
}

export interface ApiError {
  error: string;
  details?: string;
}

// ─── tfstate JSON shape (partial — only what we read) ────────────────────────

export interface TfstateResource {
  mode: 'managed' | 'data';
  type: string;
  name: string;
  provider: string;
  instances: TfstateInstance[];
}

export interface TfstateInstance {
  schema_version: number;
  attributes: Record<string, unknown>;
  dependencies?: string[];
}

export interface Tfstate {
  version: number;
  terraform_version: string;
  resources: TfstateResource[];
}
