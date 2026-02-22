import { useEffect, useState } from 'react';

const STEPS = [
  'Reading file...',
  'Detecting cloud provider...',
  'Parsing resources...',
  'Building dependency graph...',
  'Laying out nodes...',
];

const STEP_DELAY = 400; // ms between each step appearing

interface ParsingProgressProps {
  fileName: string;
}

export function ParsingProgress({ fileName }: ParsingProgressProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= STEPS.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), STEP_DELAY);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-start gap-0 w-80">
        {/* File name header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 border-3 border-slate-200 dark:border-slate-700 border-t-[#ED7100] rounded-full animate-spin" />
          <div>
            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Parsing infrastructure</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-mono">{fileName}</p>
          </div>
        </div>

        {/* Log lines */}
        <div className="w-full rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 font-mono text-xs space-y-1.5">
          {STEPS.slice(0, visibleCount).map((step, i) => {
            const isDone = i < visibleCount - 1;
            return (
              <div
                key={step}
                className={`flex items-center gap-2 transition-opacity duration-200 ${
                  isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isDone ? (
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <div className="h-3.5 w-3.5 shrink-0 border-2 border-current rounded-full border-t-transparent animate-spin" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
