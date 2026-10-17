"""
Module 2 — Sleep Domain
Assesses sleep duration and hygiene for pre-surgery cardiovascular patients.
CVD Risk Connection: Chronic sleep deprivation (< 5 hours) elevates nocturnal blood pressure,
triggers sympathetic overdrive, and spikes pre-operative troponin and cardiac events.
"""

class SleepDomain:
    def __init__(self, critical_threshold_hours=5.0):
        self.critical_threshold_hours = critical_threshold_hours

    def assess_sleep(self, sleep_hours, consecutive_low_days=1):
        is_dangerous = sleep_hours < self.critical_threshold_hours
        doctor_alert = consecutive_low_days >= 3 and is_dangerous

        guidelines = [
            "Screens and mobile phones powered off by 9:30 PM",
            "Target falling asleep before 10:00 PM for nocturnal BP dipping",
            "Maintain bedroom temperature at a cool 18°C – 20°C in total darkness",
            "Avoid caffeinated drinks and heavy sodium meals after 6:00 PM"
        ]

        if is_dangerous:
            priority_action = f"Sleep before 10:00 PM tonight (Critical: {sleep_hours}h recorded, need >= 7h)"
        else:
            priority_action = "Maintain 7-8 hours sleep window with phone off at 9:30 PM"

        return {
            "domain": "Sleep",
            "sleep_hours_recorded": sleep_hours,
            "is_dangerous": is_dangerous,
            "consecutive_low_days": consecutive_low_days,
            "doctor_alert_triggered": doctor_alert,
            "doctor_alert_message": (
                "ALERT: Patient has recorded < 5 hours of sleep for 3+ consecutive days. "
                "Significant risk of pre-operative hypertensive crisis. Notify clinical cardiac team."
                if doctor_alert else None
            ),
            "priority_action": priority_action,
            "clinical_rationale": "Deep sleep allows cardiovascular deceleration, reducing cardiac output workload and resting tachycardia.",
            "sleep_hygiene_rules": guidelines
        }
