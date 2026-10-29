import React, { useState } from 'react';
import type { PatientProfile, DailyPriorityAction } from './types';
import { createDefaultPatient, generateDailyPriorities } from './data/clinicalData';
import { Navbar } from './Navbar';
import { PatientHeader } from './PatientHeader';
import { AnatomicalHeartBody } from './AnatomicalHeartBody';
import { DailyRoadmap } from './DailyRoadmap';
import { PatientIntakeForm } from './PatientIntakeForm';
import { MotionCoachStudio } from './MotionCoachStudio';
import { NutritionPlanner } from './NutritionPlanner';
import { SleepStressHub } from './SleepStressHub';
import { SmokingTaperTracker } from './SmokingTaperTracker';
import { DoctorMonitorModal } from './DoctorMonitorModal';
import { ArchitectureInfoModal } from './ArchitectureInfoModal';
import { DashboardHero } from './DashboardHero';

export const Module2Dashboard: React.FC = () => {
  // Single-patient state — starts null so the first screen is ALWAYS the Patient Intake Form
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);

  // Model-driven priorities and outputs for THIS patient (generated locally)
  const [priorities, setPriorities] = useState<DailyPriorityAction[]>([]);
  const [clinicalFlags, setClinicalFlags] = useState<string[]>([]);
  const [currentActionIdx] = useState<number>(3);

  // Always start on 'intake' form — as requested: "first we got form with enter patient details"
  const [activeTab, setActiveTab] = useState<string>('intake');

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  // Fresh blank patient profile template
  const blankPatient = createDefaultPatient();

  /**
   * Uses local clinical rule engine to generate a personalized care plan.
   * No backend required — all logic runs in the browser.
   */
  const loadLocalPlan = (targetPatient: PatientProfile) => {
    const localPriorities = generateDailyPriorities(targetPatient);
    setPriorities(localPriorities);

    // Derive clinical flags from patient data
    const flags: string[] = [];
    if (targetPatient.sleepHours < 5) flags.push('Critical sleep deprivation detected — nocturnal cardiac risk elevated.');
    if (targetPatient.stressScore >= 8) flags.push('High sympathetic stress load — adrenal cortisol surge risk before surgery.');
    if (targetPatient.cigarettesPerDay > 0) flags.push(`Active smoking (${targetPatient.cigarettesPerDay} cigs/day) — immediate cessation required pre-operatively.`);
    if (targetPatient.bmi >= 30) flags.push(`BMI ${targetPatient.bmi.toFixed(1)} — obesity increases anaesthetic and haemodynamic risk.`);
    if ((targetPatient.surgicalTimelineDays ?? 30) <= 14) flags.push('Surgical timeline ≤ 14 days — intensive prehab acceleration protocol now active.');
    setClinicalFlags(flags);
  };

  /**
   * Called when the Patient Intake Form is submitted.
   * Generates patient plan using local rules and navigates to the dashboard.
   */
  const handlePatientFormSubmit = (newPatient: PatientProfile) => {
    setPatient(newPatient);
    setEditingPatient(null);
    loadLocalPlan(newPatient);
    setActiveTab('dashboard');
  };

  /**
   * Triggers editing the current patient's vitals
   */
  const handleOpenEdit = () => {
    setEditingPatient(patient);
    setActiveTab('intake');
  };

  /**
   * Triggers entering details for a new patient
   */
  const handleOpenNew = () => {
    setEditingPatient(null);
    setActiveTab('intake');
  };

  // Feedback handler — updates UI state optimistically, no backend call needed
  const handleFeedback = (
    actionId: string,
    status: 'done' | 'too_hard' | 'skipped'
  ) => {
    setPriorities((prev) =>
      prev.map((item) => {
        if (item.id === actionId) {
          const quickPlan =
            status === 'done'
              ? 'Great job! Your heart stamina is progressing smoothly.'
              : status === 'too_hard'
                ? 'Pace adjusted. Tomorrow is scaled down to keep you comfortable and strain-free.'
                : 'Rescheduled for tomorrow at a relaxed pace.';

          return {
            ...item,
            status,
            rewardValue: status === 'done' ? 1.0 : status === 'too_hard' ? -1.0 : -0.5,
            adaptedNextDay: quickPlan,
          };
        }
        return item;
      })
    );
  };

  const hasPatient = patient !== null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Real-World Medical Platform Navbar (ClyHealth aesthetic) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={hasPatient ? setActiveTab : () => setActiveTab('intake')}
        onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
        onOpenAssessment={handleOpenNew}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        hasPatient={hasPatient}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* 1. Patient Intake Form — always the first screen, or when user clicks Edit / New Patient */}
        {activeTab === 'intake' && (
          <PatientIntakeForm
            currentPatient={editingPatient || blankPatient}
            onSubmitPatient={handlePatientFormSubmit}
            isModelLoading={false}
            onCancel={hasPatient ? () => setActiveTab('dashboard') : undefined}
          />
        )}

        {/* 2. Dashboard & Domain Tabs — shown after patient submits profile */}
        {hasPatient && patient && activeTab !== 'intake' && (
          <>
            {/* Tab 1: Dashboard — Hero + Clinical Vitals */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* EDITORIAL HERO + IMAGES (mirrors Sleep & Calm page) */}
                <DashboardHero
                  patient={patient}
                  onNavigate={setActiveTab}
                  onOpenEdit={handleOpenEdit}
                />

                {/* Urgent Clinical Flags */}
                {clinicalFlags && clinicalFlags.length > 0 && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 sm:p-5 shadow-xl backdrop-blur-sm" style={{boxShadow: '0 0 20px rgba(244,63,94,0.12)'}}>
                    <div className="flex items-start space-x-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 text-base border border-rose-500/30">
                        ⚠️
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-rose-300 flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping inline-block"></span>
                          <span>Important Health Alerts for {patient.name}</span>
                        </h4>
                        <div className="mt-1.5 space-y-1">
                          {clinicalFlags.map((flag, idx) => (
                            <div key={idx} className="text-xs text-rose-300/80 flex items-start space-x-1.5">
                              <span className="font-bold text-rose-400">•</span>
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2-Column Clinical: Anatomical Body + Vitals & Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 w-full">
                    <AnatomicalHeartBody
                      patient={patient}
                      onExploreInsights={() => setActiveTab('exercise')}
                    />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                    <PatientHeader
                      patient={patient}
                      onOpenAssessment={handleOpenEdit}
                      onNewPatient={handleOpenNew}
                      isModelLoading={false}
                    />
                    <DailyRoadmap
                      priorities={priorities}
                      onFeedback={handleFeedback}
                      onOpenAssessment={handleOpenEdit}
                    />
                  </div>
                </div>

                {/* 5-Pillar Navigation Cards — Dark Glassmorphism */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
                  <div
                    onClick={() => setActiveTab('exercise')}
                    className="cursor-pointer rounded-2xl border border-emerald-500/25 bg-slate-900/80 p-4 transition-all hover:scale-[1.03] hover:border-emerald-400/60 shadow-xl backdrop-blur-sm group"
                    style={{boxShadow: '0 4px 20px rgba(16,185,129,0.08)'}}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">🏃</div>
                    <div className="mt-2 text-xs font-bold text-slate-100">Daily Movement</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{patient.activityLevel || 'Sedentary'}</div>
                    <div className="mt-3 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 rounded-lg px-2 py-1 inline-block border border-emerald-500/20">
                      {priorities.find((p) => p.domain === 'Exercise')?.targetMetric || `${patient.walkingMinutes || 10} min walk`}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('sleep-stress')}
                    className="cursor-pointer rounded-2xl border border-indigo-500/25 bg-slate-900/80 p-4 transition-all hover:scale-[1.03] hover:border-indigo-400/60 shadow-xl backdrop-blur-sm group"
                    style={{boxShadow: '0 4px 20px rgba(99,102,241,0.08)'}}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">🌙</div>
                    <div className="mt-2 text-xs font-bold text-slate-100">Restful Sleep</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Nocturnal recovery</div>
                    <div className="mt-3 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 rounded-lg px-2 py-1 inline-block border border-indigo-500/20">
                      {patient.sleepHours}h · {patient.sleepHours < 5 ? '🔴 High Alert' : patient.sleepHours < 7 ? '🟡 Suboptimal' : '🟢 Optimal'}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('sleep-stress')}
                    className="cursor-pointer rounded-2xl border border-purple-500/25 bg-slate-900/80 p-4 transition-all hover:scale-[1.03] hover:border-purple-400/60 shadow-xl backdrop-blur-sm group"
                    style={{boxShadow: '0 4px 20px rgba(168,85,247,0.08)'}}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">🧘</div>
                    <div className="mt-2 text-xs font-bold text-slate-100">Calm &amp; Mind</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Autonomic balance</div>
                    <div className="mt-3 text-[11px] font-bold text-purple-400 bg-purple-500/10 rounded-lg px-2 py-1 inline-block border border-purple-500/20">
                      Stress: {patient.stressScore}/10
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('smoking')}
                    className="cursor-pointer rounded-2xl border border-rose-500/25 bg-slate-900/80 p-4 transition-all hover:scale-[1.03] hover:border-rose-400/60 shadow-xl backdrop-blur-sm group"
                    style={{boxShadow: '0 4px 20px rgba(244,63,94,0.08)'}}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">🚭</div>
                    <div className="mt-2 text-xs font-bold text-slate-100">Smoke-Free</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Nicotine taper plan</div>
                    <div className="mt-3 text-[11px] font-bold text-rose-400 bg-rose-500/10 rounded-lg px-2 py-1 inline-block border border-rose-500/20">
                      {patient.cigarettesPerDay > 0 ? `${patient.cigarettesPerDay} cigs/day` : '✓ Smoke-Free'}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('diet')}
                    className="cursor-pointer rounded-2xl border border-amber-500/25 bg-slate-900/80 p-4 transition-all hover:scale-[1.03] hover:border-amber-400/60 shadow-xl backdrop-blur-sm group"
                    style={{boxShadow: '0 4px 20px rgba(245,158,11,0.08)'}}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">🥥</div>
                    <div className="mt-2 text-xs font-bold text-slate-100">Heart Nutrition</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{patient.dietPattern || 'Sri Lankan'}</div>
                    <div className="mt-3 text-[11px] font-bold text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1 inline-block border border-amber-500/20">
                      Thambili &amp; Gotukola
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Daily Movement & Walking Prehab */}
            {activeTab === 'exercise' && (
              <MotionCoachStudio
                patient={patient}
                currentActionIdx={currentActionIdx}
                onFeedback={handleFeedback}
                modelPrescription={null}
              />
            )}

            {/* Tab 3: Heart Nutrition (Sri Lankan Diet) */}
            {activeTab === 'diet' && <NutritionPlanner patient={patient} onOpenForm={handleOpenEdit} />}

            {/* Tab 4: Sleep & Stress Hub */}
            {activeTab === 'sleep-stress' && (
              <SleepStressHub
                patient={patient}
                sleepHours={patient.sleepHours}
                stressScore={patient.stressScore}
              />
            )}

            {/* Tab 5: Smoking Taper Tracker */}
            {activeTab === 'smoking' && (
              <SmokingTaperTracker cigarettesPerDay={patient.cigarettesPerDay} patient={patient} />
            )}
          </>
        )}

        {/* If no patient exists and somehow not on intake, button to open form */}
        {!hasPatient && activeTab !== 'intake' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-4xl shadow-xl shadow-rose-200">
              🫀
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Enter Your Health Profile</h2>
            <p className="text-slate-500 max-w-sm">
              Please enter your daily lifestyle details to generate your personalized pre-operative heart care plan.
            </p>
            <button
              onClick={() => setActiveTab('intake')}
              className="mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all"
            >
              📋 Open Health Profile Form
            </button>
          </div>
        )}
      </main>

      {/* Clean Healthcare Clinical Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>CardioLoop • Personalized Pre-Operative Cardiac Care Platform</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Confidential Clinical Decision Support</span>
        </div>
      </footer>

      {/* Interactive Modals */}
      <DoctorMonitorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        patient={patient || blankPatient}
      />

      <ArchitectureInfoModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />
    </div>
  );
};
