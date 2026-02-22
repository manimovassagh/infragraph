import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpFirewallIcon } from '../icons/GcpIcons';

export function GcpFirewallNode({ data, selected }: NodeProps<GraphNodeData>) {
  const direction = data.resource.attributes['direction'] as string | undefined;

  return (
    <div className={`node-card border-l-[#EA4335] ${selected ? 'ring-2 ring-[#EA4335]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpFirewallIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#EA4335]">Firewall Rule</p>
        </div>
      </div>
      {direction && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{direction}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#EA4335]" />
      <Handle type="source" position={Position.Right} className="!bg-[#EA4335]" />
    </div>
  );
}
