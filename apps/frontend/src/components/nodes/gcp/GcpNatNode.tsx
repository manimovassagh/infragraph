import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpNatIcon } from '../icons/GcpIcons';

export function GcpNatNode({ data, selected }: NodeProps<GraphNodeData>) {
  return (
    <div className={`node-card border-l-[#AB47BC] ${selected ? 'ring-2 ring-[#AB47BC]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpNatIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#AB47BC]">Cloud NAT</p>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-[#AB47BC]" />
      <Handle type="source" position={Position.Right} className="!bg-[#AB47BC]" />
    </div>
  );
}
