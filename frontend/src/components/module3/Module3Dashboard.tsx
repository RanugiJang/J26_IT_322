import React, { useEffect, useRef, useState } from "react";
import "./module3.css";
import { ecgApi } from "./services/ecgApi";
import type { DemoKind, ECGResult } from "./types";
import SymptomChecklist from "./SymptomChecklist";
import ResultPanel from "./ResultPanel";
import ECGWaveform from "./ECGWaveform";

const DEMOS: { kind: DemoKind; label: string }[] = [
  { kind: "normal", label: "Clean ECG" },
  { kind: "irregular", label: "Irregular rhythm" },
  { kind: "baseline", label: "Breathing drift" },
  { kind: "muscle", label: "Muscle tremor" },
  { kind: "motion", label: "Electrode motion" },
  { kind: "flat", label: "Flat line" },
];

/** Accepts CSV / TXT (numbers separated by comma, space or newline) or JSON array. */
function parseSignal(text: string): number[] {
  const t = text.trim();
  if (t.startsWith("[")) return JSON.parse(t).map(Number);
  return t.split(/[\s,;]+/).map(Number).filter((n) => Number.isFinite(n));
}

const Module3Dashboard: React.FC = () => {
  const [signal, setSignal] = useState<number[]>([]);
  const [fs, setFs] = useState(300);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<ECGResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<Record<string, string> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ecgApi.health().then((h) => setModels(h.models)).catch(() => setError("Cannot reach the backend (is uvicorn running?)"));
  }, []);

  const loadDemo = async (k: DemoKind) => {
    setError(""); setResult(null);
    try { const d = await ecgApi.demo(k); setSignal(d.signal); setFs(d.fs); }
    catch (e: any) { setError(e.message); }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setError(""); setResult(null);
    try {
      const s = parseSignal(await f.text());
      if (s.length < 300) throw new Error("File needs at least 300 numeric samples.");
      setSignal(s);
    } catch (e: any) { setError(e.message); }
  };

  const analyze = async () => {
    setLoading(true); setError("");
    try { setResult(await ecgApi.analyze(signal, fs, symptoms)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="m3-root">
      <header>
        <h2>ECG Quality &amp; Rhythm Screening</h2>
        <p>Quality check &rarr; noise explanation &rarr; repair &rarr; arrhythmia screening &rarr; action guidance.</p>
        {models && (
          <div className="m3-models">
            {Object.entries(models).map(([k, v]) => <span key={k} className={`m3-pill ${v}`}>{k}: {v}</span>)}
          </div>
        )}
      </header>

      <div className="m3-card">
        <h3>1. Load an ECG recording</h3>
        <div className="m3-row">
          {DEMOS.map((d) => <button key={d.kind} className="m3-btn ghost" onClick={() => loadDemo(d.kind)}>{d.label}</button>)}
        </div>
        <div className="m3-row">
          <button className="m3-btn ghost" onClick={() => fileRef.current?.click()}>Upload .csv / .txt / .json</button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <label>Sampling rate (Hz) <input type="number" value={fs} min={50} max={2000} onChange={(e) => setFs(Number(e.target.value))} /></label>
        </div>
        {signal.length > 0 && <ECGWaveform data={signal.slice(0, 3000)} label={`Loaded signal - ${signal.length} samples`} />}
      </div>

      <SymptomChecklist selected={symptoms} onChange={setSymptoms} />

      <button className="m3-btn" disabled={!signal.length || loading} onClick={analyze}>
        {loading ? "Analysing..." : "Analyse ECG"}
      </button>
      {error && <div className="m3-error">{error}</div>}
      {result && <ResultPanel r={result} />}
    </div>
  );
};
export default Module3Dashboard;
