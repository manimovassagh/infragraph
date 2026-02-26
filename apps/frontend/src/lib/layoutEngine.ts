import type { GraphNode } from '@infragraph/shared';

export type LayoutMode = 'hierarchical' | 'left-to-right' | 'flat';

export const LAYOUT_OPTIONS: { value: LayoutMode; label: string }[] = [
  { value: 'hierarchical', label: 'Top-Down' },
  { value: 'left-to-right', label: 'Left-Right' },
  { value: 'flat', label: 'Flat Grid' },
];

/**
 * Re-layout nodes based on selected algorithm.
 * The incoming nodes use the default backend hierarchical layout.
 */
export function relayoutNodes(nodes: GraphNode[], mode: LayoutMode): GraphNode[] {
  if (mode === 'hierarchical') return nodes;
  if (mode === 'left-to-right') return layoutLeftToRight(nodes);
  if (mode === 'flat') return layoutFlat(nodes);
  return nodes;
}

/**
 * Left-to-Right: rotate the hierarchical layout 90° clockwise.
 * Swap x/y for all nodes, and swap width/height for containers.
 */
function layoutLeftToRight(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((n) => {
    const w = (n.style?.width as number) ?? 210;
    const h = (n.style?.height as number) ?? 100;
    const isContainer = n.type === 'vpcNode' || n.type === 'subnetNode' ||
      n.type === 'azureVnetNode' || n.type === 'azureSubnetNode' ||
      n.type === 'gcpVpcNode' || n.type === 'gcpSubnetNode';

    return {
      ...n,
      position: { x: n.position.y, y: n.position.x },
      style: {
        ...n.style,
        ...(isContainer ? { width: h, height: w } : {}),
      },
    };
  });
}

const FLAT_COLS = 4;
const FLAT_W = 220;
const FLAT_H = 110;
const FLAT_GAP_X = 30;
const FLAT_GAP_Y = 30;

/**
 * Flat Grid: strip all container nesting, place resources in a simple grid.
 */
function layoutFlat(nodes: GraphNode[]): GraphNode[] {
  // Filter to only leaf resources (not container nodes like VPC/Subnet)
  const containerTypes = new Set([
    'vpcNode', 'subnetNode',
    'azureVnetNode', 'azureSubnetNode',
    'gcpVpcNode', 'gcpSubnetNode',
  ]);

  const containers = nodes.filter((n) => containerTypes.has(n.type));
  const leaves = nodes.filter((n) => !containerTypes.has(n.type));

  // Sort leaves by type then name for visual grouping
  leaves.sort((a, b) => {
    const typeCmp = a.data.resource.type.localeCompare(b.data.resource.type);
    if (typeCmp !== 0) return typeCmp;
    return a.data.resource.displayName.localeCompare(b.data.resource.displayName);
  });

  const result: GraphNode[] = [];

  // Place leaves in grid (strip parentNode)
  leaves.forEach((n, i) => {
    const col = i % FLAT_COLS;
    const row = Math.floor(i / FLAT_COLS);
    result.push({
      ...n,
      position: { x: col * (FLAT_W + FLAT_GAP_X), y: row * (FLAT_H + FLAT_GAP_Y) },
      parentNode: undefined,
      extent: undefined,
      style: { ...n.style, width: FLAT_W, height: FLAT_H },
    });
  });

  // Hide container nodes (keep them but move off-screen with 0 size)
  containers.forEach((n) => {
    result.push({
      ...n,
      position: { x: -9999, y: -9999 },
      style: { ...n.style, width: 0, height: 0, opacity: 0 },
    });
  });

  return result;
}
