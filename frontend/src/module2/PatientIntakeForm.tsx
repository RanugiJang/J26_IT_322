import React, { useState } from 'react';
import type { PatientProfile } from './types';
import { calculatePatientRisk } from './data/clinicalData';

interface PatientIntakeFormProps {
  currentPatient: PatientProfile;
  onSubmitPatient: (patient: PatientProfile) => Promise<void>;
  isModelLoading: boolean;
  onCancel?: () => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  currentPatient,
  onSubmitPatient,
  isModelLoading,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PatientProfile>(currentPatient);

  // Recalculate BMI when height or weight change
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-compute risk from lifestyle inputs before submitting
    const { score, category, trajectory } = calculatePatientRisk(formData);

    const fullPatient: PatientProfile = {
      ...formData,
      name: formData.name.trim() || `Patient ${formData.id}`,
      predictedRiskScore: formData.predictedRiskScore || score,
      riskCategory: formData.riskCategory || category,
      riskTrajectory: formData.riskTrajectory || trajectory,
      sodiumMg: formData.sodiumMg ?? 2400,
      totalFatG: formData.totalFatG ?? 70,
      sugarG: formData.sugarG ?? 45,
      calories: formData.calories ?? 2100,
      dietPattern: formData.dietPattern || 'Sri Lankan Traditional',
    };

    await onSubmitPatient(fullPatient);
  };

  const handleLoadDemoData = () => {
    const demoPatient: PatientProfile = {
      id: 'P-DEMO-01',
      name: 'Nimal Jayasuriya',
      age: 54,
      gender: 'Male',
      occupation: 'Senior Accountant (Desk Routine)',
      procedureType: 'Coronary Artery Bypass Graft (CABG)',
      surgicalTimelineDays: 21,
      heightCm: 172,
      weightKg: 76,
      bmi: 25.7,
      sittingHours: 4.0, // <= 4 / Active routine triggers Supported Chair Sit-to-Stand
      activityLevel: 'Active',
      walkingMinutes: 20,
      cigarettesPerDay: 0,
      sleepHours: 7.0,
      consecutiveLowSleepDays: 0,
      stressScore: 5.0,
      consecutiveHighStressDays: 0,
      predictedRiskScore: 0.42,
      riskCategory: 'MODERATE',
      riskTrajectory: 'Decreasing',
      sodiumMg: 1950,
      totalFatG: 55,
      sugarG: 30,
      calories: 2050,
      dietPattern: 'Sri Lankan Traditional',
      usualFoods: ['Red rice', 'Dhal curry', 'Gotukola sambol', 'Malu Ambul Thiyal'],
      foodToReplace: 'Sweetened Tea & Deep Fried Short-Eats',
      foodFrequency: 'Daily',
      portionSize: 'Moderate',
      preparationMethod: 'Steamed / Mild curry',
      dietImprovements: ['Hydrate with Thambili', 'Reduce coconut milk salt'],
      foodBudget: 'Traditional fresh local market',
      foodAllergies: 'None reported',
    };
    setFormData(demoPatient);
  };

  const riskPreview = calculatePatientRisk(formData);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-slate-800">
      {/* Header */}
      <div className="pb-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/20 text-2xl font-bold">
              🩺
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Personal Health Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your daily routine and body details — age, activity, sleep, stress, and nutrition — to build your customized heart preparation guide.
              </p>
            </div>
          </div>

          {/* Quick Demo Data Fill Button */}
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="self-start sm:self-auto shrink-0 inline-flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
            title="Auto-fill verified demo patient: Nimal Jayasuriya (Recommends Supported Chair Sit-to-Stand prehab)"
          >
            <span>⚡</span>
            <span>Fill Demo Data</span>
          </button>
        </div>

        {/* Live Risk Preview Banner */}
        {formData.name && (
          <div
            className={`mt-4 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              riskPreview.category === 'HIGH'
                ? 'border-rose-200 bg-rose-50/60'
                : riskPreview.category === 'MODERATE'
                ? 'border-amber-200 bg-amber-50/60'
                : 'border-emerald-200 bg-emerald-50/60'
            }`}
          >
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">{formData.name}</span>
              {' '}•{' '}
              {formData.age} yrs • BMI {formData.bmi} • Estimated Heart Score:
            </div>
            <div className="flex items-center space-x-2.5">
              <span
                className={`font-black text-xl ${
                  riskPreview.category === 'HIGH'
                    ? 'text-rose-600'
                    : riskPreview.category === 'MODERATE'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {Math.round(riskPreview.score * 100)}%
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  riskPreview.category === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : riskPreview.category === 'MODERATE'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                {riskPreview.category === 'HIGH' ? 'Needs Support' : riskPreview.category === 'MODERATE' ? 'Moderate' : 'Optimal'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics & Clinical Goal */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center space-x-1.5">
            <span>👤</span>
            <span>1. About You &amp; Your Care Objective</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Your Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Nimal Jayasuriya"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                min="18"
                max="95"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Biological Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Occupation / Routine</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Desk Job, Teacher"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Surgical / Care Procedure</label>
              <input
                type="text"
                value={formData.procedureType}
                onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
                placeholder="e.g. Heart Bypass (CABG) or Valve Replacement"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Days Until Procedure</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="3"
                  max="180"
                  value={formData.surgicalTimelineDays}
                  onChange={(e) => setFormData({ ...formData, surgicalTimelineDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all font-medium"
                  required
                />
                <span className="text-slate-500 shrink-0 font-medium text-xs">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Body Metrics & BMI */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
            <span>📊</span>
            <span>2. Body Metrics &amp; Sitting Routine</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Height (cm)</label>
              <input
                type="number"
                min="120"
                max="220"
                value={formData.heightCm || 170}
                onChange={(e) =>
                  handleHeightWeightChange(Number(e.target.value), formData.weightKg || 75)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Weight (kg)</label>
              <input
                type="number"
                min="35"
                max="200"
                step="0.5"
                value={formData.weightKg || 75}
                onChange={(e) =>
                  handleHeightWeightChange(formData.heightCm || 170, Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Calculated BMI</label>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 font-mono font-bold text-slate-900 flex items-center justify-between">
                <span>{formData.bmi}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    formData.bmi >= 30
                      ? 'bg-rose-100 text-rose-800'
                      : formData.bmi >= 25
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {formData.bmi >= 30 ? 'Obese' : formData.bmi >= 25 ? 'Overweight' : 'Healthy'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Daily Sitting Time (Hours)</label>
              <input
                type="number"
                min="0"
                max="18"
                step="0.5"
                value={formData.sittingHours}
                onChange={(e) => setFormData({ ...formData, sittingHours: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Activity */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center space-x-1.5">
            <span>🏃</span>
            <span>3. Physical Movement &amp; Walking</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">General Activity Routine</label>
              <select
                value={formData.activityLevel || 'Sedentary'}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all font-medium"
              >
                <option value="Sedentary">Mostly Sedentary (Sits often / little exercise)</option>
                <option value="Light">Light (Gentle strolls 1–3 days/week)</option>
                <option value="Moderate">Moderate (Active 3–5 days/week)</option>
                <option value="Active">Active (Exercise 6–7 days/week)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Daily Walking (minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={formData.walkingMinutes || 10}
                onChange={(e) => setFormData({ ...formData, walkingMinutes: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Sleep, Stress & Tobacco */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center space-x-1.5">
            <span>🌙</span>
            <span>4. Sleep, Stress &amp; Tobacco</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Sleep */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-indigo-800 font-bold">
                <span>Sleep Duration</span>
                <span>🌙</span>
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">Average Hours / Night</label>
                <input
                  type="number"
                  min="2"
                  max="14"
                  step="0.5"
                  value={formData.sleepHours}
                  onChange={(e) => setFormData({ ...formData, sleepHours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none font-medium"
                  required
                />
                <span className={`text-[10px] mt-1 block font-medium ${formData.sleepHours < 5 ? 'text-rose-600' : formData.sleepHours < 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formData.sleepHours < 5 ? '⚠️ High Alert — needs rest' :
                   formData.sleepHours < 7 ? 'ℹ️ Suboptimal — aim for 7–8h' : '✓ Restful sleep'}
                </span>
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">Consecutive Days &lt; 5h</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.consecutiveLowSleepDays}
                  onChange={(e) =>
                    setFormData({ ...formData, consecutiveLowSleepDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Stress */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-purple-800 font-bold">
                <span>Daily Stress Level</span>
                <span>🧘</span>
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">Rating (1 = Calm, 10 = High)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={formData.stressScore}
                  onChange={(e) => setFormData({ ...formData, stressScore: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 focus:outline-none font-medium"
                  required
                />
                <span className={`text-[10px] mt-1 block font-medium ${formData.stressScore >= 8 ? 'text-rose-600' : formData.stressScore >= 6 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formData.stressScore >= 8 ? '⚠️ High — relaxation priority' :
                   formData.stressScore >= 6 ? 'ℹ️ Moderate stress' : '✓ Calm & comfortable'}
                </span>
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">Consecutive High Days (≥ 7)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.consecutiveHighStressDays}
                  onChange={(e) =>
                    setFormData({ ...formData, consecutiveHighStressDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Tobacco */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-rose-800 font-bold">
                <span>Tobacco Use</span>
                <span>🚭</span>
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">Cigarettes per Day</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.cigarettesPerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, cigarettesPerDay: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none font-medium"
                  required
                />
              </div>
              <div className={`text-[11px] p-2 rounded-xl border ${
                formData.cigarettesPerDay === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {formData.cigarettesPerDay === 0
                  ? '✓ Smoke-Free'
                  : `⚠️ Target today: ${Math.max(0, formData.cigarettesPerDay - 2)} cigs (Gentle step-down)`}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Diet */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center space-x-1.5">
            <span>🥥</span>
            <span>5. Heart Nutrition (Sri Lankan Diet)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Typical Eating Habit</label>
              <select
                value={formData.dietPattern || 'Sri Lankan Traditional'}
                onChange={(e) => setFormData({ ...formData, dietPattern: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="Sri Lankan Traditional">Sri Lankan Traditional (Rice, Curry, Sambol)</option>
                <option value="Westernized Mixed">Westernized Mixed (Fast Food + Home Meals)</option>
                <option value="Vegetarian">Vegetarian / Plant-based</option>
                <option value="Low Sodium">Low Sodium (Doctor Recommended)</option>
              </select>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
              <div className="font-bold mb-0.5">🥥 Heart-Friendly Sri Lankan Recommendations:</div>
              <span>Thambili (King Coconut) • Gotukola Sambol • Malu Ambul Thiyal • Dhal Curry • Kurakkan Roti</span>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>Your confidential details are securely saved and used exclusively for your heart care guidance.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isModelLoading}
              className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isModelLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Building Your Care Plan...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>View My Personalized Health Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
