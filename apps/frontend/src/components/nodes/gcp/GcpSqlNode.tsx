import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpSqlIcon } from '../icons/GcpIcons';

export function GcpSqlNode({ data, selected }: NodeProps<GraphNodeData>) {
  const dbVersion = data.resource.attributes['database_version'] as string | undefined;

  return (
    <div className={`node-card border-l-[#0F9D58] ${selected ? 'ring-2 ring-[#0F9D58]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpSqlIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#0F9D58]">Cloud SQL</p>
        </div>
      </div>
      {dbVersion && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{dbVersion}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#0F9D58]" />
      <Handle type="source" position={Position.Right} className="!bg-[#0F9D58]" />
    </div>
  );
}
