import React, { useState } from 'react';
import type { DailyPriorityAction } from './types';

interface DailyRoadmapProps {
  priorities: DailyPriorityAction[];
  onFeedback: (actionId: string, status: 'done' | 'too_hard' | 'skipped') => void;
  onOpenAssessment: () => void;
}

export const DailyRoadmap: React.FC<DailyRoadmapProps> = ({
  priorities,
  onFeedback,
  onOpenAssessment,
}) => {
  const [activeStrategyTab, setActiveStrategyTab] = useState<'action' | 'lifestyle' | 'prehab'>('action');

  const getDomainBadge = (domain: string) => {
    switch (domain) {
      case 'Sleep':
        return {
          label: 'Restful Sleep',
          icon: '🌙',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'Exercise':
        return {
          label: 'Daily Movement',
          icon: '🏃',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'Diet':
        return {
          label: 'Heart Nutrition',
          icon: '🥥',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Smoking':
        return {
          label: 'Smoke-Free Steps',
          icon: '🚭',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'Stress':
        return {
          label: 'Calm & Relaxation',
          icon: '🧘',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      default:
        return {
          label: domain,
          icon: '❤️',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const completedCount = priorities.filter((p) => p.status === 'done').length;

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header Row — Matches "Customized Care Strategy" in reference design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 text-lg shadow-sm border border-rose-100">
            🎯
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">Customized Care Strategy</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {completedCount} of {priorities.length} completed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tailored daily steps to strengthen your heart and build stamina comfortably before surgery.
            </p>
          </div>
        </div>

        {/* Tab Pills (like Action Plan | Supplements | Lifestyle in screenshot) */}
        <div className="flex items-center space-x-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/70 self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveStrategyTab('action')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeStrategyTab === 'action'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Action Plan
          </button>
          <button
            onClick={() => setActiveStrategyTab('lifestyle')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeStrategyTab === 'lifestyle'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lifestyle Habits
          </button>
          <button
            onClick={() => setActiveStrategyTab('prehab')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeStrategyTab === 'prehab'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prehab Routine
          </button>
        </div>
      </div>

      {/* Priorities Grid (like the supplement/action item cards in screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {priorities.map((item, index) => {
          const badge = getDomainBadge(item.domain);
          const isDone = item.status === 'done';
          const isTooHard = item.status === 'too_hard';
          const isSkipped = item.status === 'skipped';

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all ${
                isDone
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                  : isTooHard
                  ? 'border-amber-300 bg-amber-50/40 shadow-sm'
                  : isSkipped
                  ? 'border-slate-200 bg-slate-50/50 opacity-60'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                {/* Top Badge & Priority Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${badge.bg}`}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 font-mono">
                    #{index + 1}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h4>

                {/* Friendly Patient Explanation */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                {/* Target Metric Pill */}
                <div className="flex items-center space-x-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/70 text-xs text-slate-700">
                  <span className="text-rose-500 font-bold">🎯 Daily Goal:</span>
                  <span className="font-semibold text-slate-900">{item.targetMetric}</span>
                </div>

                {/* Why this helps your heart */}
                <div className="text-[11px] text-slate-500 bg-sky-50/50 rounded-xl p-2.5 border border-sky-100/80 leading-normal">
                  <strong className="text-sky-900 block mb-0.5">❤️ Why this helps you:</strong>
                  {item.clinicalRationale}
                </div>

                {/* Smart Adaptive Coach note */}
                {item.adaptedNextDay && (
                  <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2">
                    <span className="text-amber-600 font-bold shrink-0">✨ Smart Coach:</span>
                    <span className="leading-tight">{item.adaptedNextDay}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onFeedback(item.id, 'done')}
                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <span>✓</span>
                  <span>{isDone ? 'Completed' : 'Done'}</span>
                </button>

                <button
                  onClick={() => onFeedback(item.id, 'too_hard')}
                  className={`flex-1 rounded-xl py-2 px-2.5 text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                    isTooHard
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                  title="Adapts this goal to a gentler duration tomorrow"
                >
                  <span>⚡</span>
                  <span>{isTooHard ? 'Eased' : 'Too Hard'}</span>
                </button>

                <button
                  onClick={() => onFeedback(item.id, 'skipped')}
                  className={`rounded-xl py-2 px-2.5 text-xs font-medium transition-all ${
                    isSkipped
                      ? 'bg-slate-200 text-slate-700'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Skip for today"
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Friendly Encouragement & Explanation Banner */}
      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 text-xs text-slate-600 flex items-start space-x-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm text-sm border border-sky-100 font-bold">
          💡
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            How your daily care plan adapts to you:
          </p>
          <p className="text-slate-600 leading-relaxed">
            Every patient is unique. If an exercise or goal feels difficult, simply press{' '}
            <strong className="text-amber-700 font-bold">"Too Hard"</strong>. Your intelligent cardiac coach will gently reduce the duration and intensity for tomorrow, preventing strain while steadily conditioning your heart.
          </p>
        </div>
      </div>
    </div>
  );
};
