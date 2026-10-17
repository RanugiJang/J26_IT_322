"""
Module 2 — Smoking Domain
Handles stage-specific smoking cessation, craving management, and weekly tapering
for pre-surgery cardiovascular patients to restore endothelial function and reduce carbon monoxide Hb.
"""

import os
import joblib
import pandas as pd


class SmokingDomain:
    HARM_AWARENESS_VIDEOS = [
        {
            "title": "How Cigarette Toxins Damage Coronary Arteries & Accelerate Plaque Rupture",
            "url": "https://www.youtube.com/watch?v=g3u24uY4E6Y",
            "duration": "4 mins",
            "impact": "Explains endothelial dysfunction and carbon monoxide hypoxia"
        },
        {
            "title": "Immediate Heart Health Benefits within 48 Hours of Smoking Reduction",
            "url": "https://www.youtube.com/watch?v=0P4508w41Xg",
            "duration": "5 mins",
            "impact": "Shows blood pressure drop and oxygenation normalization"
        }
    ]

    CRAVING_SURFING_TIPS = [
        "Drink a tall glass of ice-cold water slowly through a straw when craving strikes",
        "Perform 3 cycles of 4-4-4 Box Breathing to calm nicotine withdrawal anxiety",
        "Delay lighting up by 10 minutes — acute cravings subside naturally within 3-5 minutes",
        "Keep hands engaged (e.g. grip ball, herbal toothpick) after meals"
    ]

    def __init__(self, model_path="module2/models/smoking stage.pkl"):
        self.model_pkg = None
        if os.path.exists(model_path):
            try:
                self.model_pkg = joblib.load(model_path)
            except Exception:
                pass

    def detect_stage(self, age, gender, bmi, cigarettes_per_day):
        if cigarettes_per_day == 0:
            return "Never_Smoked_or_Former_Smoker"

        if self.model_pkg is not None:
            try:
                X_in = pd.DataFrame([{
                    'Age': age, 'Gender': gender, 'BMI': bmi,
                    'Cigarettes_Per_Day_Current': cigarettes_per_day
                }])[self.model_pkg['features']]

                if 'scaler' in self.model_pkg:
                    X_scaled = self.model_pkg['scaler'].transform(X_in)
                    pred_idx = self.model_pkg['model'].predict(X_scaled)[0]
                else:
                    pred_idx = self.model_pkg['model'].predict(X_in)[0]

                return self.model_pkg['label_encoder'].inverse_transform([pred_idx])[0]
            except Exception:
                pass

        if cigarettes_per_day >= 10:
            return "Maintenance_Current_Daily"
        return "Action_Reducing_Some_Days"

    def get_cessation_plan(self, cigarettes_current, current_week=1):
        if cigarettes_current <= 0:
            return {
                "domain": "Smoking",
                "status": "Non-smoker / Sustained Quit",
                "priority_action": "Maintain smoke-free heart status",
                "target_cigarettes": 0,
                "weekly_schedule": []
            }

        # Stepwise tapering schedule (e.g. 8 -> 6 -> 4 -> 2 -> 0)
        reduction_step = max(2, int(cigarettes_current * 0.25))
        target_this_week = max(0, cigarettes_current - reduction_step)

        weekly_schedule = [
            {"week": 1, "target": max(0, cigarettes_current - reduction_step), "focus": "Eliminate morning & post-dinner cigarettes"},
            {"week": 2, "target": max(0, cigarettes_current - 2 * reduction_step), "focus": "Swap mid-day smoke break for walking"},
            {"week": 3, "target": max(0, cigarettes_current - 3 * reduction_step), "focus": "Nicotine taper & craving surfing"},
            {"week": 4, "target": 0, "focus": "Complete cessation before surgery"}
        ]

        return {
            "domain": "Smoking",
            "current_cigarettes_per_day": cigarettes_current,
            "current_week": current_week,
            "priority_action": f"Reduce smoking from {cigarettes_current} to {target_this_week} cigarettes/day this week",
            "target_cigarettes_today": target_this_week,
            "craving_tips": self.CRAVING_SURFING_TIPS,
            "harm_awareness_videos": self.HARM_AWARENESS_VIDEOS,
            "weekly_schedule": weekly_schedule
        }
