"""
Module 2 — Smoking Stage Detection Model
Pre-contemplation / contemplation / action / maintenance / quit stages
Trained on NHANES / Smoking Cessation dataset (Smoking_Stage.xlsx)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score


FEATURES = ['Age', 'Gender', 'BMI', 'Cigarettes_Per_Day_Current']


def train_smoking_stage_model(
    data_path="module2/data/Smoking_Stage.xlsx",
    output_dir="module2/models",
    reports_dir="module2/reports"
):
    print(f"Loading smoking stage data from {data_path}...")
    df = pd.read_excel(data_path)

    X = df[FEATURES].copy()
    y_raw = df['Smoking_Stage'].astype(str)

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    print(f"Dataset shape: {X.shape}, Classes: {label_encoder.classes_.tolist()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Baseline Logistic Regression (as specified in literature / TAF)
    print("\n--- Training Calibrated Logistic Regression ---")
    log_reg = LogisticRegression(
        C=1.0,
        class_weight='balanced',
        max_iter=1000,
        random_state=42,
        solver='lbfgs'
    )
    log_reg.fit(X_train_scaled, y_train)

    lr_preds = log_reg.predict(X_test_scaled)
    lr_acc = accuracy_score(y_test, lr_preds)
    lr_f1 = f1_score(y_test, lr_preds, average='weighted')
    print(f"Logistic Regression Test Accuracy: {lr_acc * 100:.2f}% | F1: {lr_f1:.4f}")

    # 2. Random Forest Classifier (High precision on non-linear stage boundaries)
    print("\n--- Training Random Forest Stage Classifier ---")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        class_weight='balanced',
        random_state=42
    )
    rf_model.fit(X_train, y_train)

    rf_preds = rf_model.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    rf_f1 = f1_score(y_test, rf_preds, average='weighted')
    print(f"Random Forest Test Accuracy: {rf_acc * 100:.2f}% | F1: {rf_f1:.4f}")

    # Select best model while preserving LR baseline
    best_model = rf_model if rf_acc > lr_acc else log_reg

    report_lr = classification_report(
        y_test, lr_preds, target_names=label_encoder.classes_, output_dict=True
    )
    report_rf = classification_report(
        y_test, rf_preds, target_names=label_encoder.classes_, output_dict=True
    )

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # Save package compatible with existing format
    package = {
        'model': log_reg,
        'rf_model': rf_model,
        'scaler': scaler,
        'label_encoder': label_encoder,
        'features': FEATURES,
        'classes': label_encoder.classes_.tolist(),
        'metrics': {
            'logistic_regression_acc': float(lr_acc),
            'logistic_regression_f1': float(lr_f1),
            'random_forest_acc': float(rf_acc),
            'random_forest_f1': float(rf_f1)
        }
    }

    model_path = os.path.join(output_dir, "smoking stage.pkl")
    joblib.dump(package, model_path)
    print(f"\nSaved updated model package to {model_path}")

    # Save report
    report_data = {
        "model_name": "Smoking Stage Detection Model",
        "features": FEATURES,
        "classes": label_encoder.classes_.tolist(),
        "logistic_regression_accuracy": float(lr_acc),
        "logistic_regression_f1": float(lr_f1),
        "random_forest_accuracy": float(rf_acc),
        "random_forest_f1": float(rf_f1),
        "logistic_regression_report": report_lr,
        "random_forest_report": report_rf
    }
    report_json = os.path.join(reports_dir, "smoking_stage_report.json")
    with open(report_json, 'w') as f:
        json.dump(report_data, f, indent=2)
    print(f"Saved evaluation report to {report_json}")

    return package


if __name__ == '__main__':
    train_smoking_stage_model()
