import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpAddressIcon } from '../icons/GcpIcons';

export function GcpAddressNode({ data, selected }: NodeProps<GraphNodeData>) {
  const address = data.resource.attributes['address'] as string | undefined;

  return (
    <div className={`node-card border-l-[#4285F4] ${selected ? 'ring-2 ring-[#4285F4]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpAddressIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#4285F4]">External Address</p>
        </div>
      </div>
      {address && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{address}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#4285F4]" />
      <Handle type="source" position={Position.Right} className="!bg-[#4285F4]" />
    </div>
  );
}
