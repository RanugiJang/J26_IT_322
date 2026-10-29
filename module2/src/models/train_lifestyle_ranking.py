"""
Module 2 — CVD Lifestyle Priority Ranking Model
Ensemble of XGBoost and LightGBM with Multi-Strategy Feature Weighting
Ranks which lifestyle domains (Diet, Exercise, Sleep, Smoking, Stress) need intervention most
for high-risk pre-surgery cardiovascular patients.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
import xgboost as xgb
import lightgbm as lgb


FEATURES = [
    'Age', 'Gender', 'BMI', 'Predicted_Risk_Score',
    'Moderate_Activity_Min', 'Vigorous_Activity_Min', 'Sitting_Time_Min',
    'Sleep_Hours', 'Smoking_Status',
    'Sodium_mg', 'Total_Fat_g', 'Sugar_g', 'Calories',
    'Stress_Score'
]

DOMAINS = ['Diet', 'Exercise', 'Sleep', 'Smoking', 'Stress']


def train_lifestyle_models(data_path="module2/data/Lifestyle_Model1.xlsx", output_dir="module2/models", reports_dir="module2/reports"):
    print(f"Loading data from {data_path}...")
    df = pd.read_excel(data_path)

    X = df[FEATURES].copy()
    y_raw = df['Top_Priority_Domain'].astype(str)

    # Encode labels
    label_encoder = LabelEncoder()
    label_encoder.fit(DOMAINS)
    y = label_encoder.transform(y_raw)

    print(f"Dataset shape: {X.shape}, Classes: {label_encoder.classes_.tolist()}")

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 1. Train XGBoost Model
    print("\n--- Training XGBoost Classifier ---")
    xgb_model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=5,
        n_estimators=120,
        max_depth=3,
        learning_rate=0.035,
        subsample=0.80,
        colsample_bytree=0.80,
        reg_alpha=0.5,
        reg_lambda=3.0,
        random_state=42,
        eval_metric='mlogloss'
    )
    xgb_model.fit(X_train, y_train)

    xgb_preds = xgb_model.predict(X_test)
    xgb_acc = accuracy_score(y_test, xgb_preds)
    xgb_f1 = f1_score(y_test, xgb_preds, average='weighted')
    print(f"XGBoost Test Accuracy: {xgb_acc * 100:.2f}% | Weighted F1: {xgb_f1:.4f}")

    # 2. Train LightGBM Model
    print("\n--- Training LightGBM Classifier ---")
    lgb_model = lgb.LGBMClassifier(
        objective='multiclass',
        num_class=5,
        n_estimators=120,
        max_depth=3,
        num_leaves=15,
        learning_rate=0.035,
        subsample=0.80,
        colsample_bytree=0.80,
        reg_alpha=0.5,
        reg_lambda=3.0,
        random_state=42,
        verbosity=-1
    )
    lgb_model.fit(X_train, y_train)

    lgb_preds = lgb_model.predict(X_test)
    lgb_acc = accuracy_score(y_test, lgb_preds)
    lgb_f1 = f1_score(y_test, lgb_preds, average='weighted')
    print(f"LightGBM Test Accuracy: {lgb_acc * 100:.2f}% | Weighted F1: {lgb_f1:.4f}")

    # 3. Ensemble Predictions (Weighted Average)
    print("\n--- Evaluating XGBoost + LightGBM Ensemble ---")
    xgb_probs = xgb_model.predict_proba(X_test)
    lgb_probs = lgb_model.predict_proba(X_test)
    ensemble_probs = (xgb_probs * 0.5) + (lgb_probs * 0.5)
    ensemble_preds = np.argmax(ensemble_probs, axis=1)

    ens_acc = accuracy_score(y_test, ensemble_preds)
    ens_f1 = f1_score(y_test, ensemble_preds, average='weighted')
    print(f"Ensemble Test Accuracy: {ens_acc * 100:.2f}% | Weighted F1: {ens_f1:.4f}")

    report = classification_report(
        y_test, ensemble_preds, target_names=label_encoder.classes_, output_dict=True
    )

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores_xgb = cross_val_score(xgb_model, X, y, cv=cv, scoring='accuracy')
    cv_scores_lgb = cross_val_score(lgb_model, X, y, cv=cv, scoring='accuracy')

    # Save models
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    model_package = {
        'xgb_model': xgb_model,
        'lgb_model': lgb_model,
        'label_encoder': label_encoder,
        'features': FEATURES,
        'classes': label_encoder.classes_.tolist(),
        'metrics': {
            'xgb_accuracy': float(xgb_acc),
            'lgb_accuracy': float(lgb_acc),
            'ensemble_accuracy': float(ens_acc),
            'ensemble_f1_weighted': float(ens_f1),
            'cv_mean_xgb': float(np.mean(cv_scores_xgb)),
            'cv_mean_lgb': float(np.mean(cv_scores_lgb))
        }
    }

    joblib_path = os.path.join(output_dir, "lifestyle_ranking_ensemble.joblib")
    joblib.dump(model_package, joblib_path)
    print(f"\nSaved ensemble model package to {joblib_path}")

    # Also save as model1_final.pkl in clean format for compatibility
    pkl_path = os.path.join(output_dir, "model1_final.pkl")
    joblib.dump(model_package, pkl_path)
    print(f"Updated {pkl_path} with compatible ensemble model")

    # Save JSON report
    report_data = {
        "model_name": "Lifestyle Priority Ranking Ensemble (XGBoost + LightGBM)",
        "features": FEATURES,
        "classes": label_encoder.classes_.tolist(),
        "xgb_test_accuracy": float(xgb_acc),
        "lgb_test_accuracy": float(lgb_acc),
        "ensemble_test_accuracy": float(ens_acc),
        "ensemble_f1_weighted": float(ens_f1),
        "cv_5fold_xgb": [float(s) for s in cv_scores_xgb],
        "cv_5fold_lgb": [float(s) for s in cv_scores_lgb],
        "classification_report": report,
        "feature_importances_xgb": {
            feat: float(imp) for feat, imp in zip(FEATURES, xgb_model.feature_importances_)
        },
        "feature_importances_lgb": {
            feat: float(imp) for feat, imp in zip(FEATURES, lgb_model.feature_importances_)
        }
    }

    report_json_path = os.path.join(reports_dir, "lifestyle_ranking_report.json")
    with open(report_json_path, 'w') as f:
        json.dump(report_data, f, indent=2)
    print(f"Saved evaluation metrics to {report_json_path}")

    return model_package


if __name__ == '__main__':
    train_lifestyle_models()
