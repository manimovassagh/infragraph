import { Handle, Position, type NodeProps } from 'reactflow';
import type { GraphNodeData } from '@infragraph/shared';
import { GcpStorageIcon } from '../icons/GcpIcons';

export function GcpStorageNode({ data, selected }: NodeProps<GraphNodeData>) {
  const storageClass = data.resource.attributes['storage_class'] as string | undefined;

  return (
    <div className={`node-card border-l-[#34A853] ${selected ? 'ring-2 ring-[#34A853]/40' : ''}`}>
      <div className="flex items-center gap-2">
        <GcpStorageIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{data.label}</p>
          <p className="text-[11px] font-medium text-[#34A853]">Cloud Storage</p>
        </div>
      </div>
      {storageClass && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{storageClass}</p>
      )}
      <Handle type="target" position={Position.Left} className="!bg-[#34A853]" />
      <Handle type="source" position={Position.Right} className="!bg-[#34A853]" />
    </div>
  );
}
