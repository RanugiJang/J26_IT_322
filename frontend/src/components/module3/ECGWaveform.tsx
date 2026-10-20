import React from "react";

interface Props { data: number[]; color?: string; label: string; }

/** Lightweight SVG line chart (no extra libraries). */
const ECGWaveform: React.FC<Props> = ({ data, color = "#38bdf8", label }) => {
  const W = 800, H = 140;
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 8 - ((v - min) / span) * (H - 16)}`).join(" ");
  return (
    <div className="m3-wave">
      <div className="m3-wave-label">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
};
export default ECGWaveform;
