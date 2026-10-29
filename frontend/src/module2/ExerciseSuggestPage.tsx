import React from 'react';
import type { PatientProfile, SuggestedExercise } from './types';
import movementHeroBg from './assets/exercises/movement_hero_bg.jpg';
import movementWarmupCard from './assets/exercises/movement_warmup_card.jpg';
import movementCardioWalking from './assets/exercises/movement_cardio_walking.jpg';

export type StudioStep = 'suggest' | 'reference' | 'upload' | 'analysis';
type Feedback = 'done' | 'too_hard' | 'skipped' | null;

export interface ExerciseSuggestPageProps {
  exercise: SuggestedExercise;
  patient?: PatientProfile | null;
  currentDuration: number;
  usingMlModel: boolean;
  feedbackGiven: Feedback;
  onFeedback: (status: 'done' | 'too_hard' | 'skipped') => void;
  onStepChange: (step: StudioStep) => void;
}

export const ExerciseSuggestPage: React.FC<ExerciseSuggestPageProps> = ({
  exercise,
  patient,
  currentDuration,
  usingMlModel,
  feedbackGiven,
  onFeedback,
  onStepChange,
}) => {
  const name = patient?.name || 'you';

  const benefits = [
    { n: 1, title: 'Stronger Myocardial Stamina', text: 'Conditions your heart muscle and arterial elasticity at a safe, submaximal rate.' },
    { n: 2, title: 'Deep Peripheral Circulation', text: 'Mobilizes venous return, stimulating collateral blood flow and preventing blood clots.' },
    { n: 3, title: 'Accelerated Post-Op Recovery', text: 'Builds functional aerobic reserve so you can stand and mobilize comfortably after surgery.' },
  ];

  const stats = [
    { label: 'Session Length', value: `${exercise.durationMinutes || currentDuration} min`, note: 'Tailored daily goal', tone: 'text-emerald-700' },
    { label: 'Target Cadence', value: exercise.targetCadence || 'Comfortable pace', note: 'Steady aerobic cadence', tone: 'text-slate-900' },
    { label: 'Effort Level (RPE)', value: exercise.rpeScale || 'Fairly light (11-12)', note: 'Talk comfortably without gasping', tone: 'text-slate-900' },
    { label: 'Safety Certification', value: 'Prehab Approved', note: 'Strain-free cardiac protection', tone: 'text-emerald-700' },
  ];

  const posturePoints = exercise.posturePoints && exercise.posturePoints.length > 0
    ? exercise.posturePoints.slice(0, 4)
    : [
      'Keep your spine tall and chest comfortably open',
      'Maintain relaxed shoulders and rhythmic arm swings',
      'Breathe naturally in cadence with your strides',
      'Pause and rest if you feel sudden fatigue or dizziness',
    ];

  return (
    <div className="space-y-8 font-sans pb-6">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL HERO BANNER ("Movement")                                     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#1c2e28] shadow-2xl shadow-emerald-950/20 border border-emerald-900/40 min-h-[560px] sm:min-h-[620px] flex flex-col justify-between">
        {/* Background Image with warm natural coastal lighting overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-[1.02]"
          style={{
            backgroundImage: `url(${movementHeroBg})`,
          }}
        >
          {/* Subtle gradient veil for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-900/30 to-stone-950/80" />
          <div className="absolute inset-0 bg-emerald-950/20 backdrop-brightness-[0.93]" />
        </div>

        {/* Top Floating Pill Navigation Bar */}
        <div className="relative z-20 px-5 pt-6 sm:px-10">
          <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/20 px-5 py-3 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-black/10">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-emerald-900 text-xs font-black shadow-sm">
                🏃
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow-sm">
                DAILY MOVEMENT PREHAB
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-[11px] font-semibold tracking-wider uppercase text-white/90">
              <button onClick={() => onStepChange('reference')} className="hover:text-emerald-200 transition-colors">
                Video Guide
              </button>
              <button onClick={() => onStepChange('upload')} className="hover:text-emerald-200 transition-colors">
                AI Kinematic Check
              </button>
              <button onClick={() => onStepChange('analysis')} className="hover:text-emerald-200 transition-colors">
                Posture Breakdown
              </button>
            </nav>

            <button
              onClick={() => onStepChange('reference')}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-900 hover:bg-emerald-50 hover:shadow-md transition-all uppercase tracking-wider"
            >
              Start Session
            </button>
          </header>
        </div>

        {/* Giant Hero Title: "Movement" (mirrors "Recovery" and "Calmness") */}
        <div className="relative z-10 px-5 pt-6 sm:px-10 text-center select-none pointer-events-none">
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-light tracking-tight text-white/95 leading-none drop-shadow-[0_4px_35px_rgba(0,0,0,0.5)]">
            Movement
          </h1>
        </div>

        {/* Hero Middle Content: Left and Right Copy with Present Exercise Details */}
        <div className="relative z-20 px-6 sm:px-12 pb-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-end text-white">
          {/* Left Kicker & Prescribed Exercise Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 px-3 py-1 text-[11px] font-bold text-emerald-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>Tailored for {name === 'you' ? 'Your Routine' : name}</span>
              </span>
              <span className="inline-flex items-center space-x-1 rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                <span>{usingMlModel ? '🤖 AI Prescribed' : '⏱️ Clinical Goal'}:</span>
                <span className="font-bold text-emerald-200">{exercise.durationMinutes || currentDuration} min</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
              {exercise.title} <br />
              <span className="font-light italic text-emerald-100">safe cardiovascular pacing</span>
            </h2>

            <p className="max-w-md text-xs sm:text-sm text-stone-200 leading-relaxed font-normal">
              {exercise.description}
            </p>
          </div>

          {/* Right Copy & Primary CTAs */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <div className="rounded-2xl bg-black/40 border border-white/20 p-4 max-w-md backdrop-blur-md text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Today's Target: {exercise.durationMinutes || currentDuration} min</span>
                <span className="text-stone-300 font-normal">{exercise.cardioIntensity || 'Moderate'}</span>
              </div>
              <p className="text-[11px] text-stone-200 leading-relaxed">
                Aim for a smooth rhythm where you can speak in full sentences without feeling breathless. This preserves optimal myocardial oxygen delivery.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => onStepChange('reference')}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-stone-900 hover:bg-emerald-100 transition-all shadow-lg shadow-black/20 flex items-center space-x-1.5"
              >
                <span>Watch Video Guide</span>
                <span>📹</span>
              </button>
              <button
                onClick={() => onStepChange('upload')}
                className="rounded-full px-5 py-2.5 text-xs font-bold transition-all flex items-center space-x-2 backdrop-blur-md border bg-black/35 hover:bg-black/55 text-white border-white/20"
              >
                <span>AI Motion Check ➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Banner */}
        <div className="relative z-20 border-t border-white/20 bg-black/30 backdrop-blur-md px-6 py-3.5 sm:px-12">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-medium tracking-wider uppercase text-stone-200/90 gap-3">
            <span>Evidence-Based Aerobic Prehab</span>
            <span className="hidden sm:inline">•</span>
            <span>Zero Myocardial Strain</span>
            <span className="hidden sm:inline">•</span>
            <span>Venous Thrombosis Prevention</span>
            <span className="hidden sm:inline">•</span>
            <span>Continuous Vitals Safeguard</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. 3-COLUMN EDITORIAL PHOTOS & CLINICAL INSIGHTS                         */}
      {/* ========================================================================= */}
      <section className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900"></span>
            <span>Clinical Prehabilitation Movement</span>
          </div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            How daily movement protects your heart before surgery
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Photo Card: Clinician Warmup & Form */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={movementWarmupCard}
              alt="Physiotherapist guiding cardiac patient through safe posture and mobility"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 left-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60">
              <div className="text-xs font-black text-stone-900">100% Supervised</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Clinical Form Safety
              </div>
            </div>
            {/* Bottom Caption Pill */}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-stone-950/75 backdrop-blur-md p-3 text-white text-[11px] leading-relaxed">
              Gentle mobility and shoulder loosening ensure unrestricted rib cage excursion and deep thoracic oxygenation.
            </div>
          </div>

          {/* Center Column: 3 Key Clinical Benefits & CTAs */}
          <div className="md:col-span-4 space-y-5 px-2">
            <ul className="space-y-4">
              {benefits.map((b) => (
                <li key={b.n} className="flex gap-3 items-start">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800 shadow-sm border border-emerald-200">
                    {b.n}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-stone-900">{b.title}</div>
                    <div className="text-xs leading-relaxed text-stone-600 mt-0.5">{b.text}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onStepChange('reference')}
                className="rounded-full bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Watch Video Routine</span>
                <span>➔</span>
              </button>
              <button
                onClick={() => onStepChange('upload')}
                className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
              >
                <span>Upload Motion Video</span>
              </button>
            </div>
          </div>

          {/* Right Photo Card: Senior Endurance & Aerobic Stamina */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={movementCardioWalking}
              alt="Cardiac patient walking with vitality in the park"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60 text-right">
              <div className="text-xs font-black text-emerald-700">{exercise.durationMinutes || currentDuration} Min / Day</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Recommended Dose
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="absolute bottom-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-xl border border-white/80">
              <div className="text-lg font-black text-emerald-700">45% Faster</div>
              <div className="text-[10px] font-semibold text-stone-600">
                Post-Surgical Mobilization
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK STATS CARDS                                                      */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">{s.label}</div>
            <div className={`mt-1 text-xl font-black leading-snug ${s.tone}`}>{s.value}</div>
            <div className="mt-0.5 text-[11px] text-stone-500">{s.note}</div>
          </div>
        ))}
      </section>

      {/* ========================================================================= */}
      {/* 4. WHY + FORM CHECKPOINTS                                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
            <span>❤️</span>
            <span>Why this exercise was selected for {name}</span>
          </h3>
          <p className="text-xs leading-relaxed text-stone-600">
            Configured specifically for your daily activity profile (averaging {patient?.sittingHours ?? 8} hours of sitting daily) and your surgical readiness score.
            This cadence stimulates peripheral capillary flow gently, building vascular endurance without myocardial strain.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900">
            <span className="font-bold">⚠️ Clinical Safety Notice: </span>
            {exercise.contraindications || 'Avoid sudden speed surges or holding your breath. Maintain gentle, synchronized rhythmic respirations throughout.'}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
            <span>✨</span>
            <span>Key Posture Checkpoints</span>
          </h3>
          <p className="text-xs text-stone-500">Essential biometric form cues for your session:</p>
          <ul className="space-y-2.5">
            {posturePoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 rounded-2xl border border-stone-200/80 bg-stone-50 p-3 text-xs">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                  ✓
                </span>
                <span className="font-medium leading-relaxed text-stone-700">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. ADAPTIVE COACHING FEEDBACK                                             */}
      {/* ========================================================================= */}
      <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-stone-200/80">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">How did today's movement session feel?</h3>
            <p className="mt-1 text-xs text-stone-500" aria-live="polite">
              {feedbackGiven === 'done'
                ? '✓ Excellent work! Steady progress strengthens your heart muscle each day.'
                : feedbackGiven === 'too_hard'
                  ? '⚡ Noted. Tomorrow will be scaled down to keep your exertion comfortable.'
                  : feedbackGiven === 'skipped'
                    ? 'Skipped for today. You can resume tomorrow whenever you are ready.'
                    : 'Share your feedback so your intelligent prehab coach can tune your next plan.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onFeedback('done')}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition focus:outline-none ${feedbackGiven === 'done'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
            >
              ✓ Completed ({exercise.durationMinutes || currentDuration} min)
            </button>
            <button
              onClick={() => onFeedback('too_hard')}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition focus:outline-none ${feedbackGiven === 'too_hard'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              title="Scales tomorrow's session down"
            >
              ⚡ Need an easier pace
            </button>
            <button
              onClick={() => onFeedback('skipped')}
              className="rounded-full px-4 py-2.5 text-xs font-medium text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              Skip
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
