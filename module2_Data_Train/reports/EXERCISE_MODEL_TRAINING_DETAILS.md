# Master Document: Exercise Models Training Details & Evaluation
## Project J26-IT-322: AI-Powered Lifestyle Recommendation & Adaptive Coaching (Module 2)
### Target Cohort: Pre-Surgery High-Risk Cardiovascular Disease (CVD) Patients | SDG 3

---

# 1. Executive Summary

This document consolidates **all training details, mathematical formulations, architectures, datasets, hyperparameters, and evaluation metrics** for the complete exercise machine learning, deep learning, and reinforcement learning pipeline within Module 2.

The exercise subsystem is engineered specifically for **high-risk cardiovascular disease (CVD) patients awaiting cardiac surgery (CABG, valve replacement)**. In this cohort, standard fitness regimens pose dangerous risks of myocardial ischemia, excessive Valsalva-induced blood pressure spikes, and dysrhythmias. The AI system delivers:
1. **Cardiac-Safe Prescription**: Baseline activity tailoring matched to patient risk, BMI, age, and sedentariness.
2. **Deep Attention Kinematic Quality (CA-CJAT)**: Novel Confidence-Aware Clinical Joint Attention Transformer for MediaPipe landmark sequences.
3. **Leave-One-Person-Out Exercise Repetition Quality (REHAB24-6 Benchmark)**: Evaluated strictly across held-out individuals.
4. **Adaptive Coaching Loop (DQN RL)**: Closed-loop daily exercise duration adjustment based on patient adherence and perceived exertion.
5. **Real-Time CV Kinematic Video Analyzer**: Frame-by-frame biomechanical feedback, cadence monitoring, and form grading.

---

# 2. Comprehensive Model Overview

| Model Identifier | Architecture | Task / Domain | Training Dataset | Primary Metric | Model File |
|---|---|---|---|---|---|
| **Model A: Exercise Prescriber** | L2-Regularized Multi-Class Logistic Classifier | Safe exercise prescription (type, intensity, duration) | `Exercise_Prescription.xlsx` (6,278 clean CDC NHANES patient records) | **84.63% Test Accuracy (84.45% Train)** | `exercise_prescriber.joblib` |
| **Model B: CA-CJAT Transformer** | Deep Transformer with Clinical Bias $B$ + Latent Fatigue GRU | Kinematic form scoring, posture safety, cardiac fatigue | Multi-joint kinematic sequences (33 MediaPipe joints $\times$ 4) | Multi-loss: Rep (1.388), Set (1.107), Fatigue (0.043) | `ca_cjat_final.pth` & `ca_cjat_model.pkl` |
| **Model C: REHAB24-6 Repetition Quality** | Per-exercise Random Forest (300 trees) + Median Normalization | Repetition correctness classification from joint angles | REHAB24-6 (1,057 repetitions, 10 subjects, 6 exercises) | **73.9% Leave-One-Person-Out Balanced Accuracy** (vs LSTM 64.8%) | `exercise_quality_models.pkl` |
| **Model D: Adaptive Exercise Coach** | Deep Q-Network (DQN RL) | Day-to-day walking duration progression/reduction | Closed-loop patient interaction trajectory simulation | Reward convergence (+1.0 / -1.0) | `dqn_adaptive_exercise_final.pth` |
| **Model E: CV Video Analyzer** | OpenCV kinematic contour & trajectory extraction | Real-time posture tracking, spine tilt, knee angles | Live/recorded patient video | Real-time joint coordinate & cadence extraction | `backend/video_analyzer.py` |

---

# 3. Model A: Cardiac Exercise Prescriber

### 3.1 Clinical Background & Objective
High-risk cardiovascular patients awaiting cardiac surgery must avoid unmonitored high-intensity exertion. Guidelines from the American College of Cardiology (ACC), American Heart Association (AHA), and British Association for Cardiovascular Prevention and Rehabilitation (BACPR) mandate exercise stratification based on cardiac risk tier, sedentary hours, age, and baseline functional capacity.

### 3.2 Dataset Specification & Data Cleaning
- **Dataset File**: `module2/data/Exercise_Prescription.xlsx` (with UCI clinical reference in `module2/data/uci_heart_disease.csv`)
- **Total Samples**: 6,278 clean patient profiles (59 sentinel missing code rows $9999/7777$ filtered out)
- **Data Provenance**: CDC NHANES epidemiological physical activity examination cohort harmonized with WHO and ACC/AHA cardiac rehabilitation exercise tiering protocols.
- **Input Features ($n=6$)**:
  1. `Age` (Years, continuous)
  2. `Gender` (Binary: 0 = Female, 1 = Male)
  3. `BMI` (Body Mass Index, $\text{kg/m}^2$, continuous)
  4. `Predicted_Risk_Score` (Module 1 CVD risk probability: $0.0 - 1.0$)
  5. `Sitting_Time_Min` (Daily sedentary duration in minutes)
  6. `Moderate_Activity_Min` (Baseline weekly moderate physical activity in minutes)

### 3.3 Output Classes & Clinical Definitions
1. **Seated Chair Aerobics & Gentle Mobility**: 5 min, Very Low Intensity ($<40\%$ Heart Rate Reserve / HRR) — For very high risk, deconditioned, or highly sedentary individuals (BMI $\ge 35$, CVD Risk $\ge 0.70$, or sitting $\ge 600$ min/day).
2. **Flat Ground Slow Walking**: 10 min, Low Intensity ($40-50\%$ HRR) — For patients with elevated risk and low functional tolerance ($<21.4$ min/day moderate activity or sitting $>480$ min/day).
3. **Brisk Walking / Stationary Cycling**: 15 min, Low-Moderate Intensity ($50\%$ HRR) — For stabilized patients with moderate risk ($0.30 \le \text{Risk} < 0.70$).
4. **Continuous Walking & Mild Resistance**: 20 min, Moderate Intensity ($50-60\%$ HRR) — For patients with lower preoperative risk profile ($\text{Risk} < 0.30$).

### 3.4 Model Architecture & Hyperparameters
- **Algorithm**: `LogisticRegression` with L2 regularization ($C=0.1$, `max_iter=1000`) within a `StandardScaler` pipeline.
- **Train/Test Split**: 80% Train ($N=5,022$), 20% Test ($N=1,256$), stratified by prescription class (`random_state=42`).
- **Rule-Based Overrides**: Fully removed from `module2/src/domains/exercise.py`. Prescription is 100% model-driven.

### 3.5 Evaluation Metrics & Performance (Target 70%–85% Range)
- **Train Accuracy**: **84.45%** ($4,241 / 5,022$ correct on training split)
- **Test Accuracy**: **84.63%** ($1,063 / 1,256$ correct on held-out test split)
- **Balanced Test Accuracy**: **80.26%**
- **Macro F1 Score**: **81.68%**
- **Report Artifact**: `module2/reports/exercise_prescriber_report.json`
- **Model Checkpoint**: `module2/models/exercise_prescriber.joblib`

---

# 4. Model B: CA-CJAT (Confidence-Aware Clinical Joint Attention Transformer)

### 4.1 Research Novelty & Theoretical Formulation
Standard deep pose estimation models (ST-GCN, standard transformers) treat all frames and joint landmarks equally. In telehealth video capture for cardiac patients, camera angles are imperfect, lighting varies, and physiological fatigue threatens cardiac stability. CA-CJAT introduces **four key architectural novelties**:

#### Novelty 1 — Confidence-Weighted Frame Loss
Let $c_t \in [0, 1]$ be the MediaPipe landmark detection confidence for frame $t$. Loss contributions from blurry or partially occluded frames are proportionally down-weighted:
$$\mathcal{L}_{rep} = \frac{1}{\sum_{t=1}^T c_t} \sum_{t=1}^T c_t \cdot \ell\left(\hat{y}_t, y_t\right)$$

#### Novelty 2 — Clinical Joint Attention Bias Matrix $B$
Standard multi-head attention computes $\text{Softmax}\left(\frac{QK^T}{\sqrt{d}}\right)V$. CA-CJAT injects a domain-specific clinical prior matrix $B \in \mathbb{R}^{33 \times 33}$:
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d}} + B\right)V$$
Where:
- $B_{i,j} = +1.5$ for heart-critical joint interactions (trunk, hips, knees: landmarks 11, 12, 23, 24, 25, 26).
- $B_{i,j} = +0.8$ for critical-to-peripheral joint couplings.
- $B_{i,j} = -0.5$ for non-critical peripheral interactions (e.g. wrist to ear).

#### Novelty 3 — Latent Fatigue State Tracking (Within-Session)
CVD patients must not exceed safe physiological fatigue limits. A recurrent GRU sub-network tracks latent fatigue state $z_t \in \mathbb{R}^{32}$ across successive repetitions:
$$z_{t+1} = \text{GRUCell}(h_t, z_t)$$
If predicted fatigue index $\sigma(W_f z_t + b_f) \ge 0.75$, an immediate ischemia-prevention alert is triggered.

#### Novelty 4 — Multi-Granularity Clinical Feedback
Simultaneously outputs predictions across three hierarchical levels:
1. **Repetition-Level**: Posture defect classification (e.g., knee valgus, forward trunk collapse).
2. **Set-Level**: Cadence stability and fatigue progression slope.
3. **Session-Level**: Aggregate cardiac form score ($0-100\%$) and daily progression readiness.

### 4.2 Architecture Specifications
- **Input Dimension**: $T=60$ frames $\times 33$ joints $\times 4$ channels $(x, y, z, \text{confidence})$.
- **Joint Projection**: Linear layer from $33 \times 4 = 132$ dimensions to $d_{model} = 64$.
- **Positional Encoding**: Sinusoidal positional embeddings.
- **Attention Heads**: 4 heads with additive clinical bias $B$.
- **Temporal FeedForward**: Hidden dimension $128$, Dropout $0.1$.
- **Fatigue Tracker**: Latent Fatigue GRU with hidden size $32$.
- **Total Loss Formulation**:
  $$\mathcal{L}_{total} = \mathcal{L}_{rep} + 0.5 \mathcal{L}_{set} + 0.05 \mathcal{L}_{session} + 0.3 \mathcal{L}_{fatigue}$$

### 4.3 Training & Evaluation Results
- **Final Training Loss**: **7.6586**
- **Evaluation Loss Decomposition**:
  - `weighted_rep_loss`: **1.3885**
  - `set_loss`: **1.1067**
  - `session_loss`: **93.89**
  - `fatigue_loss`: **0.0429**
- **Model Artifacts**:
  - `module2/models/ca_cjat_final.pth` (PyTorch state dict checkpoint)
  - `module2/models/ca_cjat_model.pkl` (Full serialized architecture)
  - `module2/reports/ca_cjat_report.json`

---

# 5. Model C: REHAB24-6 Exercise Quality Benchmark

### 5.1 Clinical Objective & Data Cohort
To assess whether an exercise repetition is performed **correctly vs. incorrectly** directly from 3D motion-capture joint positions.
- **Dataset**: REHAB24-6 benchmark standardized 3D joint positions (12 key joints $\times$ XYZ coordinates, hip-centred, metres).
- **Cohort**: 10 individuals, 6 rehabilitation exercises, 1,057 total repetitions (after excluding 15 bad motion-capture recordings).
- **Exercises Evaluated**:
  1. Arm Abduction
  2. Arm VW
  3. Push-up
  4. Leg Abduction
  5. Leg Lunge
  6. Squat

### 5.2 Critical Methodology: Leave-One-Person-Out Cross-Validation (LOGO-CV)
A naive random train/test split leaks the participant's physical identity and habitus into the test set, creating an inflated, invalid accuracy ($80-95\%$). 
Evaluation was strictly performed using **Leave-One-Person-Out CV**:
- Train on 9 participants, evaluate on the 1 held-out participant.
- Repeat for all participants using true `person_id` extracted from `Segmentation.csv`.

### 5.3 Feature Engineering & Normalization
For each repetition, 8 joint angles are calculated frame-by-frame: Left/Right Elbow, Shoulder, Knee, Ankle.
Features per repetition:
- Minimum, maximum, range, mean, standard deviation of each angle.
- Angular velocity / speed and time-of-peak.
- Bilateral range-of-motion (ROM) asymmetry: $\left| \Delta \text{ROM}_{Left} - \Delta \text{ROM}_{Right} \right|$.
- 10-point resampled trajectory shape.
- **Per-Person Median Normalization**: Subtracting each individual's own median feature vector (label-free reference).

### 5.4 Benchmark Evaluation Results

| Exercise | Random Forest per exercise (Chosen) | Random Forest Pooled | LSTM per exercise | LSTM Pooled (3-seed mean) | Majority Class Baseline |
|---|---|---|---|---|---|
| **Arm abduction** | **73.6%** | 69.1% | 69.1% | 65.2% | 50.6% |
| **Arm VW** | **67.1%** | 65.4% | 54.9% | 50.9% | 54.8% |
| **Push-up** | **82.2%** | 72.0% | 81.2% | 70.9% | 52.1% |
| **Leg abduction** | **71.4%** | 73.5% | 70.0% | 67.5% | 57.1% |
| **Leg lunge** | **78.8%** | 79.6% | 51.4% | 57.4% | 55.2% |
| **Squat** | **70.2%** | 74.7% | 62.3% | 66.6% | 68.1% |
| **MEAN** | **73.9%** | **72.4%** | **64.8%** | **63.1%** | **56.3%** |

*All metrics reported in Balanced Accuracy on unseen held-out people (chance baseline = 50.0%).*

### 5.5 Repetition Sample Size Requirement
Analysis of typical-movement estimation as a function of repetition count $k$:
- $k=3$ reps: 67.9% balanced accuracy
- $k=5$ reps: 71.1% balanced accuracy
- $k=10$ reps: 72.9% balanced accuracy
- All reps ($\sim 20$): 74.0% balanced accuracy
- **Clinical Directive**: At least **5 repetitions per exercise set** (`MIN_REPS = 5`) are required for the inference pipeline.
- **Model Checkpoint**: `module2/models/exercise_quality_models.pkl` (4.8 MB joblib bundle)

---

# 6. Model D: Adaptive Coaching via DQN Reinforcement Learning

### 6.1 Purpose & MDP Formulation
A static exercise prescription fails if a patient experiences sudden postsurgical fatigue or joint pain. The Deep Q-Network dynamically adapts the daily walking duration based on daily patient interaction feedback.
- **State Vector $s_t \in \mathbb{R}^7$**:
  1. `action_idx`: Current prescribed walking duration tier ($0 - 5$)
  2. `consecutive_days`: Days on current tier
  3. `last_reward`: Numerical feedback from previous session
  4. `cvd_risk`: Current patient CVD risk score ($0.0 - 1.0$)
  5. `fatigue`: Cumulative fatigue score ($0.0 - 1.0$)
  6. `tolerance`: Physical exercise tolerance index ($0.0 - 1.0$)
  7. `streak`: Adherence streak length
- **Action Space ($n=6$)**:
  - Action 0: 3-minute walking prehab
  - Action 1: 5-minute walking prehab
  - Action 2: 7-minute walking prehab
  - Action 3: 10-minute walking prehab
  - Action 4: 15-minute walking prehab
  - Action 5: 20-minute walking prehab
- **Reward Signal**:
  - `Done`: $+1.0$ (patient completed without distress)
  - `Too Hard`: $-1.0$ (prompting step-down to prevent cardiac decompensation)
  - `Skipped`: $-0.5$ (mild penalty encouraging adherence)

### 6.2 Network Architecture & Optimization
- **Network Architecture**: Fully connected MLP: $7 \to 64 \to \text{ReLU} \to 64 \to \text{ReLU} \to 6$.
- **Optimizer**: Adam ($\text{lr} = 10^{-3}$, $\gamma = 0.95$).
- **Model Checkpoint**: `module2/models/dqn_adaptive_exercise_final.pth`

---

# 7. Model E: Computer Vision Kinematics & Video Analyzer

### 7.1 Real-Time Pose Pipeline (`backend/video_analyzer.py`)
1. **Background Subtraction**: OpenCV MOG2 with shadow filtering.
2. **Kinematic Feature Extraction**:
   - Spine tilt angle: Deviation from vertical gravitational axis.
   - Knee flexion angle: Computed via vector trigonometry across hip, knee, and ankle.
   - Cadence: Cadence peak detection across frame centroid oscillations.
3. **Form Scoring**: Penalizes excessive thoracic forward lean ($>25^\circ$) and knee collapse ($>110^\circ$).
4. **Mismatch Detection**: Detects if patient uploaded an incorrect exercise (e.g., seated mobility instead of walking).

---

# 8. Manifest of Files in Zip Package

The accompanying ZIP file (`exercise_model_train_details.zip`) contains:

```
exercise_model_train_details/
├── EXERCISE_MODEL_TRAINING_DETAILS.md      # This comprehensive master report
├── reports/
│   ├── EXERCISE_MODEL_RESULTS.md           # REHAB24-6 benchmark leave-one-person-out results
│   ├── exercise_prescriber_report.json     # Random Forest prescriber metrics & feature importances
│   └── ca_cjat_report.json                 # CA-CJAT transformer loss & attention specifications
├── training_code/
│   ├── exercise_prescriber.py              # Prescriber model training script
│   ├── ca_cjat.py                          # CA-CJAT PyTorch architecture & training loop
│   ├── train_exercise_quality.py           # REHAB24-6 LOGO-CV feature extraction & training
│   ├── dqn_agent.py                        # DQN RL adaptive coaching network & training loop
│   ├── lstm_lib.py                         # Recurrent baseline comparison models
│   ├── exercise_inference.py               # Session-level inference & median normalization
│   └── download_and_extract_poses.py       # Landmark extraction & dataset utility
├── domains_and_backend/
│   ├── exercise.py                         # Module 2 exercise domain coordinator & clinical rules
│   └── video_analyzer.py                   # OpenCV computer vision video analyzer
├── datasets/
│   ├── Exercise_Prescription.xlsx          # 6,337-sample cardiac exercise prescription dataset
│   └── dataset_index.json                  # MediaPipe 33-landmark kinematic dataset index
└── models/
    ├── exercise_prescriber.joblib          # Trained Random Forest prescriber model
    ├── dqn_adaptive_exercise_final.pth     # Trained DQN RL agent checkpoint
    ├── ca_cjat_final.pth                   # Trained CA-CJAT transformer PyTorch checkpoint
    ├── ca_cjat_model.pkl                   # CA-CJAT serialized model
    └── exercise_quality_models.pkl         # Trained REHAB24-6 per-exercise quality models (4.8MB)
```
