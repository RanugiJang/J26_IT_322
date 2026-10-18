import React, { useState, useEffect } from 'react';

interface SleepStressHubProps {
  sleepHours: number;
  stressScore: number;
}

export const SleepStressHub: React.FC<SleepStressHubProps> = ({ sleepHours, stressScore }) => {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    let timer: any;
    if (breathingActive) {
      timer = setInterval(() => {
        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === 'Inhale') return 'Hold';
              if (currentPhase === 'Hold') return 'Exhale';
              if (currentPhase === 'Exhale') return 'Rest';
              setCycleCount((c) => c + 1);
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase('Inhale');
      setPhaseSeconds(4);
    }
    return () => clearInterval(timer);
  }, [breathingActive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-800">
      {/* Sleep & Heart Rest */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🌙</span> Restful Sleep &amp; Heart Recovery
            </h3>
            <p className="text-xs text-slate-500">Helping your heart rest and recharge overnight</p>
          </div>
          {sleepHours < 5 && (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
              Needs Attention
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Current Average</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{sleepHours} hrs</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase text-slate-400">Recommended Goal</div>
              <div className="text-sm font-bold text-emerald-700">7 to 8 hrs</div>
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${sleepHours < 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (sleepHours / 8) * 100)}%` }}
            ></div>
          </div>
        </div>

        {sleepHours < 5 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800">
            <strong>Heart Health Note:</strong> Getting under 5 hours of sleep keeps your blood pressure elevated overnight. Sleeping 7 hours gives your heart time to rest, relax blood vessels, and rebuild stamina.
          </div>
        )}

        <div className="space-y-2.5 text-xs">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
            <strong className="text-indigo-900">1. Relax Screen-Free by 9:30 PM:</strong> Put phone on silent to let your body naturally prepare for sleep.
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
            <strong className="text-indigo-900">2. In Bed Before 10:00 PM:</strong> Promotes deep, restorative rest for your heart and blood vessels.
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
            <strong className="text-indigo-900">3. Cool &amp; Dark Room:</strong> Helps you stay asleep peacefully throughout the night.
          </div>
        </div>
      </div>

      {/* Stress & 4-4-4 Box Breathing Visualizer */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🧘</span> Calm Mind &amp; Deep Breathing
            </h3>
            <p className="text-xs text-slate-500">Quick 2-minute exercise to relax heart rate and tension</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            Stress Level: {stressScore}/10
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col items-center justify-center">
          {/* Animated Ring */}
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-2 border-purple-300 transition-all duration-1000 ${
                breathingActive && (breathPhase === 'Inhale' || breathPhase === 'Hold')
                  ? 'scale-110 border-purple-500 shadow-md shadow-purple-100'
                  : 'scale-90 border-purple-200'
              }`}
            ></div>
            <div className="text-center">
              <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">
                {breathingActive ? breathPhase : 'READY'}
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono mt-0.5">
                {breathingActive ? `${phaseSeconds}s` : '4s'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                {breathingActive ? `Completed: ${cycleCount} rounds` : 'Inhale 4s • Hold 4s • Exhale 4s'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setBreathingActive(!breathingActive)}
            className={`mt-5 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-sm transition-all ${
              breathingActive
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {breathingActive ? '⏹ Stop Breathing Pacer' : '▶ Start Relaxing Breath'}
          </button>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5 text-xs text-purple-900">
          <strong>Why this works:</strong> Slow, structured breathing gently tells your nervous system that you are safe, lowering stress hormones and keeping your heart rate smooth and calm.
        </div>
      </div>
    </div>
  );
};
