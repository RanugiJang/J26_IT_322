import React from "react";

export const SYMPTOMS = [
  { id: "chest_pain", label: "Severe chest pain, pressure or tightness", red: true },
  { id: "shortness_of_breath", label: "Sudden shortness of breath", red: true },
  { id: "fainting", label: "Fainting or near-fainting", red: true },
  { id: "dizziness", label: "Dizziness or unexplained weakness" },
  { id: "palpitations", label: "Palpitations or racing heart" },
];

interface Props { selected: string[]; onChange: (s: string[]) => void; }

const SymptomChecklist: React.FC<Props> = ({ selected, onChange }) => {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  return (
    <div className="m3-card">
      <h3>Symptoms right now</h3>
      {SYMPTOMS.map((s) => (
        <label key={s.id} className={`m3-check ${s.red ? "red" : ""}`}>
          <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
          {s.label}
        </label>
      ))}
    </div>
  );
};
export default SymptomChecklist;
