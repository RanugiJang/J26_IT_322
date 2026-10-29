import os
import zipfile
from pathlib import Path

def create_zip():
    root = Path(r"c:\Users\hashi\OneDrive\Desktop\Research\J26_IT_322")
    zip_path = root / "exercise_model_train_details.zip"

    files_to_pack = [
        (root / "EXERCISE_MODEL_TRAINING_DETAILS.md", "EXERCISE_MODEL_TRAINING_DETAILS.md"),
        (root / "module2" / "reports" / "EXERCISE_MODEL_RESULTS.md", "reports/EXERCISE_MODEL_RESULTS.md"),
        (root / "module2" / "reports" / "exercise_prescriber_report.json", "reports/exercise_prescriber_report.json"),
        (root / "module2" / "reports" / "ca_cjat_report.json", "reports/ca_cjat_report.json"),
        
        (root / "module2" / "src" / "models" / "exercise_prescriber.py", "training_code/exercise_prescriber.py"),
        (root / "module2" / "src" / "models" / "ca_cjat.py", "training_code/ca_cjat.py"),
        (root / "module2" / "src" / "models" / "train_exercise_quality.py", "training_code/train_exercise_quality.py"),
        (root / "module2" / "src" / "models" / "dqn_agent.py", "training_code/dqn_agent.py"),
        (root / "module2" / "src" / "models" / "lstm_lib.py", "training_code/lstm_lib.py"),
        (root / "module2" / "src" / "exercise_inference.py", "training_code/exercise_inference.py"),
        (root / "module2" / "src" / "utils" / "download_uci_data.py", "training_code/download_uci_data.py"),
        (root / "module2" / "src" / "utils" / "download_and_extract_poses.py", "training_code/download_and_extract_poses.py"),
        
        (root / "module2" / "src" / "domains" / "exercise.py", "domains_and_backend/exercise.py"),
        (root / "backend" / "video_analyzer.py", "domains_and_backend/video_analyzer.py"),
        
        (root / "module2" / "data" / "uci_heart_disease.csv", "datasets/uci_heart_disease.csv"),
        (root / "module2" / "data" / "Exercise_Prescription.xlsx", "datasets/Exercise_Prescription.xlsx"),
        (root / "module2" / "data" / "processed_kinematics" / "dataset_index.json", "datasets/dataset_index.json"),
        
        (root / "module2" / "models" / "exercise_prescriber.joblib", "models/exercise_prescriber.joblib"),
        (root / "module2" / "models" / "dqn_adaptive_exercise_final.pth", "models/dqn_adaptive_exercise_final.pth"),
        (root / "module2" / "models" / "ca_cjat_final.pth", "models/ca_cjat_final.pth"),
        (root / "module2" / "models" / "ca_cjat_model.pkl", "models/ca_cjat_model.pkl"),
        (root / "module2" / "models" / "exercise_quality_models.pkl", "models/exercise_quality_models.pkl"),
    ]

    print("Creating updated ZIP archive...")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for src, arcname in files_to_pack:
            if src.exists():
                zf.write(src, arcname)
                print(f"  Added {arcname}")
            else:
                print(f"  Warning: missing {src}")

    print(f"Complete: {zip_path} ({zip_path.stat().st_size / (1024*1024):.2f} MB)")

if __name__ == '__main__':
    create_zip()
