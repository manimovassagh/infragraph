import type { CloudResource, PlanAction, ProviderConfig } from '@infragraph/shared';

/** A single resource change from `terraform show -json` output */
interface ResourceChange {
  address: string;
  mode: 'managed' | 'data';
  type: string;
  name: string;
  provider_name: string;
  change: {
    actions: string[];
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    after_unknown?: Record<string, unknown>;
    before_sensitive?: Record<string, unknown>;
    after_sensitive?: Record<string, unknown>;
  };
}

/** Top-level structure of `terraform show -json tfplan` */
export interface TerraformPlan {
  format_version: string;
  terraform_version: string;
  resource_changes: ResourceChange[];
  variables?: Record<string, { value: unknown }>;
}

/** Map Terraform plan actions array to our PlanAction union */
function mapActions(actions: string[]): PlanAction {
  if (actions.length === 2 && actions.includes('delete') && actions.includes('create')) {
    return 'replace';
  }
  const action = actions[0];
  if (action === 'create') return 'create';
  if (action === 'update') return 'update';
  if (action === 'delete') return 'delete';
  if (action === 'read') return 'read';
  return 'no-op';
}

/** Validate that a parsed JSON object looks like a Terraform plan */
export function validatePlanStructure(plan: unknown): asserts plan is TerraformPlan {
  if (typeof plan !== 'object' || plan === null || Array.isArray(plan)) {
    throw new Error('Plan must be a JSON object');
  }
  const obj = plan as Record<string, unknown>;
  if (!Array.isArray(obj['resource_changes'])) {
    throw new Error('Missing resource_changes array. Run: terraform show -json tfplan > plan.json');
  }
  // Spot-check first entry has expected shape
  const changes = obj['resource_changes'] as unknown[];
  if (changes.length > 0) {
    const first = changes[0] as Record<string, unknown>;
    if (typeof first['type'] !== 'string' || typeof first['name'] !== 'string') {
      throw new Error('Invalid resource_changes entry — expected type and name fields');
    }
    const change = first['change'] as Record<string, unknown> | undefined;
    if (!change || !Array.isArray(change['actions'])) {
      throw new Error('Invalid resource_changes entry — expected change.actions array');
    }
  }
}

/** Parse a Terraform plan JSON and extract resources with their change actions */
export function extractResourcesFromPlan(
  plan: TerraformPlan,
  provider: ProviderConfig,
): { resources: CloudResource[]; actions: Map<string, PlanAction>; warnings: string[] } {
  const resources: CloudResource[] = [];
  const actions = new Map<string, PlanAction>();
  const warnings: string[] = [];

  for (const rc of plan.resource_changes) {
    // Skip data sources
    if (rc.mode === 'data') continue;

    const planAction = mapActions(rc.change.actions);

    // Use "after" values for creates/updates/replaces, "before" for deletes
    const attrs = (planAction === 'delete' ? rc.change.before : rc.change.after) ?? {};
    const tags: Record<string, string> = {};
    const rawTags = attrs['tags'] as Record<string, string> | undefined;
    if (rawTags && typeof rawTags === 'object') {
      for (const [k, v] of Object.entries(rawTags)) {
        if (typeof v === 'string') tags[k] = v;
      }
    }

    const id = rc.address;
    const displayName = tags['Name'] ?? rc.name;

    // Build flat attributes from both before and after for the detail panel
    const flatAttrs: Record<string, unknown> = {};
    const source = planAction === 'delete' ? rc.change.before : rc.change.after;
    if (source) {
      for (const [k, v] of Object.entries(source)) {
        if (k === 'tags' || k === 'tags_all') continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          flatAttrs[k] = v;
        }
      }
    }

    // Mark unknown values
    if (rc.change.after_unknown) {
      for (const [k, v] of Object.entries(rc.change.after_unknown)) {
        if (v === true) flatAttrs[k] = '(known after apply)';
      }
    }

    // Check if the type is known to the provider
    if (!provider.nodeTypeMapping[rc.type]) {
      warnings.push(`Unmapped type: ${rc.type} (${rc.address})`);
    }

    // Collect sensitive keys from before_sensitive / after_sensitive
    const sensitiveKeys = new Set<string>();
    const sensitiveSrc = planAction === 'delete' ? rc.change.before_sensitive : rc.change.after_sensitive;
    if (sensitiveSrc && typeof sensitiveSrc === 'object') {
      for (const [k, v] of Object.entries(sensitiveSrc)) {
        if (v === true) sensitiveKeys.add(k);
      }
    }

    const resource: CloudResource = {
      id,
      type: rc.type,
      name: rc.name,
      displayName,
      attributes: flatAttrs,
      dependencies: [],
      provider: provider.id,
      tags,
      ...(sensitiveKeys.size > 0 ? { sensitiveKeys: Array.from(sensitiveKeys) } : {}),
    };

    resources.push(resource);
    actions.set(id, planAction);
  }

  return { resources, actions, warnings };
}
