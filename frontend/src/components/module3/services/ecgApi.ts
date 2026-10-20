import type { DemoKind, ECGResult } from "../types";

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const ecgApi = {
  health: () => fetch(`${BASE}/api/module3/health`).then((r) => handle<{ models: Record<string, string> }>(r)),
  demo: (kind: DemoKind) =>
    fetch(`${BASE}/api/module3/demo/${kind}`).then((r) => handle<{ signal: number[]; fs: number }>(r)),
  analyze: (signal: number[], fs: number, symptoms: string[]) =>
    fetch(`${BASE}/api/module3/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal, fs, symptoms }),
    }).then((r) => handle<ECGResult>(r)),
};
