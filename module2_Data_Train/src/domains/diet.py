"""
Module 2 — Diet Domain (Sri Lankan Context)
Provides heart-healthy dietary interventions using the Sri Lankan Food Composition Database
and the Rule-Based Diet Recommender (Diet_Lookup_Combined_Final.xlsx).
Addresses high sodium, trans fats, refined sugar, and deep-fried staples.
Implements culturally authentic cardioprotective substitutions.
"""

import os
import pandas as pd
from ..diet_recommender import recommend_swap, load_table, LOW_THRESHOLDS, VALID_METRICS


class DietDomain:
    # Key substitutions specified in research proposal
    CULTURAL_SWAPS = [
        {
            "unhealthy_item": "Carbonated Cola / Sugary Soda",
            "healthy_swap": "Thambili (King Coconut Water) or Fresh Lime Water",
            "clinical_benefit": "Eliminates high-fructose spikes; King coconut provides 250mg cardioprotective potassium that counterbalances arterial sodium."
        },
        {
            "unhealthy_item": "Deep-Fried Fish Cutlet / Fried Sprats",
            "healthy_swap": "Malu Ambul Thiyal (Sour Fish Curry) or Grilled Thalapath",
            "clinical_benefit": "Replaces oxidized trans fats with anti-inflammatory omega-3 EPA/DHA; Goraka provides hydroxycitric acid."
        },
        {
            "unhealthy_item": "Refined White Rice / Godamba Roti",
            "healthy_swap": "Rathu Kekulu (Red Raw Rice) or Kurakkan Pittu",
            "clinical_benefit": "Retains bran polyphenols and soluble fiber, stabilizing glycemic index and lowering LDL cholesterol."
        }
    ]

    HEART_HEALTHY_RECIPES = [
        {
            "title": "Cardio Gotukola Sambol (Centella asiatica)",
            "ingredients": ["1 bunch fresh gotukola finely chopped", "2 shallots", "1 tbsp grated fresh coconut", "Lime juice", "Pinch of black pepper"],
            "preparation": "Mix raw without cooking to preserve active triterpenoids. Do not add excess salt.",
            "cardiac_action": "Improves microcirculation, reduces vascular stiffness."
        },
        {
            "title": "Low-Sodium Parippu (Red Lentil Dhal Curry)",
            "ingredients": ["1 cup red lentils", "1/2 cup thin coconut milk", "1/2 tsp turmeric", "1/4 tsp fenugreek", "Curry leaves & pandan"],
            "preparation": "Simmer lentils with turmeric and fenugreek. Add light coconut milk at the end without deep-oil tempering.",
            "cardiac_action": "Provides magnesium and soluble fiber; turmeric curtails vascular inflammation."
        },
        {
            "title": "Boiled Mun Eta (Green Gram Breakfast)",
            "ingredients": ["1 cup green gram soaked overnight", "Boiled tender", "Served with dash of scraped coconut and luncheon ginger tea"],
            "preparation": "Boil until soft. Zero added oil, low sodium.",
            "cardiac_action": "Lowers homocysteine and aids weight loss for BMI reduction."
        }
    ]

    def __init__(self, lookup_path="module2/data/Diet_Lookup_Combined_Final.xlsx"):
        self.lookup_path = lookup_path
        self.df_lookup = None
        if os.path.exists(lookup_path):
            try:
                self.df_lookup = load_table(lookup_path)
            except Exception as e:
                print(f"DietDomain table load warning: {e}")

    def get_food_swap(self, food_name, metric="Sodium_mg", max_results=3):
        """
        Wrapper around the rule-based diet recommender for specific food queries.
        """
        if self.df_lookup is None and os.path.exists(self.lookup_path):
            self.df_lookup = load_table(self.lookup_path)
        return recommend_swap(food_name, metric=metric, max_results=max_results)

    def get_dietary_prescription(self, sodium_mg=2800, total_fat_g=85, sugar_g=70, calories=2400):
        needs_sodium_cut = sodium_mg > 2000
        needs_fat_cut = total_fat_g > 65
        needs_sugar_cut = sugar_g > 35

        actions = []
        if needs_sugar_cut:
            actions.append("Swap Cola / sugary soda for fresh King Coconut Water (Thambili)")
        if needs_fat_cut:
            actions.append("Replace fried fish cutlets with Malu Ambul Thiyal or grilled fish")
        if needs_sodium_cut:
            actions.append("Eliminate processed papadam & dried sprats; temper dhal with fresh herbs, not salt")

        priority_action = actions[0] if actions else "Include fresh Gotukola Sambol and Rathu Kekulu red rice at lunch"

        # Dynamically query recommender for candidate swaps from lookup table
        recommended_swaps = []
        try:
            if needs_fat_cut:
                fat_res = self.get_food_swap("Fried chicken", metric="Fat_g")
                if fat_res.get("status") == "ok":
                    recommended_swaps.append(fat_res)
            if needs_sodium_cut:
                salt_res = self.get_food_swap("Fish, dried", metric="Sodium_mg")
                if salt_res.get("status") == "ok":
                    recommended_swaps.append(salt_res)
        except Exception:
            pass

        return {
            "domain": "Diet",
            "priority_action": priority_action,
            "patient_metrics": {
                "sodium_mg": sodium_mg,
                "total_fat_g": total_fat_g,
                "sugar_g": sugar_g,
                "calories": calories
            },
            "cardiac_targets": {
                "target_sodium_mg": "< 1800 mg/day",
                "target_sugar_g": "< 25 g/day",
                "target_saturated_fat_g": "< 15 g/day"
            },
            "cultural_swaps": self.CULTURAL_SWAPS,
            "sri_lankan_recipes": self.HEART_HEALTHY_RECIPES,
            "dynamic_food_swaps": recommended_swaps,
            "dataset_source": "Diet_Lookup_Combined_Final.xlsx (8,829 items, Sri Lankan FCDB & USDA)"
        }
