import React, { useState, useEffect } from 'react';
import type { PatientProfile } from './types';
import smokingHeroBg from './assets/smoking/smoking_hero_bg.jpg';
import smokingLungsRecovery from './assets/smoking/smoking_lungs_recovery.jpg';
import smokingFreshLifestyle from './assets/smoking/smoking_fresh_lifestyle.jpg';

interface SmokingTaperTrackerProps {
  cigarettesPerDay: number;
  patient?: PatientProfile | null;
}

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const SmokingTaperTracker: React.FC<SmokingTaperTrackerProps> = ({
  cigarettesPerDay,
  patient,
}) => {
  const [cravingActive, setCravingActive] = useState(false);
  const [cravingSeconds, setCravingSeconds] = useState(180); // 3 minutes
  const [selectedWeek, setSelectedWeek] = useState(1);

  const patientName = patient?.name || 'you';

  // Dynamic 4-week step down based on patient's baseline
  const baseline = Math.max(2, cigarettesPerDay || patient?.cigarettesPerDay || 10);
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

  const weeks = [
    { week: 1, from: baseline, to: week1, label: '25% fewer', status: 'This week', tip: 'Drop the easiest cigarettes first, such as right after morning tea or post-lunch.' },
    { week: 2, from: week1, to: week2, label: '50% fewer', status: 'Next week', tip: 'Delay each cigarette by 30 to 45 minutes. Keep cold fresh water or green tea near you.' },
    { week: 3, from: week2, to: week3, label: '75% fewer', status: 'Week 3', tip: 'Retain only the essential habit triggers. Activate the 3-minute Craving Surfer for all other cravings.' },
    { week: 4, from: week3, to: 0, label: 'Smoke-free', status: 'Goal week', tip: 'Celebrate your official quit milestone! Inform family and your prehab team for celebration.' },
  ];
  const active = weeks.find((w) => w.week === selectedWeek) || weeks[0];

  const risks = [
    { n: 1, title: 'Coronary Vasospasm & Plaque', text: 'Nicotine triggers acute arterial vasoconstriction, decreasing coronary perfusion when your myocardium needs it most.' },
    { n: 2, title: 'Carboxyhemoglobin Elevation', text: 'Carbon monoxide binds to hemoglobin 200x tighter than oxygen, starving your vital tissues of oxygen.' },
    { n: 3, title: 'Impaired Tissue & Wound Healing', text: 'Cigarette toxins inhibit microvascular capillary growth, dramatically increasing postoperative infection risk.' },
  ];

  return (
    <div className="space-y-8 font-sans pb-6">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION ("Smoke-Free" Grand Editorial Header)                     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#242b26] shadow-2xl shadow-stone-900/30 border border-stone-200/40 min-h-[560px] sm:min-h-[620px] flex flex-col justify-between">
        {/* Background Image with warm lush morning garden sunlight */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-[1.02]"
          style={{
            backgroundImage: `url(${smokingHeroBg})`,
          }}
        >
          {/* Subtle gradient veil for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/45 via-stone-900/25 to-stone-950/80" />
          <div className="absolute inset-0 bg-emerald-950/15 backdrop-brightness-[0.93]" />
        </div>

        {/* Top Floating Pill Navigation Bar */}
        <div className="relative z-20 px-5 pt-6 sm:px-10">
          <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/20 px-5 py-3 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-black/10">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-emerald-900 text-xs font-black shadow-sm">
                🚭
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow-sm">
                SMOKE-FREE PREHAB
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-[11px] font-semibold tracking-wider uppercase text-white/90">
              <button onClick={() => scrollToId('taper-plan')} className="hover:text-emerald-200 transition-colors">
                4-Week Taper Plan
              </button>
              <button onClick={() => scrollToId('taper-craving')} className="hover:text-emerald-200 transition-colors">
                Craving Surfer
              </button>
              <button onClick={() => scrollToId('taper-recovery')} className="hover:text-emerald-200 transition-colors">
                Vascular Timeline
              </button>
            </nav>

            <button
              onClick={() => scrollToId('taper-plan')}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-900 hover:bg-emerald-50 hover:shadow-md transition-all uppercase tracking-wider"
            >
              Start Taper Plan
            </button>
          </header>
        </div>

        {/* Giant Hero Title: "Breathe" (mirrors "Recovery", "Movement", "Calmness") */}
        <div className="relative z-10 px-5 pt-6 sm:px-10 text-center select-none pointer-events-none">
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-light tracking-tight text-white/95 leading-none drop-shadow-[0_4px_35px_rgba(0,0,0,0.5)]">
            Breathe
          </h1>
        </div>

        {/* Hero Middle Content: Left and Right Copy */}
        <div className="relative z-20 px-6 sm:px-12 pb-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-end text-white">
          {/* Left Kicker & Subhead */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-emerald-200/95 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Clean Oxygen for Your Heart · {patientName}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
              Restoring clean air <br />
              <span className="font-light italic text-emerald-100">and surgical resilience</span>
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-stone-200 leading-relaxed font-normal">
              Every cigarette eliminated expands your arterial lumen, frees up oxygen-carrying hemoglobin,
              and significantly slashes cardiac and pulmonary surgical risks.
            </p>
          </div>

          {/* Right Copy & Primary CTAs */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <div className="rounded-2xl bg-black/40 border border-white/20 p-4 max-w-md backdrop-blur-md text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Baseline: {baseline} Cigarettes / Day</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 border border-emerald-400/30">
                  Target: 0 (Goal Week)
                </span>
              </div>
              <p className="text-[11px] text-stone-200 leading-relaxed">
                Gradual tapering supported by 3-minute craving redirection gently clears toxins without severe withdrawal spikes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => scrollToId('taper-plan')}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-stone-900 hover:bg-emerald-100 transition-all shadow-lg shadow-black/20 flex items-center space-x-1.5"
              >
                <span>View 4-Week Step-Down</span>
                <span>➔</span>
              </button>
              <button
                onClick={() => {
                  setCravingActive(true);
                  scrollToId('taper-craving');
                }}
                className="rounded-full px-4 py-2.5 text-xs font-bold transition-all flex items-center space-x-2 backdrop-blur-md border bg-black/35 hover:bg-black/55 text-white border-white/20"
              >
                <span>⚡ 3-Min Craving Timer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Banner */}
        <div className="relative z-20 border-t border-white/20 bg-black/30 backdrop-blur-md px-6 py-3.5 sm:px-12">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-medium tracking-wider uppercase text-stone-200/90 gap-3">
            <span>Clinical Nicotine Deceleration</span>
            <span className="hidden sm:inline">•</span>
            <span>Microvascular Re-Oxygenation</span>
            <span className="hidden sm:inline">•</span>
            <span>Zero Abrupt Shock</span>
            <span className="hidden sm:inline">•</span>
            <span>Surgeon-Approved Recovery Protocol</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. 3-COLUMN EDITORIAL PHOTOS & VASCULAR RECOVERY                          */}
      {/* ========================================================================= */}
      <section className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900"></span>
            <span>Clinical Nicotine Deceleration</span>
          </div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            How stepping away from smoke shields your heart &amp; lungs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Photo Card: Clinician Consultation / Lungs */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={smokingLungsRecovery}
              alt="Physician explaining cardiovascular re-oxygenation to cardiac patient"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 left-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60">
              <div className="text-xs font-black text-rose-700">Rapid Rebound</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                CO Cleared in 24 Hours
              </div>
            </div>
            {/* Bottom Caption Pill */}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-stone-950/75 backdrop-blur-md p-3 text-white text-[11px] leading-relaxed">
              Clinical counseling guides gradual reduction, allowing damaged bronchial cilia and cardiac arterioles to regenerate smoothly.
            </div>
          </div>

          {/* Center Column: 3 Major Risks Eliminated */}
          <div className="md:col-span-4 space-y-5 px-2">
            <ul className="space-y-4">
              {risks.map((r) => (
                <li key={r.n} className="flex gap-3 items-start">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-extrabold text-rose-700 shadow-sm border border-rose-200">
                    {r.n}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-stone-900">{r.title}</div>
                    <div className="text-xs leading-relaxed text-stone-600 mt-0.5">{r.text}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => scrollToId('taper-plan')}
                className="rounded-full bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Explore 4-Week Plan</span>
                <span>➔</span>
              </button>
              <button
                onClick={() => {
                  setCravingActive(true);
                  scrollToId('taper-craving');
                }}
                className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
              >
                <span>Craving Surfer</span>
              </button>
            </div>
          </div>

          {/* Right Photo Card: Vibrant Smoke-Free Vitality */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={smokingFreshLifestyle}
              alt="Healthy happy person drinking fresh hydrating coconut water outdoors"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60 text-right">
              <div className="text-xs font-black text-emerald-700">Smoke-Free</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Full Vitality Restored
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="absolute bottom-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-xl border border-white/80">
              <div className="text-lg font-black text-emerald-700">50% Lower</div>
              <div className="text-[10px] font-semibold text-stone-600">
                Post-Op Pulmonary Infection Risk
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 4-WEEK STEP-DOWN PLAN                                                  */}
      {/* ========================================================================= */}
      <section id="taper-plan" className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-6 scroll-mt-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900"></span>
            <span>Personalized Step-Down Protocol</span>
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-stone-900">Your 4-Week Taper Roadmap</h3>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
            Stepping down gradually preserves cardiovascular stability and prevents sharp withdrawal anxiety. Select a week to review your daily target and habits:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {weeks.map((item) => {
            const isSelected = selectedWeek === item.week;
            const isGoal = item.week === 4;
            return (
              <button
                key={item.week}
                onClick={() => setSelectedWeek(item.week)}
                aria-pressed={isSelected}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? isGoal
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/40 shadow-md'
                      : 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400/40 shadow-md'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-stone-500 uppercase tracking-wider">Week {item.week}</span>
                  <span className={isGoal ? 'text-emerald-700' : 'text-rose-600'}>{item.status}</span>
                </div>
                <div className={`mt-2 text-3xl font-black ${isGoal ? 'text-emerald-700' : 'text-stone-900'}`}>
                  {item.to}
                  <span className="ml-1 text-xs font-semibold text-stone-500">cigs/day</span>
                </div>
                <div className="mt-1 text-[11px] text-stone-500">
                  from {item.from} · {item.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs leading-relaxed text-stone-800 flex items-start space-x-2">
          <span className="text-rose-600 font-bold text-sm">💡</span>
          <div>
            <strong className="font-bold text-rose-800">Week {active.week} Clinical Tip: </strong>
            <span>{active.tip}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CRAVING SURFER + RECOVERY TIMELINE                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Craving surfer */}
        <section id="taper-craving" className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-4 scroll-mt-6">
          <h3 className="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
            <span>⚡</span>
            <span>Beat a Craving in 3 Minutes</span>
          </h3>
          <p className="text-xs leading-relaxed text-stone-500">
            Neurochemical nicotine cravings peak sharply but naturally subside within 180 seconds. Trigger the countdown and ride the wave:
          </p>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center">
            {cravingActive ? (
              <div className="space-y-3" aria-live="polite">
                <div className="text-6xl font-black font-mono text-rose-600 tracking-tight">{formatTime(cravingSeconds)}</div>
                <div className="text-xs font-medium text-stone-700">Slow 4-second inhale, gentle 4-second exhale. You are doing great.</div>
                <button
                  onClick={() => {
                    setCravingActive(false);
                    setCravingSeconds(180);
                  }}
                  className="mt-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100 transition shadow-sm"
                >
                  Reset Timer
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCravingActive(true)}
                className="w-full rounded-full bg-rose-600 hover:bg-rose-700 py-4 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition uppercase tracking-wider"
              >
                I Feel a Craving: Start 3-Minute Timer
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
            {[
              { label: 'Delay:', tip: 'Wait 3 full minutes.' },
              { label: 'Breathe:', tip: '4s inhale, 4s exhale.' },
              { label: 'Hydrate:', tip: 'Sip fresh cold water or thambili.' },
              { label: 'Move:', tip: 'Take a brief, easy stroll.' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-200/80 bg-stone-50 p-3">
                <span className="font-bold text-rose-700">{item.label}</span>
                <span className="ml-1 text-stone-600">{item.tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recovery timeline */}
        <section id="taper-recovery" className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-4 scroll-mt-6">
          <h3 className="text-lg font-extrabold text-stone-900 flex items-center space-x-2">
            <span>🫀</span>
            <span>Vascular Rejuvenation Timeline</span>
          </h3>
          <p className="text-xs leading-relaxed text-stone-500">Every smoke-free hour directly rebuilds your vascular lining:</p>

          <ol className="relative mt-4 space-y-6 border-l-2 border-emerald-300 pl-6">
            {[
              { when: 'Within 24 Hours', color: 'bg-emerald-500', text: 'Carbon monoxide is flushed from circulation. Arterial blood carries maximum oxygen, enhancing myocardium endurance.' },
              { when: 'Within 48 Hours', color: 'bg-sky-500', text: 'Peripheral vascular resistance drops. Arterial spasms disappear and blood pressure normalizes safely.' },
              { when: '2 to 3 Weeks', color: 'bg-purple-500', text: 'Microvascular capillary proliferation accelerates wound healing, reducing surgical infection rates by more than half.' },
            ].map((step) => (
              <li key={step.when} className="relative">
                <span className={`absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white ${step.color} shadow-sm`} />
                <div className="text-sm font-bold text-stone-900">{step.when}</div>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};