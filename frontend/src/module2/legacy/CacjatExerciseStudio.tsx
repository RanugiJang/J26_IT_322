import React, { useState } from 'react';
import { CACJAT_DEMO_REPS } from '../data/clinicalData';

export const CacjatExerciseStudio: React.FC = () => {
  const [selectedRepIndex, setSelectedRepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>('cardiac_rehab_walk_nimal_rep1_5.mp4');

  const currentRep = CACJAT_DEMO_REPS[selectedRepIndex];

  const handleSimulate = () => {
    setIsSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % CACJAT_DEMO_REPS.length;
      setSelectedRepIndex(step);
      if (step === CACJAT_DEMO_REPS.length - 1) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Novelty Introduction Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
              <span>★ Smart Care Assistant</span>
              <span>•</span>
              <span>Movement Safety AI</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
              Clinical Posture &amp; Movement Video Assessment
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl leading-relaxed">
              Assesses exercise posture, movement balance, and physical comfort level 
              from your exercise videos to keep your heart safe before surgery.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
                isSimulating
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 ring-2 ring-rose-400/50'
              }`}
            >
              <span>{isSimulating ? '⏳ Checking Movement...' : '▶ Run Live Movement Video Check'}</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Summary Pills */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[10px] font-mono text-rose-400 font-semibold uppercase">Novelty 1</div>
            <div className="text-xs font-bold text-white mt-0.5">Confidence Weighting</div>
            <div className="text-[11px] text-slate-400 mt-1">Filters low-confidence / blurry video frames automatically.</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">Novelty 2</div>
            <div className="text-xs font-bold text-white mt-0.5">Clinical Attention Bias B</div>
            <div className="text-[11px] text-slate-400 mt-1">Matrix B tells AI to focus on Knee & Spine, not Wrists.</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[10px] font-mono text-amber-400 font-semibold uppercase">Novelty 3</div>
            <div className="text-xs font-bold text-white mt-0.5">Latent Fatigue State</div>
            <div className="text-[11px] text-slate-400 mt-1">Tracks fatigue rep-by-rep; triggers STOP NOW ischemia alert.</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Novelty 4</div>
            <div className="text-xs font-bold text-white mt-0.5">Multi-Granularity</div>
            <div className="text-[11px] text-slate-400 mt-1">Outputs simultaneous Rep, Set, and Session feedback.</div>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pose & Video Kinematic Visualizer (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                MediaPipe 33-Joint Pose Kinematics • Frame #{currentRep.frameIndex}
              </span>
            </div>

            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
              {uploadedVideoName}
            </span>
          </div>

          {/* Interactive Skeleton Canvas Simulation */}
          <div className="relative mt-4 flex h-80 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

            {/* Simulated 2D Kinematic Skeleton */}
            <svg className="relative h-full w-full max-w-sm" viewBox="0 0 200 240">
              {/* Head */}
              <circle cx="100" cy="30" r="14" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="100" cy="30" r="4" fill="#38bdf8" />

              {/* Spine / Torso (Novelty 2 Clinical High Attention) */}
              <line x1="100" y1="44" x2="100" y2="120" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              {/* Clinical Attention Glow for Torso */}
              <circle cx="100" cy="80" r="18" fill="#f43f5e" fillOpacity="0.15" />
              <text x="110" y="80" fill="#f43f5e" fontSize="7" fontFamily="monospace" fontWeight="bold">B: Thoracic Expansion [High Attention]</text>

              {/* Shoulders & Arms (Low Attention Wrist) */}
              <line x1="70" y1="58" x2="130" y2="58" stroke="#94a3b8" strokeWidth="2" />
              <line x1="70" y1="58" x2="55" y2="95" stroke="#94a3b8" strokeWidth="2" />
              <line x1="55" y1="95" x2="48" y2="130" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="48" cy="130" r="3" fill="#64748b" />
              <text x="8" y="132" fill="#64748b" fontSize="6" fontFamily="monospace">Wrist (Low Attn)</text>

              <line x1="130" y1="58" x2="145" y2="95" stroke="#94a3b8" strokeWidth="2" />
              <line x1="145" y1="95" x2="152" y2="130" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="152" cy="130" r="3" fill="#64748b" />

              {/* Pelvis & Hips */}
              <line x1="82" y1="120" x2="118" y2="120" stroke="#f43f5e" strokeWidth="3" />

              {/* Left Leg & Knee (Novelty 2 Clinical High Attention) */}
              <line x1="85" y1="120" x2={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} y2="170" stroke="#f43f5e" strokeWidth="3.5" />
              <circle cx={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} cy="170" r="6" fill="#f43f5e" />
              <circle cx={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} cy="170" r="14" fill="#f43f5e" fillOpacity="0.2" className="animate-ping" />
              <line x1={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} y1="170" x2="80" y2="220" stroke="#cbd5e1" strokeWidth="2" />
              <text x="12" y="172" fill="#f43f5e" fontSize="7" fontFamily="monospace" fontWeight="bold">Knee Angle: {currentRep.keyJoints.kneeAngle}°</text>

              {/* Right Leg */}
              <line x1="115" y1="120" x2="118" y2="170" stroke="#f43f5e" strokeWidth="3" />
              <circle cx="118" cy="170" r="5" fill="#f43f5e" />
              <line x1="118" y1="170" x2="120" y2="220" stroke="#cbd5e1" strokeWidth="2" />
            </svg>

            {/* Frame Confidence Badge (Novelty 1) */}
            <div className="absolute top-3 left-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Frame Confidence $c_t$</div>
              <div className="flex items-center space-x-1.5">
                <span className={`h-2 w-2 rounded-full ${currentRep.confidenceScore > 0.5 ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className="text-xs font-bold font-mono text-white">
                  {(currentRep.confidenceScore * 100).toFixed(0)}%
                </span>
                <span className={`text-[10px] ${currentRep.confidenceScore > 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currentRep.confidenceScore > 0.5 ? '• Weight 1.0 (Learned)' : '• Discounted (Noise Filter)'}
                </span>
              </div>
            </div>

            {/* Rep Fatigue Indicator (Novelty 3) */}
            <div className="absolute top-3 right-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Latent Fatigue $z_t$</div>
              <div className="text-xs font-bold font-mono text-rose-400">
                {(currentRep.fatigueIndex * 100).toFixed(0)}% Index
              </div>
              <div className="text-[10px] font-semibold text-slate-300">
                State: {currentRep.fatigueStatus}
              </div>
            </div>

            {/* Critical Stop Alert if Fatigue is high */}
            {currentRep.fatigueIndex > 0.7 && (
              <div className="absolute bottom-3 inset-x-3 rounded-xl border border-red-600 bg-red-950/90 p-2.5 text-center backdrop-blur-md animate-pulse">
                <div className="text-xs font-black uppercase tracking-wider text-red-200">
                  ⚠️ Cardiac Safety Alert: Latent Fatigue Critical ($z_t &gt; 0.75$)
                </div>
                <div className="text-[11px] text-red-300">
                  Form deterioration detected at Rep #{currentRep.repNumber}. Stop session now to prevent myocardial ischemia!
                </div>
              </div>
            )}
          </div>

          {/* Rep Navigation Selector */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Select Exercise Repetition:</span>
            <div className="flex space-x-1.5">
              {CACJAT_DEMO_REPS.map((rep, idx) => (
                <button
                  key={rep.repNumber}
                  onClick={() => setSelectedRepIndex(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all ${
                    selectedRepIndex === idx
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40 ring-2 ring-rose-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  R{rep.repNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Multi-Granularity Clinical Assessment (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Level 1: Repetition-Level Feedback */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                <span>Level 1: Repetition-Level Feedback</span>
              </span>
              <span className="font-mono text-xs font-semibold text-slate-400">Rep #{currentRep.repNumber}</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Biomechanical Form:</span>
                <span className={`font-semibold ${currentRep.formState === 'CORRECT' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentRep.formState}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Knee Angle:</span>
                <span className="font-mono text-slate-200">{currentRep.keyJoints.kneeAngle}° (Optimal: 90°)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Thoracic Spine Lean:</span>
                <span className="font-mono text-slate-200">{currentRep.keyJoints.spineAngle}°</span>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-slate-950 p-2.5 text-xs text-slate-300">
              <span className="font-semibold text-rose-400">AI Prompt: </span>
              {currentRep.formState === 'CORRECT'
                ? 'Excellent gait alignment and pelvic stability. Maintain current rhythm.'
                : currentRep.formState === 'VALGUS DETECTED'
                ? 'Keep knees tracking directly over ankles; prevent inward knee collapse.'
                : 'Excessive forward thoracic lean detected. Stand upright to reduce cardiac work.'}
            </div>
          </div>

          {/* Level 2: Set-Level Feedback */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                <span>Level 2: Set-Level Pacing & Fatigue</span>
              </span>
              <span className="font-mono text-xs text-slate-400">Set 1 of 1</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Set Summary:</span>
                <span className="font-semibold text-slate-200">Reps 1-2: Form Good • Reps 4-5: Form Worse</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pacing Cadence:</span>
                <span className="font-mono text-slate-200">86 steps/min (Cardiac Zone 1)</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fatigue Accumulation:</span>
                  <span>{(currentRep.fatigueIndex * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentRep.fatigueIndex < 0.4
                        ? 'bg-emerald-400'
                        : currentRep.fatigueIndex < 0.7
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${currentRep.fatigueIndex * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 3: Session-Level Feedback */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Level 3: Full Session Quality</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">Quality: 82%</span>
            </div>

            <div className="mt-3 text-xs text-slate-300 leading-relaxed">
              Overall session adherence is <strong className="text-emerald-400">82%</strong>. First 3 reps demonstrated stable joint kinematics. Final reps showed compensatory fatigue. 
              <div className="mt-2 rounded-md bg-slate-950 p-2 font-mono text-indigo-300 text-[11px]">
                Prescription for tomorrow: Reduce set to 8 reps or 7 min brisk walk.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
