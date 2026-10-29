import React, { useState } from 'react';
import { DailyPriorityAction } from '../types';

interface TopPrioritiesCardProps {
  priorities: DailyPriorityAction[];
  onFeedback: (actionId: string, status: 'done' | 'too_hard' | 'skipped') => void;
}

export const TopPrioritiesCard: React.FC<TopPrioritiesCardProps> = ({ priorities, onFeedback }) => {
  const [activeFeedbackAnim, setActiveFeedbackAnim] = useState<string | null>(null);

  const handleAction = (id: string, status: 'done' | 'too_hard' | 'skipped') => {
    setActiveFeedbackAnim(id);
    setTimeout(() => setActiveFeedbackAnim(null), 1200);
    onFeedback(id, status);
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'Sleep': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Exercise': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Diet': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Stress': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Smoking': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold text-white">
              3
            </span>
            <h2 className="text-lg font-bold text-white">Today's Top 3 Priority Prescriptions</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Ranked by XGBoost + LightGBM Ensemble based on Module 2 CVD Risk & Lifestyle Biomarkers
          </p>
        </div>

        <div className="flex items-center space-x-2 rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400">DQN Adaptive Loop Ready</span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="mt-5 space-y-4">
        {priorities.map((item) => {
          const isPending = item.status === 'pending';
          const isDone = item.status === 'done';
          const isTooHard = item.status === 'too_hard';
          const isSkipped = item.status === 'skipped';

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border p-4 transition-all ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : isTooHard
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : isSkipped
                  ? 'border-slate-700 bg-slate-950/40 opacity-70'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Priority & Content */}
                <div className="flex items-start space-x-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-sm font-bold text-slate-200 border border-slate-700">
                    P{item.priorityNumber}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${getDomainColor(item.domain)}`}>
                        {item.domain}
                      </span>
                      <h3 className="text-sm font-semibold text-white">{item.actionText}</h3>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {item.clinicalReason}
                    </p>

                    <div className="mt-2 flex items-center space-x-2 text-xs text-slate-300 font-mono">
                      <span className="text-rose-400">⚡</span>
                      <span>{item.targetMetric}</span>
                    </div>

                    {/* Dynamic DQN Adaptation Result Banner */}
                    {item.adaptedNextDay && (
                      <div className="mt-3 flex items-center space-x-2 rounded-lg bg-slate-900/90 px-3 py-2 border border-indigo-500/30 text-xs">
                        <span className="text-indigo-400 font-bold">🤖 DQN Adapted for Tomorrow:</span>
                        <span className="text-slate-200">{item.adaptedNextDay}</span>
                        <span className="ml-auto rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                          Reward: {item.dqnReward && item.dqnReward > 0 ? `+${item.dqnReward}` : item.dqnReward}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Feedback Buttons (The Core RL Input) */}
                <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
                  <button
                    onClick={() => handleAction(item.id, 'done')}
                    className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <span>✓ Done</span>
                    <span className="text-[10px] opacity-75">(+1)</span>
                  </button>

                  <button
                    onClick={() => handleAction(item.id, 'too_hard')}
                    className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      isTooHard
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <span>⚡ Too Hard</span>
                    <span className="text-[10px] opacity-75">(-1)</span>
                  </button>

                  <button
                    onClick={() => handleAction(item.id, 'skipped')}
                    className={`flex items-center space-x-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                      isSkipped
                        ? 'bg-slate-700 text-white ring-2 ring-slate-500'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>Skipped</span>
                    <span className="text-[10px] opacity-75">(-0.5)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DQN Coaching Trajectory Note */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400 flex items-start space-x-3">
        <div className="text-base">💡</div>
        <div>
          <span className="font-semibold text-slate-200">How DQN Adaptive Learning Works:</span> When Nimal marks 
          <span className="text-amber-400 font-semibold"> "Too Hard"</span> on a 10 min walk, the DQN agent receives reward <span className="font-mono text-amber-400">-1</span> and scales tomorrow's exercise down to <span className="text-white font-semibold">3 minutes</span> to avoid cardiac exhaustion. Once he completes 3 min (<span className="text-emerald-400 font-semibold">+1</span>), it progressively advances to <span className="text-white font-semibold">7 min (Week 2)</span> and <span className="text-white font-semibold">20 min (Week 4)</span>.
        </div>
      </div>
    </div>
  );
};
