import React from 'react';
import { PatientProfile } from '../types';

interface PatientHeaderProps {
  patient: PatientProfile;
  onRefreshRisk?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, onRefreshRisk }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-2xl">
      {/* Decorative ambient background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl"></div>

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Patient Identity & Pre-Surgery Context */}
        <div className="flex items-start space-x-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-xl font-bold text-white shadow-inner border border-slate-700">
            <span>NJ</span>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-2 ring-slate-900" title="High Cardiac Risk">
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{patient.name}</h1>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300 border border-slate-700">
                {patient.id}
              </span>
              <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
                Pre-Surgery High-Risk CVD
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {patient.age} yrs • Male • BMI {patient.bmi} (Class I Obesity) • {patient.occupation} • Sits {patient.sittingHours}h/day
            </p>

            {/* Clinical Escalation Notice */}
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center space-x-1.5 rounded-md bg-red-950/60 px-2 py-1 text-red-300 border border-red-800/50">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping"></span>
                <span>Sleep &lt; 5h for {patient.consecutiveLowSleepDays} days: High Ischemia Risk</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 rounded-md bg-amber-950/60 px-2 py-1 text-amber-300 border border-amber-800/50">
                <span>⚠️ Stress {patient.stressScore}/10 for {patient.consecutiveHighStressDays} days: Sympathetic Overdrive</span>
              </span>
            </div>
          </div>
        </div>

        {/* Module 2 Risk Integration & Pre-Surgery Window */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
          {/* Risk Score */}
          <div className="border-r border-slate-800 pr-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Module 2 CVD Risk
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-rose-400">
                {(patient.predictedRiskScore * 100).toFixed(0)}%
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-rose-400">
                ↑ {patient.riskTrajectory}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">Recalibrated Weekly</div>
          </div>

          {/* Surgery Countdown */}
          <div className="border-r border-slate-800 pr-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Surgery Window
            </div>
            <div className="mt-1 text-lg font-bold text-slate-200">
              {patient.surgicalTimelineDays} <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
            <div className="text-[10px] text-emerald-400">Prehab Window Active</div>
          </div>

          {/* Clinical Goal */}
          <div className="max-w-[200px]">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Primary Goal
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-snug">
              Reduce risk to defer surgery or optimize surgical tolerance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
