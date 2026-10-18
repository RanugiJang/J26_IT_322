"""
SQLite Database Layer for CardioCare AI
Zero-dependency, uses Python's built-in sqlite3.
Stores:
  1. Patients (demographics, biomarkers, clinical risk, lifestyle profile)
  2. Generated Daily Care Plans
  3. Adherence Logs & DQN RL Feedback history
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = Path(__file__).resolve().parent / "cardiocare.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes SQLite database tables and applies non-destructive migrations."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Patients Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                bmi REAL NOT NULL,
                height_cm REAL,
                weight_kg REAL,
                occupation TEXT,
                sitting_hours REAL DEFAULT 6.0,
                activity_level TEXT DEFAULT 'Sedentary',
                walking_minutes INTEGER DEFAULT 10,
                cigarettes_per_day INTEGER DEFAULT 0,
                sleep_hours REAL DEFAULT 7.0,
                consecutive_low_sleep_days INTEGER DEFAULT 0,
                stress_score REAL DEFAULT 5.0,
                consecutive_high_stress_days INTEGER DEFAULT 0,
                predicted_risk_score REAL DEFAULT 0.50,
                risk_category TEXT DEFAULT 'MODERATE',
                risk_trajectory TEXT DEFAULT 'Stable',
                surgical_timeline_days INTEGER DEFAULT 30,
                procedure_type TEXT,
                sodium_mg REAL DEFAULT 2400,
                total_fat_g REAL DEFAULT 70,
                sugar_g REAL DEFAULT 45,
                calories REAL DEFAULT 2100,
                diet_pattern TEXT DEFAULT 'Sri Lankan Traditional',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add any columns if table was created earlier without them
        columns_to_ensure = [
            ("activity_level", "TEXT DEFAULT 'Sedentary'"),
            ("walking_minutes", "INTEGER DEFAULT 10"),
            ("diet_pattern", "TEXT DEFAULT 'Sri Lankan Traditional'"),
        ]
        for col_name, col_type in columns_to_ensure:
            try:
                cursor.execute(f"ALTER TABLE patients ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError:
                pass  # Column already exists

        # 2. Daily Generated Plans Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                day_num INTEGER DEFAULT 1,
                top_3_json TEXT NOT NULL,
                domain_rankings_json TEXT,
                clinical_flags_json TEXT,
                current_action_idx INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)

        # 3. Adherence & DQN Feedback Logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS adherence_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                day_num INTEGER DEFAULT 1,
                action_id TEXT NOT NULL,
                domain TEXT NOT NULL,
                action_title TEXT NOT NULL,
                feedback TEXT NOT NULL, -- 'done', 'too_hard', 'skipped'
                reward_value REAL,
                dqn_adaptation_note TEXT,
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)

        # 4. Exercise Video Analysis Sessions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS exercise_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                video_filename TEXT,
                prescribed_exercise_id TEXT,
                prescribed_title TEXT,
                detected_exercise TEXT,
                is_mismatch BOOLEAN DEFAULT 0,
                mismatch_warning TEXT,
                overall_form_score REAL,
                fatigue_index REAL,
                cadence_bpm REAL,
                cadence_label TEXT,
                avg_spine_angle REAL,
                avg_knee_angle REAL,
                reps_detected INTEGER,
                form_state TEXT,
                metrics_json TEXT,
                feedback_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )
        """)

        conn.commit()


# --- Patient Database Operations ---

def save_patient(p: Dict[str, Any]) -> Dict[str, Any]:
    """Inserts or updates a patient in the database."""
    patient_id = p.get("id") or f"P-{int(datetime.now().timestamp()) % 100000}"
    name = (p.get("name") or "").strip() or f"Patient {patient_id}"

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO patients (
                id, name, age, gender, bmi, height_cm, weight_kg, occupation,
                sitting_hours, activity_level, walking_minutes, cigarettes_per_day,
                sleep_hours, consecutive_low_sleep_days, stress_score,
                consecutive_high_stress_days, predicted_risk_score, risk_category,
                risk_trajectory, surgical_timeline_days, procedure_type,
                sodium_mg, total_fat_g, sugar_g, calories, diet_pattern, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                age=excluded.age,
                gender=excluded.gender,
                bmi=excluded.bmi,
                height_cm=excluded.height_cm,
                weight_kg=excluded.weight_kg,
                occupation=excluded.occupation,
                sitting_hours=excluded.sitting_hours,
                activity_level=excluded.activity_level,
                walking_minutes=excluded.walking_minutes,
                cigarettes_per_day=excluded.cigarettes_per_day,
                sleep_hours=excluded.sleep_hours,
                consecutive_low_sleep_days=excluded.consecutive_low_sleep_days,
                stress_score=excluded.stress_score,
                consecutive_high_stress_days=excluded.consecutive_high_stress_days,
                predicted_risk_score=excluded.predicted_risk_score,
                risk_category=excluded.risk_category,
                risk_trajectory=excluded.risk_trajectory,
                surgical_timeline_days=excluded.surgical_timeline_days,
                procedure_type=excluded.procedure_type,
                sodium_mg=excluded.sodium_mg,
                total_fat_g=excluded.total_fat_g,
                sugar_g=excluded.sugar_g,
                calories=excluded.calories,
                diet_pattern=excluded.diet_pattern,
                updated_at=CURRENT_TIMESTAMP
        """, (
            patient_id,
            name,
            int(p.get("age", 50)),
            p.get("gender", "Male"),
            float(p.get("bmi", 26.0)),
            float(p.get("heightCm") or p.get("height_cm", 170.0)),
            float(p.get("weightKg") or p.get("weight_kg", 75.0)),
            p.get("occupation", "Patient"),
            float(p.get("sittingHours") or p.get("sitting_hours", 6.0)),
            p.get("activityLevel") or p.get("activity_level", "Sedentary"),
            int(p.get("walkingMinutes") or p.get("walking_minutes", 10)),
            int(p.get("cigarettesPerDay") or p.get("cigarettes_per_day", 0)),
            float(p.get("sleepHours") or p.get("sleep_hours", 7.0)),
            int(p.get("consecutiveLowSleepDays") or p.get("consecutive_low_sleep_days", 0)),
            float(p.get("stressScore") or p.get("stress_score", 5.0)),
            int(p.get("consecutiveHighStressDays") or p.get("consecutive_high_stress_days", 0)),
            float(p.get("predictedRiskScore") or p.get("predicted_risk_score", 0.50)),
            p.get("riskCategory") or p.get("risk_category", "MODERATE"),
            p.get("riskTrajectory") or p.get("risk_trajectory", "Stable"),
            int(p.get("surgicalTimelineDays") or p.get("surgical_timeline_days", 30)),
            p.get("procedureType") or p.get("procedure_type", "Elective Cardiac Surgery"),
            float(p.get("sodiumMg") or p.get("sodium_mg", 2400.0)),
            float(p.get("totalFatG") or p.get("total_fat_g", 70.0)),
            float(p.get("sugarG") or p.get("sugar_g", 45.0)),
            float(p.get("calories", 2100.0)),
            p.get("dietPattern") or p.get("diet_pattern", "Sri Lankan Traditional")
        ))
        conn.commit()

    return get_patient_by_id(patient_id)


def get_patient_by_id(patient_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return _format_patient_dict(dict(row))


def get_all_patients() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        return [_format_patient_dict(dict(row)) for row in rows]


def get_latest_patient() -> Optional[Dict[str, Any]]:
    """Retrieves the most recently entered/updated patient."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients ORDER BY updated_at DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        return _format_patient_dict(dict(row))


def _format_patient_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes db row to support both camelCase (frontend) and snake_case (backend)."""
    height_cm = d.get("height_cm", 170.0)
    weight_kg = d.get("weight_kg", 70.0)
    occupation = d.get("occupation", "Desk Job")
    activity_level = d.get("activity_level", "Sedentary")
    walking_minutes = d.get("walking_minutes", 10)
    sodium_mg = d.get("sodium_mg", 2400.0)
    total_fat_g = d.get("total_fat_g", 70.0)
    sugar_g = d.get("sugar_g", 45.0)
    calories = d.get("calories", 2100.0)
    diet_pattern = d.get("diet_pattern", "Sri Lankan Traditional")

    res = {
        # camelCase for TypeScript/React frontend
        "id": d["id"],
        "name": d["name"],
        "age": d["age"],
        "gender": d["gender"],
        "bmi": d["bmi"],
        "heightCm": height_cm,
        "weightKg": weight_kg,
        "occupation": occupation,
        "sittingHours": d["sitting_hours"],
        "activityLevel": activity_level,
        "walkingMinutes": walking_minutes,
        "cigarettesPerDay": d["cigarettes_per_day"],
        "sleepHours": d["sleep_hours"],
        "consecutiveLowSleepDays": d["consecutive_low_sleep_days"],
        "stressScore": d["stress_score"],
        "consecutiveHighStressDays": d["consecutive_high_stress_days"],
        "predictedRiskScore": d["predicted_risk_score"],
        "riskCategory": d["risk_category"],
        "riskTrajectory": d["risk_trajectory"],
        "surgicalTimelineDays": d["surgical_timeline_days"],
        "procedureType": d["procedure_type"],
        "sodiumMg": sodium_mg,
        "totalFatG": total_fat_g,
        "sugarG": sugar_g,
        "calories": calories,
        "dietPattern": diet_pattern,
        "createdAt": d.get("created_at"),
        "updatedAt": d.get("updated_at"),

        # snake_case aliases for Python pipeline models
        "height_cm": height_cm,
        "weight_kg": weight_kg,
        "sitting_hours": d["sitting_hours"],
        "activity_level": activity_level,
        "walking_minutes": walking_minutes,
        "cigarettes_per_day": d["cigarettes_per_day"],
        "sleep_hours": d["sleep_hours"],
        "consecutive_low_sleep_days": d["consecutive_low_sleep_days"],
        "stress_score": d["stress_score"],
        "consecutive_high_stress_days": d["consecutive_high_stress_days"],
        "predicted_risk_score": d["predicted_risk_score"],
        "risk_category": d["risk_category"],
        "risk_trajectory": d["risk_trajectory"],
        "surgical_timeline_days": d["surgical_timeline_days"],
        "procedure_type": d["procedure_type"],
        "sodium_mg": sodium_mg,
        "total_fat_g": total_fat_g,
        "sugar_g": sugar_g,
        "diet_pattern": diet_pattern,
    }
    return res


# --- Plan & Adherence Operations ---

def save_daily_plan(patient_id: str, day_num: int, top_3: list, domain_rankings: dict, clinical_flags: list, action_idx: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO daily_plans (
                patient_id, day_num, top_3_json, domain_rankings_json,
                clinical_flags_json, current_action_idx
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            day_num,
            json.dumps(top_3),
            json.dumps(domain_rankings),
            json.dumps(clinical_flags),
            action_idx
        ))
        conn.commit()


def get_latest_plan_for_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves the latest generated care plan for a patient from SQLite."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM daily_plans WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1
        """, (patient_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        return {
            "id": d["id"],
            "patient_id": d["patient_id"],
            "day_num": d["day_num"],
            "top_3_today": json.loads(d["top_3_json"]),
            "domain_priority_ranking": json.loads(d["domain_rankings_json"]) if d["domain_rankings_json"] else {},
            "clinical_flags": json.loads(d["clinical_flags_json"]) if d["clinical_flags_json"] else [],
            "current_exercise_action_idx": d["current_action_idx"],
            "created_at": d["created_at"]
        }


def log_adherence_feedback(
    patient_id: str,
    action_id: str,
    domain: str,
    action_title: str,
    feedback: str,
    reward_value: float,
    dqn_note: str,
    day_num: int = 1
):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO adherence_logs (
                patient_id, day_num, action_id, domain, action_title,
                feedback, reward_value, dqn_adaptation_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            day_num,
            action_id,
            domain,
            action_title,
            feedback,
            reward_value,
            dqn_note
        ))
        conn.commit()


def get_patient_history(patient_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM adherence_logs WHERE patient_id = ? ORDER BY logged_at DESC
        """, (patient_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def save_exercise_session(
    patient_id: str,
    video_filename: str,
    prescribed_exercise_id: str,
    prescribed_title: str,
    detected_exercise: str,
    is_mismatch: bool,
    mismatch_warning: Optional[str],
    overall_form_score: float,
    fatigue_index: float,
    cadence_bpm: float,
    cadence_label: str,
    avg_spine_angle: float,
    avg_knee_angle: float,
    reps_detected: int,
    form_state: str,
    metrics: Dict[str, Any],
    feedback_text: str
) -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO exercise_sessions (
                patient_id, video_filename, prescribed_exercise_id, prescribed_title,
                detected_exercise, is_mismatch, mismatch_warning, overall_form_score,
                fatigue_index, cadence_bpm, cadence_label, avg_spine_angle, avg_knee_angle,
                reps_detected, form_state, metrics_json, feedback_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            video_filename,
            prescribed_exercise_id,
            prescribed_title,
            detected_exercise,
            1 if is_mismatch else 0,
            mismatch_warning,
            overall_form_score,
            fatigue_index,
            cadence_bpm,
            cadence_label,
            avg_spine_angle,
            avg_knee_angle,
            reps_detected,
            form_state,
            json.dumps(metrics),
            feedback_text
        ))
        conn.commit()
        session_id = cursor.lastrowid
        return {
            "session_id": session_id,
            "patient_id": patient_id,
            "overall_form_score": overall_form_score,
            "is_mismatch": is_mismatch,
            "detected_exercise": detected_exercise
        }


def get_exercise_sessions(patient_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM exercise_sessions WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?
        """, (patient_id, limit))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["is_mismatch"] = bool(d["is_mismatch"])
            d["metrics"] = json.loads(d["metrics_json"]) if d["metrics_json"] else {}
            result.append(d)
        return result


# Initialize schema on module import
init_db()
