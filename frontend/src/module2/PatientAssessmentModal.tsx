import React, { useState } from 'react';
import type { PatientProfile } from './types';
import { calculatePatientRisk } from './data/clinicalData';

interface PatientAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: PatientProfile;
  onSavePatient: (patient: PatientProfile) => void;
}

export const PatientAssessmentModal: React.FC<PatientAssessmentModalProps> = ({
  isOpen,
  onClose,
  currentPatient,
  onSavePatient,
}) => {
  const [formData, setFormData] = useState<PatientProfile>(currentPatient);

  if (!isOpen) return null;



  const handleHeightWeightChange = (height: number, weight: number) => {
    const heightM = height / 100;
    const computedBmi = heightM > 0 ? Math.round((weight / (heightM * heightM)) * 10) / 10 : formData.bmi;
    setFormData((prev) => ({
      ...prev,
      heightCm: height,
      weightKg: weight,
      bmi: computedBmi,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const riskAnalysis = calculatePatientRisk(formData);
    const updatedPatient: PatientProfile = {
      ...formData,
      predictedRiskScore: riskAnalysis.score,
      riskCategory: riskAnalysis.category,
      riskTrajectory: riskAnalysis.trajectory,
    };
    onSavePatient(updatedPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🩺</span> Patient Health & Lifestyle Assessment
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Input patient clinical baseline to dynamically generate personalized cardiac prehab targets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Info banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-xs text-slate-400">✏️ Edit the current patient's vitals below. Risk score will be recomputed automatically.</div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Identity & Basic Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Procedure & Surgical Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Procedure / Clinical Goal</label>
              <input
                type="text"
                value={formData.procedureType}
                onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Coronary Artery Bypass Graft (CABG)"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Prehab Window (Days until procedure)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={formData.surgicalTimelineDays}
                  onChange={(e) => setFormData({ ...formData, surgicalTimelineDays: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  required
                />
                <span className="text-slate-400">Days</span>
              </div>
            </div>
          </div>

          {/* Anthropometrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm || 172}
                onChange={(e) => handleHeightWeightChange(Number(e.target.value), formData.weightKg || 90)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={formData.weightKg || 92}
                onChange={(e) => handleHeightWeightChange(formData.heightCm || 172, Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Calculated BMI</label>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-rose-400 font-bold font-mono">
                {formData.bmi} kg/m² {formData.bmi > 30 ? '(Class I Obesity)' : formData.bmi > 25 ? '(Overweight)' : '(Normal)'}
              </div>
            </div>
          </div>

          {/* Lifestyle Variables (Sitting, Smoking, Sleep, Stress) */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Lifestyle Risk Indicators</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Daily Sedentary Hours */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Daily Sitting / Desk Hours:</span>
                  <span className="font-mono text-white font-bold">{formData.sittingHours} hrs/day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="0.5"
                  value={formData.sittingHours}
                  onChange={(e) => setFormData({ ...formData, sittingHours: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Cigarettes Per Day */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Cigarettes per Day:</span>
                  <span className="font-mono text-rose-400 font-bold">{formData.cigarettesPerDay} cigs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={formData.cigarettesPerDay}
                  onChange={(e) => setFormData({ ...formData, cigarettesPerDay: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Sleep Hours */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Average Sleep Hours:</span>
                  <span className={`font-mono font-bold ${formData.sleepHours < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formData.sleepHours} hrs/night
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.2"
                  value={formData.sleepHours}
                  onChange={(e) => setFormData({ ...formData, sleepHours: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Stress Level */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Stress Rating (1 - 10):</span>
                  <span className={`font-mono font-bold ${formData.stressScore >= 7.5 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {formData.stressScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.stressScore}
                  onChange={(e) => setFormData({ ...formData, stressScore: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/40 transition-all flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Generate My Personalized Prehab Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
