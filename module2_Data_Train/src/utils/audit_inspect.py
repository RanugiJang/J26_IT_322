"""
Non-destructive audit script to inspect all exercise models, checkpoints, datasets, and configurations.
"""

import os
import json
import joblib
import torch
import pandas as pd

def audit():
    print("="*60)
    print("AUDIT: EXERCISE MODELS IN MODULE 2")
    print("="*60)

    # 1. Exercise Prescriber
    p1 = "module2/models/exercise_prescriber.joblib"
    print(f"\n[1] Checkpoint: {p1}")
    if os.path.exists(p1):
        d1 = joblib.load(p1)
        print("  Type:", type(d1))
        if isinstance(d1, dict):
            print("  Keys:", list(d1.keys()))
            print("  Classes:", d1.get("classes"))
            print("  Features:", d1.get("features"))
            print("  Train Acc:", d1.get("train_accuracy"))
            print("  Test Acc:", d1.get("accuracy"))
            print("  Balanced Acc:", d1.get("balanced_accuracy"))
            print("  Macro F1:", d1.get("macro_f1"))
            print("  Dataset info:", d1.get("dataset_info"))
            if "pipeline" in d1:
                print("  Pipeline steps:", d1["pipeline"].named_steps)

    # 2. CA-CJAT Transformer PyTorch Checkpoint
    p2 = "module2/models/ca_cjat_final.pth"
    print(f"\n[2] Checkpoint: {p2}")
    if os.path.exists(p2):
        d2 = torch.load(p2, map_location='cpu')
        print("  Type:", type(d2))
        if isinstance(d2, dict):
            print("  Keys:", list(d2.keys()))
            print("  Architecture:", d2.get("architecture"))
            print("  Novelties:", d2.get("novelties"))
            print("  Final loss:", d2.get("final_loss"))
            if "model_state_dict" in d2:
                sd = d2["model_state_dict"]
                print(f"  Total weight tensors in state_dict: {len(sd)}")
                for k in list(sd.keys())[:8]:
                    print(f"    {k}: shape {tuple(sd[k].shape)}, dtype {sd[k].dtype}")

    # 3. CA-CJAT Serialized Architecture Bundle
    p3 = "module2/models/ca_cjat_model.pkl"
    print(f"\n[3] Checkpoint: {p3}")
    if os.path.exists(p3):
        try:
            d3 = joblib.load(p3)
            print("  Type:", type(d3))
            if isinstance(d3, dict):
                print("  Keys:", list(d3.keys()))
            else:
                print("  Object string representation:", str(d3)[:200])
        except Exception as e:
            print("  Load error:", e)

    # 4. REHAB24-6 Exercise Quality Models
    p4 = "module2/models/exercise_quality_models.pkl"
    print(f"\n[4] Checkpoint: {p4}")
    if os.path.exists(p4):
        d4 = joblib.load(p4)
        print("  Type:", type(d4))
        if isinstance(d4, dict):
            print("  Keys:", list(d4.keys()))
            if "exercises" in d4:
                print("  Covered Exercises:", list(d4["exercises"].keys()))
                for ex_name, spec in d4["exercises"].items():
                    m = spec.get("model")
                    f_list = spec.get("features", [])
                    print(f"    - {ex_name}: model={type(m).__name__}, n_features={len(f_list)}, classes={getattr(m, 'classes_', None)}")

    # 5. DQN Adaptive Exercise Coach
    p5 = "module2/models/dqn_adaptive_exercise_final.pth"
    print(f"\n[5] Checkpoint: {p5}")
    if os.path.exists(p5):
        d5 = torch.load(p5, map_location='cpu')
        print("  Type:", type(d5))
        if isinstance(d5, dict):
            print("  Keys:", list(d5.keys()))
            for k in ["hyperparameters", "total_episodes", "avg_reward", "epsilon"]:
                if k in d5:
                    print(f"    {k}:", d5[k])
            if "q_network" in d5:
                qn = d5["q_network"]
                print(f"    q_network tensors ({len(qn)}):")
                for qk in qn:
                    print(f"      {qk}: shape {tuple(qn[qk].shape)}")

    # 6. Datasets Inventory
    print("\n" + "="*60)
    print("AUDIT: DATASETS & KINEMATICS")
    print("="*60)

    data_dir = "module2/data"
    for f in os.listdir(data_dir):
        fp = os.path.join(data_dir, f)
        if os.path.isfile(fp):
            sz = os.path.getsize(fp)
            print(f"File: {f} ({sz:,} bytes)")
            if f.endswith(".xlsx"):
                try:
                    df = pd.read_excel(fp)
                    print(f"  Shape: {df.shape}, Columns ({len(df.columns)}): {list(df.columns)[:8]}...")
                except Exception as e:
                    print("  Excel read error:", e)
            elif f.endswith(".csv"):
                try:
                    df = pd.read_csv(fp)
                    print(f"  Shape: {df.shape}, Columns ({len(df.columns)}): {list(df.columns)[:8]}...")
                except Exception as e:
                    print("  CSV read error:", e)
        elif os.path.isdir(fp):
            children = os.listdir(fp)
            print(f"Directory: {f} ({len(children)} items)")

    # 7. Check processed kinematics index if present
    kin_idx = "module2/data/processed_kinematics/dataset_index.json"
    if os.path.exists(kin_idx):
        with open(kin_idx, "r") as f:
            idx_data = json.load(f)
        print(f"\nProcessed kinematics dataset_index.json entries: {len(idx_data) if isinstance(idx_data, list) else list(idx_data.keys())}")
        if isinstance(idx_data, list) and len(idx_data) > 0:
            print("  First entry:", idx_data[0])

if __name__ == '__main__':
    audit()
