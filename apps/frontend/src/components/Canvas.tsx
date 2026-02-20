'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { GraphNode, GraphEdge, GraphNodeData } from '@awsarchitect/shared';

import { VpcNode } from './nodes/VpcNode';
import { SubnetNode } from './nodes/SubnetNode';
import { Ec2Node } from './nodes/Ec2Node';
import { RdsNode } from './nodes/RdsNode';
import { S3Node } from './nodes/S3Node';
import { LambdaNode } from './nodes/LambdaNode';
import { LbNode } from './nodes/LbNode';
import { IgwNode } from './nodes/IgwNode';
import { NatNode } from './nodes/NatNode';
import { RouteTableNode } from './nodes/RouteTableNode';
import { SecurityGroupNode } from './nodes/SecurityGroupNode';
import { EipNode } from './nodes/EipNode';
import { GenericNode } from './nodes/GenericNode';

// MUST be defined at module scope — inside component causes infinite re-renders
const nodeTypes = {
  vpcNode: VpcNode,
  subnetNode: SubnetNode,
  ec2Node: Ec2Node,
  rdsNode: RdsNode,
  s3Node: S3Node,
  lambdaNode: LambdaNode,
  lbNode: LbNode,
  igwNode: IgwNode,
  natNode: NatNode,
  routeTableNode: RouteTableNode,
  securityGroupNode: SecurityGroupNode,
  eipNode: EipNode,
  genericNode: GenericNode,
};

const defaultEdgeOptions = {
  animated: false,
  type: 'smoothstep' as const,
  style: { stroke: '#94a3b8', strokeDasharray: '6 3', strokeWidth: 1.5 },
};

function minimapNodeColor(node: Node) {
  switch (node.type) {
    case 'vpcNode':            return '#1B660F';
    case 'subnetNode':         return '#147EBA';
    case 'ec2Node':            return '#ED7100';
    case 'rdsNode':            return '#3B48CC';
    case 's3Node':             return '#3F8624';
    case 'lambdaNode':         return '#ED7100';
    case 'lbNode':             return '#8C4FFF';
    case 'securityGroupNode':  return '#DD344C';
    case 'igwNode':            return '#8C4FFF';
    case 'natNode':            return '#8C4FFF';
    case 'eipNode':            return '#ED7100';
    case 'routeTableNode':     return '#8C4FFF';
    default:                   return '#7B8794';
  }
}

// Edge colors by relationship type
const EDGE_COLORS: Record<string, string> = {
  'secured by': '#DD344C',
  'depends on': '#3B48CC',
  'routes via': '#8C4FFF',
  'uses eip':   '#ED7100',
  'attached to': '#64748b',
  'behind lb':  '#8C4FFF',
};

interface CanvasProps {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export function Canvas({ graphNodes, graphEdges, selectedNodeId, onNodeSelect }: CanvasProps) {
  const [nodes, , onNodesChange] = useNodesState(graphNodes as Node<GraphNodeData>[]);

  // Style edges with color-coding and selection highlighting
  const edges = useMemo(
    () =>
      graphEdges.map((e) => {
        const isConnected = selectedNodeId
          ? e.source === selectedNodeId || e.target === selectedNodeId
          : false;
        const isDimmed = selectedNodeId !== null && !isConnected;
        const edgeColor = EDGE_COLORS[e.label ?? ''] ?? '#94a3b8';
        const color = isDimmed ? '#e2e8f0' : edgeColor;

        return {
          ...e,
          type: 'smoothstep',
          animated: isConnected,
          style: {
            stroke: color,
            strokeDasharray: isConnected ? undefined : '6 3',
            strokeWidth: isConnected ? 2.5 : 1.5,
          },
          labelStyle: {
            fontSize: 10,
            fill: isDimmed ? '#cbd5e1' : '#475569',
            fontWeight: isConnected ? 600 : 400,
          },
          labelBgStyle: {
            fill: isConnected ? '#ffffff' : '#f8fafc',
            fillOpacity: isConnected ? 1 : 0.9,
          },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
        };
      }),
    [graphEdges, selectedNodeId]
  ) as Edge[];

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onNodeSelect(node.id)}
      onPaneClick={() => onNodeSelect(null)}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultEdgeOptions={defaultEdgeOptions}
    >
      <Background color="#cbd5e1" gap={20} size={1} />
      <Controls />
      <MiniMap
        nodeColor={minimapNodeColor}
        maskColor="rgba(248, 250, 252, 0.7)"
      />
    </ReactFlow>
  );
}
