import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpLbIcon } from '../icons/GcpIcons';

export function GcpLbNode({ data, selected }: NodeProps<GraphNodeData>) {
  const scheme = data.resource.attributes['load_balancing_scheme'] as string | undefined;

  return (
    <div className={`node-card border-l-[#AB47BC] ${selected ? 'ring-2 ring-[#AB47BC]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpLbIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#AB47BC]">Forwarding Rule</p>
        </div>
      </div>
      {scheme && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{scheme}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#AB47BC]" />
      <Handle type="source" position={Position.Right} className="!bg-[#AB47BC]" />
    </div>
  );
}
