import React, { useState, useEffect, useCallback } from 'react';
import type { PatientProfile, DailyPriorityAction } from './types';
import { createDefaultPatient, generateDailyPriorities } from './data/mockData';
import {
  checkBackendHealth,
  fetchPersonalizedPlan,
  sendAdaptiveFeedback,
  type BackendRecommendationResponse,
} from './services/api';
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

export const Module2Dashboard: React.FC = () => {
  // Single-patient state — starts null so the first screen is ALWAYS the Patient Intake Form
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);

  // Model-driven priorities and outputs for THIS patient
  const [priorities, setPriorities] = useState<DailyPriorityAction[]>([]);
  const [, setDomainRankings] = useState<Record<string, number>>({});
  const [clinicalFlags, setClinicalFlags] = useState<string[]>([]);
  const [currentActionIdx, setCurrentActionIdx] = useState<number>(3);
  const [, setLastDqnMessage] = useState<string>('');

  // System & Model Telemetry
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);

  // Always start on 'intake' form — as requested: "first we got form with enter patient details"
  const [activeTab, setActiveTab] = useState<string>('intake');

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  // Fresh blank patient profile template
  const blankPatient = createDefaultPatient();

  /**
   * Calls the FastAPI backend to execute personalized care models
   * Saves patient & plan directly to database
   */
  const loadModelPlan = useCallback(
    async (targetPatient: PatientProfile, actionIdx: number = currentActionIdx) => {
      setIsModelLoading(true);
      try {
        const response: BackendRecommendationResponse = await fetchPersonalizedPlan(
          targetPatient,
          1,
          actionIdx
        );

        setBackendOnline(true);
        if (response.top_3_today && response.top_3_today.length > 0) {
          setPriorities(response.top_3_today);
        }
        if (response.domain_priority_ranking) {
          setDomainRankings(response.domain_priority_ranking);
        }
        if (response.clinical_flags) {
          setClinicalFlags(response.clinical_flags);
        }
        if (response.current_exercise_action_idx !== undefined) {
          setCurrentActionIdx(response.current_exercise_action_idx);
        }
        // Update patient with server-returned record (includes computed risk & DB ID)
        if (response.patient) {
          setPatient(response.patient);
        }
      } catch (err) {
        console.warn('Backend unavailable, using localized clinical rules fallback:', err);
        setBackendOnline(false);
        // Fallback to local rule engine so dashboard never breaks offline
        const fallbackPriorities = generateDailyPriorities(targetPatient);
        setPriorities(fallbackPriorities);
      } finally {
        setIsModelLoading(false);
      }
    },
    [currentActionIdx]
  );

  // Initial load: check backend health only. We deliberately DO NOT load mock patients.
  useEffect(() => {
    let mounted = true;

    async function initializeSystem() {
      try {
        const health = await checkBackendHealth();
        if (mounted && health.status === 'healthy') {
          setBackendOnline(true);
        }
      } catch (e) {
        if (mounted) setBackendOnline(false);
      }
    }

    initializeSystem();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Called when the Patient Intake Form is submitted.
   * Generates patient plan, stores in database, and navigates to the dashboard.
   */
  const handlePatientFormSubmit = async (newPatient: PatientProfile) => {
    setPatient(newPatient);
    setEditingPatient(null);
    await loadModelPlan(newPatient, 3);
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

  // Adaptive feedback handler powered by intelligent coach
  const handleFeedback = async (
    actionId: string,
    status: 'done' | 'too_hard' | 'skipped'
  ) => {
    // Optimistically update the UI with patient-friendly responses
    setPriorities((prev) =>
      prev.map((item) => {
        if (item.id === actionId) {
          let reward = status === 'done' ? 1.0 : status === 'too_hard' ? -1.0 : -0.5;
          let quickPlan =
            status === 'done'
              ? 'Great job! Your heart stamina is progressing smoothly.'
              : status === 'too_hard'
              ? 'Pace adjusted. Tomorrow is scaled down to keep you comfortable and strain-free.'
              : 'Rescheduled for tomorrow at a relaxed pace.';

          return {
            ...item,
            status,
            rewardValue: reward,
            adaptedNextDay: quickPlan,
          };
        }
        return item;
      })
    );

    // Call intelligent adaptive coach on backend
    if (backendOnline && patient) {
      try {
        const dqnRes = await sendAdaptiveFeedback(
          currentActionIdx,
          status,
          patient.predictedRiskScore,
          1,
          patient.id
        );

        if (dqnRes && dqnRes.adaptation) {
          const adapted = dqnRes.adaptation;
          setCurrentActionIdx(adapted.action_index);
          setLastDqnMessage(
            `Smart Coach: ${adapted.current_action} (${adapted.recommended_duration_min} min) — ${adapted.coach_message}`
          );

          // Update priority item with coach message
          setPriorities((prev) =>
            prev.map((item) =>
              item.id === actionId
                ? {
                    ...item,
                    adaptedNextDay: adapted.coach_message,
                  }
                : item
            )
          );
        }
      } catch (e) {
        console.error('Failed to submit feedback to adaptive coach:', e);
      }
    }
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
        backendOnline={backendOnline}
        hasPatient={hasPatient}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* 1. Patient Intake Form — always the first screen, or when user clicks Edit / New Patient */}
        {activeTab === 'intake' && (
          <PatientIntakeForm
            currentPatient={editingPatient || blankPatient}
            onSubmitPatient={handlePatientFormSubmit}
            isModelLoading={isModelLoading}
            onCancel={hasPatient ? () => setActiveTab('dashboard') : undefined}
          />
        )}

        {/* 2. Dashboard & Domain Tabs — shown after patient submits profile */}
        {hasPatient && patient && activeTab !== 'intake' && (
          <>
            {/* Tab 1: Today's Action Plan Roadmap & Cardiovascular Scan (ClyHealth Layout) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Urgent Clinical Flags */}
                {clinicalFlags && clinicalFlags.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm text-base">
                        ⚠️
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-rose-900">
                          Important Health Alerts for {patient.name}
                        </h4>
                        <div className="mt-1.5 space-y-1">
                          {clinicalFlags.map((flag, idx) => (
                            <div key={idx} className="text-xs text-rose-700 flex items-start space-x-1.5">
                              <span className="font-bold">•</span>
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2-Column Responsive Layout: Left 3D Anatomical Body Scan, Right Vitals & Strategy */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: 3D Anatomical Human Body & Cardiovascular System (lg:col-span-5) */}
                  <div className="lg:col-span-5 w-full">
                    <AnatomicalHeartBody
                      patient={patient}
                      onExploreInsights={() => setActiveTab('exercise')}
                    />
                  </div>

                  {/* Right Column: Cardiovascular Vitals + Daily Care Strategy (lg:col-span-7) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Top Right: Cardiovascular System Card (Heart Age vs Actual Age + Key Vitals) */}
                    <PatientHeader
                      patient={patient}
                      onOpenAssessment={handleOpenEdit}
                      onNewPatient={handleOpenNew}
                      isModelLoading={isModelLoading}
                    />

                    {/* Bottom Right: Customized Daily Care Strategy (Action Plan & Habits) */}
                    <DailyRoadmap
                      priorities={priorities}
                      onFeedback={handleFeedback}
                      onOpenAssessment={handleOpenEdit}
                    />
                  </div>
                </div>

                {/* Quick 5-Pillar Navigation Cards for this Patient (White Cards matching ClyHealth) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
                  <div
                    onClick={() => setActiveTab('exercise')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:scale-[1.02] hover:border-emerald-300 hover:shadow-md shadow-sm"
                  >
                    <div className="text-2xl">🏃</div>
                    <div className="mt-2 text-xs font-bold text-slate-900">Daily Movement</div>
                    <div className="text-[11px] text-slate-500">Activity: {patient.activityLevel || 'Sedentary'}</div>
                    <div className="mt-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 inline-block border border-emerald-100">
                      {priorities.find((p) => p.domain === 'Exercise')?.targetMetric || `${patient.walkingMinutes || 10} min walking`}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('sleep-stress')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:scale-[1.02] hover:border-indigo-300 hover:shadow-md shadow-sm"
                  >
                    <div className="text-2xl">🌙</div>
                    <div className="mt-2 text-xs font-bold text-slate-900">Restful Sleep</div>
                    <div className="text-[11px] text-slate-500">Nighttime recovery</div>
                    <div className="mt-3 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1 inline-block border border-indigo-100">
                      {patient.sleepHours}h ({patient.sleepHours < 5 ? 'High Alert' : patient.sleepHours < 7 ? 'Suboptimal' : 'Optimal'})
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('sleep-stress')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:scale-[1.02] hover:border-purple-300 hover:shadow-md shadow-sm"
                  >
                    <div className="text-2xl">🧘</div>
                    <div className="mt-2 text-xs font-bold text-slate-900">Calm &amp; Mind</div>
                    <div className="text-[11px] text-slate-500">Autonomic balance</div>
                    <div className="mt-3 text-[11px] font-bold text-purple-700 bg-purple-50 rounded-lg px-2 py-1 inline-block border border-purple-100">
                      Stress: {patient.stressScore}/10
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('smoking')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:scale-[1.02] hover:border-rose-300 hover:shadow-md shadow-sm"
                  >
                    <div className="text-2xl">🚭</div>
                    <div className="mt-2 text-xs font-bold text-slate-900">Smoke-Free</div>
                    <div className="text-[11px] text-slate-500">Step-down nicotine taper</div>
                    <div className="mt-3 text-[11px] font-bold text-rose-700 bg-rose-50 rounded-lg px-2 py-1 inline-block border border-rose-100">
                      {patient.cigarettesPerDay > 0 ? `${patient.cigarettesPerDay} cigs/day` : 'Smoke-Free ✓'}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('diet')}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:scale-[1.02] hover:border-amber-300 hover:shadow-md shadow-sm"
                  >
                    <div className="text-2xl">🥥</div>
                    <div className="mt-2 text-xs font-bold text-slate-900">Heart Nutrition</div>
                    <div className="text-[11px] text-slate-500">{patient.dietPattern || 'Sri Lankan Traditional'}</div>
                    <div className="mt-3 text-[11px] font-bold text-amber-800 bg-amber-50 rounded-lg px-2 py-1 inline-block border border-amber-100">
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
              />
            )}

            {/* Tab 3: Heart Nutrition (Sri Lankan Diet) */}
            {activeTab === 'diet' && <NutritionPlanner />}

            {/* Tab 4: Sleep & Stress Hub */}
            {activeTab === 'sleep-stress' && (
              <SleepStressHub
                sleepHours={patient.sleepHours}
                stressScore={patient.stressScore}
              />
            )}

            {/* Tab 5: Smoking Taper Tracker */}
            {activeTab === 'smoking' && (
              <SmokingTaperTracker cigarettesPerDay={patient.cigarettesPerDay} />
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
          <span>CardioCare • Personalized Pre-Operative Cardiac Care Platform</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Confidential Clinical Decision Support</span>
          {backendOnline && (
            <>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-emerald-600 font-medium">● Connected &amp; Active</span>
            </>
          )}
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
