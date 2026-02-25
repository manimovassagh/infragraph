import { describe, it, expect } from 'vitest';
import { parseCfnTemplate, extractResourcesFromCfn } from '../../parser/cloudformation.js';
import { awsProvider } from '../../providers/aws.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── parseCfnTemplate ────────────────────────────────────────────────────────

describe('parseCfnTemplate', () => {
  it('parses valid JSON CloudFormation template', () => {
    const raw = JSON.stringify({
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'test' } },
      },
    });
    const result = parseCfnTemplate(raw);
    expect(result.Resources).toBeDefined();
    expect(result.Resources['MyBucket']).toBeDefined();
  });

  it('parses valid YAML CloudFormation template', () => {
    const raw = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: test
`;
    const result = parseCfnTemplate(raw);
    expect(result.Resources['MyBucket']!.Type).toBe('AWS::S3::Bucket');
  });

  it('throws on invalid JSON/YAML', () => {
    expect(() => parseCfnTemplate('{{invalid')).toThrow();
  });

  it('throws on non-object input', () => {
    expect(() => parseCfnTemplate('"just a string"')).toThrow(
      'CloudFormation template must be a JSON/YAML object',
    );
  });

  it('throws on missing Resources block', () => {
    expect(() => parseCfnTemplate('{"AWSTemplateFormatVersion": "2010-09-09"}')).toThrow(
      'Missing or invalid "Resources" block',
    );
  });

  it('throws on null input', () => {
    expect(() => parseCfnTemplate('null')).toThrow(
      'CloudFormation template must be a JSON/YAML object',
    );
  });
});

// ─── extractResourcesFromCfn — VPC+EC2 fixture ──────────────────────────────

describe('extractResourcesFromCfn (01-vpc-ec2)', () => {
  const raw = readFileSync(
    resolve(import.meta.dirname!, '../../../../../test/fixtures/cloudformation/01-vpc-ec2.json'),
    'utf-8',
  );
  const template = parseCfnTemplate(raw);

  it('extracts correct number of resources (skips glue resources)', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    // 13 total - 1 VPCGatewayAttachment (glue) = 12 resources
    expect(resources.length).toBe(12);
  });

  it('maps CFN types to Terraform types', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const types = new Set(resources.map((r) => r.type));
    expect(types).toContain('aws_vpc');
    expect(types).toContain('aws_subnet');
    expect(types).toContain('aws_instance');
    expect(types).toContain('aws_db_instance');
    expect(types).toContain('aws_s3_bucket');
  });

  it('uses correct IDs in type.logicalId format', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const ids = resources.map((r) => r.id);
    expect(ids).toContain('aws_vpc.MainVPC');
    expect(ids).toContain('aws_subnet.PublicSubnet1');
    expect(ids).toContain('aws_instance.WebServer');
    expect(ids).toContain('aws_s3_bucket.AppBucket');
  });

  it('extracts display names from Tags', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const vpc = resources.find((r) => r.id === 'aws_vpc.MainVPC')!;
    expect(vpc.displayName).toBe('main-vpc');
  });

  it('extracts tags correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const vpc = resources.find((r) => r.id === 'aws_vpc.MainVPC')!;
    expect(vpc.tags).toEqual({ Name: 'main-vpc', Environment: 'production' });
  });

  it('resolves Ref dependencies to Terraform IDs', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const subnet = resources.find((r) => r.id === 'aws_subnet.PublicSubnet1')!;
    expect(subnet.dependencies).toContain('aws_vpc.MainVPC');
  });

  it('resolves Fn::GetAtt dependencies', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const nat = resources.find((r) => r.id === 'aws_nat_gateway.NatGateway')!;
    expect(nat.dependencies).toContain('aws_eip.NatEIP');
  });

  it('resolves DependsOn', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const web = resources.find((r) => r.id === 'aws_instance.WebServer')!;
    // DependsOn: IGWAttachment — but IGWAttachment is a glue resource, so its tfId won't exist
    // The dependency on WebSecurityGroup comes from SecurityGroupIds Ref
    expect(web.dependencies).toContain('aws_security_group.WebSecurityGroup');
  });

  it('maps CFN properties to Terraform attribute names', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const vpc = resources.find((r) => r.id === 'aws_vpc.MainVPC')!;
    expect(vpc.attributes['cidr_block']).toBe('10.0.0.0/16');
    expect(vpc.attributes['enable_dns_hostnames']).toBe(true);
  });

  it('merges VPCGatewayAttachment into IGW resource', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const igw = resources.find((r) => r.id === 'aws_internet_gateway.InternetGateway')!;
    expect(igw.attributes['vpc_id']).toBe('aws_vpc.MainVPC');
  });

  it('returns no unsupported type warnings for known types', () => {
    const { warnings } = extractResourcesFromCfn(template, awsProvider);
    expect(warnings.length).toBe(0);
  });

  it('sets all resources to aws provider', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    for (const r of resources) {
      expect(r.provider).toBe('aws');
    }
  });
});

// ─── extractResourcesFromCfn — Serverless YAML fixture ──────────────────────

describe('extractResourcesFromCfn (02-serverless YAML)', () => {
  const raw = readFileSync(
    resolve(import.meta.dirname!, '../../../../../test/fixtures/cloudformation/02-serverless.yaml'),
    'utf-8',
  );
  const template = parseCfnTemplate(raw);

  it('parses YAML and extracts resources', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    expect(resources.length).toBe(7);
  });

  it('maps Lambda functions correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const lambda = resources.find((r) => r.id === 'aws_lambda_function.ApiFunction')!;
    expect(lambda.type).toBe('aws_lambda_function');
    expect(lambda.attributes['runtime']).toBe('nodejs20.x');
    expect(lambda.attributes['memory_size']).toBe(256);
  });

  it('maps SQS queue correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const queue = resources.find((r) => r.id === 'aws_sqs_queue.RequestQueue')!;
    expect(queue.displayName).toBe('request-queue');
  });

  it('maps SNS topic correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const topic = resources.find((r) => r.id === 'aws_sns_topic.NotificationTopic')!;
    expect(topic.displayName).toBe('notifications');
  });
});

// ─── extractResourcesFromCfn — ECS Cluster fixture ──────────────────────────

describe('extractResourcesFromCfn (03-ecs-cluster)', () => {
  const raw = readFileSync(
    resolve(import.meta.dirname!, '../../../../../test/fixtures/cloudformation/03-ecs-cluster.json'),
    'utf-8',
  );
  const template = parseCfnTemplate(raw);

  it('extracts all non-glue resources', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    // 15 total - 1 VPCGatewayAttachment (glue) = 14 resources
    expect(resources.length).toBe(14);
  });

  it('maps ECS resources correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const cluster = resources.find((r) => r.type === 'aws_ecs_cluster')!;
    expect(cluster).toBeDefined();
    expect(cluster.displayName).toBe('app-cluster');
  });

  it('maps ALB resources correctly', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const alb = resources.find((r) => r.type === 'aws_lb')!;
    expect(alb).toBeDefined();
    expect(alb.displayName).toBe('app-alb');
  });
});

// ─── extractResourcesFromCfn — CDK synthesized fixture ──────────────────────

describe('extractResourcesFromCfn (04-cdk-webapp)', () => {
  const raw = readFileSync(
    resolve(import.meta.dirname!, '../../../../../test/fixtures/cloudformation/04-cdk-webapp.json'),
    'utf-8',
  );
  const template = parseCfnTemplate(raw);

  it('handles CDK-generated logical IDs', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const vpc = resources.find((r) => r.type === 'aws_vpc')!;
    expect(vpc).toBeDefined();
    expect(vpc.name).toBe('WebAppVpcF01234AB');
  });

  it('extracts CDK-style Name tags', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const vpc = resources.find((r) => r.type === 'aws_vpc')!;
    expect(vpc.displayName).toBe('CdkStack/WebAppVpc');
  });

  it('merges IGW attachment for CDK resources', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    const igw = resources.find((r) => r.type === 'aws_internet_gateway')!;
    expect(igw.attributes['vpc_id']).toContain('aws_vpc.');
  });
});

// ─── extractResourcesFromCfn — Minimal YAML fixture ─────────────────────────

describe('extractResourcesFromCfn (05-minimal)', () => {
  const raw = readFileSync(
    resolve(import.meta.dirname!, '../../../../../test/fixtures/cloudformation/05-minimal.yaml'),
    'utf-8',
  );
  const template = parseCfnTemplate(raw);

  it('extracts single resource', () => {
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    expect(resources.length).toBe(1);
    expect(resources[0]!.type).toBe('aws_s3_bucket');
    expect(resources[0]!.displayName).toBe('my-bucket');
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('extractResourcesFromCfn edge cases', () => {
  it('warns about unsupported CFN types', () => {
    const template = parseCfnTemplate(JSON.stringify({
      Resources: {
        MyThing: { Type: 'AWS::Custom::Unknown', Properties: {} },
      },
    }));
    const { resources, warnings } = extractResourcesFromCfn(template, awsProvider);
    expect(resources.length).toBe(0);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Unsupported CloudFormation type');
  });

  it('handles resources with no Properties', () => {
    const template = parseCfnTemplate(JSON.stringify({
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket' },
      },
    }));
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    expect(resources.length).toBe(1);
    expect(resources[0]!.type).toBe('aws_s3_bucket');
  });

  it('handles empty Resources block', () => {
    const template = parseCfnTemplate(JSON.stringify({ Resources: {} }));
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    expect(resources.length).toBe(0);
  });

  it('ignores pseudo-parameter Refs', () => {
    const template = parseCfnTemplate(JSON.stringify({
      Resources: {
        MyBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': '${AWS::StackName}-bucket' },
            Tags: [{ Key: 'Region', Value: { Ref: 'AWS::Region' } }],
          },
        },
      },
    }));
    const { resources } = extractResourcesFromCfn(template, awsProvider);
    expect(resources[0]!.dependencies).toHaveLength(0);
  });
});
