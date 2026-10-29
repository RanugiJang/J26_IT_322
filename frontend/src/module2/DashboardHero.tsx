import React, { useState } from 'react';
import type { PatientProfile } from './types';
import cardiacHeart3d from './assets/dashboard/cardiac_heart_3d.jpg';

interface DashboardHeroProps {
  patient: PatientProfile;
  onNavigate: (tab: string) => void;
  onOpenEdit: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  patient,
  onNavigate,
  onOpenEdit,
}) => {
  const patientName = patient?.name || 'Hanna';
  const riskScore = patient?.predictedRiskScore ?? 0.35;
  const riskPercent = Math.round(riskScore * 100);
  const riskLabel = riskScore < 0.35 ? 'Low Risk' : riskScore < 0.65 ? 'Moderate' : 'Elevated';

  const [pulseBeating, setPulseBeating] = useState(true);

  // Systolic / Diastolic values
  const bloodPressure = patient.bloodPressure || '120/80';
  const restingHeartRate = 72; // Standard physiological bpm

  return (
    <div className="rounded-[2.5rem] bg-[#f8fafc] border border-slate-200/90 p-5 sm:p-8 shadow-xl shadow-slate-200/50 text-slate-800 font-sans">
      {/* ========================================================================= */}
      {/* MAIN HERO SECTION (Big 3D Anatomical Heart & Floating Card Matrix)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Greeting + Big Anatomical Heart + Floating ECG Card */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 bg-white rounded-[2.25rem] border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background ambient radial blur */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full bg-rose-100/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-100/40 blur-3xl" />

          {/* Top Headline: "Hello, Hanna! How are you feeling today?" */}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hi, {patientName}!
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              How are you feeling today?
            </p>
          </div>

          {/* Centerpiece: Big Realistic 3D Heart Illustration with Realistic Coronary Vessels */}
          <div className="relative z-10 my-6 flex items-center justify-center flex-1">
            {/* The Big 3D Anatomical Heart Image */}
            <div className="relative w-64 sm:w-80 h-72 sm:h-80 flex items-center justify-center group">
              <img
                src={cardiacHeart3d}
                alt="3D Anatomical Human Heart with Coronary Arteries"
                className={`w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105 ${pulseBeating ? 'animate-pulse' : ''}`}
                style={{ filter: 'drop-shadow(0 15px 30px rgba(225,29,72,0.18))' }}
              />

              {/* Floating Heart Beat Pulse Glass Card (Exact match to user screenshot) */}
              <div className="absolute -bottom-2 -left-2 sm:left-0 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 p-3.5 shadow-xl shadow-rose-950/10 min-w-[210px] space-y-1.5 transition-all hover:scale-105">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-rose-500 animate-pulse text-sm">♥</span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Heart Beat</span>
                  </div>
                  <span className="text-xs font-black font-mono text-slate-900">{restingHeartRate} bpm</span>
                </div>

                {/* Animated ECG Pulse Line */}
                <div className="h-8 w-full flex items-center">
                  <svg viewBox="0 0 160 32" className="w-full h-full stroke-sky-500" fill="none">
                    <polyline
                      points="0,16 25,16 35,16 42,6 50,28 58,10 65,16 85,16 95,16 102,6 110,28 118,10 125,16 160,16"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Top Floating Badge on the Heart */}
              <div className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 border border-slate-200/80 shadow-md text-[11px] font-bold text-rose-700 flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Myocardium Guard</span>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Interactive Charts & Clinical Schedule Matrix      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 space-y-5">
          {/* Top Row: Cholesterol Level + Vital Signs Waveform Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cholesterol / Prehab Risk Level Chart */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 tracking-tight">Cholesterol &amp; Risk</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Trajectory Index</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  By month ▾
                </span>
              </div>

              {/* Smooth Spline Chart Visualization */}
              <div className="h-28 w-full pt-1">
                <svg viewBox="0 0 200 90" className="w-full h-full">
                  <defs>
                    <linearGradient id="cholesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="45" x2="200" y2="45" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="200" y2="70" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path
                    d="M0,65 Q30,68 60,52 T120,40 T160,28 T200,32 L200,90 L0,90 Z"
                    fill="url(#cholesGrad)"
                  />
                  {/* Curve stroke */}
                  <path
                    d="M0,65 Q30,68 60,52 T120,40 T160,28 T200,32"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Target Point */}
                  <circle cx="160" cy="28" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </div>

            {/* Vital Signs Waveform Chart */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 tracking-tight">Vital Signs</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{bloodPressure} mmHg</span>
                </div>
                <span className="h-6 w-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-xs">
                  ↗
                </span>
              </div>

              {/* BP & SpO2 Double Mini Graphs */}
              <div className="space-y-2 pt-1">
                {/* Systolic curve */}
                <div className="rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-rose-600">
                    <span>Blood Pressure (Resting)</span>
                    <span className="font-mono">{bloodPressure}</span>
                  </div>
                  <div className="h-6 w-full pt-1">
                    <svg viewBox="0 0 160 20" className="w-full h-full stroke-rose-400" fill="none">
                      <path d="M0,10 Q20,6 40,11 T80,8 T120,12 T160,9" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Oxygenation */}
                <div className="rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-sky-600">
                    <span>Oxygen Saturation</span>
                    <span className="font-mono">98% SpO2</span>
                  </div>
                  <div className="h-6 w-full pt-1">
                    <svg viewBox="0 0 160 20" className="w-full h-full stroke-sky-400" fill="none">
                      <path d="M0,8 Q20,10 40,8 T80,12 T120,7 T160,8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Medication List & My Schedule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Medication & Supplement List */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Medication List</h3>
                <span className="text-[10px] font-bold text-slate-400">Prehab Plan</span>
              </div>

              <div className="space-y-2">
                {/* Med 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 text-sm">
                      💊
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Cardio Aspirin</div>
                      <div className="text-[10px] text-slate-400">75 mg · Once daily</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">Morning</span>
                </div>

                {/* Med 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-600 text-white shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white text-sm">
                      💧
                    </span>
                    <div>
                      <div className="text-xs font-bold">Electrolyte Thambili</div>
                      <div className="text-[10px] text-sky-100">Potassium &amp; Hydration</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-100 font-mono">Daily</span>
                </div>

                {/* Med 3 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-sm">
                      🌿
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Gotukola Bioflavonoid</div>
                      <div className="text-[10px] text-slate-400">Arterial compliance</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">Lunch</span>
                </div>
              </div>

              {/* Allergies Notice */}
              <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
                <span className="text-rose-500 font-bold">🛡️ Allergies:</span>
                <span className="font-medium truncate">{patient.foodAllergies || 'None reported'}</span>
              </div>
            </div>

            {/* My Schedule (Appointments & Prehab milestones from screenshot) */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">My Schedule</h3>
                <span className="text-[10px] font-bold text-slate-500">This Week ▾</span>
              </div>

              {/* Mini Weekday Strip */}
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { day: 'Mon', num: 20, active: true },
                  { day: 'Tue', num: 21, active: false },
                  { day: 'Wed', num: 22, active: false },
                  { day: 'Thu', num: 23, active: false },
                  { day: 'Fri', num: 24, active: false },
                ].map((d) => (
                  <div
                    key={d.day}
                    className={`rounded-xl py-1.5 text-xs font-semibold ${d.active ? 'bg-sky-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600'
                      }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider opacity-80">{d.day}</div>
                    <div className="text-xs font-black">{d.num}</div>
                  </div>
                ))}
              </div>

              {/* Appointments / Milestones */}
              <div className="space-y-2 pt-1">
                {/* Doctor 1 */}
                <div className="flex items-center justify-between p-2 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                      👨‍⚕️
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900">Dr. Kalana Donin</div>
                      <div className="text-[9px] text-slate-400">Cardiologist · 10:30 AM</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                    Confirmed
                  </span>
                </div>

                {/* Doctor 2 */}
                <div className="flex items-center justify-between p-2 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                      👩‍⚕️
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900">Pre-Op Kinematics</div>
                      <div className="text-[9px] text-slate-400">Physio Coach · 2:00 PM</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    Today
                  </span>
                </div>

                {/* Doctor 3 / Milestone 3 */}
                <div className="flex items-center justify-between p-2 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                      🥗
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900">Heart Nutritionist</div>
                      <div className="text-[9px] text-slate-400">Sri Lankan Diet Plan · 4:30 PM</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
