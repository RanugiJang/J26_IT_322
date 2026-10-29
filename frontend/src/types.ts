export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  bmi: number;
  occupation: string;
  sittingHours: number;
  cigarettesPerDay: number;
  sleepHours: number;
  consecutiveLowSleepDays: number;
  stressScore: number;
  consecutiveHighStressDays: number;
  predictedRiskScore: number; // e.g. 0.78
  riskCategory: 'HIGH' | 'MODERATE' | 'LOW';
  riskTrajectory: 'Increasing' | 'Stable' | 'Decreasing';
  surgicalTimelineDays: number; // e.g. 28 days to CABG
}

export interface DailyPriorityAction {
  id: string;
  domain: 'Sleep' | 'Exercise' | 'Diet' | 'Stress' | 'Smoking';
  priorityNumber: 1 | 2 | 3;
  actionText: string;
  clinicalReason: string;
  targetMetric: string;
  status: 'pending' | 'done' | 'too_hard' | 'skipped';
  dqnReward?: number;
  adaptedNextDay?: string;
}

export interface CacjatRepFrame {
  repNumber: number;
  frameIndex: number;
  confidenceScore: number; // e.g. 0.95 vs 0.20
  confidenceStatus: 'High (0.95) - Weight 1.0' | 'Low (0.20) - Frame Filtered';
  keyJoints: {
    kneeAngle: number;
    spineAngle: number;
    attentionWeight: 'HIGH (CVD Critical)' | 'MODERATE' | 'LOW (Wrist/Ankle)';
  };
  formState: 'CORRECT' | 'VALGUS DETECTED' | 'EXCESS FORWARD LEAN';
  fatigueIndex: number; // 0.0 to 1.0
  fatigueStatus: 'NORMAL' | 'ELEVATED' | 'CRITICAL (STOP NOW)';
}

export interface SriLankanFoodItem {
  id: string;
  name: string;
  sinhalaName: string;
  category: 'Staple' | 'Curry / Sambol' | 'Beverage' | 'Snack';
  calories: number;
  sodiumMg: number;
  totalFatG: number;
  transFatG: number;
  cardioImpact: 'PROTECTIVE' | 'CAUTION' | 'RESTRICTED';
  swapTarget?: string;
  reason?: string;
}
