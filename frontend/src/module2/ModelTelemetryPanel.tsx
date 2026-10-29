import React from 'react';

interface ModelTelemetryPanelProps {
  backendOnline: boolean;
  isModelLoading: boolean;
  domainRankings: Record<string, number>;
  clinicalFlags: string[];
  currentActionIdx: number;
  lastDqnMessage?: string;
  onRefreshPlan: () => void;
}

export const ModelTelemetryPanel: React.FC<ModelTelemetryPanelProps> = ({
  backendOnline,
  isModelLoading,
  domainRankings,
  clinicalFlags,
  currentActionIdx,
  lastDqnMessage,
  onRefreshPlan,
}) => {
  // Sort domains by probability descending
  const sortedDomains = Object.entries(domainRankings).sort((a, b) => b[1] - a[1]);

  const domainIcons: Record<string, string> = {
    Sleep: '🌙',
    Diet: '🥥',
    Exercise: '🏃',
    Smoking: '🚭',
    Stress: '🧘',
  };

  const domainColors: Record<string, { bar: string; text: string; bg: string }> = {
    Sleep: { bar: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    Diet: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    Exercise: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    Smoking: { bar: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    Stress: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  };

  return (
    <div className="space-y-4">
      {/* Clinical Escalation Alerts (if any) */}
      {clinicalFlags && clinicalFlags.length > 0 && (
        <div className="rounded-2xl border border-rose-500/50 bg-gradient-to-r from-rose-950/70 via-rose-900/40 to-slate-900 p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-2 bg-rose-500 animate-pulse"></div>
          <div className="flex items-start space-x-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-lg text-white shadow-lg shadow-rose-600/40">
              🚨
            </span>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-rose-200 uppercase tracking-wide">
                  Clinical Escalation Flags (Cardiology Care Team Alert)
                </h4>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  {clinicalFlags.length} URGENT
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-300/90 leading-relaxed">
                Trained physiological thresholds exceeded. Action required prior to surgical clearance.
              </p>
              <div className="mt-3 space-y-2">
                {clinicalFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 rounded-lg bg-slate-950/60 p-2.5 border border-rose-800/40 text-xs text-rose-200"
                  >
                    <span className="text-rose-400 font-bold shrink-0">⚠️ [Flag #{idx + 1}]</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Decision Support & Probability Distribution */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                🧠
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Module 2 ML Decision Support & Domain Ranking
              </h3>
              {isModelLoading && (
                <span className="flex items-center space-x-1 text-xs text-indigo-400 animate-pulse font-mono">
                  <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                  <span>Executing models...</span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Dual-Ensemble (XGBoost + LightGBM) analyzes 14 patient biomarkers to determine priority urgency weights.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                backendOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
              ></span>
              <span>{backendOnline ? 'FastAPI Backend Online' : 'Connecting Engine...'}</span>
            </span>

            <button
              onClick={onRefreshPlan}
              disabled={isModelLoading}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1 text-xs font-medium border border-slate-700 transition-colors"
              title="Re-run ML models on current patient profile"
            >
              ↻ Re-Run
            </button>
          </div>
        </div>

        {/* Domain Probabilities Comparative Progress Bars */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          {sortedDomains.map(([domain, prob], index) => {
            const pct = Math.round(prob * 100);
            const style = domainColors[domain] || {
              bar: 'bg-slate-500',
              text: 'text-slate-300',
              bg: 'bg-slate-800',
            };
            const isTop3 = index < 3;

            return (
              <div
                key={domain}
                className={`rounded-xl border p-3 transition-all ${
                  isTop3
                    ? 'border-slate-700 bg-slate-950/80 shadow-md'
                    : 'border-slate-800/80 bg-slate-950/40 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-semibold text-white">
                    <span>{domainIcons[domain] || '🎯'}</span>
                    <span>{domain}</span>
                  </div>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isTop3 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between text-xs font-mono">
                  <span className="text-[11px] text-slate-400">Urgency Weight:</span>
                  <span className={`font-bold ${style.text}`}>{pct}%</span>
                </div>

                {/* Progress Meter Bar */}
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar}`}
                    style={{ width: `${Math.max(8, pct)}%` }}
                  ></div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400">
                  {isTop3 ? (
                    <span className="text-emerald-400 font-medium">✓ Active Priority Today</span>
                  ) : (
                    <span>Secondary Monitoring</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DQN Reinforcement Learning Adaptive State Pill */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
              DQN RL Agent
            </span>
            <span>
              Current Action Level: <strong className="text-white font-mono">Level {currentActionIdx}</strong> (Adaptive duration feedback loop active)
            </span>
          </div>

          {lastDqnMessage && (
            <div className="text-[11px] text-emerald-300 font-mono italic">
              ⚡ {lastDqnMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
