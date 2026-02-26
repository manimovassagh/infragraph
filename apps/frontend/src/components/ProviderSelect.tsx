import type { CloudProvider, ParseResponse } from '@infragraph/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from './Upload';
import { UserMenu } from './UserMenu';
import { GitHubConnectModal } from './GitHubConnectModal';
import { useDarkMode } from '@/lib/useDarkMode';
import { GITHUB_ICON_PATH, PROVIDER_COLORS } from '@/lib/constants';

const samples: { id: CloudProvider; label: string; color: string; count: string }[] = [
  { id: 'aws', label: 'AWS', color: PROVIDER_COLORS.aws, count: '20+' },
  { id: 'azure', label: 'Azure', color: PROVIDER_COLORS.azure, count: '12+' },
  { id: 'gcp', label: 'GCP', color: PROVIDER_COLORS.gcp, count: '11+' },
];

interface ProviderSelectProps {
  onUpload: (files: File[], mode: 'tfstate' | 'hcl' | 'cfn' | 'cdk' | 'plan') => void;
  onTrySample: (provider: CloudProvider) => void;
  onTryCfnSample: () => void;
  onTryPlanSample: () => void;
  onGitHubParsed: (data: ParseResponse, fileName: string) => void;
}

export function ProviderSelect({ onUpload, onTrySample, onTryCfnSample, onTryPlanSample, onGitHubParsed }: ProviderSelectProps) {
  const [dark, toggleTheme] = useDarkMode();
  const [showGitHub, setShowGitHub] = useState(false);

  return (
    <main className={`min-h-screen flex flex-col ${dark ? 'landing-bg' : 'landing-bg-light'}`}>
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 relative z-20 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-1">
          {[{ label: 'Docs', path: '/docs' }, { label: 'API', path: '/reference' }, { label: 'AI', path: '/ai' }].map(({ label, path }) => (
            <Link
              key={label}
              to={path}
              className="px-4 py-2 text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/manimovassagh/infragraph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d={GITHUB_ICON_PATH} />
            </svg>
            GitHub
          </a>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? (
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <UserMenu />
        </div>
      </nav>

      {/* ── Hero: split layout ── */}
      <div className="flex-1 flex items-center relative z-10">
        <div className="max-w-7xl mx-auto w-full px-8 py-12 lg:py-0 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column: text + CTA */}
          <div className="flex flex-col items-start">
            <h1 className={`text-6xl lg:text-7xl font-bold tracking-tight leading-tight ${dark ? 'text-gradient' : 'text-gradient-light'}`}>
              InfraGraph
            </h1>
            <p className="mt-5 text-2xl font-medium text-slate-600 dark:text-slate-300">
              Terraform, CloudFormation & CDK to diagrams, instantly.
            </p>

            {/* Provider pills */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6">
              {samples.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-base font-medium"
                  style={{
                    backgroundColor: `${s.color}18`,
                    color: s.color,
                    border: `1px solid ${s.color}30`,
                  }}
                >
                  {s.label} {s.count}
                </span>
              ))}
            </div>

            {/* Upload drop zone */}
            <div className="w-full max-w-lg mt-8">
              <Upload onSubmit={onUpload} />
            </div>

            {/* GitHub connect */}
            <button
              onClick={() => setShowGitHub(true)}
              className="flex items-center gap-2 mt-5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d={GITHUB_ICON_PATH} />
              </svg>
              Connect GitHub Repo
            </button>

            {/* Sample pill buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="text-sm text-slate-600 dark:text-slate-500 font-medium">Try a sample:</span>
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onTrySample(s.id)}
                  className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: s.color }}
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={onTryCfnSample}
                className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#E7157B' }}
              >
                CloudFormation
              </button>
              <button
                onClick={onTryPlanSample}
                className="px-3 py-1 text-sm font-semibold rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#7B42F6' }}
              >
                TF Plan
              </button>
            </div>
          </div>

          {/* Right column: product screenshot */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={dark ? '/preview-graph.png' : '/preview-light.png'}
              alt="InfraGraph architecture diagram preview"
              className="w-full max-w-lg rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-center gap-2 px-8 py-4 text-xs text-slate-400 dark:text-slate-500 relative z-10">
        <span className="font-mono">v2.2</span>
        <span>&middot;</span>
        <span className="font-medium">Open Source</span>
      </footer>

      {showGitHub && (
        <GitHubConnectModal
          onClose={() => setShowGitHub(false)}
          onParsed={(data, fileName) => {
            setShowGitHub(false);
            onGitHubParsed(data, fileName);
          }}
        />
      )}
    </main>
  );
}
