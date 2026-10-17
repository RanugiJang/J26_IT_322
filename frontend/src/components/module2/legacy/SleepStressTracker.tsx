import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';

interface SleepStressTrackerProps {
  patient: PatientProfile;
}

export const SleepStressTracker: React.FC<SleepStressTrackerProps> = ({ patient }) => {
  // 4-4-4 Box Breathing interactive state
  const [breathingPhase, setBreathingPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [countdown, setCountdown] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'INHALE') {
              setBreathingPhase('HOLD');
              return 4;
            } else if (breathingPhase === 'HOLD') {
              setBreathingPhase('EXHALE');
              return 4;
            } else {
              setBreathingPhase('INHALE');
              setCompletedCycles((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, breathingPhase]);

  const toggleBreathing = () => {
    setIsBreathingActive(!isBreathingActive);
    if (!isBreathingActive) {
      setBreathingPhase('INHALE');
      setCountdown(4);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Split: Sleep on Left, Stress on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= SLEEP DOMAIN ================= */}
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-sm">
                🌙
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Sleep & Nocturnal BP Recovery</h3>
                <p className="text-[11px] text-slate-400">Circadian Blood Pressure Dipping Protocol</p>
              </div>
            </div>

            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
              High Ischemia Risk
            </span>
          </div>

          {/* Current Sleep Metric */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">Recorded Last Night</div>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-rose-400">{patient.sleepHours}</span>
                  <span className="text-sm text-slate-400">hours</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono uppercase text-slate-400">Target</div>
                <div className="mt-1 text-sm font-bold text-emerald-400">&gt;= 7.0 - 8.0 hrs</div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="mt-3">
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                  style={{ width: `${(patient.sleepHours / 8) * 100}%` }}
                ></div>
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0h</span>
                <span className="text-rose-400 font-bold">&lt; 5h Alert Threshold</span>
                <span>8h Optimal</span>
              </div>
            </div>
          </div>

          {/* Clinical Escalation Warning */}
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs text-red-200">
            <div className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping"></span>
              <span>Clinical Escalation Alert (Rule 1)</span>
            </div>
            <p className="mt-1 text-[11px] text-red-300 leading-relaxed">
              Detected &lt; 5 hours sleep for {patient.consecutiveLowSleepDays} consecutive nights. In pre-surgery CVD patients, non-dipping nocturnal BP impairs myocardial perfusion and doubles perioperative arrhythmia vulnerability.
            </p>
          </div>

          {/* Actionable Sleep Hygiene Recommendations */}
          <div className="mt-4 space-y-2.5">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs flex items-start space-x-2.5">
              <span className="text-indigo-400 font-bold">1.</span>
              <div>
                <strong className="text-slate-200">Digital Sunset at 9:30 PM:</strong> Place mobile phone outside bedroom to eliminate blue-light melatonin suppression.
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs flex items-start space-x-2.5">
              <span className="text-indigo-400 font-bold">2.</span>
              <div>
                <strong className="text-slate-200">Strict Bedtime: 10:00 PM:</strong> Consistent circadian timing aligns autonomic parasympathetic reset.
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs flex items-start space-x-2.5">
              <span className="text-indigo-400 font-bold">3.</span>
              <div>
                <strong className="text-slate-200">Cool & Dark Environment (18-20°C):</strong> Thermoregulatory vasodilation facilitates nocturnal deep REM sleep.
              </div>
            </div>
          </div>
        </div>

        {/* ================= STRESS DOMAIN ================= */}
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 text-sm">
                🧘
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Stress & 4-4-4 Box Breathing</h3>
                <p className="text-[11px] text-slate-400">Vagal Nerve Stimulation & Sympathetic Reset</p>
              </div>
            </div>

            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Stress Score: {patient.stressScore}/10
            </span>
          </div>

          {/* Interactive Box Breathing Animation Widget */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              {/* Outer pulsing ring */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-purple-500/40 transition-all duration-1000 ${
                  isBreathingActive
                    ? breathingPhase === 'INHALE'
                      ? 'scale-110 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                      : breathingPhase === 'HOLD'
                      ? 'scale-110 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                      : 'scale-90 border-rose-400 opacity-60'
                    : 'scale-100 opacity-30'
                }`}
              ></div>

              {/* Inner Circle */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-mono uppercase text-purple-300 font-semibold tracking-wider">
                  {isBreathingActive ? breathingPhase : 'READY'}
                </span>
                <span className="text-3xl font-black text-white font-mono mt-0.5">
                  {isBreathingActive ? countdown : '4s'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {completedCycles > 0 ? `${completedCycles} Cycles Done` : 'IN 4 • HOLD 4 • OUT 4'}
                </span>
              </div>
            </div>

            {/* Play / Pause Button */}
            <button
              onClick={toggleBreathing}
              className={`mt-4 rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-lg ${
                isBreathingActive
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/30 ring-2 ring-purple-400/50'
              }`}
            >
              {isBreathingActive ? '⏸ Pause Breathing Pacer' : '▶ Start 4-4-4 Box Breathing'}
            </button>
          </div>

          {/* Doctor Escalation Notice */}
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 text-xs text-amber-200">
            <div className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <span>⚠️ Doctor Escalation Flag (Rule 2)</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-300 leading-relaxed">
              Stress score &gt;= 8.0 for {patient.consecutiveHighStressDays} days (Threshold: 5 days reached). 
              Cardiologist review flagged due to elevated catecholamine surges increasing pre-surgery rupture risk.
            </p>
          </div>

          {/* Clinical Benefit Summary */}
          <div className="mt-4 rounded-lg bg-slate-950/80 p-3 text-xs text-slate-300 border border-slate-800">
            <span className="font-bold text-purple-400">Clinical Impact:</span> Box breathing activates the vagus nerve, reducing heart rate by 6–10 bpm and attenuating stress-induced coronary vasospasms within 3 minutes.
          </div>
        </div>
      </div>
    </div>
  );
};
