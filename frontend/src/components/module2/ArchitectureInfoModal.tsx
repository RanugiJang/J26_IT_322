import React from 'react';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                How CardioCare Works
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Intelligent Care Technology Behind Your Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>

        {/* 4 Core Capabilities */}
        <div className="mt-5 space-y-4 text-xs">
          {/* 1: Smart Movement Coach */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center space-x-2 font-bold text-rose-900">
              <span className="rounded-xl bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">📹 Movement Coach</span>
              <span className="text-sm text-slate-900">Video-Based Posture &amp; Exercise Check</span>
            </div>
            <p className="mt-2 text-slate-700 leading-relaxed">
              Our intelligent video system watches how you walk or perform exercises from your smartphone camera. It automatically detects good posture, comfortable pace, and flags if you are moving in a way that may strain your heart — all in real time.
            </p>
          </div>

          {/* 2: Smart Adaptive Coach */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
            <div className="flex items-center space-x-2 font-bold text-indigo-900">
              <span className="rounded-xl bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800">✨ Adaptive Coach</span>
              <span className="text-sm text-slate-900">Learns Your Comfort Every Day</span>
            </div>
            <p className="mt-2 text-slate-700 leading-relaxed">
              Every time you tell us how you felt (completed, too hard, or skipped), our smart coach automatically adjusts the next day's session to stay in your comfort zone. The plan starts gentle and builds gradually — like a patient personal trainer that never pushes you too hard.
            </p>
          </div>

          {/* 3: Sri Lankan Nutrition */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center space-x-2 font-bold text-amber-900">
              <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">🥥 Heart Nutrition</span>
              <span className="text-sm text-slate-900">Sri Lankan Heart-Healthy Food Guide</span>
            </div>
            <p className="mt-2 text-slate-700 leading-relaxed">
              A curated database of Sri Lankan foods with clear guidance on which ones strengthen your heart and which ones to reduce. Familiar foods like King Coconut (Thambili), Gotukola Sambol, and Dhal Curry are prioritized for their natural heart benefits.
            </p>
          </div>

          {/* 4: Multi-Domain Wellness Monitoring */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center space-x-2 font-bold text-emerald-900">
              <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">❤️ Whole Health</span>
              <span className="text-sm text-slate-900">5-Area Daily Health Monitoring</span>
            </div>
            <p className="mt-2 text-slate-700 leading-relaxed">
              CardioCare tracks all 5 lifestyle areas — Sleep, Stress, Movement, Tobacco, and Nutrition — together. When one area needs attention (e.g. poor sleep or high stress), the plan automatically highlights it and sends reminders so nothing is missed before surgery.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white shadow-sm"
          >
            Got It — Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
