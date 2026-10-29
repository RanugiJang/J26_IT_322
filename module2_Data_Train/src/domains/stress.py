"""
Module 2 — Stress Domain
Manages autonomic nervous system recovery and psycho-cardiac interventions.
CVD Risk Connection: Prolonged acute stress (Score >= 8/10) causes severe catecholamine surge,
coronary artery spasm, and heightened pre-surgical arrhythmia susceptibility.
"""

class StressDomain:
    RELAXATION_RESOURCES = [
        {
            "title": "4-4-4 Box Breathing for Immediate Vagal Stimulation",
            "technique": "Inhale 4 seconds, Hold 4 seconds, Exhale 4 seconds (Repeat 3 times)",
            "url": "https://www.youtube.com/watch?v=tEmt1Znux58",
            "duration": "3 mins"
        },
        {
            "title": "Cardiovascular Guided Autogenic Relaxation",
            "technique": "Progressive peripheral muscle release with slow diaphragmatic breathing",
            "url": "https://www.youtube.com/watch?v=1ZYbU88VzII",
            "duration": "10 mins"
        }
    ]

    def assess_stress(self, stress_score_10, consecutive_high_days=1):
        is_high = stress_score_10 >= 8
        doctor_flag = is_high and consecutive_high_days >= 5

        if is_high:
            priority_action = "Practice 4-4-4 Box Breathing now (In 4s, Hold 4s, Out 4s × 3)"
        else:
            priority_action = "Evening 5-minute guided mindfulness to keep resting heart rate below 75 bpm"

        return {
            "domain": "Stress",
            "stress_score": stress_score_10,
            "status": "CRITICAL CVD RISK" if is_high else "Moderate / Controlled",
            "consecutive_high_days": consecutive_high_days,
            "doctor_flag_triggered": doctor_flag,
            "doctor_alert_message": (
                "CLINICAL ESCALATION: Severe stress (>= 8/10) persistent for 5+ days. "
                "Immediate cardiac nurse or psychologist review required before surgical scheduling."
                if doctor_flag else None
            ),
            "priority_action": priority_action,
            "box_breathing_guide": {
                "inhale_sec": 4,
                "hold_sec": 4,
                "exhale_sec": 4,
                "cycles": 3,
                "instructions": "Sit upright, inhale through nose for 4s, hold gently for 4s, exhale smoothly through mouth for 4s."
            },
            "relaxation_videos": self.RELAXATION_RESOURCES
        }
