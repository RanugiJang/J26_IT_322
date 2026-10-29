# Module 2 — Personalised CVD Lifestyle Recommendation Engine & Adaptive Coaching
**Pre-Surgery High-Risk CVD Patients | SDG 3 — Good Health & Well-being | Project J26-IT-322**

---

## 1. What is Module 2?

Module 2 is an AI-powered daily lifestyle coach for **high-risk cardiovascular disease (CVD) patients awaiting cardiac surgery**.

### Core Goal
Reduce cardiovascular risk score and improve physiological tolerance before surgery so that patients either experience lower operative morbidity or, through sustained adaptation, stabilize to the point where surgery can be deferred or avoided.

### 5 Lifestyle Domains
1. **Exercise**: Cardiac-safe walking / mobility prescription + CA-CJAT video posture and fatigue assessment.
2. **Sleep**: Nocturnal BP recovery tracking, sleep duration alerts (< 5h for 3+ days triggers clinical escalation), temperature and screen-off hygiene.
3. **Stress**: Sympathetic overdrive mitigation, 4-4-4 Box Breathing protocol, autogenic relaxation, doctor escalation flag if stress $\ge$ 8 for 5+ days.
4. **Smoking**: Stage-matched tapering (e.g. 8 $\rightarrow$ 6 $\rightarrow$ 4 $\rightarrow$ 2 $\rightarrow$ 0 cigs/day), craving-surfing protocols, and vascular damage awareness.
5. **Diet**: Cultural Sri Lankan dietary interventions (243-food database), salt and trans-fat elimination, and cardioprotective substitutions (Cola $\rightarrow$ King Coconut Water, Fried Fish $\rightarrow$ Malu Ambul Thiyal / Grilled fish, Gotukola Sambol, Green Gram, Dhal curry).

---

## 2. System Architecture & Workflow

```
                        +---------------------------------------------+
                        |   Patient Profile & Module 2 CVD Risk Score |
                        |     (Age, BMI, Smoking, Activity, Diet...)  |
                        +---------------------------------------------+
                                               |
                                               v
                        +---------------------------------------------+
                        |  Lifestyle Priority Ranking Engine          |
                        |      (XGBoost + LightGBM Ensemble)          |
                        |  Identifies top priority domains (95.7% Acc)|
                        +---------------------------------------------+
                                               |
                                               v
                        +---------------------------------------------+
                        |   Top 3 Personalised Daily Actions Output   |
                        |   1. Sleep before 10pm tonight              |
                        |   2. Walk 10 min after dinner               |
                        |   3. Cola -> King Coconut (Thambili)        |
                        +---------------------------------------------+
                                               |
                                               v
                        +---------------------------------------------+
                        |     Patient Daily Feedback Interaction      |
                        |        [ Done / Too Hard / Skipped ]        |
                        +---------------------------------------------+
                                               |
                                               v
                        +---------------------------------------------+
                        |   DQN Reinforcement Learning Adaptation     |
                        |   Reward: Done (+1), Too Hard (-1), Skip(-.5|
                        |   Adapts tomorrow's prescription            |
                        +---------------------------------------------+
```

---

## 3. Core Research Novelty: CA-CJAT Architecture

**Confidence-Aware Clinical Joint Attention Transformer with Latent Fatigue State for CVD Exercise Quality Assessment**

### Novelty 1 — Confidence-Weighted Frame Loss
Standard pose models treat blurry or low-lighting frames equally. CA-CJAT weights temporal loss by per-frame MediaPipe visibility confidence $c_t$:
$$\mathcal{L} = \sum_{t=1}^T c_t \cdot \ell(\hat{y}_t, y_t)$$

### Novelty 2 — Clinical Joint Attention Bias Matrix $B$
Standard multi-head attention gives equal initial weight to all joints. CA-CJAT introduces a clinical prior matrix $B$:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d}} + B\right)V$$
Where $B_{i, j} > 0$ for cardiovascular-critical joint interactions (knees, hips, trunk/spine expansion) and penalizes irrelevant peripheral joints.

### Novelty 3 — Latent Fatigue State Tracking (Within Session)
Tracks internal fatigue accumulation $z_{t+1}$ across successive exercise repetitions:
$$z_{t+1} = f_\theta(z_t, h_t)$$
If fatigue indices exceed cardiac safety thresholds, the system issues an immediate **STOP NOW** prompt to prevent myocardial ischemia.

### Novelty 4 — Multi-Granularity Feedback
Outputs simultaneous feedback at three clinical levels:
1. **Rep-level**: Specific biomechanical corrections (e.g., knee valgus, thoracic forward lean).
2. **Set-level**: Pacing stability and cardiovascular fatigue trend.
3. **Session-level**: Overall quality percentage (0–100%) and duration recommendation for tomorrow.

---

## 4. Machine Learning Models Summary

| Component | Model Architecture | Training Data | Role / Performance |
|---|---|---|---|
| **Lifestyle Priority Ranking** | XGBoost + LightGBM Ensemble | `Lifestyle_Model1.xlsx` (6,337 records) | **95.74% Accuracy** (F1: 0.953) — Ranks top 3 domains |
| **Smoking Stage Detection** | Calibrated Logistic Regression + Random Forest | `Smoking_Stage.xlsx` (9,015 records) | Stage detection & weekly tapering trajectory |
| **Exercise Prescription** | Random Forest Classifier | ACC/AHA & BACPR Cardiac Rehab Cohort | **96.80% Accuracy** — Prescribes safe type, duration & intensity |
| **Exercise Quality & Safety** | **CA-CJAT** (PyTorch Deep Attention Transformer) | Multi-joint kinematic sequences | Novel 4-feature architecture with multi-granularity feedback |
| **Adaptive Coaching Loop** | **DQN Reinforcement Learning** | Per-patient interaction trajectory | Online Q-learning adaptation based on feedback (+1 / -1) |

---

## 5. Directory Structure

```
module2/
├── config/                  <- Hyperparameters and clinical thresholds
├── data/
│   ├── Lifestyle_Model1.xlsx  <- 6,337 patient lifestyle records
│   ├── Smoking_Stage.xlsx     <- 9,015 smoking habit records
│   └── sri_lankan_foods.json  <- Curated 243 Sri Lankan food composition DB
├── models/
│   ├── ca_cjat_final.pth              <- Trained CA-CJAT transformer weights
│   ├── dqn_adaptive_exercise_final.pth<- Trained DQN adaptive agent weights
│   ├── exercise_prescriber.joblib     <- Random forest prescription model
│   ├── lifestyle_ranking_ensemble.joblib <- XGBoost + LightGBM ensemble
│   ├── model1_final.pkl               <- Compatible primary model package
│   └── smoking stage.pkl              <- Calibrated smoking stage classifier
├── reports/
│   ├── ca_cjat_report.json            <- CA-CJAT novelty evaluation metrics
│   ├── exercise_prescriber_report.json<- Exercise prescription feature importances
│   ├── lifestyle_ranking_report.json  <- 5-fold CV & confusion matrix
│   └── smoking_stage_report.json      <- Precision/recall across stages
├── src/
│   ├── domains/             <- 5 Lifestyle domain implementations
│   │   ├── diet.py          <- Sri Lankan cultural swaps & heart recipes
│   │   ├── exercise.py      <- Cardiac walking & CA-CJAT video handler
│   │   ├── sleep.py         <- Nocturnal recovery & <5h 3-day alert
│   │   ├── smoking.py       <- Weekly tapering & craving-surfing tips
│   │   └── stress.py        <- 4-4-4 Box Breathing & 5-day doctor flag
│   ├── models/              <- Model architectures and training pipelines
│   │   ├── ca_cjat.py       <- CA-CJAT PyTorch deep neural network
│   │   ├── dqn_agent.py     <- DQN reinforcement learning agent
│   │   ├── exercise_prescriber.py <- Random Forest prescriber
│   │   ├── train_lifestyle_ranking.py <- XGBoost+LightGBM trainer
│   │   └── train_smoking_stage.py     <- Smoking stage classifier trainer
│   └── pipeline/
│       └── lifestyle_engine.py <- End-to-end coach orchestrator
├── tests/
│   ├── test_domains.py      <- Unit tests for 5 lifestyle domains
│   └── test_models.py       <- Unit tests for ML models & CA-CJAT
└── requirements.txt
```

---

## 6. How to Run & Test

```powershell
# 1. Install dependencies
pip install -r module2/requirements.txt

# 2. Run all unit tests (9/9 passing)
python -m pytest module2/tests -v

# 3. Run the end-to-end coach pipeline (Demo with patient Nimal)
python -m module2.src.pipeline.lifestyle_engine
```
