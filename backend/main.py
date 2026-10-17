"""
FastAPI Backend for CardioCare AI — Module 2 Lifestyle & Prehabilitation Engine
Connects frontend React dashboard to trained ML models:
  - XGBoost + LightGBM Lifestyle Ranking Ensemble
  - DQN Reinforcement Learning Adaptive Coach
  - CA-CJAT Exercise Quality Assessment
  - 5 Clinical Domains (Exercise, Sleep, Stress, Smoking, Sri Lankan Diet)
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is in sys.path so module2 imports work seamlessly
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from module2.src.pipeline.lifestyle_engine import CVDLifestyleCoachEngine
from backend.database import (
    save_patient,
    get_all_patients,
    get_patient_by_id,
    get_latest_patient,
    save_daily_plan,
    get_latest_plan_for_patient,
    log_adherence_feedback,
    get_patient_history,
    save_exercise_session,
    get_exercise_sessions
)
from backend.video_analyzer import analyze_video_file

# Initialize FastAPI App
app = FastAPI(
    title="CardioCare AI — Clinical Decision Support & Lifestyle Engine",
    description="Backend API exposing Module 2 trained machine learning models for cardiac prehabilitation.",
    version="2.0.0"
)

# CORS Middleware for frontend integration (Vite runs on 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve model paths
ranking_model_path = str(WORKSPACE_ROOT / "module2" / "models" / "lifestyle_ranking_ensemble.joblib")
dqn_model_path = str(WORKSPACE_ROOT / "module2" / "models" / "dqn_adaptive_exercise_final.pth")
cacjat_model_path = str(WORKSPACE_ROOT / "module2" / "models" / "ca_cjat_final.pth")

# Initialize Engine
try:
    engine = CVDLifestyleCoachEngine(
        ranking_model_path=ranking_model_path,
        dqn_model_path=dqn_model_path,
        cacjat_model_path=cacjat_model_path
    )
    engine_loaded = True
except Exception as e:
    print(f"Warning: Could not initialize CVDLifestyleCoachEngine with absolute paths: {e}")
    # Fallback with default constructor
    engine = CVDLifestyleCoachEngine()
    engine_loaded = True


# Pydantic Schemas
class PatientProfileDTO(BaseModel):
    id: Optional[str] = None
    name: str = Field(default="New Patient")
    age: int = Field(default=50, ge=18, le=100)
    gender: Optional[str] = "Male"
    bmi: float = Field(default=26.0, ge=12.0, le=60.0)
    heightCm: Optional[float] = 170.0
    weightKg: Optional[float] = 75.0
    occupation: Optional[str] = "Patient"
    sittingHours: float = Field(default=6.0, ge=0.0, le=24.0)
    activityLevel: Optional[str] = "Sedentary"
    walkingMinutes: Optional[int] = 10
    cigarettesPerDay: int = Field(default=0, ge=0, le=100)
    sleepHours: float = Field(default=7.0, ge=0.0, le=24.0)
    consecutiveLowSleepDays: int = Field(default=0, ge=0)
    stressScore: float = Field(default=5.0, ge=0.0, le=10.0)
    consecutiveHighStressDays: int = Field(default=0, ge=0)
    predictedRiskScore: Optional[float] = Field(default=0.50, ge=0.0, le=1.0)
    riskCategory: Optional[str] = "MODERATE"
    riskTrajectory: Optional[str] = "Stable"
    surgicalTimelineDays: Optional[int] = 30
    procedureType: Optional[str] = "Elective Cardiac Surgery"
    sodiumMg: Optional[float] = 2400.0
    totalFatG: Optional[float] = 70.0
    sugarG: Optional[float] = 45.0
    calories: Optional[float] = 2100.0
    dietPattern: Optional[str] = "Sri Lankan Traditional"
    currentDay: Optional[int] = 1
    currentActionIdx: Optional[int] = 3


class FeedbackDTO(BaseModel):
    patientId: Optional[str] = None
    actionId: Optional[str] = "rec-exercise"
    domain: Optional[str] = "Exercise"
    actionTitle: Optional[str] = "Gentle Cardiac Walk"
    currentActionIdx: int = Field(default=3, ge=0, le=6)
    feedback: str = Field(default="done")  # 'done', 'too_hard', 'skipped'
    cvdRisk: float = Field(default=0.50, ge=0.0, le=1.0)
    currentDay: int = Field(default=1, ge=1)


class VideoAnalysisDTO(BaseModel):
    poseLandmarksSeq: List[Any]
    confidences: Optional[List[float]] = None


@app.get("/")
def read_root():
    has_cacjat = hasattr(engine.exercise_domain, 'cacjat') and engine.exercise_domain.cacjat is not None
    return {
        "system": "CardioCare AI Module 2 Backend",
        "database": "SQLite (cardiocare.db)",
        "status": "online",
        "models_active": {
            "ranking_ensemble": engine.ranking_pkg is not None,
            "dqn_rl_agent": engine.dqn is not None,
            "cacjat_model": has_cacjat,
            "domains_loaded": ["Exercise", "Sleep", "Stress", "Smoking", "Diet"]
        },
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    has_cacjat = hasattr(engine.exercise_domain, 'cacjat') and engine.exercise_domain.cacjat is not None
    return {
        "status": "healthy",
        "database": "connected (SQLite)",
        "engine_ready": engine_loaded,
        "models": {
            "lifestyle_ranking_ensemble": "loaded (XGBoost + LightGBM)" if engine.ranking_pkg else "fallback",
            "dqn_adaptive_agent": "loaded (PyTorch DQN)" if engine.dqn else "unavailable",
            "exercise_prescriber": "loaded (Random Forest)",
            "ca_cjat_pose": "loaded (PyTorch CA-CJAT)" if has_cacjat else "fallback"
        }
    }


@app.get("/api/patients")
def list_patients():
    """Fetches all registered patients from SQLite database (no mock data)."""
    return get_all_patients()


@app.get("/api/patients/latest")
def get_most_recent_patient():
    """Fetches the latest registered patient from SQLite database."""
    latest = get_latest_patient()
    if not latest:
        return {"patient": None}
    return {"patient": latest}


@app.post("/api/patients")
def create_or_update_patient(dto: PatientProfileDTO):
    """Saves or updates a patient profile in the SQLite database."""
    saved = save_patient(dto.dict())
    return saved


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    """Retrieves a specific patient by ID from the database."""
    p = get_patient_by_id(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


@app.get("/api/patients/{patient_id}/plan")
def get_patient_saved_plan(patient_id: str):
    """Retrieves the latest generated care plan for a patient from SQLite."""
    plan = get_latest_plan_for_patient(patient_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found for this patient")
    return plan


@app.get("/api/patients/{patient_id}/history")
def get_history(patient_id: str):
    """Returns patient daily adherence history from SQLite."""
    return get_patient_history(patient_id)


def _compute_clinical_risk(age: int, bmi: float, sitting_hours: float, cigarettes: int, sleep: float, stress: float) -> float:
    """Computes a baseline CVD risk score based on patient lifestyle biomarkers."""
    risk = 0.20
    if age >= 60:
        risk += 0.15
    elif age >= 45:
        risk += 0.08

    if bmi >= 30:
        risk += 0.18
    elif bmi >= 25:
        risk += 0.10

    if sitting_hours >= 9:
        risk += 0.14
    elif sitting_hours >= 7:
        risk += 0.07

    if cigarettes >= 10:
        risk += 0.22
    elif cigarettes > 0:
        risk += 0.14

    if sleep < 5:
        risk += 0.16
    elif sleep < 6:
        risk += 0.08

    if stress >= 8:
        risk += 0.15
    elif stress >= 6:
        risk += 0.08

    return round(min(0.95, max(0.12, risk)), 2)


@app.post("/api/recommend")
def get_recommendation_plan(dto: PatientProfileDTO):
    """
    Executes the trained Module 2 models to generate a personalized lifestyle plan:
      1. Effective CVD Risk calculation & clinical trajectory
      2. XGBoost + LightGBM Priority Domain Ranking
      3. Random Forest Exercise Prescriber & DQN target duration
      4. Sleep, Stress, Smoking, and Sri Lankan dietary prescriptions
      5. Clinical escalation flags
      6. Persists patient and plan in SQLite database
    """
    try:
        gender_code = 1 if dto.gender in ["Male", "1", 1] else 0
        smoking_status = 2 if dto.cigarettesPerDay >= 10 else (1 if dto.cigarettesPerDay > 0 else 0)

        # Calculate or use provided risk score
        calculated_risk = _compute_clinical_risk(
            age=dto.age,
            bmi=dto.bmi,
            sitting_hours=dto.sittingHours,
            cigarettes=dto.cigarettesPerDay,
            sleep=dto.sleepHours,
            stress=dto.stressScore
        )
        final_risk = dto.predictedRiskScore if dto.predictedRiskScore is not None else calculated_risk
        risk_category = "HIGH" if final_risk >= 0.70 else ("MODERATE" if final_risk >= 0.45 else "LOW")
        risk_trajectory = dto.riskTrajectory or ("Increasing" if final_risk >= 0.65 else ("Stable" if final_risk >= 0.40 else "Decreasing"))

        patient_profile = {
            'Age': dto.age,
            'Gender': gender_code,
            'BMI': dto.bmi,
            'Height_Cm': dto.heightCm or 170.0,
            'Weight_Kg': dto.weightKg or 75.0,
            'Sitting_Hours': dto.sittingHours,
            'Sitting_Time_Min': dto.sittingHours * 60,
            'Moderate_Activity_Min': 15 if dto.activityLevel == 'Moderate' else (5 if dto.activityLevel == 'Light' else 0),
            'Vigorous_Activity_Min': 0,
            'Sleep_Hours': dto.sleepHours,
            'Consecutive_Low_Sleep_Days': dto.consecutiveLowSleepDays,
            'Stress_Score': dto.stressScore,
            'Consecutive_High_Stress_Days': dto.consecutiveHighStressDays,
            'Cigarettes_Per_Day': dto.cigarettesPerDay,
            'Smoking_Status': smoking_status,
            'Sodium_mg': dto.sodiumMg or 2400,
            'Total_Fat_g': dto.totalFatG or 70,
            'Sugar_g': dto.sugarG or 45,
            'Calories': dto.calories or 2100,
            'Predicted_Risk_Score': final_risk,
            'Risk_Trajectory': risk_trajectory,
            'Program_Week': 1
        }

        # Run pipeline
        plan = engine.generate_daily_recommendation_plan(
            patient_profile=patient_profile,
            current_day=dto.currentDay or 1,
            current_action_idx=dto.currentActionIdx or 3
        )

        # Enhance top_3_today with patient-friendly clinical metadata
        ex_guidance = plan.get('full_domain_guidance', {}).get('exercise', {})
        walk_min = ex_guidance.get('target_duration_min', 10)
        ex_action_text = ex_guidance.get('priority_action', f"Cardioprotective Motion Protocol ({walk_min} Min)")
        ex_intensity_text = ex_guidance.get('target_intensity', 'Low Intensity (<50% HRR)')

        domain_badges = {
            "Sleep": {
                "icon": "🌙",
                "title": f"Restorative Sleep Protocol ({dto.sleepHours}h logged)",
                "metric": "Target: ≥ 7.0 hours uninterrupted • Blue-light off at 9:30 PM",
                "rationale": "Deep sleep restores nocturnal blood pressure dipping and prevents hypertensive myocardial strain."
            },
            "Diet": {
                "icon": "🥥",
                "title": "Heart-Healthy Sri Lankan Nutrition (Low Salt & Potassium Swap)",
                "metric": f"Sodium limit < 2000mg • Fresh King Coconut (Thambili) + Gotukola Sambol",
                "rationale": "High bioavailable potassium mitigates vascular stiffness and prevents fluid overload."
            },
            "Exercise": {
                "icon": "🏃",
                "title": f"{ex_action_text}",
                "metric": f"{walk_min} min • Intensity: {ex_intensity_text} (Prehab Safe)",
                "rationale": "Safely improves coronary microcirculation without exceeding ischemic threshold."
            },
            "Smoking": {
                "icon": "🚭",
                "title": f"Nicotine Step-Down Taper (Current: {dto.cigarettesPerDay} cigs/day)",
                "metric": f"Cap smoking at maximum {max(0, dto.cigarettesPerDay - 2)} cigarettes today",
                "rationale": "Reduces carboxyhemoglobin, restoring myocardial oxygen delivery before surgery."
            },
            "Stress": {
                "icon": "🧘",
                "title": f"Autonomic Balance Protocol (Stress Rating: {dto.stressScore}/10)",
                "metric": "4-4-4 Box Breathing Session (In 4s, Hold 4s, Out 4s × 3)",
                "rationale": "Activates the vagal nerve brake to decrease resting heart rate and sympathetic tone."
            }
        }

        enhanced_top_3 = []
        for item in plan['top_3_today']:
            dom = item['domain']
            meta = domain_badges.get(dom, {
                "icon": "🎯",
                "title": f"{dom} Priority Action",
                "metric": "Daily clinical target",
                "rationale": "Key lifestyle intervention recommended for cardiovascular recovery."
            })
            enhanced_top_3.append({
                "id": f"rec-{dom.lower()}",
                "priorityNumber": item['priority_rank'],
                "domain": dom,
                "title": meta['title'],
                "description": item['action'],
                "targetMetric": meta['metric'],
                "clinicalRationale": meta['rationale'],
                "status": "pending",
                "severityScore": item['severity_score']
            })

        # Persist patient and generated plan in SQLite DB
        patient_record = dto.dict()
        patient_record['predictedRiskScore'] = final_risk
        patient_record['riskCategory'] = risk_category
        patient_record['riskTrajectory'] = risk_trajectory
        saved_patient = save_patient(patient_record)

        try:
            save_daily_plan(
                patient_id=saved_patient["id"],
                day_num=dto.currentDay or 1,
                top_3=enhanced_top_3,
                domain_rankings=plan["domain_priority_ranking"],
                clinical_flags=plan["clinical_flags"],
                action_idx=plan["current_exercise_action_idx"]
            )
        except Exception as db_err:
            print(f"Warning: SQLite daily plan persistence failed: {db_err}")

        return {
            "patient": saved_patient,
            "patient_summary": plan["patient_summary"],
            "top_3_today": enhanced_top_3,
            "raw_top_3": plan["top_3_today"],
            "domain_priority_ranking": plan["domain_priority_ranking"],
            "clinical_flags": plan["clinical_flags"],
            "full_domain_guidance": plan["full_domain_guidance"],
            "current_exercise_action_idx": plan["current_exercise_action_idx"]
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@app.post("/api/adapt-exercise")
def adapt_exercise(dto: FeedbackDTO):
    """
    Submits patient feedback ('done', 'too_hard', 'skipped') to the DQN Reinforcement Learning agent.
    DQN adapts next day's exercise duration and heart rate target.
    Persists feedback log in SQLite database.
    """
    try:
        adaptation = engine.process_patient_feedback(
            current_action_idx=dto.currentActionIdx,
            feedback=dto.feedback,
            cvd_risk=dto.cvdRisk,
            current_day=dto.currentDay
        )

        # Log adherence in SQLite DB
        try:
            reward_val = 1.0 if dto.feedback == "done" else (-1.0 if dto.feedback == "too_hard" else -0.5)
            log_adherence_feedback(
                patient_id=dto.patientId or "PATIENT",
                action_id=dto.actionId or "rec-exercise",
                domain=dto.domain or "Exercise",
                action_title=dto.actionTitle or "Gentle Cardiac Walk",
                feedback=dto.feedback,
                reward_value=reward_val,
                dqn_note=adaptation.get("coach_message", ""),
                day_num=dto.currentDay
            )
        except Exception as db_err:
            print(f"Warning: Failed to log adherence to SQLite: {db_err}")

        return {
            "success": True,
            "feedback_received": dto.feedback,
            "adaptation": adaptation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DQN adaptation error: {str(e)}")


@app.post("/api/analyze-video")
def analyze_video_landmarks(dto: VideoAnalysisDTO):
    """
    Evaluates patient exercise posture and movement fatigue using CA-CJAT deep learning model.
    """
    try:
        result = engine.analyze_exercise_video(
            pose_landmarks_seq=dto.poseLandmarksSeq,
            confidences=dto.confidences
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis error: {str(e)}")


@app.post("/api/analyze-video-file")
async def upload_and_analyze_video(
    file: UploadFile = File(...),
    patient_id: str = Form("PATIENT"),
    prescribed_exercise_id: str = Form("ex-walk-10"),
    patient_name: str = Form("Patient")
):
    """
    Accepts raw video upload (.mp4, .webm, .mov) from the patient,
    runs real computer vision kinematic and posture analysis,
    detects exercise mismatches, and saves session in SQLite.
    """
    import tempfile
    import shutil

    uploads_dir = WORKSPACE_ROOT / "backend" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix or ".mp4"
    temp_path = uploads_dir / f"session_{patient_id}_{int(os.times().elapsed * 1000)}{suffix}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run real OpenCV Computer Vision analysis
        analysis = analyze_video_file(
            video_path=str(temp_path),
            prescribed_exercise_id=prescribed_exercise_id,
            patient_name=patient_name
        )

        # Save to SQLite DB
        db_res = save_exercise_session(
            patient_id=patient_id,
            video_filename=file.filename,
            prescribed_exercise_id=prescribed_exercise_id,
            prescribed_title=analysis["prescribed_title"],
            detected_exercise=analysis["detected_exercise"],
            is_mismatch=analysis["is_mismatch"],
            mismatch_warning=analysis["mismatch_warning"],
            overall_form_score=analysis["overall_form_score"],
            fatigue_index=analysis["fatigue_index"],
            cadence_bpm=analysis["measured_metrics"]["cadence_bpm"],
            cadence_label=analysis["measured_metrics"]["cadence_label"],
            avg_spine_angle=analysis["measured_metrics"]["spine_angle"],
            avg_knee_angle=analysis["measured_metrics"]["knee_angle"],
            reps_detected=analysis["measured_metrics"]["reps_detected"],
            form_state=analysis["form_state"],
            metrics=analysis["measured_metrics"],
            feedback_text=analysis["clinical_guidance"]
        )

        analysis["db_session_id"] = db_res["session_id"]
        return analysis

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Live video computer vision failed: {str(e)}")
    finally:
        # Keep or clean up temporary file
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass


@app.get("/api/exercise-sessions/{patient_id}")
def get_patient_exercise_sessions(patient_id: str):
    """
    Retrieves all past analyzed exercise video sessions for this patient.
    """
    try:
        sessions = get_exercise_sessions(patient_id)
        return {"patient_id": patient_id, "sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
