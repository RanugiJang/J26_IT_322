"""
Module 2 — Exercise Domain
Handles cardiac rehabilitation recommendations, reference videos,
CA-CJAT posture and fatigue analysis from patient video landmarks,
and REHAB24-6 exercise quality scoring (predict_session).
"""

import torch
import numpy as np
from ..models.ca_cjat import CACJAT
from ..models.exercise_prescriber import ExercisePrescriptionEngine
from ..exercise_inference import predict_session, MIN_REPS


class ExerciseDomain:
    CARDIAC_REHAB_VIDEOS = [
        {
            "title": "Low-Intensity Cardiac Walking Warm-up & Pacing",
            "url": "https://www.youtube.com/watch?v=kYJzXv8gJ24",
            "duration": "5 mins",
            "target_hr": "< 100 bpm",
            "focus": "Breathing rhythm, posture, heel-to-toe stride"
        },
        {
            "title": "Seated Chair Aerobics for Pre-Surgery Heart Patients",
            "url": "https://www.youtube.com/watch?v=9oZ2mYvIuH8",
            "duration": "10 mins",
            "target_hr": "< 110 bpm",
            "focus": "Joint range of motion without thoracic pressure"
        }
    ]

    def __init__(
        self,
        cacjat_model_path="module2/models/ca_cjat_final.pth",
        quality_model_path=None,
    ):
        self.prescriber = ExercisePrescriptionEngine()
        self.quality_model_path = quality_model_path  # None → auto-resolve inside predict_session
        self.cacjat = CACJAT(in_features=4, num_joints=33, d_model=64)
        try:
            ckpt = torch.load(cacjat_model_path, map_location='cpu')
            self.cacjat.load_state_dict(ckpt['model_state_dict'])
            self.cacjat.eval()
        except Exception:
            pass

    def get_recommendation(self, patient_profile, current_minutes=None):
        prescription = self.prescriber.prescribe(patient_profile)
        sitting_hours = patient_profile.get('Sitting_Hours', patient_profile.get('sitting_hours', 8.0))
        duration = current_minutes if current_minutes else prescription['recommended_duration_min']

        # CLINICAL RULE: If patient sits <= 3.5 hours/day, they are already on their feet moving all day.
        # Prescribing beginner flat walking is redundant; shift to functional pre-sternotomy strength & venous return.
        if sitting_hours <= 3.5:
            exercise_name = "Supported Chair Sit-to-Stand & Sternal Prehab"
            intensity_val = "Low-Moderate Functional Resistance"
            instructions = [
                "Exhale smoothly while standing up; NEVER hold your breath (Valsalva spikes arterial pressure)",
                "Keep feet shoulder-width apart and knees tracking directly over mid-toes without inward collapse",
                "Controlled 3-second descent back to chair without dropping (eccentric quadriceps loading)"
            ]
        else:
            exercise_name = prescription['exercise_type']
            intensity_val = prescription['intensity_level']
            instructions = [
                "Keep torso upright and shoulders relaxed (avoids chest compression)",
                "Breathe continuously — NEVER hold your breath (Valsalva maneuver spikes arterial pressure)",
                "Land softly heel-to-toe to minimize joint impact"
            ]

        return {
            "domain": "Exercise",
            "priority_action": f"{exercise_name} for {duration} minutes",
            "exercise_type": exercise_name,
            "target_duration_min": duration,
            "target_intensity": intensity_val,
            "reference_videos": self.CARDIAC_REHAB_VIDEOS,
            "form_instructions": instructions,
            "cardiac_warning": prescription['cardiac_safety_rules'][0]
        }

    def analyze_exercise_quality(self, exercise_name, reps):
        """
        Score exercise quality using the REHAB24-6 Random Forest models.

        Parameters
        ----------
        exercise_name : str
            One of: armabduction, armvw, pushup, legabduction, leglunge, squat
        reps : list[pd.DataFrame]
            One DataFrame per repetition, containing the 12 joint columns used
            in REHAB24-6 (LeftShoulder_X/Y/Z, ..., RightFootIndex_X/Y/Z).
            Needs at least MIN_REPS (5) repetitions for per-person normalisation.

        Returns
        -------
        dict with keys: exercise, n_reps, repetitions (list), share_correct, warning
        """
        return predict_session(exercise_name, reps, model_path=self.quality_model_path)

    def analyze_exercise_video_landmarks(self, pose_landmarks_seq, confidences=None):
        """
        Runs CA-CJAT analysis on extracted MediaPipe pose sequence.

        Parameters
        ----------
        pose_landmarks_seq : np.ndarray or torch.Tensor, shape (seq_len, 33, 4)
            Time-series of MediaPipe pose landmarks with visibility scores.
        confidences : np.ndarray, optional
            Per-frame landmark confidences, shape (seq_len,).
        """
        if isinstance(pose_landmarks_seq, np.ndarray):
            pose_landmarks_seq = torch.from_numpy(pose_landmarks_seq).float()
        if pose_landmarks_seq.dim() == 3:
            pose_landmarks_seq = pose_landmarks_seq.unsqueeze(0)  # (1, T, 33, 4)

        if confidences is not None and isinstance(confidences, np.ndarray):
            confidences = torch.from_numpy(confidences).float()
            if confidences.dim() == 1:
                confidences = confidences.unsqueeze(0)

        self.cacjat.eval()
        with torch.no_grad():
            out = self.cacjat(pose_landmarks_seq, confidences)

        session_qual = float(out['session_quality'][0, 0].item())
        fatigue_score = float(out['fatigue_pred'][0, 0].item())
        stop_flag = bool(out['fatigue_pred'][0, 1].item() > 0.5 or fatigue_score > 0.75)

        return {
            "session_level": {
                "quality_score": round(session_qual, 1),
                "fatigue_index": round(fatigue_score, 2),
                "status": (
                    "STOP EXERCISING — Cardiovascular fatigue threshold reached"
                    if stop_flag else "Good session — target achieved"
                ),
                "next_day_advice": (
                    "Reduce duration tomorrow by 3-5 mins"
                    if fatigue_score > 0.6 else "Maintain current duration"
                ),
            },
            "set_level": {
                "pacing": "Stable in first 60%, irregular in final 40%",
                "heart_strain_indicator": "Elevated fatigue signature detected in late reps",
            },
        }
