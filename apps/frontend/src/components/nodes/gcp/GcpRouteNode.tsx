import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpRouteIcon } from '../icons/GcpIcons';

export function GcpRouteNode({ data, selected }: NodeProps<GraphNodeData>) {
  return (
    <div className={`node-card border-l-[#4285F4] ${selected ? 'ring-2 ring-[#4285F4]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpRouteIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#4285F4]">Route</p>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-[#4285F4]" />
      <Handle type="source" position={Position.Right} className="!bg-[#4285F4]" />
    </div>
  );
}
