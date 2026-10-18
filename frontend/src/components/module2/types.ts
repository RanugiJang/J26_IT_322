export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bmi: number;
  heightCm?: number;
  weightKg?: number;
  occupation: string;
  sittingHours: number;
  activityLevel?: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  walkingMinutes?: number;
  cigarettesPerDay: number;
  sleepHours: number;
  consecutiveLowSleepDays: number;
  stressScore: number;
  consecutiveHighStressDays: number;
  predictedRiskScore: number; // e.g. 0.81 (81%)
  riskCategory: 'HIGH' | 'MODERATE' | 'LOW';
  riskTrajectory: 'Increasing' | 'Stable' | 'Decreasing';
  surgicalTimelineDays: number; // e.g. 24 days to surgery/procedure
  procedureType: string; // e.g. 'Coronary Artery Bypass Graft (CABG)'
  // Dietary parameters
  sodiumMg?: number;
  totalFatG?: number;
  sugarG?: number;
  calories?: number;
  dietPattern?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestedExercise {
  id: string;
  title: string;
  cardioIntensity: 'Gentle Mobility' | 'Low Intensity' | 'Moderate' | string;
  durationMinutes: number;
  targetCadence: string;
  rpeScale: string; // e.g. 'RPE <= 11 (Fairly Light)'
  description: string;
  clinicalObjective: string;
  contraindications: string;
  posturePoints: string[];
  referenceThumbnail: string;
  referenceVideoUrl?: string;  // Direct video URL (Wikimedia Commons, public domain)
  referenceVideoLabel?: string; // Source credit label
  referenceVideoType?: string;  // MIME type hint e.g. 'video/webm' or 'video/ogg'
}

export interface DailyPriorityAction {
  id: string;
  domain: 'Sleep' | 'Exercise' | 'Diet' | 'Stress' | 'Smoking';
  priorityNumber: 1 | 2 | 3;
  title: string;
  description: string;
  targetMetric: string;
  clinicalRationale: string;
  status: 'pending' | 'done' | 'too_hard' | 'skipped';
  adaptedNextDay?: string;
  rewardValue?: number;
}

export interface MotionRepFrame {
  repNumber: number;
  frameIndex: number;
  confidenceScore: number;
  confidenceLabel: string;
  keyJoints: {
    kneeAngle: number;
    spineAngle: number;
    focusJoint: string;
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
