"""
Module 2 — Exercise Prescription Model (Random Forest)
Trained on module2/data/Exercise_Prescription.xlsx (NHANES & ACC/AHA cardiac rehab protocols)
Prescribes cardiac-safe exercise type, initial duration, and target intensity.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


class ExercisePrescriptionEngine:
    FEATURES = ['Age', 'Gender', 'BMI', 'Predicted_Risk_Score', 'Sitting_Time_Min', 'Moderate_Activity_Min']

    def __init__(self, model_path="module2/models/exercise_prescriber.joblib", data_path="module2/data/Exercise_Prescription.xlsx"):
        self.model_path = model_path
        self.data_path = data_path
        self.model_pkg = None
        if os.path.exists(model_path):
            try:
                self.model_pkg = joblib.load(model_path)
            except Exception:
                pass

    def train(self, output_path=None):
        if output_path is None:
            output_path = self.model_path

        print(f"Loading exercise training data from {self.data_path}...")
        df = pd.read_excel(self.data_path)

        X = df[self.FEATURES].copy()
        y = df['Prescription_Label']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        rf = RandomForestClassifier(
            n_estimators=120,
            max_depth=6,
            min_samples_split=5,
            random_state=42
        )
        rf.fit(X_train, y_train)

        test_preds = rf.predict(X_test)
        acc = accuracy_score(y_test, test_preds)
        print(f"Exercise Prescriber Random Forest Test Accuracy on Exercise_Prescription.xlsx: {acc * 100:.2f}%")

        pkg = {
            'model': rf,
            'features': self.FEATURES,
            'classes': rf.classes_.tolist(),
            'accuracy': float(acc),
            'feature_importances': {feat: float(imp) for feat, imp in zip(self.FEATURES, rf.feature_importances_)}
        }

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        joblib.dump(pkg, output_path)
        self.model_pkg = pkg

        # Save report
        reports_dir = "module2/reports"
        os.makedirs(reports_dir, exist_ok=True)
        with open(os.path.join(reports_dir, "exercise_prescriber_report.json"), "w") as f:
            json.dump({
                "model": "Random Forest Cardiac Exercise Prescriber",
                "dataset": self.data_path,
                "n_samples": len(df),
                "accuracy": float(acc),
                "features": self.FEATURES,
                "classes": rf.classes_.tolist(),
                "feature_importances": pkg['feature_importances']
            }, f, indent=2)

        print(f"Saved exercise prescription model to {output_path}")
        return pkg

    def prescribe(self, patient_dict):
        if self.model_pkg is None:
            if os.path.exists(self.model_path):
                self.model_pkg = joblib.load(self.model_path)
            else:
                self.train()

        features = self.model_pkg['features']
        input_data = {
            'Age': patient_dict.get('Age', 50),
            'Gender': patient_dict.get('Gender', 1),
            'BMI': patient_dict.get('BMI', 28.0),
            'Predicted_Risk_Score': patient_dict.get('Predicted_Risk_Score', 0.5),
            'Sitting_Time_Min': patient_dict.get('Sitting_Time_Min', patient_dict.get('Sitting_Hours', 8.0) * 60.0),
            'Moderate_Activity_Min': patient_dict.get('Moderate_Activity_Min', patient_dict.get('Baseline_Activity_Min', 10))
        }

        X_in = pd.DataFrame([input_data])[features]
        full_pred = self.model_pkg['model'].predict(X_in)[0]
        probs = self.model_pkg['model'].predict_proba(X_in)[0]
        confidence = float(np.max(probs))

        parts = full_pred.split(" | ")
        return {
            'prescription': full_pred,
            'exercise_type': parts[0],
            'recommended_duration_min': int(parts[1].replace('m', '')),
            'intensity_level': parts[2],
            'confidence': round(confidence, 3),
            'cardiac_safety_rules': [
                "Discontinue immediately if experiencing chest tightness, lightheadedness, or shortness of breath",
                "Perform gentle warm-up before exercise and cool-down for 3 minutes after",
                "Keep heart rate strictly below 60% of age-predicted maximum (220 - Age)"
            ]
        }


if __name__ == '__main__':
    engine = ExercisePrescriptionEngine()
    engine.train()
