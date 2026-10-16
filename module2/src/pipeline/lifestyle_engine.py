"""
Module 2 — Personalised CVD Lifestyle Recommendation Engine & Adaptive Coaching
End-to-End Orchestrator integrating:
  1. Module 2 CVD Risk Score & Trajectory
  2. XGBoost + LightGBM Lifestyle Priority Ranking (Top 3 daily priorities)
  3. Random Forest Exercise Prescriber
  4. DQN Reinforcement Learning Daily Adaptation Loop
  5. 5 Domain Modules: Exercise, Sleep, Stress, Smoking, Diet
  6. CA-CJAT Video Movement & Fatigue Quality Assessment
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from ..models.dqn_agent import DQNAgent
from ..models.exercise_prescriber import ExercisePrescriptionEngine
from ..domains.exercise import ExerciseDomain
from ..domains.sleep import SleepDomain
from ..domains.stress import StressDomain
from ..domains.smoking import SmokingDomain
from ..domains.diet import DietDomain


class CVDLifestyleCoachEngine:
    def __init__(
        self,
        ranking_model_path="module2/models/lifestyle_ranking_ensemble.joblib",
        dqn_model_path="module2/models/dqn_adaptive_exercise_final.pth",
        cacjat_model_path="module2/models/ca_cjat_final.pth"
    ):
        # 1. Ranking model
        self.ranking_pkg = None
        if os.path.exists(ranking_model_path):
            self.ranking_pkg = joblib.load(ranking_model_path)
        elif os.path.exists("module2/models/model1_final.pkl"):
            self.ranking_pkg = joblib.load("module2/models/model1_final.pkl")

        # 2. DQN RL Agent
        self.dqn = DQNAgent(model_path=dqn_model_path)

        # 3. Domain handlers
        self.exercise_domain = ExerciseDomain(cacjat_model_path=cacjat_model_path)
        self.sleep_domain = SleepDomain()
        self.stress_domain = StressDomain()
        self.smoking_domain = SmokingDomain()
        self.diet_domain = DietDomain()

    def generate_daily_recommendation_plan(self, patient_profile, current_day=1, current_action_idx=3):
        """
        Generates full daily lifestyle recommendation for a pre-surgery CVD patient.
        patient_profile keys:
          - Age, Gender, BMI, Predicted_Risk_Score, Risk_Trajectory ('Increasing'/'Stable'/'Decreasing')
          - Moderate_Activity_Min, Vigorous_Activity_Min, Sitting_Time_Min (or Sitting_Hours)
          - Sleep_Hours, Consecutive_Low_Sleep_Days
          - Stress_Score, Consecutive_High_Stress_Days
          - Cigarettes_Per_Day, Smoking_Status
          - Sodium_mg, Total_Fat_g, Sugar_g, Calories
        """
        # 1. Module 2 Risk Integration
        cvd_risk = patient_profile.get('Predicted_Risk_Score', 0.65)
        risk_trajectory = patient_profile.get('Risk_Trajectory', 'Stable')

        # Adjust effective risk if trajectory is increasing
        effective_risk = min(0.99, cvd_risk * 1.1) if risk_trajectory == 'Increasing' else cvd_risk

        # 2. XGBoost + LightGBM Ranking
        features = [
            'Age', 'Gender', 'BMI', 'Predicted_Risk_Score',
            'Moderate_Activity_Min', 'Vigorous_Activity_Min', 'Sitting_Time_Min',
            'Sleep_Hours', 'Smoking_Status',
            'Sodium_mg', 'Total_Fat_g', 'Sugar_g', 'Calories',
            'Stress_Score'
        ]

        # Prepare input df
        row = {
            'Age': patient_profile.get('Age', 50),
            'Gender': patient_profile.get('Gender', 1),
            'BMI': patient_profile.get('BMI', 28.0),
            'Predicted_Risk_Score': effective_risk,
            'Moderate_Activity_Min': patient_profile.get('Moderate_Activity_Min', 10),
            'Vigorous_Activity_Min': patient_profile.get('Vigorous_Activity_Min', 0),
            'Sitting_Time_Min': patient_profile.get('Sitting_Time_Min', patient_profile.get('Sitting_Hours', 8) * 60),
            'Sleep_Hours': patient_profile.get('Sleep_Hours', 6.0),
            'Smoking_Status': patient_profile.get('Smoking_Status', 1 if patient_profile.get('Cigarettes_Per_Day', 0) > 0 else 0),
            'Sodium_mg': patient_profile.get('Sodium_mg', 2500),
            'Total_Fat_g': patient_profile.get('Total_Fat_g', 75),
            'Sugar_g': patient_profile.get('Sugar_g', 50),
            'Calories': patient_profile.get('Calories', 2200),
            'Stress_Score': patient_profile.get('Stress_Score', 6)
        }
        df_in = pd.DataFrame([row])[features]

        # Get probabilities from ensemble
        if self.ranking_pkg is not None:
            xgb_m = self.ranking_pkg['xgb_model']
            lgb_m = self.ranking_pkg['lgb_model']
            p1 = xgb_m.predict_proba(df_in)[0]
            p2 = lgb_m.predict_proba(df_in)[0]
            domain_probs = 0.5 * p1 + 0.5 * p2
            classes = self.ranking_pkg['classes']
        else:
            # Fallback uniform
            domain_probs = np.array([0.3, 0.25, 0.2, 0.15, 0.1])
            classes = ['Diet', 'Exercise', 'Sleep', 'Smoking', 'Stress']

        # Sort top domains
        sorted_indices = np.argsort(domain_probs)[::-1]
        ranked_domains = [classes[idx] for idx in sorted_indices]
        domain_confidence = {classes[idx]: round(float(domain_probs[idx]), 3) for idx in sorted_indices}

        # 3. Compile Domain Interventions
        curr_minutes = self.dqn.ACTION_MINUTES.get(current_action_idx, 10)
        ex_out = self.exercise_domain.get_recommendation(patient_profile, current_minutes=curr_minutes)
        sleep_out = self.sleep_domain.assess_sleep(
            patient_profile.get('Sleep_Hours', 6.0),
            consecutive_low_days=patient_profile.get('Consecutive_Low_Sleep_Days', 1)
        )
        stress_out = self.stress_domain.assess_stress(
            patient_profile.get('Stress_Score', 5),
            consecutive_high_days=patient_profile.get('Consecutive_High_Stress_Days', 1)
        )
        smoke_out = self.smoking_domain.get_cessation_plan(
            patient_profile.get('Cigarettes_Per_Day', 0),
            current_week=patient_profile.get('Program_Week', 1)
        )
        diet_out = self.diet_domain.get_dietary_prescription(
            sodium_mg=patient_profile.get('Sodium_mg', 2500),
            total_fat_g=patient_profile.get('Total_Fat_g', 75),
            sugar_g=patient_profile.get('Sugar_g', 50),
            calories=patient_profile.get('Calories', 2200)
        )

        domain_lookup = {
            'Diet': diet_out,
            'Exercise': ex_out,
            'Sleep': sleep_out,
            'Smoking': smoke_out,
            'Stress': stress_out
        }

        # Select Top 3 Priority Actions
        top_3_domains = ranked_domains[:3]
        top_3_actions = [
            {
                "priority_rank": rank + 1,
                "domain": dom,
                "action": domain_lookup[dom]['priority_action'],
                "severity_score": domain_confidence[dom]
            }
            for rank, dom in enumerate(top_3_domains)
        ]

        # Clinical Escalation Flags
        clinical_flags = []
        if sleep_out['doctor_alert_triggered']:
            clinical_flags.append(sleep_out['doctor_alert_message'])
        if stress_out['doctor_flag_triggered']:
            clinical_flags.append(stress_out['doctor_alert_message'])
        if effective_risk > 0.70 and risk_trajectory == 'Increasing':
            clinical_flags.append("URGENT: Pre-surgery CVD Risk is HIGH and INCREASING. Strict lifestyle compliance required.")

        return {
            "patient_summary": {
                "age": patient_profile.get('Age'),
                "bmi": patient_profile.get('BMI'),
                "cvd_risk_score": cvd_risk,
                "risk_trajectory": risk_trajectory,
                "effective_risk": round(effective_risk, 3),
                "program_day": current_day
            },
            "top_3_today": top_3_actions,
            "domain_priority_ranking": domain_confidence,
            "clinical_flags": clinical_flags,
            "full_domain_guidance": {
                "exercise": ex_out,
                "sleep": sleep_out,
                "stress": stress_out,
                "smoking": smoke_out,
                "diet": diet_out
            },
            "current_exercise_action_idx": current_action_idx
        }

    def process_patient_feedback(self, current_action_idx, feedback, cvd_risk, current_day=1):
        """
        Processes Done / Too Hard / Skipped and lets DQN adapt the exercise plan.
        """
        return self.dqn.update_from_feedback(
            current_action_idx=current_action_idx,
            feedback=feedback,
            cvd_risk=cvd_risk,
            day_num=current_day
        )

    def analyze_exercise_video(self, pose_landmarks_seq, confidences=None):
        """
        Runs CA-CJAT Video Analysis on patient exercise video.
        """
        return self.exercise_domain.analyze_exercise_video_landmarks(pose_landmarks_seq, confidences)


if __name__ == '__main__':
    engine = CVDLifestyleCoachEngine()

    print("=================================================================")
    print("DEMO: TESTING LIFESTYLE ENGINE FOR EXAMPLE PATIENT 'NIMAL'")
    print("=================================================================")
    # Nimal from prompt:
    # Age 48, office job, BMI 31, sits 9hrs/day, Smokes 8 cigs/day,
    # Sleeps only 4 hours, Eats fried food + cola daily, Module 2 Risk HIGH + INCREASING
    nimal_profile = {
        'Age': 48,
        'Gender': 1,
        'BMI': 31.0,
        'Sitting_Hours': 9.0,
        'Sitting_Time_Min': 540,
        'Moderate_Activity_Min': 0,
        'Vigorous_Activity_Min': 0,
        'Sleep_Hours': 4.0,
        'Consecutive_Low_Sleep_Days': 3,
        'Stress_Score': 8,
        'Consecutive_High_Stress_Days': 2,
        'Cigarettes_Per_Day': 8,
        'Smoking_Status': 2,
        'Sodium_mg': 3200,
        'Total_Fat_g': 95,
        'Sugar_g': 78,
        'Calories': 2600,
        'Predicted_Risk_Score': 0.78,
        'Risk_Trajectory': 'Increasing',
        'Program_Week': 1
    }

    plan = engine.generate_daily_recommendation_plan(nimal_profile, current_day=1, current_action_idx=3)
    print("\n--- TOP 3 PRIORITIES TODAY ---")
    for item in plan['top_3_today']:
        print(f"Priority {item['priority_rank']} ({item['domain']}): {item['action']}")

    print("\n--- CLINICAL ESCALATION FLAGS ---")
    for flag in plan['clinical_flags']:
        print(f"[!] {flag}")

    print("\n--- SIMULATING DQN RL ADAPTIVE FEEDBACK ---")
    # Patient tries 10-min walk, clicks 'Too Hard'
    feedback_res = engine.process_patient_feedback(
        current_action_idx=3,
        feedback='Too Hard',
        cvd_risk=nimal_profile['Predicted_Risk_Score'],
        current_day=1
    )
    print("Patient clicked: 'Too Hard'")
    print(f"DQN RL Adaptation: {feedback_res['adapted_exercise']}")
    print(f"Coach Message: {feedback_res['adaptation_message']}")
