import React from 'react';
import type { PatientProfile } from './types';

interface DoctorMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
}

export const DoctorMonitorModal: React.FC<DoctorMonitorModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl text-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">🩺</span>
              <span>Health Alerts &amp; Reminders</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Important health notes for {patient.name} to discuss with your doctor
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Alerts List */}
        <div className="mt-5 space-y-3 text-xs">
          {patient.sleepHours < 5 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex items-center space-x-2 text-rose-800 font-bold">
                <span>🚨</span>
                <span>Low Sleep Alert — {patient.sleepHours} hours per night</span>
              </div>
              <p className="mt-1.5 text-slate-700 leading-relaxed">
                You have been sleeping under 5 hours for {patient.consecutiveLowSleepDays} consecutive nights. Poor sleep keeps blood pressure elevated, which increases surgical risk. Please discuss with your doctor, who may recommend a sleep check-up.
              </p>
            </div>
          )}

          {patient.stressScore >= 7.5 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center space-x-2 text-amber-800 font-bold">
                <span>⚠️</span>
                <span>High Stress Level — {patient.stressScore}/10</span>
              </div>
              <p className="mt-1.5 text-slate-700 leading-relaxed">
                Your stress has been elevated for {patient.consecutiveHighStressDays} days. High stress puts extra strain on your heart before surgery. Your doctor may suggest relaxation strategies or medication to help you feel calmer.
              </p>
            </div>
          )}

          {patient.cigarettesPerDay > 0 && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
              <div className="flex items-center space-x-2 text-purple-800 font-bold">
                <span>🚭</span>
                <span>Active Smoking — {patient.cigarettesPerDay} cigarettes/day</span>
              </div>
              <p className="mt-1.5 text-slate-700 leading-relaxed">
                Your step-down quit plan is in progress. Stopping smoking before surgery day {patient.surgicalTimelineDays} cuts wound healing risks in half and speeds up recovery. Talk to your doctor if you need additional support.
              </p>
            </div>
          )}

          {patient.sleepHours >= 5 && patient.stressScore < 7.5 && patient.cigarettesPerDay === 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <span>✅</span>
                <span>Looking Good — No Major Alerts</span>
              </div>
              <p className="mt-1.5 text-slate-700 leading-relaxed">
                No critical health flags detected for {patient.name}. Keep following your daily care plan. Regular check-ins keep your progress on track.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs text-slate-700 font-semibold"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              alert(`Exported Health Summary for ${patient.name} to Hospital Records.`);
              onClose();
            }}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-sm flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Share With Doctor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
