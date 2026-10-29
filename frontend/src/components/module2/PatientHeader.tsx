import React from 'react';
import type { PatientProfile } from './types';

interface PatientHeaderProps {
  patient: PatientProfile;
  onOpenAssessment: () => void;
  onNewPatient?: () => void;
  isModelLoading?: boolean;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onOpenAssessment,
}) => {
  const riskPercent = Math.round((patient.predictedRiskScore ?? 0.45) * 100);
  const heartAge = Math.round(patient.age + (patient.predictedRiskScore > 0.6 ? 5 : patient.predictedRiskScore > 0.4 ? 2 : -1));
  const ageDiff = heartAge - patient.age;

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Top Header Row (Matches Cardiovascular System card in screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 text-lg shadow-sm border border-sky-100 font-bold">
            💙
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Cardiovascular Health</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {patient.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personalized for {patient.procedureType || 'Pre-Operative Preparation'}
            </p>
          </div>
        </div>

        {/* Risk Score Slider (Matches ClyHealth in screenshot) */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">Health Score</span>
            <div className="flex items-center space-x-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  patient.riskCategory === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span
                className={`text-xs font-extrabold ${
                  patient.riskCategory === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
                }`}
              >
                {patient.riskCategory === 'HIGH' ? 'Needs Support' : 'Moderate'} {riskPercent}%
              </span>
            </div>
          </div>

          {/* Mini Gradient Slider */}
          <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                patient.riskCategory === 'HIGH'
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-400 to-amber-400'
              }`}
              style={{ width: `${riskPercent}%` }}
            />
          </div>

          <button
            onClick={onOpenAssessment}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all"
            title="Edit your health vitals"
          >
            ✏️ Edit Vitals
          </button>
        </div>
      </div>

      {/* Heart Age vs Chronological Age Bar (Matches middle banner in screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl bg-slate-50/70 border border-slate-200/70 p-4">
        {/* Heart Age */}
        <div className="md:col-span-3 flex items-center space-x-3 pr-4 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0">
          <div className="flex flex-col space-y-0.5">
            <div className="flex space-x-0.5 h-6 items-end">
              <span className="w-1.5 h-3 bg-rose-400 rounded-sm" />
              <span className="w-1.5 h-5 bg-rose-500 rounded-sm" />
              <span className="w-1.5 h-6 bg-rose-600 rounded-sm" />
              <span className="w-1.5 h-4 bg-rose-400 rounded-sm" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Heart Age</span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {heartAge} <span className="text-xs font-normal text-slate-500">yrs</span>
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">
              {ageDiff > 0 ? `+${ageDiff} yrs above age` : 'Optimal pace'}
            </span>
          </div>
        </div>

        {/* Actual Age */}
        <div className="md:col-span-3 flex items-center space-x-3 pr-4 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">Actual Age</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
              {patient.age} <span className="text-xs font-normal text-slate-500">yrs</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              BMI {patient.bmi} • {patient.gender}
            </span>
          </div>
        </div>

        {/* Heart Recovery Message */}
        <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
            {ageDiff > 0 ? (
              <>
                Your heart is currently under strain ({ageDiff} years older than your calendar age). Following your <strong>3 daily prehab habits</strong> will rebuild steady coronary reserve.
              </>
            ) : (
              <>
                Your cardiovascular vitals are well-aligned with your age. Maintain your daily walking and sleep targets.
              </>
            )}
          </p>

          <div className="rounded-xl bg-white px-3 py-1.5 border border-slate-200/90 shadow-sm shrink-0 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Date</span>
            <span className="text-xs font-extrabold text-slate-900">{patient.surgicalTimelineDays} Days</span>
          </div>
        </div>
      </div>

      {/* Key Focus Areas (Matches HbA1c, APOB, VLDL slider cards in screenshot) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Key Lifestyle Health Vitals
          </h3>
          <span className="text-[11px] text-slate-400">Personalized markers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Sleep */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>🌙</span> Sleep Quality
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  patient.sleepHours < 5
                    ? 'bg-rose-50 text-rose-600'
                    : patient.sleepHours < 7
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {patient.sleepHours < 5 ? 'Needs Focus' : patient.sleepHours < 7 ? 'Suboptimal' : 'Optimal'}
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-slate-900">{patient.sleepHours}</span>
              <span className="text-xs text-slate-500">hrs / night</span>
            </div>

            {/* Slider Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    patient.sleepHours < 5 ? 'bg-rose-500' : patient.sleepHours < 7 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (patient.sleepHours / 8) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>4h</span>
                <span>Goal: ≥ 7.0h</span>
                <span>8h</span>
              </div>
            </div>
          </div>

          {/* Card 2: Daily Sitting vs Standing */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>🪑</span> Sitting Time
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  patient.sittingHours >= 8
                    ? 'bg-rose-50 text-rose-600'
                    : patient.sittingHours > 4
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {patient.sittingHours >= 8 ? 'Sedentary' : patient.sittingHours > 4 ? 'Moderate' : 'Active Standing'}
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-slate-900">{patient.sittingHours}</span>
              <span className="text-xs text-slate-500">hours daily</span>
            </div>

            {/* Slider Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    patient.sittingHours >= 8 ? 'bg-rose-500' : patient.sittingHours > 4 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (patient.sittingHours / 12) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>2h (Active)</span>
                <span>Target: &lt; 5h</span>
                <span>12h</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tobacco / Nicotine */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>🚭</span> Tobacco Status
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  patient.cigarettesPerDay === 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : patient.cigarettesPerDay >= 8
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {patient.cigarettesPerDay === 0 ? 'Smoke-Free' : 'Tapering'}
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-slate-900">
                {patient.cigarettesPerDay > 0 ? patient.cigarettesPerDay : 0}
              </span>
              <span className="text-xs text-slate-500">
                {patient.cigarettesPerDay > 0 ? 'cigs / day' : '✓ Non-Smoker'}
              </span>
            </div>

            {/* Visual Indicator */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    patient.cigarettesPerDay === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${patient.cigarettesPerDay === 0 ? 100 : Math.min(100, patient.cigarettesPerDay * 7)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0 Cigs</span>
                <span>Goal: Smoke-Free</span>
                <span>20 Cigs</span>
              </div>
            </div>
          </div>

          {/* Card 4: Daily Stress Level */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>🧘</span> Nervous Balance
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  patient.stressScore >= 8
                    ? 'bg-rose-50 text-rose-600'
                    : patient.stressScore >= 6
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {patient.stressScore >= 8 ? 'High Strain' : patient.stressScore >= 6 ? 'Moderate' : 'Calm'}
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-slate-900">{patient.stressScore}</span>
              <span className="text-xs text-slate-500">/ 10 rating</span>
            </div>

            {/* Slider Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    patient.stressScore >= 8 ? 'bg-rose-500' : patient.stressScore >= 6 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(patient.stressScore / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1 (Calm)</span>
                <span>Target: &lt; 5</span>
                <span>10 (Overwhelmed)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
