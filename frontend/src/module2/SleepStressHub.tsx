import React, { useState, useEffect, useRef } from 'react';
import type { PatientProfile } from './types';
import wellnessHeroBg from './assets/wellness/hero_bg.jpg';
import stretchImg from './assets/wellness/stretch.jpg';
import meditationImg from './assets/wellness/meditation.jpg';

interface SleepStressHubProps {
  patient?: PatientProfile | null;
  sleepHours: number;
  stressScore: number;
}

interface RelaxationVideo {
  id: string;
  title: string;
  duration: string;
  tag: string;
  description: string;
  youtubeId: string;
  benefits: string[];
}

export const SleepStressHub: React.FC<SleepStressHubProps> = ({
  patient,
  sleepHours,
  stressScore,
}) => {
  // Breathing Pacer State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // Soundscape State (Web Audio API)
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Video State
  const videos: RelaxationVideo[] = [
    {
      id: 'box-breathing',
      title: '5-Minute Cardiac Coherence Breathing',
      duration: '5 min',
      tag: 'Heart Rate Calmer',
      description: 'Slow 4-4-4 paced breathing shown to lower preoperative sympathetic tone and stabilize arterial pressure.',
      youtubeId: 'inpok4MKVLM',
      benefits: ['Lowers resting heart rate', 'Reduces circulating cortisol', 'Vagus nerve stimulation'],
    },
    {
      id: 'body-scan',
      title: '10-Minute Deep Sleep & Body Scan',
      duration: '10 min',
      tag: 'Circadian Recharge',
      description: 'Progressive neuromuscular relaxation designed to release shoulder, neck, and chest tension before bed.',
      youtubeId: '1ZYbU82GVz4',
      benefits: ['Releases muscular rigidity', 'Encourages deep REM sleep', 'Eases preoperative anxiety'],
    },
    {
      id: 'heart-calm',
      title: 'Cardiac Rhythm Peaceful Nature Immersion',
      duration: '8 min',
      tag: 'Parasympathetic Rest',
      description: 'Gentle nature visuals with rhythmic wave sounds to synchronize cardiovascular pacing with calm mental focus.',
      youtubeId: 'aEqlQvczMJQ',
      benefits: ['Smooths heart rate variability', 'Relaxes vascular tension', 'Promotes peace of mind'],
    },
  ];

  const [activeVideo, setActiveVideo] = useState<RelaxationVideo>(videos[0]);
  const [videoExpanded, setVideoExpanded] = useState(false);

  // Box Breathing Timer
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

  // Web Audio Synth for 432Hz ambient meditation tone
  const toggleAudio = () => {
    if (audioPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setAudioPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Warm 432 Hz healing tone with gentle sub-octave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(216, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2);

        osc.connect(filter);
        oscHarmonic.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscHarmonic.start();

        audioCtxRef.current = ctx;
        gainNodeRef.current = gain;
        setAudioPlaying(true);
      } catch (e) {
        console.error('Audio initialization error:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const patientName = patient?.name || 'you';
  const effectiveSleepHours = patient?.sleepHours ?? sleepHours;
  const effectiveStressScore = patient?.stressScore ?? stressScore;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 text-slate-900 pb-12 font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION ("Calmness" High-End Editorial Header)                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#d9cbb8] shadow-2xl shadow-stone-300/40 border border-stone-200/60 min-h-[580px] sm:min-h-[640px] flex flex-col justify-between">
        {/* Background Image with warm overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-[1.02]"
          style={{
            backgroundImage: `url(${wellnessHeroBg})`,
          }}
        >
          {/* Subtle warm amber + gradient veil for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/35 via-stone-900/20 to-stone-950/60" />
          <div className="absolute inset-0 bg-amber-950/10 backdrop-brightness-[0.96]" />
        </div>

        {/* Top Floating Pill Navigation Bar */}
        <div className="relative z-20 px-5 pt-6 sm:px-10">
          <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/20 px-5 py-3 backdrop-blur-md border border-white/30 text-white shadow-lg shadow-black/5">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-900 text-xs font-black">
                ✦
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-white drop-shadow-sm">
                CALMNESS
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-[11px] font-semibold tracking-wider uppercase text-white/90">
              <button onClick={() => scrollToSection('breathing-pacer')} className="hover:text-amber-200 transition-colors">
                Breathing Pacer
              </button>
              <button onClick={() => scrollToSection('relaxation-video')} className="hover:text-amber-200 transition-colors">
                Relaxation Guide
              </button>
              <button onClick={() => scrollToSection('exist-data')} className="hover:text-amber-200 transition-colors">
                Your Sleep &amp; Stress
              </button>
              <button onClick={() => scrollToSection('sleep-hygiene')} className="hover:text-amber-200 transition-colors">
                Night Routine
              </button>
            </nav>

            <button
              onClick={() => {
                setBreathingActive(true);
                scrollToSection('breathing-pacer');
              }}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-900 hover:bg-amber-50 hover:shadow-md transition-all uppercase tracking-wider"
            >
              Get Started
            </button>
          </header>
        </div>

        {/* Giant Hero Title: "Calmness" */}
        <div className="relative z-10 px-5 pt-10 sm:px-10 text-center select-none pointer-events-none">
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] font-light tracking-tight text-white/95 leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
            Calmness
          </h1>
        </div>

        {/* Hero Middle Content: Left and Right Copy */}
        <div className="relative z-20 px-6 sm:px-12 pb-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-end text-white">
          {/* Left Kicker & Subhead */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300"></span>
              <span>Your Heart &amp; Mind Matter</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
              Rest that protects <br />
              <span className="font-light italic text-amber-100">your heart's future</span>
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-stone-200 leading-relaxed font-normal">
              Restorative prehabilitation designed to downregulate stress hormones, steady resting blood pressure,
              and prepare your cardiovascular system for seamless recovery.
            </p>
          </div>

          {/* Right Copy & Primary CTA */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <p className="max-w-md text-xs sm:text-sm text-stone-200 leading-relaxed">
              Connect with guided cardiac relaxation anytime, anywhere. Experience 4-4-4 vagus nerve breathing,
              soothing guided soundscapes, and restful sleep coaching tailored for {patientName}.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={toggleAudio}
                className={`rounded-full px-4 py-2.5 text-xs font-bold transition-all flex items-center space-x-2 backdrop-blur-md border ${
                  audioPlaying
                    ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-md'
                    : 'bg-black/30 hover:bg-black/50 text-white border-white/20'
                }`}
                title="Plays soothing 432Hz ambient meditation frequency"
              >
                <span>{audioPlaying ? '🔊 Ambient Tone On' : '🔈 Play 432Hz Calm'}</span>
              </button>

              <button
                onClick={() => {
                  setVideoExpanded(true);
                  scrollToSection('relaxation-video');
                }}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-stone-900 hover:bg-amber-100 transition-all shadow-lg shadow-black/15 flex items-center space-x-1.5"
              >
                <span>Watch Relaxation Guide</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Banner */}
        <div className="relative z-20 border-t border-white/20 bg-black/25 backdrop-blur-md px-6 py-3 sm:px-12">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-medium tracking-wider uppercase text-stone-200/90 gap-3">
            <span>100% Evidence-Based Prehab</span>
            <span className="hidden sm:inline">•</span>
            <span>Vagus Nerve Calming</span>
            <span className="hidden sm:inline">•</span>
            <span>Flexible Daily Rhythm</span>
            <span className="hidden sm:inline">•</span>
            <span>Clinical Cardiac Recovery</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MIDDLE SECTION ("A calmer way to care for your mind")                  */}
      {/* ========================================================================= */}
      <section className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900"></span>
            <span>Clinical Principles</span>
          </div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            A calmer way to care for your heart &amp; mind
          </h2>
        </div>

        {/* 3-Column Editorial Layout directly matching user reference image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Photo Card: Mindful Stretch with floating badge */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={stretchImg}
              alt="Person practicing gentle restorative stretching"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60">
              <div className="text-xs font-black text-stone-900">1,200+</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Guided Minutes
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-stone-950/75 backdrop-blur-md p-3 text-white text-[11px] leading-relaxed">
              Gentle floor stretches release diaphragmatic tension and lower sympathetic cardiac drive.
            </div>
          </div>

          {/* Center Column: Text description & Call to Action */}
          <div className="md:col-span-4 space-y-5 px-2">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              <strong className="text-stone-900 font-semibold">CardioCare Rest &amp; Calm</strong> is built on a simple medical
              truth — cardiovascular stamina requires deep nervous system recovery. Uncontrolled stress and broken sleep constrict
              arteries and elevate heart rate variability turbulence.
            </p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              Whether you prefer guided box breathing, peaceful soundscapes, or setting a quiet bedtime boundary, our prehab
              protocol adapts gently to your routine so you feel calm, steady, and prepared.
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setBreathingActive(true);
                  scrollToSection('breathing-pacer');
                }}
                className="rounded-full bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center space-x-2"
              >
                <span>Start 4-4-4 Breathing</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          {/* Right Photo Card: Mudra Meditation with floating badges */}
          <div className="md:col-span-4 relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 aspect-[3/4] group">
            <img
              src={meditationImg}
              alt="Meditation hands in chin mudra on cushion"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Top Floating Badge */}
            <div className="absolute top-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-md border border-white/60 text-right">
              <div className="text-xs font-black text-stone-900">50K+</div>
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Sessions Completed
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="absolute bottom-4 right-4 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-xl border border-white/80">
              <div className="text-lg font-black text-emerald-700">85%</div>
              <div className="text-[10px] font-semibold text-stone-600">
                Patients Feel Lower Pre-Op Anxiety
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RELAXATION GUIDE VIDEO SECTION (Interactive Multi-Track Player)       */}
      {/* ========================================================================= */}
      <section id="relaxation-video" className="rounded-[2.5rem] bg-stone-900 text-white p-6 sm:p-10 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <span>▶</span>
              <span>Visual &amp; Auditory Guidance</span>
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Relaxation Guide Video
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-400 max-w-xl">
              Curated medical relaxation sessions designed for pre-operative cardiac patients. Watch and follow along to soothe your nervous system.
            </p>
          </div>

          {/* Video Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVideo(v)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeVideo.id === v.id
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {v.title.split(' ')[0]} ({v.duration})
              </button>
            ))}
          </div>
        </div>

        {/* Video Player Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* The Embed Player */}
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-stone-800 bg-black shadow-2xl relative">
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                title={activeVideo.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="bg-stone-950 px-5 py-3.5 flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-stone-200">{activeVideo.title}</span>
              <span className="rounded-full bg-stone-800 px-3 py-1 text-[11px] text-amber-300 font-mono">
                {activeVideo.tag}
              </span>
            </div>
          </div>

          {/* Video Clinical Details & Accompanying Guide */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-3xl bg-stone-800/80 p-6 border border-stone-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  {activeVideo.tag}
                </span>
                <span className="text-xs font-semibold text-stone-400 font-mono">
                  Duration: {activeVideo.duration}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{activeVideo.title}</h3>
              <p className="text-xs text-stone-300 leading-relaxed">{activeVideo.description}</p>

              <div className="space-y-2 pt-2 border-t border-stone-700">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Target Cardiac Outcomes:
                </div>
                <ul className="space-y-1.5 text-xs text-stone-300">
                  {activeVideo.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setBreathingActive(true);
                    scrollToSection('breathing-pacer');
                  }}
                  className="w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 py-3 text-xs font-extrabold uppercase tracking-wider transition-all shadow-md"
                >
                  Sync With Breathing Pacer ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EXISTING PATIENT DATA & CLINICAL SLEEP/STRESS METRICS                  */}
      {/* ========================================================================= */}
      <section id="exist-data" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
              Personalized Metrics
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {patientName === 'you' ? 'Your' : `${patientName}'s`} Sleep &amp; Stress Status
            </h2>
          </div>
          <span className="rounded-full bg-stone-200/70 px-4 py-1.5 text-xs font-bold text-stone-700">
            Prehab Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Sleep & Heart Rest */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>🌙</span> Restful Sleep &amp; Overnight Recovery
                </h3>
                <p className="text-xs text-stone-500">Allows blood vessels to dilate and arterial pressure to reset</p>
              </div>
              {effectiveSleepHours < 5 ? (
                <span className="rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                  Needs Attention
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  Healthy Range
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-5">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-[11px] font-bold uppercase text-stone-400">Current Average Sleep</div>
                  <div className="text-4xl font-black text-stone-900 mt-1">{effectiveSleepHours} hrs</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase text-stone-400">Target Prehab Goal</div>
                  <div className="text-base font-extrabold text-emerald-700">7 to 8 hrs</div>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="mt-4 h-3 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    effectiveSleepHours < 5 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (effectiveSleepHours / 8) * 100)}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-stone-500">
                <span>0 hrs</span>
                <span>Goal: 7–8 hrs</span>
              </div>
            </div>

            {effectiveSleepHours < 5 ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs leading-relaxed text-rose-800">
                <strong className="font-bold">⚠️ Clinical Notice:</strong> Sleeping under 5 hours keeps blood pressure
                elevated during nocturnal hours. Aiming for 7 hours lowers myocardial oxygen demand and builds surgical reserve.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
                <strong className="font-bold">✓ Great Rhythm:</strong> Your current sleep allows your blood vessels to relax,
                supporting arterial recovery before your procedure.
              </div>
            )}
          </div>

          {/* Card 2: Stress Index & Heart Rate Variability */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>🧘</span> Neuro-Cardiac Stress Level
                </h3>
                <p className="text-xs text-stone-500">Sympathetic nervous system regulation</p>
              </div>
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-bold border ${
                  effectiveStressScore > 6
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                Score: {effectiveStressScore}/10
              </span>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-5">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-[11px] font-bold uppercase text-stone-400">Stress Score</div>
                  <div className="text-4xl font-black text-stone-900 mt-1">
                    {effectiveStressScore} <span className="text-lg font-medium text-stone-500">/ 10</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase text-stone-400">Target Range</div>
                  <div className="text-base font-extrabold text-emerald-700">&le; 4.0 (Calm)</div>
                </div>
              </div>

              {/* Stress scale gauge */}
              <div className="mt-4 h-3 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    effectiveStressScore > 6 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (effectiveStressScore / 10) * 100)}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-stone-500">
                <span>1 (Zen)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-xs leading-relaxed text-purple-900">
              <strong className="font-bold">Mind-Body Connection:</strong> When you experience high stress, adrenaline stimulates
              coronary vasoconstriction. Regular daily box breathing resets your baroreflex sensitivity within 3 minutes.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE 4-4-4 BOX BREATHING PACER                                  */}
      {/* ========================================================================= */}
      <section id="breathing-pacer" className="rounded-[2.5rem] bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="max-w-2xl text-center mx-auto space-y-2">
          <span className="rounded-full bg-amber-400/20 px-4 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 uppercase tracking-widest">
            Interactive Heart Rate Calmer
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            4-4-4 Box Breathing Visualizer
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Follow the expanding and contracting rhythm. Inhale for 4s, hold for 4s, exhale for 4s, rest for 4s.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Animated Multi-Ring Breathing Visualizer */}
          <div className="relative flex h-60 w-60 items-center justify-center">
            {/* Outer Glow Wave */}
            <div
              className={`absolute inset-0 rounded-full bg-amber-400/10 blur-xl transition-all duration-1000 ${
                breathingActive && (breathPhase === 'Inhale' || breathPhase === 'Hold')
                  ? 'scale-125 opacity-100'
                  : 'scale-90 opacity-40'
              }`}
            />

            {/* Middle Pulse Ring */}
            <div
              className={`absolute inset-4 rounded-full border-2 border-amber-300/40 transition-all duration-1000 ${
                breathingActive && (breathPhase === 'Inhale' || breathPhase === 'Hold')
                  ? 'scale-110 border-amber-300'
                  : 'scale-90 border-stone-700'
              }`}
            />

            {/* Inner Core Dial */}
            <div className="relative z-10 flex flex-col items-center justify-center rounded-full bg-stone-800/90 h-44 w-44 border border-stone-600 shadow-2xl backdrop-blur-md">
              <div className="text-xs font-extrabold tracking-widest uppercase text-amber-300">
                {breathingActive ? breathPhase : 'READY'}
              </div>
              <div className="text-5xl font-black font-mono mt-1 text-white">
                {breathingActive ? `${phaseSeconds}s` : '4s'}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 font-medium">
                {breathingActive ? `Completed: ${cycleCount} rounds` : 'Press start to begin'}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 flex flex-wrap gap-4 items-center justify-center">
            <button
              onClick={() => setBreathingActive(!breathingActive)}
              className={`rounded-full px-8 py-3.5 text-xs font-extrabold uppercase tracking-widest transition-all shadow-xl ${
                breathingActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-900/30'
              }`}
            >
              {breathingActive ? '⏹ Stop Breathing Pacer' : '▶ Start Relaxing Breath'}
            </button>

            <button
              onClick={toggleAudio}
              className={`rounded-full px-6 py-3.5 text-xs font-bold transition-all border ${
                audioPlaying
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              {audioPlaying ? '🔊 Stop 432Hz Sound' : '🔈 Play 432Hz Sound'}
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto rounded-2xl border border-stone-800 bg-stone-950/60 p-4 text-center text-xs text-stone-400">
          <strong className="text-amber-300 font-semibold">How it works:</strong> Controlled box breathing activates the
          cholinergic anti-inflammatory pathway via the vagus nerve, reducing heart rate spikes and arterial stiffness.
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLINICAL SLEEP HYGIENE & NIGHTTIME HABITS ROUTINE                      */}
      {/* ========================================================================= */}
      <section id="sleep-hygiene" className="rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-sm border border-stone-200/80 space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Circadian Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Bedtime Routine for Cardiovascular Health
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Three simple evening anchors to maintain healthy circadian rhythm and prepare for surgery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-stone-50 p-6 border border-stone-200/70 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-lg font-bold">
              📱
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">1. Screen-Free by 9:30 PM</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Blue light inhibits natural melatonin secretion. Placing screens away 60 minutes before bed lets your heart rate decelerate naturally.
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-6 border border-stone-200/70 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 text-lg font-bold">
              🌙
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">2. In Bed Before 10:00 PM</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Synchronizing with natural circadian biology promotes deep restorative stage-3 delta wave sleep, when blood pressure reaches its lowest healthy dipping point.
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-6 border border-stone-200/70 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-lg font-bold">
              ❄️
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">3. Cool &amp; Dark Room (19°C)</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              A cool room temperature assists the body's natural core cooling cycle, minimizing micro-awakenings and reducing overnight cardiac stress.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
