const { useState, useEffect } = React;

// --- MOCK CLINICAL DATA FOR MODULE 2 ---
const PATIENT_NIMAL = {
  id: 'P-322-NIMAL',
  name: 'Nimal Jayasuriya',
  age: 48,
  gender: 'Male',
  bmi: 31.2,
  occupation: 'Senior Accounts Officer (Sedentary Desk Job)',
  sittingHours: 9.5,
  cigarettesPerDay: 8,
  sleepHours: 4.2,
  consecutiveLowSleepDays: 3,
  stressScore: 8.4,
  consecutiveHighStressDays: 5,
  predictedRiskScore: 0.81,
  riskCategory: 'HIGH',
  riskTrajectory: 'Increasing',
  surgicalTimelineDays: 24,
};

const INITIAL_PRIORITIES = [
  {
    id: 'act-1',
    domain: 'Sleep',
    priorityNumber: 1,
    actionText: 'Screen off at 9:30 PM & sleep strictly before 10:00 PM',
    clinicalReason: '4.2h sleep detected for 3 consecutive nights. Myocardial ischemia risk spikes by 48% with chronic nocturnal hypertension.',
    targetMetric: 'Target: >= 7.0 hrs (Goal: 10:00 PM - 5:30 AM)',
    status: 'pending',
  },
  {
    id: 'act-2',
    domain: 'Exercise',
    priorityNumber: 2,
    actionText: 'Brisk 10-minute flat walk after dinner (Low-intensity)',
    clinicalReason: 'Postprandial glycemic surge mitigation. Random forest prescriber selected 10 min low-intensity cardiac rehab protocol.',
    targetMetric: 'Duration: 10 mins (Pacing: 80-95 steps/min, RPE <= 11)',
    status: 'pending',
  },
  {
    id: 'act-3',
    domain: 'Diet',
    priorityNumber: 3,
    actionText: 'Substitute Cola & Soda with fresh King Coconut Water (Thambili)',
    clinicalReason: 'Eliminates 39g simple fructose syrup and supplies 290mg heart-calming bioavailable potassium.',
    targetMetric: 'Target: 0 Sugary sodas, 1 Thambili + 2L water',
    status: 'pending',
  },
];

const SRI_LANKAN_FOODS = [
  {
    id: 'slf-01',
    name: 'King Coconut Water (Thambili)',
    sinhalaName: 'තැඹිලි වතුර',
    category: 'Beverage',
    calories: 42,
    sodiumMg: 25,
    totalFatG: 0.2,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Natural hypotensive electrolyte drink, zero cholesterol, rich in magnesium and potassium.',
  },
  {
    id: 'slf-02',
    name: 'Industrial Cola / Fizzy Soda',
    sinhalaName: 'පැණිබීම / කෝලා',
    category: 'Beverage',
    calories: 140,
    sodiumMg: 45,
    totalFatG: 0.0,
    transFatG: 0.0,
    cardioImpact: 'RESTRICTED',
    swapTarget: 'King Coconut Water (Thambili) or Lemon Mint Infusion',
    reason: 'Causes endothelial oxidative stress and acute blood pressure spikes.',
  },
  {
    id: 'slf-03',
    name: 'Malu Ambul Thiyal (Sour Fish Curry)',
    sinhalaName: 'මාළු ඇඹුල් තියල්',
    category: 'Curry / Sambol',
    calories: 165,
    sodiumMg: 280,
    totalFatG: 4.5,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Goraka delivers hydroxycitric acid; Seer/Tuna supplies cardioprotective Omega-3 EPA/DHA without oil frying.',
  },
  {
    id: 'slf-04',
    name: 'Deep-Fried Seer Fish Cutlet / Slices',
    sinhalaName: 'බැදපු මාළු / කට්ලට්',
    category: 'Curry / Sambol',
    calories: 345,
    sodiumMg: 710,
    totalFatG: 22.0,
    transFatG: 2.1,
    cardioImpact: 'RESTRICTED',
    swapTarget: 'Malu Ambul Thiyal or Banana Leaf Steamed Seer Fish',
    reason: 'Re-used vegetable oils produce inflammatory lipid peroxides and arterial plaque formation.',
  },
  {
    id: 'slf-05',
    name: 'Gotukola Sambol (Centella Asiatica)',
    sinhalaName: 'ගොටුකොළ සම්බෝල',
    category: 'Curry / Sambol',
    calories: 68,
    sodiumMg: 85,
    totalFatG: 3.2,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'High triterpenoid saponins enhance microcirculatory venous compliance and vascular elasticity.',
  },
  {
    id: 'slf-06',
    name: 'Green Gram (Mung Bean) with Grated Coconut',
    sinhalaName: 'මුං ඇට තැම්බුම',
    category: 'Staple',
    calories: 215,
    sodiumMg: 15,
    totalFatG: 3.8,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Soluble dietary fibers lower low-density lipoprotein (LDL-C) and stabilize pre-surgery fasting glucose.',
  },
  {
    id: 'slf-07',
    name: 'Red Rice String Hoppers (Idiyappam)',
    sinhalaName: 'රතු ඉඳිආප්ප',
    category: 'Staple',
    calories: 190,
    sodiumMg: 35,
    totalFatG: 0.8,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'Unpolished wholegrain red raw rice flour prevents insulin spikes and coronary plaque inflammation.',
  },
  {
    id: 'slf-08',
    name: 'Parippu (Sri Lankan Red Dhal Curry)',
    sinhalaName: 'පරිප්පු කරිය',
    category: 'Curry / Sambol',
    calories: 145,
    sodiumMg: 180,
    totalFatG: 3.5,
    transFatG: 0.0,
    cardioImpact: 'PROTECTIVE',
    reason: 'High plant protein and potassium spiced with turmeric curcumin to mitigate vascular inflammation.',
  }
];

const CACJAT_REPS = [
  {
    repNumber: 1,
    frameIndex: 24,
    confidenceScore: 0.96,
    keyJoints: { kneeAngle: 89, spineAngle: 178, attentionWeight: 'HIGH' },
    formState: 'CORRECT',
    fatigueIndex: 0.12,
    fatigueStatus: 'NORMAL',
  },
  {
    repNumber: 2,
    frameIndex: 78,
    confidenceScore: 0.94,
    keyJoints: { kneeAngle: 91, spineAngle: 176, attentionWeight: 'HIGH' },
    formState: 'CORRECT',
    fatigueIndex: 0.24,
    fatigueStatus: 'NORMAL',
  },
  {
    repNumber: 3,
    frameIndex: 135,
    confidenceScore: 0.22,
    keyJoints: { kneeAngle: 86, spineAngle: 168, attentionWeight: 'HIGH' },
    formState: 'VALGUS DETECTED',
    fatigueIndex: 0.45,
    fatigueStatus: 'ELEVATED',
  },
  {
    repNumber: 4,
    frameIndex: 192,
    confidenceScore: 0.91,
    keyJoints: { kneeAngle: 78, spineAngle: 154, attentionWeight: 'HIGH' },
    formState: 'EXCESS FORWARD LEAN',
    fatigueIndex: 0.76,
    fatigueStatus: 'CRITICAL (STOP NOW)',
  },
  {
    repNumber: 5,
    frameIndex: 240,
    confidenceScore: 0.92,
    keyJoints: { kneeAngle: 72, spineAngle: 148, attentionWeight: 'HIGH' },
    formState: 'EXCESS FORWARD LEAN',
    fatigueIndex: 0.89,
    fatigueStatus: 'CRITICAL (STOP NOW)',
  },
];

// --- MAIN APP COMPONENT ---
function App() {
  const [patient, setPatient] = useState(PATIENT_NIMAL);
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  // CA-CJAT Studio State
  const [selectedRepIdx, setSelectedRepIdx] = useState(0);
  const [isSimulatingCacjat, setIsSimulatingCacjat] = useState(false);
  const currentRep = CACJAT_REPS[selectedRepIdx];

  // Diet Search State
  const [dietSearch, setDietSearch] = useState('');
  const [dietCategory, setDietCategory] = useState('All');

  // Box Breathing State
  const [breathingPhase, setBreathingPhase] = useState('INHALE');
  const [breathingCount, setBreathingCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [completedBreaths, setCompletedBreaths] = useState(0);

  // Smoking Craving State
  const [cravingTimer, setCravingTimer] = useState(180);
  const [isCravingActive, setIsCravingActive] = useState(false);
  const [selectedSmokingWeek, setSelectedSmokingWeek] = useState(1);

  // Box Breathing Timer Effect
  useEffect(() => {
    let t;
    if (isBreathingActive) {
      t = setInterval(() => {
        setBreathingCount((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'INHALE') {
              setBreathingPhase('HOLD');
              return 4;
            } else if (breathingPhase === 'HOLD') {
              setBreathingPhase('EXHALE');
              return 4;
            } else {
              setBreathingPhase('INHALE');
              setCompletedBreaths((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isBreathingActive, breathingPhase]);

  // Craving Timer Effect
  useEffect(() => {
    let t;
    if (isCravingActive) {
      t = setInterval(() => {
        setCravingTimer((prev) => {
          if (prev <= 1) {
            clearInterval(t);
            setIsCravingActive(false);
            return 180;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isCravingActive]);

  // DQN Reinforcement Learning Feedback Handler
  const handleFeedback = (actionId, status) => {
    setPriorities((prev) =>
      prev.map((item) => {
        if (item.id === actionId) {
          let reward = 0;
          let adapted = '';
          if (status === 'done') {
            reward = 1.0;
            if (item.domain === 'Exercise') adapted = 'Progressive target tomorrow: 12 min walking (RPE 11)';
            else if (item.domain === 'Sleep') adapted = 'Sleep target maintained: Lights out strictly at 10:00 PM';
            else adapted = 'Diet goal maintained: Continue Thambili hydration + 0 sodas';
          } else if (status === 'too_hard') {
            reward = -1.0;
            if (item.domain === 'Exercise') adapted = 'DQN Reduced Load: Walk 3 minutes flat terrain (Cardiac Protection Threshold)';
            else if (item.domain === 'Sleep') adapted = 'Adjust bedtime to 10:15 PM with 10 min relaxing breathing audio';
            else adapted = 'Start with 50/50 dilution of fresh lime water before full coconut water';
          } else {
            reward = -0.5;
            adapted = 'Task shifted to tomorrow afternoon at lower initial intensity';
          }
          return {
            ...item,
            status,
            dqnReward: reward,
            adaptedNextDay: adapted,
          };
        }
        return item;
      })
    );
  };

  const runCacjatSimulation = () => {
    setIsSimulatingCacjat(true);
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % CACJAT_REPS.length;
      setSelectedRepIdx(step);
      if (step === CACJAT_REPS.length - 1) {
        clearInterval(interval);
        setIsSimulatingCacjat(false);
      }
    }, 1400);
  };

  const filteredFoods = SRI_LANKAN_FOODS.filter((f) => {
    const matchQ = f.name.toLowerCase().includes(dietSearch.toLowerCase()) || f.sinhalaName.includes(dietSearch);
    const matchC = dietCategory === 'All' || f.category === dietCategory;
    return matchQ && matchC;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-900/40">
              <span className="text-xl">🫀</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-white sm:text-lg">CVD PreHab Coach</span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                  Module 2
                </span>
                <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 md:inline-flex">
                  SDG 3: Good Health
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Project J26-IT-322 • Adaptive Pre-Surgery Cardiac Rehabilitation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
            {[
              { id: 'dashboard', label: 'Daily Coach & DQN', icon: '⚡' },
              { id: 'exercise', label: 'CA-CJAT Video AI', icon: '🏃' },
              { id: 'diet', label: 'Sri Lankan Diet', icon: '🥥' },
              { id: 'sleep-stress', label: 'Sleep & Stress', icon: '🌙' },
              { id: 'smoking', label: 'Smoking Taper', icon: '🚭' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDoctorModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Clinical Flag (1)</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden overflow-x-auto border-t border-slate-800 px-3 py-2 space-x-1">
          {[
            { id: 'dashboard', label: 'Daily Coach', icon: '⚡' },
            { id: 'exercise', label: 'CA-CJAT AI', icon: '🏃' },
            { id: 'diet', label: 'SL Diet', icon: '🥥' },
            { id: 'sleep-stress', label: 'Sleep/Stress', icon: '🌙' },
            { id: 'smoking', label: 'Smoking', icon: '🚭' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                activeTab === tab.id ? 'bg-rose-500 text-white' : 'text-slate-300 bg-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* PATIENT HEADER BANNER */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-2xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start space-x-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-xl font-bold text-white border border-slate-700 shadow-inner">
                <span>NJ</span>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-2 ring-slate-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">{patient.name}</h1>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300 border border-slate-700">
                    {patient.id}
                  </span>
                  <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
                    Pre-Surgery High-Risk CVD
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {patient.age} yrs • Male • BMI {patient.bmi} • {patient.occupation} • Sits {patient.sittingHours}h/day
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center space-x-1.5 rounded-md bg-red-950/60 px-2 py-1 text-red-300 border border-red-800/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping"></span>
                    <span>Sleep &lt; 5h for {patient.consecutiveLowSleepDays} days: High Ischemia Risk</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 rounded-md bg-amber-950/60 px-2 py-1 text-amber-300 border border-amber-800/50">
                    <span>⚠️ Stress {patient.stressScore}/10 for {patient.consecutiveHighStressDays} days: Sympathetic Overdrive</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Risk & Timeline Badges */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
              <div className="border-r border-slate-800 pr-4">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Module 2 CVD Risk
                </div>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-rose-400">
                    {(patient.predictedRiskScore * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-semibold text-rose-400">↑ {patient.riskTrajectory}</span>
                </div>
                <div className="text-[10px] text-slate-500">Weekly Recalibration</div>
              </div>

              <div className="border-r border-slate-800 pr-4">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Surgery Target
                </div>
                <div className="mt-1 text-lg font-bold text-slate-200">
                  {patient.surgicalTimelineDays} <span className="text-xs font-normal text-slate-400">Days</span>
                </div>
                <div className="text-[10px] text-emerald-400">Prehab Active</div>
              </div>

              <div className="max-w-[190px]">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Primary Goal
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-snug">
                  Reduce risk score so patient may defer or tolerate surgery better.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: DAILY DASHBOARD & DQN */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top 3 Priorities Card with DQN Buttons */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold text-white">
                      3
                    </span>
                    <h2 className="text-lg font-bold text-white">Today's Top 3 Priority Prescriptions</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Ranked by XGBoost + LightGBM Ensemble based on Module 2 CVD Risk & Lifestyle Biomarkers
                  </p>
                </div>
                <div className="flex items-center space-x-2 rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-mono text-emerald-400">DQN Adaptive Loop: Online</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {priorities.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      item.status === 'done'
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : item.status === 'too_hard'
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : item.status === 'skipped'
                        ? 'border-slate-700 bg-slate-950/40 opacity-70'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-sm font-bold text-slate-200 border border-slate-700">
                          P{item.priorityNumber}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
                              {item.domain}
                            </span>
                            <h3 className="text-sm font-semibold text-white">{item.actionText}</h3>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                            {item.clinicalReason}
                          </p>
                          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-300 font-mono">
                            <span className="text-rose-400">⚡</span>
                            <span>{item.targetMetric}</span>
                          </div>

                          {/* Dynamic DQN Adaptation Result */}
                          {item.adaptedNextDay && (
                            <div className="mt-3 flex items-center space-x-2 rounded-lg bg-slate-900 px-3 py-2 border border-indigo-500/30 text-xs">
                              <span className="text-indigo-400 font-bold">🤖 DQN Adapted Plan:</span>
                              <span className="text-slate-200">{item.adaptedNextDay}</span>
                              <span className="ml-auto rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                                Reward: {item.dqnReward > 0 ? `+${item.dqnReward}` : item.dqnReward}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Feedback Buttons */}
                      <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
                        <button
                          onClick={() => handleFeedback(item.id, 'done')}
                          className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            item.status === 'done'
                              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          <span>✓ Done</span>
                          <span className="text-[10px] opacity-75">(+1)</span>
                        </button>

                        <button
                          onClick={() => handleFeedback(item.id, 'too_hard')}
                          className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            item.status === 'too_hard'
                              ? 'bg-amber-500 text-white ring-2 ring-amber-400 shadow-lg shadow-amber-500/30'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          <span>⚡ Too Hard</span>
                          <span className="text-[10px] opacity-75">(-1)</span>
                        </button>

                        <button
                          onClick={() => handleFeedback(item.id, 'skipped')}
                          className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                            item.status === 'skipped'
                              ? 'bg-slate-700 text-white ring-2 ring-slate-500'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span>Skipped</span>
                          <span className="text-[10px] opacity-75">(-0.5)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400 flex items-start space-x-3">
                <span className="text-base">💡</span>
                <div>
                  <strong className="text-slate-200">DQN Adaptive Feedback Mechanism:</strong> Clicking <span className="text-amber-400">"Too Hard"</span> on the 10 min walk sends reward <span className="text-amber-400 font-mono">-1</span> to the DQN agent, scaling tomorrow's walking down to <span className="text-white font-semibold">3 minutes</span> to avoid cardiac overload. Once completed (<span className="text-emerald-400 font-semibold">+1</span>), it advances progressively to <span className="text-white font-semibold">7 min (Week 2)</span> and <span className="text-white font-semibold">20 min (Week 4)</span>.
                </div>
              </div>
            </div>

            {/* 5-Domain Quick Switcher Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { tab: 'exercise', icon: '🏃', title: 'Exercise & CA-CJAT', sub: 'Posture & Fatigue AI', status: '10m Walk • 82% Form', color: 'border-emerald-500/30' },
                { tab: 'sleep-stress', icon: '🌙', title: 'Sleep & Nocturnal BP', sub: 'Circadian Dipping', status: '4.2h (<5h Alert)', color: 'border-indigo-500/30' },
                { tab: 'sleep-stress', icon: '🧘', title: 'Stress & Breathing', sub: '4-4-4 Box Reset', status: 'Stress 8.4 (Flagged)', color: 'border-purple-500/30' },
                { tab: 'smoking', icon: '🚭', title: 'Smoking Taper', sub: 'Weekly Schedule', status: '8 ➔ 6 Cigs/Day', color: 'border-rose-500/30' },
                { tab: 'diet', icon: '🥥', title: 'Sri Lankan Diet', sub: '243 Food DB', status: 'Cola ➔ Thambili', color: 'border-amber-500/30' },
              ].map((c, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTab(c.tab)}
                  className={`cursor-pointer rounded-xl border ${c.color} bg-slate-900/80 p-4 transition-all hover:scale-[1.02] hover:bg-slate-900`}
                >
                  <div className="text-xl">{c.icon}</div>
                  <div className="mt-2 text-xs font-bold text-white">{c.title}</div>
                  <div className="text-[11px] text-slate-400">{c.sub}</div>
                  <div className="mt-3 text-[10px] font-mono font-semibold text-slate-300">{c.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CA-CJAT VIDEO AI STUDIO */}
        {activeTab === 'exercise' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                    <span>★ Genuine Technical Novelty</span>
                    <span>•</span>
                    <span>CA-CJAT Architecture</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
                    Confidence-Aware Clinical Joint Attention Transformer
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 max-w-3xl leading-relaxed">
                    Assesses CVD exercise quality, movement kinematics, and within-session physiological fatigue from patient-uploaded videos to prevent pre-surgery myocardial ischemia.
                  </p>
                </div>
                <button
                  onClick={runCacjatSimulation}
                  disabled={isSimulatingCacjat}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
                    isSimulatingCacjat ? 'bg-slate-700' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 ring-2 ring-rose-400/50'
                  }`}
                >
                  {isSimulatingCacjat ? '⏳ Simulating Kinematics...' : '▶ Run Live CA-CJAT Video Analysis'}
                </button>
              </div>

              {/* 4 Pillars */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono text-rose-400 font-semibold">NOVELTY 1</div>
                  <div className="font-bold text-white mt-0.5">Confidence Weighting</div>
                  <div className="text-[11px] text-slate-400 mt-1">Filters low-confidence / blurry video frames automatically.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono text-indigo-400 font-semibold">NOVELTY 2</div>
                  <div className="font-bold text-white mt-0.5">Clinical Attention Bias B</div>
                  <div className="text-[11px] text-slate-400 mt-1">Matrix B tells AI to focus on Knee & Spine, not Wrists.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">NOVELTY 3</div>
                  <div className="font-bold text-white mt-0.5">Latent Fatigue State</div>
                  <div className="text-[11px] text-slate-400 mt-1">Tracks fatigue rep-by-rep; triggers STOP NOW alert.</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">NOVELTY 4</div>
                  <div className="font-bold text-white mt-0.5">Multi-Granularity</div>
                  <div className="text-[11px] text-slate-400 mt-1">Outputs simultaneous Rep, Set, and Session feedback.</div>
                </div>
              </div>
            </div>

            {/* Video Viewport & Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-white">MediaPipe Kinematics • Frame #{currentRep.frameIndex}</span>
                  <span className="text-xs text-slate-400 font-mono">cardiac_rehab_nimal.mp4</span>
                </div>

                <div className="relative mt-4 flex h-80 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  {/* SVG 2D Skeleton */}
                  <svg className="h-full w-full max-w-xs" viewBox="0 0 200 240">
                    <circle cx="100" cy="30" r="14" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="100" y1="44" x2="100" y2="120" stroke="#f43f5e" strokeWidth="4" />
                    <circle cx="100" cy="80" r="16" fill="#f43f5e" fillOpacity="0.15" />
                    <line x1="70" y1="58" x2="130" y2="58" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="70" y1="58" x2="55" y2="95" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="55" y1="95" x2="48" y2="130" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="130" y1="58" x2="145" y2="95" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="145" y1="95" x2="152" y2="130" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="82" y1="120" x2="118" y2="120" stroke="#f43f5e" strokeWidth="3" />
                    <line x1="85" y1="120" x2={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} y2="170" stroke="#f43f5e" strokeWidth="3.5" />
                    <circle cx={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} cy="170" r="6" fill="#f43f5e" />
                    <line x1={currentRep.keyJoints.kneeAngle < 85 ? '72' : '82'} y1="170" x2="80" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="115" y1="120" x2="118" y2="170" stroke="#f43f5e" strokeWidth="3" />
                    <circle cx="118" cy="170" r="5" fill="#f43f5e" />
                    <line x1="118" y1="170" x2="120" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                  </svg>

                  {/* Confidence Badge */}
                  <div className="absolute top-3 left-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Frame Confidence $c_t$</div>
                    <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-white">
                      <span>{(currentRep.confidenceScore * 100).toFixed(0)}%</span>
                      <span className={`text-[10px] ${currentRep.confidenceScore > 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentRep.confidenceScore > 0.5 ? '• Weight 1.0 (Learned)' : '• Filtered (Noise)'}
                      </span>
                    </div>
                  </div>

                  {/* Latent Fatigue State Badge */}
                  <div className="absolute top-3 right-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 backdrop-blur-md text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Latent Fatigue $z_t$</div>
                    <div className="text-xs font-bold font-mono text-rose-400">
                      {(currentRep.fatigueIndex * 100).toFixed(0)}% Index
                    </div>
                    <div className="text-[10px] font-semibold text-slate-300">
                      State: {currentRep.fatigueStatus}
                    </div>
                  </div>

                  {/* Critical STOP Alert */}
                  {currentRep.fatigueIndex > 0.7 && (
                    <div className="absolute bottom-3 inset-x-3 rounded-xl border border-red-600 bg-red-950/90 p-2.5 text-center backdrop-blur-md animate-pulse">
                      <div className="text-xs font-black uppercase tracking-wider text-red-200">
                        ⚠️ Cardiac Safety Alert: Latent Fatigue Critical ($z_t &gt; 0.75$)
                      </div>
                      <div className="text-[11px] text-red-300">
                        Form deterioration detected at Rep #{currentRep.repNumber}. Stop session now to prevent myocardial ischemia!
                      </div>
                    </div>
                  )}
                </div>

                {/* Rep Buttons */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Select Repetition:</span>
                  <div className="flex space-x-1.5">
                    {CACJAT_REPS.map((r, idx) => (
                      <button
                        key={r.repNumber}
                        onClick={() => setSelectedRepIdx(idx)}
                        className={`h-8 w-8 rounded-lg font-mono text-xs font-bold ${
                          selectedRepIdx === idx ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        R{r.repNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-Granularity Feedback Output */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <div className="text-xs font-bold text-white pb-2 border-b border-slate-800">
                    Level 1: Rep-Level Feedback (Rep #{currentRep.repNumber})
                  </div>
                  <div className="mt-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Biomechanical Form:</span>
                      <span className={currentRep.formState === 'CORRECT' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {currentRep.formState}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Knee Angle:</span>
                      <span className="font-mono text-slate-200">{currentRep.keyJoints.kneeAngle}° (Optimal: 90°)</span>
                    </div>
                    <div className="mt-2 rounded-lg bg-slate-950 p-2.5 text-slate-300">
                      <strong className="text-rose-400">AI Prompt: </strong>
                      {currentRep.formState === 'CORRECT'
                        ? 'Good gait alignment and pelvic stability. Maintain current rhythm.'
                        : 'Keep knees tracking over ankles; prevent inward knee collapse.'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <div className="text-xs font-bold text-white pb-2 border-b border-slate-800">
                    Level 2: Set-Level Pacing & Fatigue
                  </div>
                  <div className="mt-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Set Cadence:</span>
                      <span className="font-mono text-slate-200">86 steps/min (Cardiac Zone 1)</span>
                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Fatigue Index:</span>
                        <span>{(currentRep.fatigueIndex * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${currentRep.fatigueIndex * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <div className="text-xs font-bold text-white pb-2 border-b border-slate-800 flex justify-between">
                    <span>Level 3: Full Session Quality</span>
                    <span className="text-emerald-400 font-bold">82% Quality</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    First 3 reps demonstrated stable form. Last 2 reps showed compensatory fatigue. Prescription for tomorrow: Reduce set to 8 reps or 7 min brisk walk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SRI LANKAN DIET */}
        {activeTab === 'diet' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    <span>🥥 Cultural Nutrition AI</span>
                    <span>•</span>
                    <span>243 Sri Lankan Foods</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
                    Sri Lankan Cardioprotective Diet & Swaps
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Tailored for pre-surgery patients: eliminates trans fats and acute sodium loads while boosting natural hypotensive foods (Thambili, Malu Ambul Thiyal, Gotukola).
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs">
                  <span className="font-bold text-amber-300">Nimal's Priority Swap:</span>
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px] gap-2">
                    <span className="text-red-400 line-through">Cola (39g Sugar)</span>
                    <span>➔</span>
                    <span className="text-emerald-400 font-bold">King Coconut (Thambili)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search 243 Sri Lankan foods (English or Sinhala)..."
                  value={dietSearch}
                  onChange={(e) => setDietSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <div className="flex overflow-x-auto space-x-1.5">
                  {['All', 'Staple', 'Curry / Sambol', 'Beverage'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDietCategory(cat)}
                      className={`rounded-xl px-3 py-2 text-xs font-medium ${
                        dietCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFoods.map((f) => (
                <div
                  key={f.id}
                  className={`rounded-2xl border p-5 ${
                    f.cardioImpact === 'PROTECTIVE' ? 'border-emerald-500/30 bg-slate-900/90' : 'border-red-500/30 bg-slate-950/90'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        f.cardioImpact === 'PROTECTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {f.cardioImpact}
                      </span>
                      <h3 className="mt-2 text-sm font-bold text-white">{f.name}</h3>
                      <div className="text-xs text-amber-400/90">{f.sinhalaName}</div>
                    </div>
                    <span className="rounded-lg bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
                      {f.calories} kcal
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-2.5 text-center font-mono text-[11px] border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500">Sodium</div>
                      <div className={f.sodiumMg > 500 ? 'text-red-400 font-bold' : 'text-slate-200'}>{f.sodiumMg} mg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Total Fat</div>
                      <div className="text-slate-200">{f.totalFatG} g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Trans Fat</div>
                      <div className={f.transFatG > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{f.transFatG} g</div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 leading-relaxed">{f.reason}</p>

                  {f.swapTarget && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2 text-xs">
                      <span className="font-semibold text-amber-300">Heart Swap: </span>
                      <span className="text-slate-200">{f.swapTarget}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SLEEP & STRESS */}
        {activeTab === 'sleep-stress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep Box */}
            <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Sleep & Nocturnal Recovery</h3>
                  <p className="text-[11px] text-slate-400">Circadian BP Dipping Protocol</p>
                </div>
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                  High Ischemia Alert
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-slate-400">Logged Last Night</div>
                    <div className="text-3xl font-black text-rose-400 mt-1">{patient.sleepHours} hrs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono uppercase text-slate-400">Goal</div>
                    <div className="text-sm font-bold text-emerald-400">&gt;= 7.0 hrs</div>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(patient.sleepHours / 8) * 100}%` }}></div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-200">
                <strong>Alert:</strong> &lt; 5 hours sleep for {patient.consecutiveLowSleepDays} consecutive nights. Non-dipping nocturnal BP doubles perioperative arrhythmia vulnerability.
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <strong className="text-indigo-300">1. Phone off at 9:30 PM:</strong> Eliminates blue-light melatonin suppression.
                </div>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <strong className="text-indigo-300">2. Sleep before 10:00 PM:</strong> Synchronizes autonomic parasympathetic reset.
                </div>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <strong className="text-indigo-300">3. Cool Room (18-20°C):</strong> Facilitates vasodilation and deep REM cycles.
                </div>
              </div>
            </div>

            {/* Stress Box */}
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Stress & 4-4-4 Box Breathing</h3>
                  <p className="text-[11px] text-slate-400">Vagal Nerve Sympathetic Reset</p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  Stress: {patient.stressScore}/10
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border-2 border-purple-500/40 transition-all duration-1000 ${
                    isBreathingActive ? 'scale-110 shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'scale-95 opacity-40'
                  }`}></div>
                  <div className="text-center">
                    <div className="text-[10px] font-mono uppercase text-purple-300 font-bold">
                      {isBreathingActive ? breathingPhase : 'READY'}
                    </div>
                    <div className="text-3xl font-black text-white font-mono mt-0.5">
                      {isBreathingActive ? `${breathingCount}s` : '4s'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {completedBreaths > 0 ? `${completedBreaths} Cycles Done` : 'IN 4 • HOLD 4 • OUT 4'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className="mt-4 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500"
                >
                  {isBreathingActive ? '⏸ Pause Breathing Pacer' : '▶ Start 4-4-4 Box Breathing'}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-200">
                <strong>⚠️ Doctor Flag:</strong> Stress score &gt;= 8.0 for {patient.consecutiveHighStressDays} days (Threshold: 5 days reached). Elevated catecholamines increase rupture risk.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SMOKING TAPER */}
        {activeTab === 'smoking' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                    <span>🚭 Smoking Cessation AI</span>
                    <span>•</span>
                    <span>Calibrated Stage Classifier</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-white tracking-tight">
                    Pre-Surgery Nicotine Tapering & Arterial Healing
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Patient smokes {patient.cigarettesPerDay} cigs/day. Logistic regression detected <span className="text-amber-400 font-semibold">Preparation Stage</span>. Weekly tapering prevents severe withdrawal while restoring endothelial nitric oxide.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Goal for Day 24</div>
                  <div className="text-sm font-bold text-emerald-400">0 Cigarettes (Smoke-Free)</div>
                </div>
              </div>

              {/* 4-Week Schedule */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { w: 1, target: '8 ➔ 6 cigs/day', red: '25% cut', status: 'Active (Week 1)' },
                  { w: 2, target: '6 ➔ 4 cigs/day', red: '50% cut', status: 'Upcoming' },
                  { w: 3, target: '4 ➔ 2 cigs/day', red: '75% cut', status: 'Upcoming' },
                  { w: 4, target: '2 ➔ 0 cigs/day', red: '100% Smoke-Free', status: 'Pre-Surgery Goal' },
                ].map((s) => (
                  <div
                    key={s.w}
                    onClick={() => setSelectedSmokingWeek(s.w)}
                    className={`cursor-pointer rounded-xl border p-4 ${
                      selectedSmokingWeek === s.w ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Week {s.w}</span>
                      <span className={selectedSmokingWeek === s.w ? 'text-rose-400 font-bold' : 'text-slate-500'}>{s.status}</span>
                    </div>
                    <div className="mt-2 text-base font-extrabold text-white">{s.target}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.red}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Craving Surfing Tool */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
                  Interactive Craving-Surfing Tool (3-Minute Protocol)
                </h3>
                <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                  A nicotine craving peaks within 3 minutes and then drops naturally.
                </p>

                <div className="mt-4 rounded-xl bg-slate-950 p-4 border border-slate-800 text-center">
                  {isCravingActive ? (
                    <div>
                      <div className="text-3xl font-black font-mono text-rose-400">
                        {Math.floor(cravingTimer / 60)}:{(cravingTimer % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">Breathe deeply — ride the craving wave.</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCravingActive(true)}
                      className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-rose-400"
                    >
                      🌊 I Have a Craving Now (Start 3-Min Protocol)
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-rose-400 font-bold">1. Delay:</span> Wait 3 min.</div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-rose-400 font-bold">2. Deep Breathe:</span> 4s in, 4s out.</div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-rose-400 font-bold">3. Drink Water:</span> Sip cold water.</div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-rose-400 font-bold">4. Distract:</span> Take a quick walk.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
                  Pre-Surgery Arterial Recovery Milestones
                </h3>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold">24 Hours: </span>
                    <span className="text-slate-300">Blood carbon monoxide drops to zero; arterial O2 saturation reaches 98%.</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold">48 Hours: </span>
                    <span className="text-slate-300">Myocardial oxygen consumption drops; coronary vascular resistance falls by 18%.</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                    <span className="font-mono text-emerald-400 font-bold">2-3 Weeks: </span>
                    <span className="text-slate-300">Surgical wound healing capability doubles; sternal infection risk drops by 45%.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DOCTOR CLINICAL MODAL */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Cardiology Clinical Pre-Surgery Review</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3">
                <strong className="text-red-300">🚨 Alert 1: Severe Nocturnal Sleep Debt</strong>
                <p className="mt-1 text-slate-300">Logged &lt; 5h sleep for 3 days. Recommend checking for Obstructive Sleep Apnea (OSA) prior to anesthesia.</p>
              </div>
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
                <strong className="text-amber-300">⚠️ Alert 2: Sympathetic Stress Overdrive</strong>
                <p className="mt-1 text-slate-300">Stress score 8.4 for 5 days. Consider pre-op anxiolytic counseling or beta-blocker optimization.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-2">
              <button onClick={() => setIsDoctorModalOpen(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-300">Close</button>
              <button onClick={() => { alert('Exported summary for surgical team!'); setIsDoctorModalOpen(false); }} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white">Export Clinical Summary</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Project J26-IT-322 • Module 2: Personalised CVD Lifestyle Recommendation Engine & Adaptive Coaching • SDG 3
      </footer>
    </div>
  );
}

// Render root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
