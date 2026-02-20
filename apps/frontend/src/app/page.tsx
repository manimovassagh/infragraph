'use client';

import { useState } from 'react';
import type { ParseResponse } from '@awsarchitect/shared';
import { Upload } from '@/components/Upload';
import { Canvas } from '@/components/Canvas';
import { NodeDetailPanel } from '@/components/NodeDetailPanel';
import { ResourceSummary } from '@/components/ResourceSummary';
import { parseFile } from '@/lib/api';

type AppState =
  | { view: 'upload' }
  | { view: 'loading' }
  | { view: 'error'; message: string }
  | { view: 'canvas'; data: ParseResponse; selectedNodeId: string | null };

export default function Home() {
  const [state, setState] = useState<AppState>({ view: 'upload' });

  async function handleFileAccepted(file: File) {
    setState({ view: 'loading' });
    try {
      const data = await parseFile(file);
      setState({ view: 'canvas', data, selectedNodeId: null });
    } catch (err) {
      setState({ view: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  if (state.view === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500 animate-pulse">Parsing infrastructure...</p>
      </main>
    );
  }

  if (state.view === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{state.message}</p>
        <button
          onClick={() => setState({ view: 'upload' })}
          className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Try again
        </button>
      </main>
    );
  }

  if (state.view === 'canvas') {
    const selectedResource = state.selectedNodeId
      ? state.data.resources.find((r) => r.id === state.selectedNodeId)
      : null;

    return (
      <div className="flex h-screen">
        <div className="flex-1 relative">
          <ResourceSummary resources={state.data.resources} />
          <Canvas
            graphNodes={state.data.nodes}
            graphEdges={state.data.edges}
            selectedNodeId={state.selectedNodeId}
            onNodeSelect={(id) =>
              setState((prev) =>
                prev.view === 'canvas' ? { ...prev, selectedNodeId: id } : prev
              )
            }
          />
        </div>
        <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto shadow-sm">
          {selectedResource ? (
            <NodeDetailPanel
              resource={selectedResource}
              edges={state.data.edges}
              resources={state.data.resources}
              onClose={() =>
                setState((prev) =>
                  prev.view === 'canvas' ? { ...prev, selectedNodeId: null } : prev
                )
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="h-12 w-12 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-sm text-slate-400">Click a node to inspect it</p>
              <p className="text-xs text-slate-300 mt-1">View attributes, tags, and connections</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: upload view
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">AWSArchitect</h1>
      <p className="text-slate-500 text-sm">Upload a Terraform state file to visualize your infrastructure</p>
      <div className="w-full max-w-lg">
        <Upload onFileAccepted={handleFileAccepted} />
      </div>
    </main>
  );
}
