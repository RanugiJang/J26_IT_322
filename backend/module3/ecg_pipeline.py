"""
ECG pipeline for Module 3: quality gate -> artifact detect -> repair -> re-check
-> arrhythmia screening -> symptom safety override.
"""
import json
import logging
from pathlib import Path

import numpy as np
import torch
from scipy.signal import butter, filtfilt, welch, find_peaks, resample

from .architectures import ECGResNet1D, ArtifactDetectorCNN, InceptionTime, ECGDenoisingUNet

log = logging.getLogger("module3")
BASE = Path(__file__).parent
CFG = json.loads((BASE / "model_config.json").read_text())
FS = CFG["sampling_rate"]
WIN = CFG["window_length"]
CLASSES = {"ECGResNet1D": ECGResNet1D, "ArtifactDetectorCNN": ArtifactDetectorCNN,
           "InceptionTime": InceptionTime, "ECGDenoisingUNet": ECGDenoisingUNet}

ADVICE = {
    "Baseline Wander": "Sit still and breathe calmly. Avoid deep breathing during the recording.",
    "Muscle Artifact": "Relax your arms and hands. Rest them supported on a flat desk or table.",
    "Electrode Motion": "Press the device sensors firmly against clean, dry skin and keep steady contact.",
}
RED_FLAGS = {"chest_pain", "fainting", "shortness_of_breath"}
SOFT_FLAGS = {"dizziness", "palpitations"}


# ---------------------------------------------------------------- loading
def _load(key):
    spec = CFG["models"][key]
    path = BASE / "weights" / spec["file"]
    if not path.exists():
        log.warning("%s: weight file %s not found", key, path.name)
        return None
    net = CLASSES[spec["class"]](**spec["args"])
    try:
        net.load_state_dict(torch.load(path, map_location="cpu", weights_only=True), strict=True)
    except Exception as e:                                   # architecture mismatch
        log.error("%s: could not load %s -> %s", key, path.name, str(e)[:300])
        return None
    return net.eval()


MODELS = {k: _load(k) for k in ("quality", "artifact", "arrhythmia", "repair")}


def status():
    return {k: ("loaded" if v is not None else "missing") for k, v in MODELS.items()}


# ---------------------------------------------------------------- signal helpers
_B, _A = butter(CFG["filter_order"], CFG["bandpass"], btype="band", fs=FS)


def prepare(signal, fs=None):
    """list[float] -> (raw_300hz, tensor[1,1,3000]).  Resample, window, filter, z-score."""
    sig = np.asarray(signal, dtype=np.float64)
    sig = np.nan_to_num(sig)
    if fs and fs != FS:
        sig = resample(sig, int(len(sig) * FS / fs))
    if len(sig) < WIN:
        sig = np.pad(sig, (0, WIN - len(sig)), mode="edge")
    sig = sig[:WIN]
    filt = filtfilt(_B, _A, sig)
    filt = (filt - filt.mean()) / (filt.std() + 1e-8)
    return sig, torch.tensor(filt, dtype=torch.float32).view(1, 1, -1)


def _zscore_tensor(x):
    x = x - x.mean(-1, keepdim=True)
    return x / (x.std(-1, keepdim=True) + 1e-8)


# ---------------------------------------------------------------- quality
def heuristic_quality(raw):
    """Fallback used ONLY when model1 is not available. Rule-based, not AI."""
    raw = raw - raw.mean()
    if raw.std() < 1e-6:
        return 2, [0.0, 0.0, 1.0]
    f, p = welch(raw, fs=FS, nperseg=512)
    tot = p.sum() + 1e-12
    hf = p[(f >= 40)].sum() / tot
    lf = p[(f < 0.5)].sum() / tot
    x = filtfilt(_B, _A, raw)
    x = (x - x.mean()) / (x.std() + 1e-8)
    peaks, _ = find_peaks(x, height=1.2, distance=int(0.25 * FS))
    bpm = len(peaks) * 60 / (WIN / FS)
    ok_rate = 30 <= bpm <= 220
    big_jump = np.abs(np.diff(raw)).max() > 8 * (np.abs(np.diff(raw)).std() + 1e-9)
    if not ok_rate or hf > 0.35 or lf > 0.6:
        q = 2
    elif hf > 0.10 or lf > 0.25 or big_jump:
        q = 1
    else:
        q = 0
    probs = [0.1, 0.1, 0.1]
    probs[q] = 0.8
    return q, probs


def grade(x, raw):
    net = MODELS["quality"]
    if net is None:
        q, p = heuristic_quality(raw)
        return q, p, "heuristic"
    with torch.no_grad():
        p = torch.softmax(net(x), 1)[0]
    return int(p.argmax()), p.tolist(), "model1"


# ---------------------------------------------------------------- main entry
def analyze(signal, fs=None, symptoms=None):
    symptoms = set(symptoms or [])
    raw, x = prepare(signal, fs)
    out = {"repair_applied": False, "detected_artifacts": [], "coaching_guidance": []}

    q, qp, src = grade(x, raw)
    out["quality_initial"] = CFG["quality_labels"][q]
    out["quality_confidence"] = {"good": qp[0], "borderline": qp[1], "unusable": qp[2]}
    out["quality_source"] = src
    out["signal_original"] = _ds(x)

    # Model 2 - explain noise for anything not "Good"
    if q > 0 and MODELS["artifact"] is not None:
        with torch.no_grad():
            pr = torch.sigmoid(MODELS["artifact"](x))[0].tolist()
        out["artifact_probabilities"] = dict(zip(CFG["artifact_labels"], pr))
        found = [n for n, p in zip(CFG["artifact_labels"], pr) if p > CFG["artifact_threshold"]]
        out["detected_artifacts"] = found
        out["coaching_guidance"] = [ADVICE[f] for f in found]

    if q == 2:
        out["status"] = "REJECTED_UNUSABLE"
        out["coaching_guidance"] = out["coaching_guidance"] or ["Signal is unusable. Please retake the recording."]
        return _finish(out, symptoms)

    # Model 4 - repair borderline, then re-check with Model 1
    if q == 1:
        if MODELS["repair"] is None:
            out["status"] = "REJECTED_NO_REPAIR_MODEL"
            return _finish(out, symptoms)
        with torch.no_grad():
            x = _zscore_tensor(MODELS["repair"](x))
        out["repair_applied"] = True
        out["signal_repaired"] = _ds(x)
        q2, _, _ = grade(x, x[0, 0].numpy())
        out["quality_after_repair"] = CFG["quality_labels"][q2]
        if q2 != 0:
            out["status"] = "REJECTED_AFTER_REPAIR"
            out["coaching_guidance"].append("The signal could not be cleaned enough. Please retake the recording.")
            return _finish(out, symptoms)

    # Model 3 - arrhythmia screening
    if MODELS["arrhythmia"] is None:
        out["status"] = "NO_SCREENING_MODEL"
        return _finish(out, symptoms)
    with torch.no_grad():
        p = torch.softmax(MODELS["arrhythmia"](x), 1)[0].tolist()
    labels = CFG["rhythm_labels"]
    out["screening_result"] = {
        "rhythm": labels[int(np.argmax(p))],
        "probabilities": {"normal": p[0], "atrial_fibrillation": p[1], "other_arrhythmia": p[2]},
    }
    out["status"] = "REPAIRED_SUCCESS" if out["repair_applied"] else "OK"
    return _finish(out, symptoms)


def _ds(x, n=750):
    """Down-sample a tensor to n points for the chart (keeps payload small)."""
    a = x[0, 0].numpy()
    idx = np.linspace(0, len(a) - 1, n).astype(int)
    return [round(float(v), 4) for v in a[idx]]


# ---------------------------------------------------------------- safety engine
def _finish(out, symptoms):
    rhythm = out.get("screening_result", {}).get("rhythm")
    if symptoms & RED_FLAGS:
        level, msg = "emergency", "You reported a serious symptom. Seek emergency care now, whatever the ECG shows."
    elif out["status"].startswith("REJECTED") or out["status"] in ("NO_SCREENING_MODEL",):
        level, msg = "retake", "No reliable diagnosis could be made. Follow the tips and record again."
        if symptoms & SOFT_FLAGS:
            level, msg = "doctor", "Recording unusable, but you have symptoms. Please contact a doctor soon."
    elif rhythm == "Atrial Fibrillation":
        level, msg = "doctor", "Possible atrial fibrillation. Please see a doctor within 24-48 hours."
    elif rhythm == "Other Arrhythmia":
        level, msg = "doctor", "Irregular rhythm detected. Please book a check-up with a doctor."
    elif symptoms & SOFT_FLAGS:
        level, msg = "doctor", "Rhythm looks normal, but your symptoms deserve a doctor's opinion."
    else:
        level, msg = "routine", "Rhythm looks normal. Keep monitoring regularly."
    out["action"] = {"level": level, "message": msg}
    out["symptoms"] = sorted(symptoms)
    out["disclaimer"] = "Decision-support tool only. Not a replacement for a cardiologist."
    return out
