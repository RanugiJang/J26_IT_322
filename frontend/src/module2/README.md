# Module 2 Frontend: Personalized Cardiac Prehabilitation & Rehabilitation Platform

## Overview
This folder contains the complete, self-contained frontend implementation for **Module 2: Personalized Lifestyle Intervention & Motion Analysis for Pre-operative / Post-operative Cardiac Patients** (Research Project: J26_IT_322).

### 👥 Team Integration Architecture
To prevent git merge conflicts between team members:
- **Module 1**: `src/module1/` (Explainable CVD Risk Prediction)
- **Module 2**: `src/module2/` (Personalized Prehab Lifestyle, Nutrition, Sleep/Stress, Smoking Cessation & AI Motion Coaching) - **THIS DIRECTORY**
- **Module 3**: `src/module3/` (ECG & Cardiac Rhythm Monitoring)
- **Module 4**: `src/module4/` (Post-Operative Recovery Outcomes & Risk Monitoring)

All files, types, and datasets belonging to Module 2 reside strictly within `src/module2/`.

---

## 🫀 Personalized Module 2 Components

| Component | File | Description |
|---|---|---|
| **Patient Intake Form** | `PatientIntakeForm.tsx` | Comprehensive patient registration (vitals, CABG timeline, BMI, baseline smoking/sleep/stress metrics). Generates personalized care plan upon submit. |
| **Patient Header & Risk** | `PatientHeader.tsx` | Clinical header displaying CVD risk category (HIGH/MODERATE/LOW), Heart Age delta, surgical countdown, and live telemetry triggers. |
| **Interactive Heart Anatomy** | `AnatomicalHeartBody.tsx` | SVG/Canvas anatomical cardiac visualization highlighting coronary vessel perfusion and ischemic prehab focus. |
| **Daily Prioritized Roadmap** | `DailyRoadmap.tsx` | DQN-driven top 3 daily actionable targets across exercise, sleep, diet, stress, and smoking domains. |
| **Personalized Nutrition Planner** | `NutritionPlanner.tsx` | Sri Lankan culturally tailored cardiac diet engine with direct healthy food swaps (sodium <1500mg, potassium optimization, trans-fat elimination). |
| **Sleep & Stress Hub** | `SleepStressHub.tsx` | Autonomic nervous system recovery, nocturnal cardiac protection, sleep debt calculation, and 4-7-8 guided breathing. |
| **Smoking Taper Tracker** | `SmokingTaperTracker.tsx` | Pre-operative nicotine weaning curve and pulmonary clearance tracker (CO elimination & cilia recovery before surgery). |
| **Motion Coach & Posture Studio** | `MotionCoachStudio.tsx` | CACJAT (Confidence-Aware Contextual Joint Attention Transformer) exercise posture feedback, joint angles (knee/spine), and fatigue alerts. |
| **AI Kinematic Video Player** | `AiKinematicVideoPlayer.tsx` | Interactive kinematic playback demonstrating correct posture and real-time skeleton joint overlays. |
| **Exercise Suggestion Page** | `ExerciseSuggestPage.tsx` | Prescribed low-intensity cardiac rehab exercises with RPE limits (≤11) and contraindication safety checks. |
| **Clinical Review & Telemetry** | `DoctorMonitorModal.tsx`, `ModelTelemetryPanel.tsx` | Physician audit dashboard and dual-loop AI telemetry panel. |
| **Unified Master Dashboard** | `Module2Dashboard.tsx` | Central state management container providing seamless tabbed access to all personalized module features. |

---

## 🚀 How to Import into Main Application
To mount Module 2 anywhere in the application:
```tsx
import { Module2Dashboard } from './module2';

export default function App() {
  return <Module2Dashboard />;
}
```
