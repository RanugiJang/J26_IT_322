import React from "react";
import type { ECGResult } from "./types";
import ECGWaveform from "./ECGWaveform";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const TITLES: Record<string, string> = {
  OK: "Recording accepted",
  REPAIRED_SUCCESS: "Recording repaired and accepted",
  REJECTED_UNUSABLE: "Recording rejected - signal unusable",
  REJECTED_AFTER_REPAIR: "Recording rejected - repair was not enough",
  REJECTED_NO_REPAIR_MODEL: "Recording rejected",
  NO_SCREENING_MODEL: "Screening model unavailable",
};

const ResultPanel: React.FC<{ r: ECGResult }> = ({ r }) => (
  <div className="m3-result">
    <div className={`m3-action ${r.action.level}`}>
      <strong>{r.action.level.toUpperCase()}</strong>
      <span>{r.action.message}</span>
    </div>

    <div className="m3-card">
      <h3>{TITLES[r.status] ?? r.status}</h3>
      <p>
        Quality: <b>{r.quality_initial}</b>
        {r.repair_applied && <> &rarr; after repair <b>{r.quality_after_repair}</b></>}
        {r.quality_source === "heuristic" && <span className="m3-badge"> rule-based (Model 1 not loaded)</span>}
      </p>
      <div className="m3-bars">
        {Object.entries(r.quality_confidence).map(([k, v]) => (
          <div key={k} className="m3-bar"><span>{k}</span><i style={{ width: pct(v) }} /><em>{pct(v)}</em></div>
        ))}
      </div>
    </div>

    <ECGWaveform data={r.signal_original} label="Original ECG (filtered, 10 s)" color="#94a3b8" />
    {r.signal_repaired && <ECGWaveform data={r.signal_repaired} label="Repaired ECG (Model 4)" color="#34d399" />}

    {r.detected_artifacts.length > 0 && (
      <div className="m3-card">
        <h3>What went wrong</h3>
        <div>{r.detected_artifacts.map((a) => <span key={a} className="m3-chip">{a}</span>)}</div>
        <ul>{r.coaching_guidance.map((g) => <li key={g}>{g}</li>)}</ul>
      </div>
    )}
    {!r.detected_artifacts.length && r.coaching_guidance.length > 0 && (
      <div className="m3-card"><ul>{r.coaching_guidance.map((g) => <li key={g}>{g}</li>)}</ul></div>
    )}

    {r.screening_result && (
      <div className="m3-card">
        <h3>Rhythm screening: {r.screening_result.rhythm}</h3>
        <div className="m3-bars">
          {Object.entries(r.screening_result.probabilities).map(([k, v]) => (
            <div key={k} className="m3-bar"><span>{k.replace(/_/g, " ")}</span><i style={{ width: pct(v) }} /><em>{pct(v)}</em></div>
          ))}
        </div>
      </div>
    )}
    <p className="m3-disclaimer">{r.disclaimer}</p>
  </div>
);
export default ResultPanel;
