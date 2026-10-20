export type QualityLabel = "Good" | "Borderline" | "Unusable";
export type ActionLevel = "emergency" | "doctor" | "retake" | "routine";

export interface ECGResult {
  status: "OK" | "REPAIRED_SUCCESS" | "REJECTED_UNUSABLE" | "REJECTED_AFTER_REPAIR" | "REJECTED_NO_REPAIR_MODEL" | "NO_SCREENING_MODEL";
  quality_initial: QualityLabel;
  quality_after_repair?: QualityLabel;
  quality_confidence: { good: number; borderline: number; unusable: number };
  quality_source: "model1" | "heuristic";
  detected_artifacts: string[];
  artifact_probabilities?: Record<string, number>;
  coaching_guidance: string[];
  repair_applied: boolean;
  screening_result?: {
    rhythm: string;
    probabilities: { normal: number; atrial_fibrillation: number; other_arrhythmia: number };
  };
  signal_original: number[];
  signal_repaired?: number[];
  action: { level: ActionLevel; message: string };
  symptoms: string[];
  disclaimer: string;
}

export type DemoKind = "normal" | "irregular" | "baseline" | "muscle" | "motion" | "flat";
