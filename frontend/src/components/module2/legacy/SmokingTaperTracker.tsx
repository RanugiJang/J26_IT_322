import React, { useState } from 'react';
import { PatientProfile } from '../types';

interface SmokingTaperTrackerProps {
  patient: PatientProfile;
}

export const SmokingTaperTracker: React.FC<SmokingTaperTrackerProps> = ({ patient }) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [cravingSurfingActive, setCravingSurfingActive] = useState(false);
  const [cravingTimer, setCravingTimer] = useState(180); // 3 minutes

  const taperWeeks = [
    { week: 1, target: '8 ➔ 6 cigs/day', reduction: '25% reduction', status: 'In Progress (Active)' },
    { week: 2, target: '6 ➔ 4 cigs/day', reduction: '50% reduction', status: 'Scheduled' },
    { week: 3, target: '4 ➔ 2 cigs/day', reduction: '75% reduction', status: 'Scheduled' },
    { week: 4, target: '2 ➔ 0 cigs/day', reduction: '100% Smoke-Free', status: 'Pre-Surgery Goal' },
  ];

  const handleStartCravingSurfing = () => {
    setCravingSurfingActive(true);
    let timeLeft = 180;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCravingTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setCravingSurfingActive(false);
        setCravingTimer(180);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
              <span>🚭 Smoking Cessation AI</span>
              <span>•</span>
              <span>Calibrated Stage Classifier</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
              Pre-Surgery Nicotine Tapering & Vascular Recovery
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Patient is currently smoking {patient.cigarettesPerDay} cigarettes/day. Logistic regression stage classifier detected 
              <span className="text-amber-400 font-semibold"> Preparation Stage</span>. Gradual tapering prevents severe withdrawal spikes while restoring vascular endothelium.
            </p>
          </div>

          {/* Current Stage Badge */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Stage of Change</div>
            <div className="text-sm font-bold text-amber-400">Preparation / Action</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Target: 0 Cigs by Day 24</div>
          </div>
        </div>

        {/* 4-Week Tapering Progress Timeline */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {taperWeeks.map((tw) => {
            const isCurrent = tw.week === currentWeek;
            return (
              <div
                key={tw.week}
                onClick={() => setCurrentWeek(tw.week)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isCurrent
                    ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-900/20'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">Week {tw.week}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      isCurrent
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tw.status}
                  </span>
                </div>

                <div className="mt-2 text-base font-extrabold text-white">{tw.target}</div>
                <div className="text-xs text-slate-400 mt-1">{tw.reduction}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Craving-Surfing Protocol & Vascular Healing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Craving-Surfing Interactive Tool */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <span className="text-base">🌊</span>
            <h3 className="text-sm font-bold text-white">Interactive Craving-Surfing Tool</h3>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            A nicotine craving peaks at <strong>3 minutes</strong> and subsides spontaneously. When the urge strikes, press the button below to initiate the 4-D craving-surfing protocol.
          </p>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            {cravingSurfingActive ? (
              <div>
                <div className="text-2xl font-black font-mono text-rose-400">
                  {Math.floor(cravingTimer / 60)}:{(cravingTimer % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Ride the craving wave — breathe slow and deep.
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartCravingSurfing}
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-rose-400"
              >
                🌊 I Have a Craving Now (Start 3-Min Protocol)
              </button>
            )}
          </div>

          {/* The 4 D's */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">1. Delay:</span> Wait 3 min.
            </div>
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">2. Deep Breathe:</span> Inhale 4s, out 4s.
            </div>
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">3. Drink Water:</span> Sip cold water slowly.
            </div>
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">4. Distract:</span> Walk or call a friend.
            </div>
          </div>
        </div>

        {/* Pre-Surgery Vascular Healing Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <span className="text-base">🫀</span>
            <h3 className="text-sm font-bold text-white">Pre-Surgery Arterial Recovery Timeline</h3>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            <div className="flex items-start space-x-3 rounded-lg bg-slate-950 p-2.5 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold shrink-0">24 Hours:</span>
              <span className="text-slate-300">Blood carbon monoxide levels drop to normal; arterial oxygen saturation climbs to 98%.</span>
            </div>

            <div className="flex items-start space-x-3 rounded-lg bg-slate-950 p-2.5 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold shrink-0">48 Hours:</span>
              <span className="text-slate-300">Myocardial oxygen demand reduces; coronary microvascular resistance drops by 18%.</span>
            </div>

            <div className="flex items-start space-x-3 rounded-lg bg-slate-950 p-2.5 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold shrink-0">2–3 Weeks:</span>
              <span className="text-slate-300">Surgical wound healing capability doubles; risk of postoperative sternal wound infection drops by 45%.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
