import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpSubnetIcon } from '../icons/GcpIcons';

export function GcpSubnetNode({ data, selected }: NodeProps<GraphNodeData>) {
  const ipRange = data.resource.attributes['ip_cidr_range'] as string | undefined;

  return (
    <div className={`h-full w-full rounded-lg border-2 border-dashed border-[#4285F4] bg-[#4285F4]/5 p-3 ${selected ? 'ring-2 ring-[#4285F4]/30' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpSubnetIcon className="h-6 w-6 shrink-0" />
        <span className="text-sm font-semibold text-[#4285F4]">{data.label}</span>
        {ipRange && <span className="text-xs text-[#4285F4]/70">{ipRange}</span>}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-[#4285F4] !opacity-0" />
      <Handle type="source" position={Position.Right} className="!bg-[#4285F4] !opacity-0" />
    </div>
  );
}
