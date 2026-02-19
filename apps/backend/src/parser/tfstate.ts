import type {
  Tfstate,
  TfstateResource,
  AwsResource,
  AwsResourceType,
} from '@awsarchitect/shared';

// ─── Known AWS resource types we render ──────────────────────────────────────

const SUPPORTED_TYPES = new Set<string>([
  'aws_vpc',
  'aws_subnet',
  'aws_internet_gateway',
  'aws_nat_gateway',
  'aws_route_table',
  'aws_route_table_association',
  'aws_security_group',
  'aws_instance',
  'aws_db_instance',
  'aws_lb',
  'aws_alb',
  'aws_lb_target_group',
  'aws_lb_listener',
  'aws_eip',
  'aws_s3_bucket',
  'aws_lambda_function',
  'aws_ecs_cluster',
  'aws_ecs_service',
  'aws_ecs_task_definition',
  'aws_eks_cluster',
  'aws_elasticache_cluster',
  'aws_sqs_queue',
  'aws_sns_topic',
  'aws_cloudfront_distribution',
  'aws_api_gateway_rest_api',
]);

// ─── Parse raw JSON string into Tfstate ──────────────────────────────────────

export function parseTfstate(raw: string): Tfstate {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('File is not valid JSON');
  }

  if (typeof json !== 'object' || json === null) {
    throw new Error('tfstate must be a JSON object');
  }

  const obj = json as Record<string, unknown>;

  if (obj['version'] === undefined) {
    throw new Error('Missing "version" field — is this a valid tfstate file?');
  }

  if (!Array.isArray(obj['resources'])) {
    throw new Error('Missing or invalid "resources" array in tfstate');
  }

  return obj as unknown as Tfstate;
}

// ─── Extract AwsResources from Tfstate ───────────────────────────────────────

export function extractResources(tfstate: Tfstate): {
  resources: AwsResource[];
  warnings: string[];
} {
  const resources: AwsResource[] = [];
  const warnings: string[] = [];

  for (const tfResource of tfstate.resources) {
    // Skip data sources and unsupported types
    if (tfResource.mode !== 'managed') continue;
    if (!SUPPORTED_TYPES.has(tfResource.type)) {
      // Still include it but mark as unknown so we can render a generic node
    }

    for (let i = 0; i < tfResource.instances.length; i++) {
      const instance = tfResource.instances[i];
      if (!instance) continue;

      const suffix = tfResource.instances.length > 1 ? `[${i}]` : '';
      const id = `${tfResource.type}.${tfResource.name}${suffix}`;

      // Normalize dependency references (they come as "type.name" strings)
      const dependencies = (instance.dependencies ?? [])
        .filter((dep) => SUPPORTED_TYPES.has(dep.split('.')[0] ?? ''));

      const attrs = instance.attributes ?? {};
      const tags = extractTags(attrs);
      const displayName = inferDisplayName(tfResource, attrs, tags);

      resources.push({
        id,
        type: (SUPPORTED_TYPES.has(tfResource.type)
          ? tfResource.type
          : 'unknown') as AwsResourceType,
        name: tfResource.name,
        displayName,
        attributes: attrs,
        dependencies,
        tags,
        region: extractRegion(attrs),
      });
    }
  }

  return { resources, warnings };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractTags(attrs: Record<string, unknown>): Record<string, string> {
  const raw = attrs['tags'] ?? attrs['tags_all'];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, String(v)])
  );
}

function inferDisplayName(
  tfResource: TfstateResource,
  attrs: Record<string, unknown>,
  tags: Record<string, string>
): string {
  // Prefer Name tag → terraform name → id attribute → type.name
  if (tags['Name']) return tags['Name'];
  if (typeof attrs['name'] === 'string' && attrs['name']) return attrs['name'];
  if (typeof attrs['id'] === 'string' && attrs['id']) return attrs['id'];
  return `${tfResource.type}.${tfResource.name}`;
}

function extractRegion(attrs: Record<string, unknown>): string | undefined {
  // Some resources embed ARNs we can parse, or have explicit region
  const arn = attrs['arn'];
  if (typeof arn === 'string') {
    const parts = arn.split(':');
    if (parts.length >= 4 && parts[3]) return parts[3];
  }
  return undefined;
}
