import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpFunctionIcon } from '../icons/GcpIcons';

export function GcpFunctionNode({ data, selected }: NodeProps<GraphNodeData>) {
  const runtime = data.resource.attributes['runtime'] as string | undefined;

  return (
    <div className={`node-card border-l-[#FBBC04] ${selected ? 'ring-2 ring-[#FBBC04]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpFunctionIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#FBBC04]">Cloud Function</p>
        </div>
      </div>
      {runtime && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{runtime}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#FBBC04]" />
      <Handle type="source" position={Position.Right} className="!bg-[#FBBC04]" />
    </div>
  );
}
