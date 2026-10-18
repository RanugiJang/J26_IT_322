"""
Unit Tests for Module 2 Domains & End-to-End Pipeline
"""

import pytest
import numpy as np

from module2.src.domains.sleep import SleepDomain
from module2.src.domains.stress import StressDomain
from module2.src.domains.smoking import SmokingDomain
from module2.src.domains.diet import DietDomain
from module2.src.pipeline.lifestyle_engine import CVDLifestyleCoachEngine


def test_sleep_domain_alerts():
    sleep_dom = SleepDomain(critical_threshold_hours=5.0)

    # 1 day of low sleep -> no doctor alert yet
    res1 = sleep_dom.assess_sleep(4.0, consecutive_low_days=1)
    assert res1['is_dangerous'] is True
    assert res1['doctor_alert_triggered'] is False

    # 3 days of low sleep -> doctor alert triggered
    res3 = sleep_dom.assess_sleep(4.0, consecutive_low_days=3)
    assert res3['is_dangerous'] is True
    assert res3['doctor_alert_triggered'] is True
    assert "ALERT" in res3['doctor_alert_message']


def test_stress_domain_escalation():
    stress_dom = StressDomain()

    # 2 days of high stress -> no doctor flag yet
    res2 = stress_dom.assess_stress(8, consecutive_high_days=2)
    assert res2['status'] == "CRITICAL CVD RISK"
    assert res2['doctor_flag_triggered'] is False
    assert "Box Breathing" in res2['priority_action']

    # 5 days of high stress -> doctor flag triggered
    res5 = stress_dom.assess_stress(9, consecutive_high_days=5)
    assert res5['doctor_flag_triggered'] is True
    assert "CLINICAL ESCALATION" in res5['doctor_alert_message']


def test_smoking_domain_plan():
    smoke_dom = SmokingDomain()
    plan = smoke_dom.get_cessation_plan(cigarettes_current=8, current_week=1)
    assert plan['target_cigarettes_today'] < 8
    assert len(plan['weekly_schedule']) == 4
    assert len(plan['craving_tips']) >= 3


def test_diet_domain_swaps():
    diet_dom = DietDomain()
    res = diet_dom.get_dietary_prescription(sodium_mg=3000, total_fat_g=90, sugar_g=60)
    assert "King Coconut" in res['priority_action'] or "Thambili" in res['priority_action'] or "fish" in res['priority_action']
    assert len(res['cultural_swaps']) >= 3
    assert len(res['sri_lankan_recipes']) >= 3


def test_end_to_end_lifestyle_engine():
    engine = CVDLifestyleCoachEngine()
    profile = {
        'Age': 48, 'Gender': 1, 'BMI': 31.0,
        'Sitting_Hours': 9.0, 'Moderate_Activity_Min': 0,
        'Sleep_Hours': 4.0, 'Consecutive_Low_Sleep_Days': 3,
        'Stress_Score': 8, 'Consecutive_High_Stress_Days': 1,
        'Cigarettes_Per_Day': 8, 'Smoking_Status': 2,
        'Sodium_mg': 3000, 'Total_Fat_g': 80, 'Sugar_g': 60, 'Calories': 2400,
        'Predicted_Risk_Score': 0.75, 'Risk_Trajectory': 'Increasing'
    }
    plan = engine.generate_daily_recommendation_plan(profile, current_day=1)
    assert len(plan['top_3_today']) == 3
    assert len(plan['clinical_flags']) > 0
    assert 'exercise' in plan['full_domain_guidance']
    assert 'sleep' in plan['full_domain_guidance']
