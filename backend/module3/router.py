from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from . import ecg_pipeline, demo

router = APIRouter(prefix="/api/module3", tags=["module3 - ECG"])


class ECGRequest(BaseModel):
    signal: List[float] = Field(..., min_length=300, description="ECG samples (single lead)")
    fs: Optional[int] = Field(300, description="Sampling rate of the uploaded signal in Hz")
    symptoms: List[str] = Field(default_factory=list,
                                description="chest_pain, shortness_of_breath, fainting, dizziness, palpitations")


@router.get("/health")
def health():
    return {"module": "module3", "models": ecg_pipeline.status()}


@router.get("/demo/{kind}")
def demo_signal(kind: str):
    if kind not in ("normal", "irregular", "baseline", "muscle", "motion", "flat"):
        raise HTTPException(404, "unknown demo kind")
    return {"kind": kind, "fs": 300, "signal": demo.make(kind, seed=7)}


@router.post("/analyze")
def analyze(req: ECGRequest):
    try:
        return ecg_pipeline.analyze(req.signal, req.fs, req.symptoms)
    except Exception as e:
        raise HTTPException(500, f"ECG analysis failed: {e}")
