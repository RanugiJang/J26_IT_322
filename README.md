# 🫀 Module 2 — Personalised CVD Lifestyle Recommendation & Adaptive Coaching

**📌 Project J26-IT-322 | SLIIT Faculty of Computing**
**🌍 SDG 3 — Good Health & Well-being**

---

## 📖 Overview

Module 2 is a personalised daily lifestyle coaching system for **high-risk CVD patients before surgery**. The goal is to reduce cardiovascular risk through adaptive, multi-domain lifestyle recommendations — so the patient may never need surgery.

The system covers **5 lifestyle domains**: 🏃 Exercise · 😴 Sleep · 🧘 Stress · 🚬 Smoking · 🥗 Diet

It adapts daily based on patient feedback using **Deep Q-Network (DQN) Reinforcement Learning**.

---

## 🔄 System Flow

```
👤 Patient Profile (age, BMI, smoking, sleep, stress, diet, activity)
        ↓
📊 Module 2 Risk Score (HIGH/MOD + Increasing/Stable/Decreasing)
        ↓
🤖 XGBoost + LightGBM → ranks lifestyle domains needing improvement
        ↓
📋 Top 3 Personalised Recommendations shown to patient
        ↓
💬 Patient Feedback: Done / Too Hard / Skipped
        ↓
🧠 DQN RL learns: +1 Done, -1 Too Hard → adapts tomorrow's plan
        ↓
📈 Weekly Risk Update → Module 2 score changes → plan changes
```

---

## 🤖 ML Models

| Component | Model | Dataset |
|---|---|---|
| 🏆 Lifestyle Priority Ranking | XGBoost + LightGBM | NHANES, UCI Heart Disease |
| 🏃 Exercise Prescription | Random Forest | NHANES |
| 🎯 Exercise Pose Extraction | MediaPipe | Pre-trained (no training needed) |
| ⭐ Exercise Quality Assessment | CA-CJAT (Novel) | REHAB24-6, KIMORE |
| 🚬 Smoking Stage Detection | Logistic Regression | NHANES Smoking Module |
| 🔁 Adaptive Daily Plan | DQN Reinforcement Learning | Patient interaction (real-time) |
| 🧘 Stress Support | Rule-based | — |
| 🥗 Diet Suggestions | XGBoost output + Rules | SL Food DB, USDA |

---

## ⭐ Technical Novelty — CA-CJAT Architecture

**Confidence-Aware Clinical Joint Attention Transformer** for CVD Exercise Quality Assessment.

> 💡 This is a genuine new architecture not found in existing CVD literature.

### 🔹 Novelty 1 — Confidence-Weighted Frame Processing
MediaPipe gives a confidence score per frame. The model learns MORE from high-confidence frames and ignores blurry/shaky frames.

**Formula:** `L = Σ cₜ · ℓ(ŷₜ, yₜ)` where `cₜ` = MediaPipe confidence at frame t

### 🔹 Novelty 2 — Clinical Joint Attention Bias
A clinical bias matrix B tells the transformer to focus on heart-critical joints (hips, knees) over low-risk joints (wrists).

**Formula:** `Attention = Softmax(QKᵀ / √d + B)V` where B = clinical bias matrix

### 🔹 Novelty 3 — Latent Fatigue State
The model tracks hidden fatigue state rep-by-rep within the uploaded video — not just frame by frame.

**Formula:** `z(t+1) = fθ(z(t), h(t), feedback)` where z = (fatigue, tolerance) state

### 🔹 Novelty 4 — Multi-Granularity Feedback
3 levels of feedback from one uploaded video: rep-level, set-level, session-level.

---

## 🏥 5 Domain Details

### 🏃 Exercise
- AI recommends exercise type, duration, intensity based on risk score
- Patient uploads exercise video
- CA-CJAT analyses movement and posture
- Real-time feedback: raise arms / keep back straight

### 😴 Sleep
- Detects dangerous sleep patterns (< 5 hrs)
- Recommends sleep schedule and environment tips
- Alert triggered if sleep < 5 hrs for 3+ days

### 🧘 Stress
- Stress score tracked (0–10)
- Box breathing guidance: IN 4s → HOLD 4s → OUT 4s
- Doctor flagged if stress ≥ 8 for 5+ days

### 🚬 Smoking
- Logistic Regression detects stage: Pre-contemplation / Action / Maintenance
- Weekly reduction plan: 8 → 6 → 4 cigarettes/day
- Progress tracker across weeks

### 🥗 Diet
- Maps to Sri Lankan heart-healthy foods (243 items from SL Food Composition DB)
- Swap suggestions: Cola → King coconut water, Fried fish → Grilled fish
- DQN learns food preferences over time

---

## 📂 Datasets

| Dataset | Used For | Link |
|---|---|---|
| 📊 NHANES | Lifestyle priority, exercise prescription, smoking | [wwwn.cdc.gov/nchs/nhanes](https://wwwn.cdc.gov/nchs/nhanes) |
| ❤️ UCI Heart Disease | Feature training | [archive.ics.uci.edu](https://archive.ics.uci.edu/dataset/45/heart+disease) |
| 📈 Framingham Heart Study | Temporal baseline | [kaggle.com](https://kaggle.com/datasets/amanajmera1/framingham-heart-study-dataset) |
| 🎥 REHAB24-6 | CA-CJAT exercise quality (main) | [zenodo.org/records/13305826](https://zenodo.org/records/13305826) |
| 🏋️ KIMORE | CA-CJAT attention bias training | [kaggle.com](https://kaggle.com/datasets/cpm121/ex-kimore-dataset-full) |
| 🏥 IntelliRehabDS | Multi-granularity training | [zenodo.org/record/4610859](https://zenodo.org/record/4610859) |
| 🔬 UI-PRMD | Additional exercise labels | [ualberta.ca/klab](https://ualberta.ca/klab/research/data/ui-prmd) |
| 🍛 SL Food Composition DB | Sri Lankan diet domain | [foodcompositiondb.lk](https://foodcompositiondb.lk) |
| 🥦 USDA Food Data Central | Diet backup | [fdc.nal.usda.gov](https://fdc.nal.usda.gov) |

---

## 🔍 Research Gaps Addressed

- ❌ Existing lifestyle apps give **fixed generic plans** — no per-patient adaptation
- ❌ Systems handle only **one domain** at a time — not all 5 combined
- ❌ No system links **live CVD risk trajectory** to daily recommendations
- ❌ No CVD-specific exercise video dataset existed — addressed using REHAB24-6 + KIMORE
- ❌ No existing exercise AI uses **confidence weighting or clinical joint attention** for CVD

---

## 💡 Key Novelties Summary

1. 🔁 **Adaptive RL Recommendation Loop** — DQN agent learns per patient daily
2. 📊 **Live Risk-Linked Planning** — Module 2 risk score feeds weekly into Module 3
3. 🌐 **Multi-Domain Simultaneous Output** — 5 domains ranked at once with Sri Lankan cultural diet
4. ⭐ **CA-CJAT Architecture** — Confidence weighting + clinical joint attention + latent fatigue state + multi-granularity feedback
5. 🎥 **CVD Exercise Dataset Gap** — Identified and addressed using adapted rehabilitation datasets

---

## 🛠️ Tech Stack

- **Backend:** 🐍 Python, FastAPI
- **Frontend:** ⚛️ React (TypeScript)
- **ML:** XGBoost, LightGBM, scikit-learn, PyTorch
- **Pose Estimation:** MediaPipe
- **Reinforcement Learning:** DQN (custom implementation)
- **Database:** SQLite

---

## 👩‍💻 Module Member

| Name | Student ID | Role |
|---|---|---|
| Hashinika | IT23179462 | Module 2 — CVD Lifestyle Recommendation Engine |

**📌 Project J26-IT-322 | SLIIT Faculty of Computing | SDG 3 — Good Health & Well-being**
