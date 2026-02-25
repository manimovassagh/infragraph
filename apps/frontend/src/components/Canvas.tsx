import { useRef, useMemo, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { GraphNode, GraphEdge, GraphNodeData } from '@infragraph/shared';
import type { ProviderFrontendConfig } from '@/providers/types';

const defaultEdgeOptions = {
  animated: false,
  type: 'smoothstep' as const,
  style: { stroke: '#94a3b8', strokeDasharray: '6 3', strokeWidth: 1.5 },
};

interface CanvasProps {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  selectedNodeId: string | null;
  searchQuery: string;
  hiddenTypes?: Set<string>;
  providerConfig: ProviderFrontendConfig;
  onNodeSelect: (nodeId: string | null) => void;
}

function nodeMatchesSearch(node: GraphNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const r = node.data.resource;
  return (
    r.displayName.toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q) ||
    Object.values(r.tags).some((v) => v.toLowerCase().includes(q)) ||
    Object.values(r.attributes).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
  );
}

export interface CanvasHandle {
  exportPng: () => Promise<void>;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { graphNodes, graphEdges, selectedNodeId, searchQuery, hiddenTypes, providerConfig, onNodeSelect },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const exportPng = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: '#f8fafc' });
    const link = document.createElement('a');
    link.download = 'architecture.png';
    link.href = dataUrl;
    link.click();
  }, []);

  useImperativeHandle(ref, () => ({ exportPng }));

  // Filter out hidden resource types, cascading to children of hidden parents
  const visibleNodes = useMemo(() => {
    if (!hiddenTypes || hiddenTypes.size === 0) return graphNodes;

    // Pass 1: Remove nodes whose type is hidden or whose parent is hidden
    const hiddenNodeIds = new Set(
      graphNodes.filter((n) => hiddenTypes.has(n.data.resource.type)).map((n) => n.id)
    );
    let filtered = graphNodes.filter(
      (n) => !hiddenTypes.has(n.data.resource.type) && (!n.parentNode || !hiddenNodeIds.has(n.parentNode))
    );

    // Pass 2: Remove container nodes with no visible children
    const CONTAINER_TYPES = new Set(['vpcNode', 'subnetNode']);
    let changed = true;
    while (changed) {
      changed = false;
      const currentIds = new Set(filtered.map((n) => n.id));
      const hasChildren = new Set<string>();
      for (const n of filtered) {
        if (n.parentNode && currentIds.has(n.parentNode)) {
          hasChildren.add(n.parentNode);
        }
      }
      const next = filtered.filter(
        (n) => !CONTAINER_TYPES.has(n.type) || hasChildren.has(n.id)
      );
      if (next.length < filtered.length) {
        changed = true;
        filtered = next;
      }
    }

    return filtered;
  }, [graphNodes, hiddenTypes]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    if (!hiddenTypes || hiddenTypes.size === 0) return graphEdges;
    return graphEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [graphEdges, hiddenTypes, visibleNodeIds]);

  // Apply search dimming to nodes
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery) return null;
    return new Set(visibleNodes.filter((n) => nodeMatchesSearch(n, searchQuery)).map((n) => n.id));
  }, [visibleNodes, searchQuery]);

  // Compute which nodes are connected to the hovered node (direct neighbors)
  const hoverConnected = useMemo(() => {
    if (!hoveredNodeId) return null;
    const nodeIds = new Set<string>([hoveredNodeId]);
    const edgeIds = new Set<string>();
    for (const e of visibleEdges) {
      if (e.source === hoveredNodeId || e.target === hoveredNodeId) {
        edgeIds.add(e.id);
        nodeIds.add(e.source);
        nodeIds.add(e.target);
      }
    }
    // Also keep parent containers (VPC/Subnet) of connected nodes visible
    for (const n of visibleNodes) {
      if (nodeIds.has(n.id) && n.parentNode) {
        nodeIds.add(n.parentNode);
        // grandparent (subnet → vpc)
        const parent = visibleNodes.find((p) => p.id === n.parentNode);
        if (parent?.parentNode) nodeIds.add(parent.parentNode);
      }
    }
    return { nodeIds, edgeIds };
  }, [hoveredNodeId, visibleEdges, visibleNodes]);

  const nodes = useMemo(() => {
    return visibleNodes.map((n) => {
      const searchDimmed = matchingNodeIds !== null && !matchingNodeIds.has(n.id);
      const hoverDimmed = hoverConnected !== null && !hoverConnected.nodeIds.has(n.id);
      const isDimmed = searchDimmed || hoverDimmed;
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isDimmed ? 0.2 : 1,
          transition: 'opacity 0.2s ease',
        },
      } as Node<GraphNodeData>;
    });
  }, [visibleNodes, matchingNodeIds, hoverConnected]);

  // Style edges with color-coding, selection highlighting, and hover highlighting
  const edges = useMemo(
    () =>
      visibleEdges.map((e) => {
        const isSelected = selectedNodeId
          ? e.source === selectedNodeId || e.target === selectedNodeId
          : false;
        const isHovered = hoverConnected?.edgeIds.has(e.id) ?? false;
        const isHighlighted = isSelected || isHovered;
        const isDimmed = (selectedNodeId !== null && !isSelected) ||
          (hoverConnected !== null && !isHovered);
        const edgeColor = providerConfig.edgeColors[e.label ?? ''] ?? '#94a3b8';
        const color = isDimmed ? '#e2e8f0' : edgeColor;

        return {
          ...e,
          type: 'smoothstep',
          animated: isHighlighted,
          style: {
            stroke: color,
            strokeDasharray: isHighlighted ? undefined : '6 3',
            strokeWidth: isHighlighted ? 2.5 : 1.5,
            transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
            opacity: isDimmed ? 0.15 : 1,
          },
          labelStyle: {
            fontSize: 10,
            fill: isDimmed ? '#cbd5e1' : '#475569',
            fontWeight: isHighlighted ? 600 : 400,
          },
          labelBgStyle: {
            fill: isHighlighted ? '#ffffff' : '#f8fafc',
            fillOpacity: isHighlighted ? 1 : 0.9,
          },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
        };
      }),
    [visibleEdges, selectedNodeId, hoverConnected, providerConfig.edgeColors]
  ) as Edge[];

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={providerConfig.nodeTypes}
        onNodeClick={(_: React.MouseEvent, node: Node) => onNodeSelect(node.id)}
        onPaneClick={() => onNodeSelect(null)}
        onNodeMouseEnter={(_: React.MouseEvent, node: Node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={providerConfig.minimapNodeColor}
          maskColor="rgba(248, 250, 252, 0.7)"
        />
      </ReactFlow>
    </div>
  );
});
