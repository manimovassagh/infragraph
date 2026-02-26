import { useState, useCallback, useMemo } from 'react';

import type { CloudResource, GraphEdge } from '@infragraph/shared';
import type { ProviderFrontendConfig } from '@/providers/types';
import { GenericIcon } from './nodes/icons/AwsIcons';

// Lock icon SVG for sensitive fields
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function formatAttrKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAttrValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value || '—';
  return JSON.stringify(value);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NodeDetailPanelProps {
  resource: CloudResource;
  edges: GraphEdge[];
  resources: CloudResource[];
  providerConfig: ProviderFrontendConfig;
  onClose: () => void;
  onSelectResource?: (nodeId: string) => void;
  blastRadiusMode?: boolean;
  onToggleBlastRadius?: () => void;
  blastRadiusCount?: number;
}

export function NodeDetailPanel({ resource, edges, resources, providerConfig, onClose, onSelectResource, blastRadiusMode, onToggleBlastRadius, blastRadiusCount }: NodeDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [prevResourceId, setPrevResourceId] = useState(resource.id);
  if (resource.id !== prevResourceId) {
    setPrevResourceId(resource.id);
    setRevealedKeys(new Set());
  }
  const meta = providerConfig.typeMeta[resource.type] ?? { label: resource.type, color: '#7B8794', Icon: GenericIcon };
  const { Icon } = meta;

  const sensitiveKeys = new Set(resource.sensitiveKeys ?? []);

  const toggleReveal = useCallback((key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Find connected resources via edges
  const connections = useMemo(() =>
    edges
      .filter((e) => e.source === resource.id || e.target === resource.id)
      .map((e) => {
        const otherId = e.source === resource.id ? e.target : e.source;
        const otherResource = resources.find((r) => r.id === otherId);
        const direction = e.source === resource.id ? 'outgoing' : 'incoming';
        return { edge: e, otherResource, direction };
      })
      .filter((c) => c.otherResource),
    [edges, resource.id, resources],
  );

  // Get interesting attributes for this resource type + any sensitive keys
  const displayAttrs = useMemo(() => {
    const attrKeys = providerConfig.interestingAttrs[resource.type] ?? [];
    const allKeys = new Set(attrKeys);
    for (const sk of resource.sensitiveKeys ?? []) {
      if (resource.attributes[sk] !== undefined) allKeys.add(sk);
    }
    return Array.from(allKeys)
      .filter((key) => resource.attributes[key] !== undefined && resource.attributes[key] !== null && resource.attributes[key] !== '')
      .map((key) => ({ key, value: resource.attributes[key] }));
  }, [providerConfig.interestingAttrs, resource.type, resource.attributes, resource.sensitiveKeys]);

  // Tags (excluding Name which is already shown as displayName)
  const tags = Object.entries(resource.tags).filter(([k]) => k !== 'Name');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{resource.displayName}</h2>
            <p className="text-sm font-medium" style={{ color: meta.color }}>{meta.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Terraform ID */}
      <div className="mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Terraform ID</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-mono truncate flex-1">{resource.id}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(resource.id);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="shrink-0 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            title="Copy Terraform ID"
          >
            {copied ? (
              <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Blast Radius Toggle */}
      {onToggleBlastRadius && (
        <button
          onClick={onToggleBlastRadius}
          className={`mb-4 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
            blastRadiusMode
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-xs font-medium">Blast Radius</span>
          </div>
          {blastRadiusMode && blastRadiusCount !== undefined ? (
            <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full">
              {blastRadiusCount} affected
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">Show impact</span>
          )}
        </button>
      )}

      {/* Region */}
      {resource.region && (
        <div className="mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Region</p>
          <p className="text-sm text-slate-600 mt-0.5">{resource.region}</p>
        </div>
      )}

      {/* Attributes */}
      {displayAttrs.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Attributes</p>
          <div className="space-y-1.5">
            {displayAttrs.map(({ key, value }) => {
              const isSensitive = sensitiveKeys.has(key);
              const isRevealed = revealedKeys.has(key);
              return (
                <div key={key} className="flex justify-between items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded">
                  <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                    {isSensitive && <LockIcon className="h-3 w-3 text-amber-500" />}
                    {formatAttrKey(key)}
                  </span>
                  {isSensitive && !isRevealed ? (
                    <button
                      onClick={() => toggleReveal(key)}
                      className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                      title="Click to reveal"
                    >
                      <span className="tracking-widest">{'••••••••'}</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium text-right truncate">
                      {formatAttrValue(value)}
                      {isSensitive && isRevealed && (
                        <button
                          onClick={() => toggleReveal(key)}
                          className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex"
                          title="Hide value"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Tags</p>
          <div className="space-y-1.5">
            {tags.map(([k, v]) => (
              <div key={k} className="flex justify-between items-baseline gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded">
                <span className="text-xs text-slate-500 shrink-0">{k}</span>
                <span className="text-xs text-slate-700 dark:text-slate-200 font-medium text-right truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      {connections.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">
            Connections ({connections.length})
          </p>
          <div className="space-y-1.5">
            {connections.map(({ edge, otherResource, direction }) => {
              const otherMeta = providerConfig.typeMeta[otherResource!.type] ?? { label: otherResource!.type, color: '#7B8794', Icon: GenericIcon };
              const OtherIcon = otherMeta.Icon;
              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectResource?.(otherResource!.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded w-full text-left hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <OtherIcon className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{otherResource!.displayName}</p>
                    <p className="text-[10px] text-slate-400">
                      {direction === 'outgoing' ? '→' : '←'} {edge.label}
                    </p>
                  </div>
                  <svg className="h-3.5 w-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
