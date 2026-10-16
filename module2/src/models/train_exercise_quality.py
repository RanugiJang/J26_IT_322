"""
Exercise Quality (correct / incorrect) models for REHAB24-6.

Evaluation is LEAVE-ONE-PERSON-OUT: train on all people except one, test on the
held-out person, repeat for every person. person_id comes from Segmentation.csv
(the CSVs' subject_id is a VIDEO id, which would leak).
"""
import warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict
from sklearn.metrics import accuracy_score, balanced_accuracy_score

warnings.filterwarnings("ignore")
# SEG is loaded lazily so that importing angle_sequence / rep_features for
# inference does NOT require Segmentation.csv to be present.
SEG = None


def _load_seg(path="Segmentation.csv"):
    global SEG
    if SEG is None:
        SEG = pd.read_csv(path, sep=";")
    return SEG
NAMES = {1: "armabduction", 2: "armvw", 3: "pushup", 4: "legabduction", 5: "leglunge", 6: "squat"}
ANGLE_NAMES = [f"{s}_{a}" for s in ("L", "R") for a in ("elbow", "shoulder", "knee", "ankle")]
T_SHAPE = 10   # points describing the trajectory shape


def ang(a, b, c):
    v1, v2 = a - b, c - b
    cos = (v1 * v2).sum(-1) / (np.linalg.norm(v1, axis=-1) * np.linalg.norm(v2, axis=-1) + 1e-9)
    return np.degrees(np.arccos(np.clip(cos, -1, 1)))


def P(rep, j):
    return rep[[f"{j}_X", f"{j}_Y", f"{j}_Z"]].values


def angle_sequence(rep):
    """frames x 8 joint angles (elbow, shoulder, knee, ankle for left then right)."""
    hip = np.zeros_like(P(rep, "LeftShoulder"))
    cols = []
    for s in ("Left", "Right"):
        sh, el, wr = P(rep, f"{s}Shoulder"), P(rep, f"{s}Elbow"), P(rep, f"{s}Wrist")
        kn, an, fi = P(rep, f"{s}Knee"), P(rep, f"{s}Ankle"), P(rep, f"{s}FootIndex")
        cols += [ang(sh, el, wr), ang(hip, sh, el), ang(hip, kn, an), ang(kn, an, fi)]
    return np.stack(cols, 1)


def resample(a, T):
    x0, x1 = np.linspace(0, 1, len(a)), np.linspace(0, 1, T)
    return np.stack([np.interp(x1, x0, a[:, k]) for k in range(a.shape[1])], 1)


def rep_features(seq):
    n = len(seq)
    f = {"duration_frames": n}
    vel = np.abs(np.diff(seq, axis=0))
    for k, nm in enumerate(ANGLE_NAMES):
        a = seq[:, k]
        f[f"{nm}_min"], f[f"{nm}_max"] = a.min(), a.max()
        f[f"{nm}_range"], f[f"{nm}_mean"], f[f"{nm}_std"] = np.ptp(a), a.mean(), a.std()
        f[f"{nm}_speed"] = vel[:, k].mean()
        f[f"{nm}_t_of_max"] = a.argmax() / max(n - 1, 1)
    for j in range(4):   # left-right range-of-motion asymmetry
        f[f"asym_rom_{ANGLE_NAMES[j][2:]}"] = abs(np.ptp(seq[:, j]) - np.ptp(seq[:, j + 4]))
    shape = resample(seq, T_SHAPE)
    for k, nm in enumerate(ANGLE_NAMES):
        for t in range(T_SHAPE):
            f[f"{nm}_shape{t}"] = shape[t, k]
    return f


def load_exercise(eid, name, root="standardized_data"):
    seg = _load_seg()
    d = pd.read_csv(f"{root}/rehab246_{name}_positions_standardized.csv")
    s = seg[seg.exercise_id == eid].rename(columns={"video_id": "subject_id", "repetition_number": "repetition"})
    s = s.set_index(["subject_id", "repetition"])
    rows, seqs = [], []
    for (vid, rp), rep in d.groupby(["subject_id", "repetition"]):
        m = s.loc[(vid, rp)]
        if m["mocap_erroneous"] == 1:          # skip repetitions flagged as bad mocap
            continue
        seq = angle_sequence(rep.sort_values("frame"))
        r = rep_features(seq)
        r.update(person=m["person_id"], y=int(rep["is_correct"].iloc[0]))
        rows.append(r)
        seqs.append(resample(seq, 40))
    return pd.DataFrame(rows), np.array(seqs)


def person_normalise(df, feat_cols):
    """Subtract each person's own median (uses no labels, only that person's reps)."""
    out = df.copy()
    out[feat_cols] = df[feat_cols] - df.groupby("person")[feat_cols].transform("median")
    return out


def models():
    return {
        "LogReg": make_pipeline(StandardScaler(), LogisticRegression(C=0.1, max_iter=2000)),
        "RandForest": RandomForestClassifier(n_estimators=300, min_samples_leaf=2, random_state=42),
        "HistGB": HistGradientBoostingClassifier(max_depth=3, learning_rate=0.05, max_iter=150, random_state=42),
    }


if __name__ == "__main__":
    results = []
    for eid, name in NAMES.items():
        df, _ = load_exercise(eid, name)
        feat = [c for c in df.columns if c not in ("person", "y")]
        summary = [c for c in feat if "_shape" not in c]
        y, g = df["y"].values, df["person"].values
        maj = max(y.mean(), 1 - y.mean())
        row = {"exercise": name, "reps": len(y), "people": len(set(g)), "majority": maj}
        for variant, d in (("raw", df), ("personnorm", person_normalise(df, feat))):
            for mname, mdl in models().items():
                p = cross_val_predict(mdl, d[feat].values, y, groups=g, cv=LeaveOneGroupOut())
                row[f"{mname}|{variant}|acc"] = accuracy_score(y, p)
                row[f"{mname}|{variant}|bal"] = balanced_accuracy_score(y, p)
        results.append(row)
        print(name, "done", flush=True)
    pd.DataFrame(results).to_csv("exercise_results.csv", index=False)
