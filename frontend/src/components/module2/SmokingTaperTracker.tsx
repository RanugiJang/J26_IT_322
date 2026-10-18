import React, { useState, useEffect } from 'react';

interface SmokingTaperTrackerProps {
  cigarettesPerDay: number;
}

export const SmokingTaperTracker: React.FC<SmokingTaperTrackerProps> = ({ cigarettesPerDay }) => {
  const [cravingActive, setCravingActive] = useState(false);
  const [cravingSeconds, setCravingSeconds] = useState(180); // 3 minutes
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Generate dynamic 4-week step down based on patient's baseline
  const baseline = Math.max(2, cigarettesPerDay);
  const week1 = Math.max(1, Math.round(baseline * 0.75));
  const week2 = Math.max(1, Math.round(baseline * 0.5));
  const week3 = Math.max(1, Math.round(baseline * 0.25));

  useEffect(() => {
    let timer: any;
    if (cravingActive && cravingSeconds > 0) {
      timer = setInterval(() => {
        setCravingSeconds((s) => s - 1);
      }, 1000);
    } else if (cravingSeconds === 0) {
      setCravingActive(false);
      setCravingSeconds(180);
    }
    return () => clearInterval(timer);
  }, [cravingActive, cravingSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Overview Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
              <span>🚭</span>
              <span>Gentle 4-Week Smoke-Free Journey</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
              Step-by-Step Quit Smoking Plan
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              Reducing cigarettes gradually is safer and more sustainable than quitting all at once. Each step helps your blood vessels heal progressively, making surgery safer and recovery faster.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-right shrink-0">
            <div className="text-[11px] text-slate-500 font-bold uppercase">Final Goal</div>
            <div className="text-base font-bold text-emerald-800 mt-0.5">0 Cigarettes ✓</div>
          </div>
        </div>

        {/* 4-Week Milestone Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { week: 1, from: baseline, to: week1, label: '25% Fewer', status: 'This Week' },
            { week: 2, from: week1, to: week2, label: '50% Fewer', status: 'Next Week' },
            { week: 3, from: week2, to: week3, label: '75% Fewer', status: 'Week 3' },
            { week: 4, from: week3, to: 0, label: 'Smoke-Free! 🎉', status: 'Goal Week' },
          ].map((item) => (
            <div
              key={item.week}
              onClick={() => setSelectedWeek(item.week)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                selectedWeek === item.week
                  ? item.week === 4
                    ? 'border-emerald-300 bg-emerald-50/60 shadow-sm'
                    : 'border-rose-300 bg-rose-50/60 shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Week {item.week}</span>
                <span className={item.week === 4 ? 'text-emerald-700' : 'text-rose-700'}>{item.status}</span>
              </div>
              <div className={`mt-2 text-sm font-extrabold ${item.week === 4 ? 'text-emerald-800' : 'text-slate-900'}`}>
                {item.from} ➔ {item.to} per day
              </div>
              <div className={`text-xs mt-1 font-medium ${item.week === 4 ? 'text-emerald-700' : 'text-slate-500'}`}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Craving Surfing Tool & Recovery Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Craving Surfer */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            🌊 Beat a Craving in 3 Minutes
          </h3>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            Cravings feel strong but always pass on their own within 3 minutes. When you feel one, tap below and ride it out — each time you do, your body's healing continues.
          </p>

          <div className="mt-4 rounded-2xl bg-slate-50/70 border border-slate-200 p-5 text-center">
            {cravingActive ? (
              <div className="space-y-2">
                <div className="text-4xl font-black font-mono text-rose-600 animate-pulse">
                  {formatTime(cravingSeconds)}
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  Breathe slowly and deeply — the craving will pass!
                </div>
                <button
                  onClick={() => {
                    setCravingActive(false);
                    setCravingSeconds(180);
                  }}
                  className="mt-3 rounded-xl bg-slate-100 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 font-medium"
                >
                  Reset
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCravingActive(true)}
                className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 py-3.5 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <span>🌊</span>
                <span>I Feel a Craving — Start 3-Minute Timer</span>
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
            {[
              { emoji: '1.', label: 'Delay:', tip: 'Wait just 3 minutes.' },
              { emoji: '2.', label: 'Breathe:', tip: '4 seconds in, 4 out.' },
              { emoji: '3.', label: 'Hydrate:', tip: 'Sip cold water or thambili.' },
              { emoji: '4.', label: 'Move:', tip: 'Take a brief gentle stroll.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <span className="text-rose-700 font-bold">{item.label}</span>
                <span className="text-slate-600 ml-1">{item.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Timeline */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            💚 What Happens When You Stop Smoking
          </h3>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100">
              <span className="font-bold text-emerald-900">Within 24 Hours:</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Your blood cleans up immediately. Oxygen reaches your heart and all your organs at full strength, giving you noticeably more energy.
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50/60 p-4 border border-sky-100">
              <span className="font-bold text-sky-900">Within 48 Hours:</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Blood vessels relax and widen, reducing the strain on your heart significantly, and lowering the risk of complications during surgery.
              </p>
            </div>
            <div className="rounded-2xl bg-purple-50/60 p-4 border border-purple-100">
              <span className="font-bold text-purple-900">2 to 3 Weeks:</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Your body's ability to heal wounds doubles — meaning your recovery after surgery will be faster, less painful, and with far fewer risks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
