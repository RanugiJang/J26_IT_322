import React from 'react';
import { PatientProfile } from '../types';

interface DoctorMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
}

export const DoctorMonitorModal: React.FC<DoctorMonitorModalProps> = ({ isOpen, onClose, patient }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold">
              🩺
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cardiology Clinical Pre-Surgery Monitor</h2>
              <p className="text-xs text-slate-400">Prehabilitation Compliance & Escalation Dashboard</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Patient Clinical Overview */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Patient</div>
            <div className="text-sm font-bold text-white mt-0.5">{patient.name}</div>
            <div className="text-[11px] text-slate-400">{patient.age}y • BMI {patient.bmi}</div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Pre-Surgery CVD Risk</div>
            <div className="text-sm font-bold text-rose-400 mt-0.5">{(patient.predictedRiskScore * 100).toFixed(0)}% (High)</div>
            <div className="text-[11px] text-rose-400 font-semibold">Trajectory: {patient.riskTrajectory}</div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Surgery Target</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{patient.surgicalTimelineDays} Days</div>
            <div className="text-[11px] text-emerald-400">Prehab Active</div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">DQN Compliance</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">84.2%</div>
            <div className="text-[11px] text-slate-400">12 Days Active</div>
          </div>
        </div>

        {/* Active Clinical Alerts Section */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Active Clinical Flags Requiring Physician Review
          </h3>

          <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs">
            <div className="font-bold text-red-300 flex items-center justify-between">
              <span>🚨 Flag 1: Non-Dipping Nocturnal BP & Severe Sleep Debt</span>
              <span className="font-mono text-[10px] text-red-400">Threshold Exceeded</span>
            </div>
            <p className="mt-1 text-slate-300">
              Patient logged &lt; 5 hours sleep for {patient.consecutiveLowSleepDays} consecutive days (avg: 4.2h). 
              Recommendation: Prescribe melatonin 3mg or evaluate for obstructive sleep apnea (OSA) prior to induction.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 text-xs">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>⚠️ Flag 2: Prolonged Sympathetic Overdrive</span>
              <span className="font-mono text-[10px] text-amber-400">5-Day Flag</span>
            </div>
            <p className="mt-1 text-slate-300">
              Stress score recorded at {patient.stressScore}/10 for {patient.consecutiveHighStressDays} days. Consider pre-operative anxiolytic counseling or beta-blocker dosage adjustment.
            </p>
          </div>
        </div>

        {/* 5-Domain Adherence Radar / Table */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            5 Lifestyle Domains Adherence Breakdown
          </h3>

          <div className="mt-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Domain</th>
                  <th className="px-4 py-2.5">AI Engine</th>
                  <th className="px-4 py-2.5">Current Status</th>
                  <th className="px-4 py-2.5">RL Adaptation Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-white">Exercise</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">Smart Motion Coach</td>
                  <td className="px-4 py-2.5 text-emerald-400">82% Quality (8 min walk)</td>
                  <td className="px-4 py-2.5 text-slate-300">Adapted from 10m ➔ 3m ➔ 7m</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-white">Sleep</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">Circadian Alert Engine</td>
                  <td className="px-4 py-2.5 text-red-400">4.2h (Under Alert &lt;5h)</td>
                  <td className="px-4 py-2.5 text-slate-300">Bedtime moved to 9:30pm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-white">Diet</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">243 SL Food DB</td>
                  <td className="px-4 py-2.5 text-emerald-400">Cola ➔ Thambili Swapped</td>
                  <td className="px-4 py-2.5 text-slate-300">Sodium reduced by 420mg/day</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-white">Stress</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">4-4-4 Box Pacer</td>
                  <td className="px-4 py-2.5 text-amber-400">Stress 8.4 (Flagged)</td>
                  <td className="px-4 py-2.5 text-slate-300">3 breath sessions logged</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-white">Smoking</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">Logistic Stage Classifier</td>
                  <td className="px-4 py-2.5 text-emerald-400">Tapering: 8 ➔ 6 cigs/day</td>
                  <td className="px-4 py-2.5 text-slate-300">Target 0 cigs in 3 weeks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert('Clinical Summary PDF exported for Cardiac Surgery Review Board.');
              onClose();
            }}
            className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600"
          >
            Export Pre-Surgery Clinical Summary
          </button>
        </div>
      </div>
    </div>
  );
};
