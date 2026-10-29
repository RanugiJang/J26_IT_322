import type { PatientProfile, DailyPriorityAction, SriLankanFoodItem, MotionRepFrame, SuggestedExercise } from '../types';

export const SUGGESTED_EXERCISES: SuggestedExercise[] = [
  {
    id: 'ex-walk-10',
    title: 'Flat Ground Slow Walking (Model Protocol 2)',
    cardioIntensity: 'Low Intensity (40–50% HRR)',
    durationMinutes: 10,
    targetCadence: '80 - 95 steps/min',
    rpeScale: 'RPE <= 11 (Fairly Light)',
    description: 'A gentle, continuous walk on flat ground recommended 20-30 minutes after meals to blunt glucose surges and promote steady coronary blood flow without elevating myocardial strain.',
    clinicalObjective: 'Enhances coronary microcirculation and improves autonomic parasympathetic recovery prior to surgery.',
    contraindications: 'Do not continue if experiencing chest tightness, lightheadedness, or acute breathlessness.',
    posturePoints: [
      'Maintain an upright spine with shoulders relaxed down and back (avoid forward torso lean > 15°).',
      'Step with a natural heel-to-toe roll; ensure knees track straight over toes without inward collapse.',
      'Breathe rhythmically in through the nose and out through pursed lips.'
    ],
    referenceThumbnail: '🚶‍♂️',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bella_walking_away_%2851616016144%29.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Wikimedia Commons — Human Walking Gait (CC-BY 2.0)'
  },
  {
    id: 'ex-chair-aerobics',
    title: 'Seated Chair Aerobics & Gentle Mobility (Model Protocol 1)',
    cardioIntensity: 'Very Low (< 40% HRR)',
    durationMinutes: 5,
    targetCadence: 'Rhythmic, smooth tempo',
    rpeScale: 'RPE 8 - 9 (Very Light)',
    description: 'Seated trunk rotations, gentle arm swings, and seated knee marches designed for high-risk cardiac patients to mobilize circulation without thoracic strain.',
    clinicalObjective: 'Stimulates peripheral hemodynamics and venous return while keeping cardiac output strictly submaximal.',
    contraindications: 'Avoid rapid movements or holding breath during arm lifts.',
    posturePoints: [
      'Sit upright with lumbar support against chair back.',
      'Shoulders relaxed away from ears during arm elevations.',
      'Inhale during expansion, exhale during relaxation.'
    ],
    referenceThumbnail: '🪑',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'CDC — Seated Mobility & Range of Motion (Public Domain)'
  },
  {
    id: 'ex-brisk-walk-cycling',
    title: 'Brisk Walking & Stationary Cycling (Model Protocol 4)',
    cardioIntensity: 'Low-Moderate (50% HRR)',
    durationMinutes: 15,
    targetCadence: '95 - 105 steps/min or 50-60 RPM',
    rpeScale: 'RPE 11 - 12 (Moderate)',
    description: 'Low-resistance recumbent bike or brisk continuous walking on level treadmill to condition the left ventricle in low-to-moderate risk prehab candidates.',
    clinicalObjective: 'Enhances VO2 peak and increases pre-operative functional cardiopulmonary capacity.',
    contraindications: 'Stop immediately if systolic BP feels surging or heart rate exceeds 115 bpm.',
    posturePoints: [
      'Keep grip light on handlebars or keep arms swinging naturally at sides.',
      'Maintain smooth, even pedal/cadence stroke without jerking knees.',
      'Stay well-hydrated throughout session.'
    ],
    referenceThumbnail: '🚴',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bella_walking_away_%2851616016144%29.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Cardiopulmonary Aerobic Conditioning'
  },
  {
    id: 'ex-continuous-resistance',
    title: 'Continuous Walking & Mild Resistance (Model Protocol 3)',
    cardioIntensity: 'Moderate (50–60% HRR)',
    durationMinutes: 20,
    targetCadence: 'Continuous rhythmic pacing',
    rpeScale: 'RPE 12 - 13 (Somewhat Hard)',
    description: 'Sustained endurance walking paired with light resistance bands for prehab conditioning in patients with favorable functional reserve.',
    clinicalObjective: 'Builds musculoskeletal endurance and maximizes oxygen delivery prior to elective procedure.',
    contraindications: 'Contraindicated if angina is active or patient has decompensated heart failure.',
    posturePoints: [
      'Ensure continuous diaphragmatic breathing; never perform Valsalva.',
      'Step with full heel strike and smooth push-off from forefoot.',
      'Take 1-minute walking break every 7 minutes if needed.'
    ],
    referenceThumbnail: '🏃',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bella_walking_away_%2851616016144%29.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Continuous Conditioning Protocol'
  },
  {
    id: 'ex-sit-stand',
    title: 'Supported Chair Sit-to-Stand (REHAB24-6 Squat)',
    cardioIntensity: 'Low Intensity',
    durationMinutes: 6,
    targetCadence: '8 - 10 smooth reps per set',
    rpeScale: 'RPE 10 - 11 (Light)',
    description: 'Controlled standing and sitting from a sturdy chair. Activates the calf muscle pump and quadriceps to prevent peripheral venous pooling and orthostatic hypotension.',
    clinicalObjective: 'Preserves lower-limb muscle mass and venous return critical for early post-operative mobilization.',
    contraindications: 'Avoid holding breath (Valsalva). Exhale smoothly while standing up.',
    posturePoints: [
      'Feet hip-width apart firmly planted on the floor.',
      'Push through the heels; keep chest lifted throughout the movement.',
      'Slow, controlled 3-second descent back to the chair without dropping.'
    ],
    referenceThumbnail: '🪑',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'CDC — 30-Second Chair Stand Test (Public Domain)'
  },
  {
    id: 'ex-arm-abduction',
    title: 'Bilateral Arm Abduction (REHAB24-6 Kinematics)',
    cardioIntensity: 'Gentle Mobility',
    durationMinutes: 5,
    targetCadence: '10 - 12 controlled reps',
    rpeScale: 'RPE 9 - 10 (Light)',
    description: 'Controlled lateral arm raising up to shoulder height (90°). Validated by REHAB24-6 kinematics to mobilize the shoulder girdle and intercostal musculature without elevating intrathoracic pressure.',
    clinicalObjective: 'Prevents post-sternotomy pectoral tightness and facilitates deeper tidal volumes.',
    contraindications: 'Do not raise arms beyond 90° if shoulder pain occurs.',
    posturePoints: [
      'Stand tall or sit upright with shoulders rolled down.',
      'Lift arms out to sides in smooth 3-second motion.',
      'Exhale on the raise, inhale while lowering.'
    ],
    referenceThumbnail: '🙆‍♂️',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'REHAB24-6 Upper Limb Mobility'
  },
  {
    id: 'ex-arm-vw',
    title: 'Thoracic V-to-W Retraction (REHAB24-6 Kinematics)',
    cardioIntensity: 'Gentle Mobility',
    durationMinutes: 5,
    targetCadence: '8 - 10 smooth reps',
    rpeScale: 'RPE 9 - 10 (Light)',
    description: 'Raising arms into a "V" shape and pulling elbows back down into a "W". Stimulates rhomboid and lower trapezius activation to combat slumped posture and pulmonary atelectasis.',
    clinicalObjective: 'Corrects forward slump posture common in desk workers and expands lung volume.',
    contraindications: 'Avoid hyper-extending the lower back (maintain neutral spine).',
    posturePoints: [
      'Gently squeeze shoulder blades together at the bottom of the "W".',
      'Keep chin tucked and neck elongated.',
      'Pause for 1 second in contraction.'
    ],
    referenceThumbnail: '👐',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Thoracic Posture Alignment'
  },
  {
    id: 'ex-wall-pushup',
    title: 'Supported Wall Push-Up (REHAB24-6 Push-Up)',
    cardioIntensity: 'Low Intensity',
    durationMinutes: 6,
    targetCadence: '8 - 10 controlled reps',
    rpeScale: 'RPE 10 - 11 (Light)',
    description: 'Incline push-up against a secure wall. Delivers gentle pectoralis and triceps conditioning with negligible cardiovascular strain.',
    clinicalObjective: 'Builds upper-body pushing strength needed for bed mobility and chair exit post-surgery.',
    contraindications: 'Avoid locking elbows at top or letting lower back sag.',
    posturePoints: [
      'Hands flat on wall shoulder-width apart at chest height.',
      'Body forms a straight line from heels to head.',
      'Lower chest toward wall under control; exhale while pressing away.'
    ],
    referenceThumbnail: '🧗',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Incline Wall Push-Up'
  },
  {
    id: 'ex-leg-abduction',
    title: 'Supported Side Leg Abduction (REHAB24-6 Leg Abduction)',
    cardioIntensity: 'Low Intensity',
    durationMinutes: 5,
    targetCadence: '8 - 10 reps per leg',
    rpeScale: 'RPE 10 - 11 (Light)',
    description: 'Standing sideways while holding a chair for balance, lifting one leg outward smoothly. Targets the gluteus medius for pelvis stabilization and walking balance.',
    clinicalObjective: 'Prevents Trendelenburg gait and stabilizes hip mechanics during cardiac walking protocols.',
    contraindications: 'Keep supporting knee softly unlocked; do not tilt torso sideways.',
    posturePoints: [
      'Hold sturdy chair with both hands if needed for balance.',
      'Toes point forward (not turned outward).',
      'Smooth 2-second lift, 2-second lowering.'
    ],
    referenceThumbnail: '🦵',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'Hip Abductor Stabilization'
  },
  {
    id: 'ex-ankle-breathing',
    title: 'Seated Calf Pumps & Thoracic Expansion',
    cardioIntensity: 'Gentle Mobility',
    durationMinutes: 5,
    targetCadence: '15 - 20 pumps per minute',
    rpeScale: 'RPE 8 - 9 (Very Light)',
    description: 'Gentle seated ankle dorsiflexion and deep lateral rib expansion. Suitable for low-energy days or high-fatigue states to stimulate circulation without cardiac expenditure.',
    clinicalObjective: 'Stimulates peripheral blood flow, decreases DVT risk, and expands atelectatic lung bases.',
    contraindications: 'Perform seated; stop if calf cramping occurs.',
    posturePoints: [
      'Sit tall with lumbar spine supported against the chair back.',
      'Flex and point toes fully through complete ankle range of motion.',
      'Synchronize deep diaphragmatic inhalations with arm elevation.'
    ],
    referenceThumbnail: '🧘',
    referenceVideoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm',
    referenceVideoType: 'video/webm',
    referenceVideoLabel: 'CDC — Chair & Seated Mobility Demo (Public Domain)'
  }
];

export function createDefaultPatient(): PatientProfile {
  return {
    id: `P-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    age: 50,
    gender: 'Male',
    bmi: 26.0,
    heightCm: 170,
    weightKg: 75,
    occupation: '',
    sittingHours: 6.0,
    activityLevel: 'Sedentary',
    walkingMinutes: 10,
    cigarettesPerDay: 0,
    sleepHours: 7.0,
    consecutiveLowSleepDays: 0,
    stressScore: 5.0,
    consecutiveHighStressDays: 0,
    predictedRiskScore: 0.50,
    riskCategory: 'MODERATE',
    riskTrajectory: 'Stable',
    surgicalTimelineDays: 30,
    procedureType: 'Elective Cardiac Surgery',
    sodiumMg: 2400,
    totalFatG: 70,
    sugarG: 45,
    calories: 2100,
    dietPattern: 'Sri Lankan Traditional',
  };
}

export const DEFAULT_PATIENTS: PatientProfile[] = [];


export function calculatePatientRisk(patient: Partial<PatientProfile>): {
  score: number;
  category: 'HIGH' | 'MODERATE' | 'LOW';
  trajectory: 'Increasing' | 'Stable' | 'Decreasing';
} {
  let risk = 0.20; // baseline

  if ((patient.bmi || 25) > 30) risk += 0.18;
  else if ((patient.bmi || 25) > 27) risk += 0.10;

  if ((patient.sittingHours || 0) >= 9) risk += 0.14;
  else if ((patient.sittingHours || 0) >= 7) risk += 0.08;

  if ((patient.cigarettesPerDay || 0) >= 10) risk += 0.22;
  else if ((patient.cigarettesPerDay || 0) > 0) risk += 0.15;

  if ((patient.sleepHours || 7) < 5) risk += 0.16;
  else if ((patient.sleepHours || 7) < 6) risk += 0.08;

  if ((patient.stressScore || 5) >= 8) risk += 0.15;
  else if ((patient.stressScore || 5) >= 6) risk += 0.08;

  const score = Math.min(0.95, Math.max(0.15, Math.round(risk * 100) / 100));
  const category = score >= 0.70 ? 'HIGH' : score >= 0.45 ? 'MODERATE' : 'LOW';
  const trajectory = score >= 0.65 ? 'Increasing' : score >= 0.40 ? 'Stable' : 'Decreasing';

  return { score, category, trajectory };
}

export function generateDailyPriorities(patient: PatientProfile): DailyPriorityAction[] {
  const actions: DailyPriorityAction[] = [];

  // Prioritize based on patient's specific risk points:
  if (patient.sleepHours < 5.5) {
    actions.push({
      id: 'act-sleep',
      domain: 'Sleep',
      priorityNumber: 1,
      title: 'Sleep Restorative Protocol: Screens off by 9:30 PM & in bed before 10:00 PM',
      description: `Logged only ${patient.sleepHours}h of sleep. Re-establishing nocturnal dipping protects blood pressure and prevents heart strain.`,
      targetMetric: 'Target: ≥ 7.0 hrs uninterrupted sleep',
      clinicalRationale: 'Deep nocturnal rest promotes coronary artery relaxation and reduces daytime cardiac workload.',
      status: 'pending'
    });
  }

  if (patient.cigarettesPerDay > 0) {
    const targetCigs = Math.max(0, patient.cigarettesPerDay - 2);
    actions.push({
      id: 'act-smoking',
      domain: 'Smoking',
      priorityNumber: (actions.length + 1) as 1 | 2 | 3,
      title: `Nicotine Reduction Target: Cap smoking at maximum ${targetCigs} cigarettes today`,
      description: `Current baseline is ${patient.cigarettesPerDay} cigarettes/day. Gradual step-down preserves blood vessel elasticity prior to ${patient.procedureType || 'surgery'}.`,
      targetMetric: `Today's Limit: ≤ ${targetCigs} cigarettes (25% reduction)`,
      clinicalRationale: 'Within 24 hours of cutting cigarettes, blood oxygen carrying capacity rises by over 12%.',
      status: 'pending'
    });
  }

  // Exercise / Activity Action
  const walkMinutes = patient.sittingHours > 8 ? 10 : 15;
  actions.push({
    id: 'act-exercise',
    domain: 'Exercise',
    priorityNumber: (actions.length + 1) as 1 | 2 | 3,
    title: `Gentle Post-Meal Walking: ${walkMinutes} minutes at comfortable cadence`,
    description: `Combats ${patient.sittingHours} hours of sitting. Smooth, low-intensity pace without breathlessness.`,
    targetMetric: `Duration: ${walkMinutes} mins (RPE ≤ 11 - Fairly Light)`,
    clinicalRationale: 'Blunts post-meal glucose spikes and enhances coronary collateral blood flow safely.',
    status: 'pending'
  });

  // Nutrition Action
  if (actions.length < 3) {
    actions.push({
      id: 'act-diet',
      domain: 'Diet',
      priorityNumber: (actions.length + 1) as 1 | 2 | 3,
      title: 'Heart-Healthy Hydration: Swap sugary drinks for natural King Coconut Water (Thambili)',
      description: 'Provides heart-soothing potassium (290mg) and eliminates unnecessary sugar loads that stiffen arteries.',
      targetMetric: 'Target: 0 sugary beverages + 1 fresh Thambili + 2L water',
      clinicalRationale: 'High dietary potassium counterbalances arterial tension and maintains smooth vascular function.',
      status: 'pending'
    });
  }

  return actions.slice(0, 3);
}

export const SRI_LANKAN_FOODS: SriLankanFoodItem[] = [
  {
    id: 'sl-1',
    name: 'King Coconut Water',
    sinhalaName: 'තැඹිලි (Thambili)',
    category: 'Beverage',
    calories: 45,
    sodiumMg: 25,
    totalFatG: 0.1,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Pure bioavailable potassium (290mg), low glycemic index, lowers vascular resistance.'
  },
  {
    id: 'sl-2',
    name: 'Malu Ambul Thiyal',
    sinhalaName: 'මාළු ඇඹුල් තියල්',
    category: 'Curry / Sambol',
    calories: 145,
    sodiumMg: 180,
    totalFatG: 3.2,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Tuna/Goraka rich in Omega-3 fatty acids and hydroxycitric acid; heart-friendly without coconut cream.'
  },
  {
    id: 'sl-3',
    name: 'Gotukola Sambol',
    sinhalaName: 'ගොටුකොළ සම්බෝල',
    category: 'Curry / Sambol',
    calories: 68,
    sodiumMg: 75,
    totalFatG: 2.1,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Centella asiatica bioactive triterpenoids improve microcirculation and reduce oxidative arterial stress.'
  },
  {
    id: 'sl-4',
    name: 'Red Raw Rice (Rathu Kakulu)',
    sinhalaName: 'රතු කැකුළු බත්',
    category: 'Staple',
    calories: 185,
    sodiumMg: 5,
    totalFatG: 1.2,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    swapTarget: 'White Polished Samba Rice',
    reason: 'High bran fiber slows carbohydrate absorption and prevents sharp glycemic surges.'
  },
  {
    id: 'sl-5',
    name: 'Karapincha (Curry Leaf) Kenda',
    sinhalaName: 'කරපිංචා කැඳ',
    category: 'Beverage',
    calories: 90,
    sodiumMg: 40,
    totalFatG: 1.0,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Mahanimbine alkaloids support healthy blood lipid levels and arterial flexibility.'
  },
  {
    id: 'sl-6',
    name: 'Deep Fried Beef / Mutton Roll',
    sinhalaName: 'රෝල්ස් (Short Eats)',
    category: 'Snack',
    calories: 320,
    sodiumMg: 680,
    totalFatG: 18.5,
    transFatG: 1.8,
    cardioImpact: 'RESTRICTED',
    swapTarget: 'Gotukola Kenda or Steamed Dhal Patty',
    reason: 'High trans-fat from reused cooking oil spikes coronary inflammation and plaque instability.'
  },
  {
    id: 'sl-7',
    name: 'Sweet Carbonated Cola (330ml)',
    sinhalaName: 'පැණි බීම',
    category: 'Beverage',
    calories: 140,
    sodiumMg: 45,
    totalFatG: 0,
    transFatG: 0,
    cardioImpact: 'RESTRICTED',
    swapTarget: 'King Coconut Water (Thambili)',
    reason: '39 grams of simple syrup induces acute endothelial dysfunction and transient blood pressure spike.'
  },
  {
    id: 'sl-8',
    name: 'Dhal (Parippu) Curry with Thin Milk',
    sinhalaName: 'පරිප්පු හොදි (දිය කිරි)',
    category: 'Curry / Sambol',
    calories: 130,
    sodiumMg: 120,
    totalFatG: 2.5,
    transFatG: 0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Plant protein, folate, and soluble fiber with light coconut milk formulation.'
  }
];

export const MOTION_REP_FRAMES: MotionRepFrame[] = [
  {
    repNumber: 1,
    frameIndex: 24,
    confidenceScore: 0.96,
    confidenceLabel: 'Optimal Camera Clarity (96%)',
    keyJoints: { kneeAngle: 89, spineAngle: 8, focusJoint: 'Knee & Hip Alignment' },
    formState: 'CORRECT',
    fatigueIndex: 0.12,
    fatigueStatus: 'NORMAL'
  },
  {
    repNumber: 2,
    frameIndex: 48,
    confidenceScore: 0.95,
    confidenceLabel: 'Optimal Camera Clarity (95%)',
    keyJoints: { kneeAngle: 88, spineAngle: 9, focusJoint: 'Knee & Hip Alignment' },
    formState: 'CORRECT',
    fatigueIndex: 0.22,
    fatigueStatus: 'NORMAL'
  },
  {
    repNumber: 3,
    frameIndex: 72,
    confidenceScore: 0.93,
    confidenceLabel: 'Optimal Camera Clarity (93%)',
    keyJoints: { kneeAngle: 85, spineAngle: 11, focusJoint: 'Knee Alignment' },
    formState: 'CORRECT',
    fatigueIndex: 0.38,
    fatigueStatus: 'NORMAL'
  },
  {
    repNumber: 4,
    frameIndex: 96,
    confidenceScore: 0.89,
    confidenceLabel: 'Moderate Clarity (89%)',
    keyJoints: { kneeAngle: 78, spineAngle: 17, focusJoint: 'Spinal Posture' },
    formState: 'EXCESS FORWARD LEAN',
    fatigueIndex: 0.64,
    fatigueStatus: 'ELEVATED'
  },
  {
    repNumber: 5,
    frameIndex: 120,
    confidenceScore: 0.84,
    confidenceLabel: 'Acceptable Clarity (84%)',
    keyJoints: { kneeAngle: 72, spineAngle: 22, focusJoint: 'Knee & Spine Stress' },
    formState: 'VALGUS DETECTED',
    fatigueIndex: 0.79,
    fatigueStatus: 'CRITICAL (STOP NOW)'
  }
];
