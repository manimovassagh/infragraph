import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpVpcIcon } from '../icons/GcpIcons';

export function GcpVpcNode({ data, selected }: NodeProps<GraphNodeData>) {
  const autoCreate = data.resource.attributes['auto_create_subnetworks'] as boolean | undefined;

  return (
    <div className={`h-full w-full rounded-lg border-2 border-dashed border-[#34A853] bg-[#34A853]/5 p-3 ${selected ? 'ring-2 ring-[#34A853]/30' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpVpcIcon className="h-6 w-6 shrink-0" />
        <span className="text-sm font-semibold text-[#34A853]">{data.label}</span>
        {autoCreate === false && <span className="text-xs text-[#34A853]/70">custom</span>}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-[#34A853] !opacity-0" />
      <Handle type="source" position={Position.Right} className="!bg-[#34A853] !opacity-0" />
    </div>
  );
}
