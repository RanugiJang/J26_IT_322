import type { PatientProfile, DailyPriorityAction } from '../types';

export const API_BASE_URL = 'http://127.0.0.1:8000';

export interface BackendHealthResponse {
  status: string;
  engine_ready: boolean;
  models: {
    lifestyle_ranking_ensemble: string;
    dqn_adaptive_agent: string;
    exercise_prescriber: string;
    ca_cjat_pose: string;
  };
}

export interface BackendRecommendationResponse {
  patient?: PatientProfile;
  patient_summary: {
    age: number;
    bmi: number;
    cvd_risk_score: number;
    risk_trajectory: string;
    effective_risk: number;
    program_day: number;
  };
  top_3_today: DailyPriorityAction[];
  raw_top_3: Array<{
    priority_rank: number;
    domain: string;
    action: string;
    severity_score: number;
  }>;
  domain_priority_ranking: Record<string, number>;
  clinical_flags: string[];
  full_domain_guidance: {
    exercise: any;
    sleep: any;
    stress: any;
    smoking: any;
    diet: any;
  };
  current_exercise_action_idx: number;
}

export interface AdaptationResponse {
  success: boolean;
  feedback_received: string;
  adaptation: {
    current_action: string;
    action_index: number;
    coach_message: string;
    recommended_duration_min: number;
  };
}

/**
 * Check backend connection and model loading state
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch clinical patient cohort from backend
 */
export async function fetchClinicalPatients(): Promise<PatientProfile[]> {
  const res = await fetch(`${API_BASE_URL}/api/patients`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch clinical patient cohort: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch most recently created/updated patient from backend
 */
export async function fetchLatestPatient(): Promise<PatientProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/patients/latest`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.patient || null;
  } catch {
    return null;
  }
}

/**
 * Save or update patient in backend database
 */
export async function savePatientProfile(patient: PatientProfile): Promise<PatientProfile> {
  const res = await fetch(`${API_BASE_URL}/api/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!res.ok) {
    throw new Error(`Failed to save patient: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Request real ML recommendation plan (XGBoost + LightGBM + DQN) from backend
 */
export async function fetchPersonalizedPlan(
  patient: PatientProfile,
  currentDay: number = 1,
  currentActionIdx: number = 3
): Promise<BackendRecommendationResponse> {
  const payload = {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    bmi: patient.bmi,
    heightCm: patient.heightCm || 170,
    weightKg: patient.weightKg || 75,
    occupation: patient.occupation,
    sittingHours: patient.sittingHours,
    activityLevel: patient.activityLevel || 'Sedentary',
    walkingMinutes: patient.walkingMinutes || 10,
    cigarettesPerDay: patient.cigarettesPerDay,
    sleepHours: patient.sleepHours,
    consecutiveLowSleepDays: patient.consecutiveLowSleepDays || 0,
    stressScore: patient.stressScore,
    consecutiveHighStressDays: patient.consecutiveHighStressDays || 0,
    predictedRiskScore: patient.predictedRiskScore,
    riskCategory: patient.riskCategory,
    riskTrajectory: patient.riskTrajectory,
    surgicalTimelineDays: patient.surgicalTimelineDays,
    procedureType: patient.procedureType,
    sodiumMg: patient.sodiumMg || 2400,
    totalFatG: patient.totalFatG || 70,
    sugarG: patient.sugarG || 45,
    calories: patient.calories || 2100,
    dietPattern: patient.dietPattern || 'Sri Lankan Traditional',
    currentDay,
    currentActionIdx,
  };

  const res = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Model recommendation API error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

/**
 * Send patient feedback to DQN RL agent for dynamic exercise adaptation
 */
export async function sendAdaptiveFeedback(
  currentActionIdx: number,
  feedback: 'done' | 'too_hard' | 'skipped',
  cvdRisk: number,
  currentDay: number = 1,
  patientId?: string
): Promise<AdaptationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/adapt-exercise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      currentActionIdx,
      feedback,
      cvdRisk,
      currentDay,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit feedback to DQN agent: ${res.statusText}`);
  }

  return res.json();
}
