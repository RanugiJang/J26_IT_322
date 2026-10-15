
from pathlib import Path
import pickle

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
SRC_DIR = ROOT / "src"

print("=== MODULE 2 MODEL INSPECTION ===")

# 1. Inspect lifestyle and smoking models
for pattern in ["model1_final.pkl", "*smoking*.pkl"]:
    matches = list(MODEL_DIR.glob(pattern))

    for path in matches:
        print(f"\n--- {path.name} ---")
        try:
            with open(path, "rb") as f:
                model = pickle.load(f)

            print("Type:", type(model).__name__)

            if hasattr(model, "n_features_in_"):
                print("Expected features:", model.n_features_in_)

            if hasattr(model, "feature_names_in_"):
                print("Feature names:", list(model.feature_names_in_))

            if hasattr(model, "classes_"):
                print("Classes:", model.classes_)

            if hasattr(model, "named_steps"):
                print("Pipeline steps:", list(model.named_steps.keys()))

            if isinstance(model, dict):
                print("Dictionary keys:", list(model.keys()))

        except Exception as e:
            print("Inspection error:", repr(e))

# 2. Locate and display the diet recommender source
print("\n=== DIET RECOMMENDER FILE ===")
diet_files = list(SRC_DIR.glob("*diet*recommender*.py"))

if not diet_files:
    print("Diet recommender file not found. Check the filename.")
else:
    for path in diet_files:
        print(f"\nFile: {path.name}")
        print(path.read_text(encoding="utf-8"))

print("\n=== INSPECTION FINISHED ===")
