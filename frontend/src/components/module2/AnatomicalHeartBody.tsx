import React, { useState } from 'react';
import type { PatientProfile } from './types';

interface AnatomicalHeartBodyProps {
  patient: PatientProfile | null;
  onExploreInsights?: () => void;
}

export const AnatomicalHeartBody: React.FC<AnatomicalHeartBodyProps> = ({
  patient,
  onExploreInsights,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeLayer, setActiveLayer] = useState<'vessels' | 'heart' | 'full'>('full');
  const [showInsightBox, setShowInsightBox] = useState<boolean>(true);

  const riskPercent = Math.round((patient?.predictedRiskScore ?? 0.45) * 100);
  const heartStatus =
    (patient?.predictedRiskScore ?? 0.5) > 0.65
      ? 'Needs Daily Support'
      : (patient?.predictedRiskScore ?? 0.5) > 0.40
      ? 'Moderate Balance'
      : 'Optimal Rhythm';

  const heartGlowColor =
    (patient?.predictedRiskScore ?? 0.5) > 0.65
      ? '#ef4444' // Rose / Red
      : (patient?.predictedRiskScore ?? 0.5) > 0.40
      ? '#f59e0b' // Amber
      : '#10b981'; // Emerald

  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-[680px] rounded-3xl bg-gradient-to-b from-slate-100/90 via-sky-50/50 to-slate-100/80 border border-slate-200/80 p-5 flex flex-col justify-between overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Background radial ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-rose-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-64 h-64 rounded-full bg-sky-400/15 blur-3xl" />

      {/* Top Floating Status Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 rounded-full bg-white/90 px-3.5 py-1.5 shadow-sm border border-slate-200/80 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: heartGlowColor }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: heartGlowColor }}
            />
          </span>
          <span className="text-xs font-bold text-slate-800">Cardiovascular Focus</span>
          <span className="text-[11px] text-slate-400">•</span>
          <span className="text-[11px] font-semibold text-rose-600">{heartStatus}</span>
        </div>

        {/* View Switcher: Full Body / Vessels / Heart Focus */}
        <div className="flex items-center rounded-xl bg-white/80 p-1 border border-slate-200/70 shadow-sm text-xs">
          <button
            onClick={() => setActiveLayer('full')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'full'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveLayer('heart')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'heart'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Heart
          </button>
        </div>
      </div>

      {/* Center 3D Anatomical Human Body & Cardiovascular Vessel Network */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <div
          className="relative w-full max-w-[320px] transition-transform duration-500 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 300 560"
            className="w-full h-auto drop-shadow-md select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Glassmorphic body gradient */}
              <linearGradient id="bodySkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
              </linearGradient>

              {/* Arterial blood glow */}
              <linearGradient id="arteryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>

              {/* Venous return glow */}
              <linearGradient id="veinGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Heart Pulse Filter */}
              <filter id="heartGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Translucent Human Silhouette Anatomy */}
            <g opacity="0.92">
              {/* Head */}
              <circle cx="150" cy="55" r="28" fill="url(#bodySkin)" stroke="#94a3b8" strokeWidth="1.2" />
              {/* Neck */}
              <path d="M140 82 L140 102 L160 102 L160 82 Z" fill="url(#bodySkin)" />
              {/* Torso & Shoulders */}
              <path
                d="M105 110 C105 105, 120 100, 150 100 C180 100, 195 105, 195 110 L205 175 C205 200, 190 240, 182 270 L118 270 C110 240, 95 200, 95 175 Z"
                fill="url(#bodySkin)"
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
              {/* Left Arm */}
              <path
                d="M102 112 C90 125, 78 165, 70 215 C66 238, 62 265, 58 290 C56 298, 50 310, 52 316 C54 320, 60 320, 64 314 L75 285 C82 255, 88 220, 95 180 Z"
                fill="url(#bodySkin)"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {/* Right Arm */}
              <path
                d="M198 112 C210 125, 222 165, 230 215 C234 238, 238 265, 242 290 C244 298, 250 310, 248 316 C246 320, 240 320, 236 314 L225 285 C218 255, 212 220, 205 180 Z"
                fill="url(#bodySkin)"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {/* Pelvis & Upper Thighs */}
              <path
                d="M118 270 L110 330 C105 380, 102 430, 105 470 L108 525 C108 535, 120 538, 122 530 L132 460 C136 415, 142 360, 145 320 L150 300 L155 320 C158 360, 164 415, 168 460 L178 530 C180 538, 192 535, 192 525 L195 470 C198 430, 195 380, 190 330 L182 270 Z"
                fill="url(#bodySkin)"
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
            </g>

            {/* Glowing Cardiovascular Vascular Network (Arteries & Veins) */}
            <g opacity={activeLayer === 'heart' ? '0.3' : '0.95'}>
              {/* Carotid Arteries (To Head) */}
              <path d="M148 140 Q146 110 144 75 Q143 60 148 48" stroke="url(#arteryGlow)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M154 140 Q156 110 156 75 Q157 60 153 48" stroke="url(#veinGlow)" strokeWidth="2.2" strokeLinecap="round" />

              {/* Subclavian & Brachial Vessels (Left Arm) */}
              <path d="M145 145 Q125 135 105 150 Q90 180 80 225 Q72 265 64 305" stroke="url(#arteryGlow)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M143 150 Q122 140 102 155 Q88 185 78 228 Q70 268 62 308" stroke="url(#veinGlow)" strokeWidth="1.8" strokeLinecap="round" />

              {/* Subclavian & Brachial Vessels (Right Arm) */}
              <path d="M156 145 Q175 135 195 150 Q210 180 220 225 Q228 265 236 305" stroke="url(#arteryGlow)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M158 150 Q178 140 198 155 Q212 185 222 228 Q230 268 238 308" stroke="url(#veinGlow)" strokeWidth="1.8" strokeLinecap="round" />

              {/* Descending Aorta & Vena Cava (Abdomen) */}
              <path d="M149 165 L148 240 Q148 265 142 290" stroke="url(#arteryGlow)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M153 165 L154 240 Q154 265 158 290" stroke="url(#veinGlow)" strokeWidth="3.0" strokeLinecap="round" />

              {/* Iliac & Femoral Vessels (Legs) */}
              <path d="M142 290 Q130 330 124 380 Q118 430 115 500" stroke="url(#arteryGlow)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M145 295 Q134 335 128 385 Q122 435 119 505" stroke="url(#veinGlow)" strokeWidth="2.0" strokeLinecap="round" />

              <path d="M158 290 Q170 330 176 380 Q182 430 185 500" stroke="url(#arteryGlow)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M155 295 Q166 335 172 385 Q178 435 181 505" stroke="url(#veinGlow)" strokeWidth="2.0" strokeLinecap="round" />
            </g>

            {/* Glowing Anatomical Heart Hub */}
            <g transform="translate(142, 146)">
              {/* Outer pulsing radiance */}
              <circle cx="9" cy="9" r="24" fill={heartGlowColor} opacity="0.25" className="animate-ping" />
              <circle cx="9" cy="9" r="16" fill={heartGlowColor} opacity="0.4" filter="url(#heartGlowFilter)" />

              {/* Stylized Anatomical Heart Body */}
              <path
                d="M9 18 C3 12, 0 8, 2 3 C4 -2, 10 -1, 12 3 C14 -1, 20 -2, 22 3 C24 8, 21 12, 15 18 L9 24 Z"
                fill="url(#arteryGlow)"
                stroke="#ffffff"
                strokeWidth="1.2"
                filter="url(#heartGlowFilter)"
              />

              {/* Heart Rhythm Marker Point */}
              <circle cx="12" cy="10" r="3" fill="#ffffff" className="animate-pulse" />
            </g>

            {/* Interactive Hotspot Tags */}
            {activeLayer === 'full' && (
              <>
                {/* Heart Rate & Output Tag */}
                <g transform="translate(178, 142)">
                  <rect x="0" y="0" width="85" height="24" rx="12" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" stroke="#e2e8f0" strokeWidth="1" />
                  <circle cx="10" cy="12" r="3.5" fill="#ef4444" className="animate-pulse" />
                  <text x="20" y="15" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Myocardium
                  </text>
                </g>

                {/* Microcirculation Stride Tag */}
                <g transform="translate(35, 340)">
                  <rect x="0" y="0" width="90" height="24" rx="12" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" stroke="#e2e8f0" strokeWidth="1" />
                  <circle cx="10" cy="12" r="3.5" fill="#0284c7" />
                  <text x="20" y="15" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    Venous Pump
                  </text>
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Floating Zoom & Orientation Controls */}
        <div className="absolute right-3 bottom-14 flex flex-col items-center space-y-1.5 rounded-xl bg-white/90 p-1.5 shadow-md border border-slate-200/80 backdrop-blur-md">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
            title="Zoom out"
          >
            –
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 text-xs transition-colors"
            title="Reset scale"
          >
            ⤢
          </button>
        </div>
      </div>

      {/* Bottom Floating Insight Card (like in screenshot) */}
      {showInsightBox && (
        <div className="relative z-10 rounded-2xl bg-white/95 p-4 shadow-lg border border-slate-200/90 backdrop-blur-md space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">
                🫀
              </span>
              <span className="text-xs font-bold text-slate-900">
                {patient ? `${patient.name.split(' ')[0]}'s Heart Focus` : 'Cardiovascular Status'}
              </span>
            </div>
            <button
              onClick={() => setShowInsightBox(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-0.5"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-600 leading-snug">
            {patient && patient.sittingHours <= 3
              ? 'Great daily standing activity detected. Today’s focus is gentle strength and breathing to prep your heart.'
              : 'Your heart conditioning plan is ready. Follow your 3 daily habits to build cardiac strength.'}
          </p>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={onExploreInsights}
              className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 shadow-sm transition-all text-center"
            >
              View Daily Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
