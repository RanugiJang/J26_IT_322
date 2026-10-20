"""
Module 1 demo – Explainable CVD Risk Prediction
Run from the repo root:   streamlit run module1/src/app.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import altair as alt
import pandas as pd
import streamlit as st
from module1 import load, predict_patient, train_and_save

DATA_PATH = os.path.join(HERE, "..", "data", "framingham.csv")
MODEL_PATH = os.path.join(HERE, "..", "outputs", "module1_model.joblib")

st.set_page_config(page_title="CardioLoop – CVD Risk Assessment", layout="wide")

# ------------------------------------------------------------- styling
NAVY, MUTED = "#1B2A41", "#5B6573"
BAND_COLOURS = {"low": "#2E7D3A", "moderate": "#B7791F", "high": "#C0392B"}
TYPE_STYLES = {"fixed": ("Fixed", "#5B6573", "#EEF0F3"),
               "modifiable": ("Modifiable", "#1E7A6A", "#E4F4F1"),
               "treatment": ("Treatment", "#4B3F9E", "#ECEAF7")}

st.markdown(f"""
<style>
  .block-container {{padding-top: 3.5rem;}}
  .app-title {{font-size: 1.9rem; font-weight: 700; color: {NAVY}; margin-bottom: 0;}}
  .app-sub {{color: {MUTED}; font-size: 0.95rem; margin-top: 0.2rem;}}
  .card {{border: 1px solid #E3E6EA; border-radius: 10px; padding: 1rem 1.2rem; background: #FFFFFF; min-height: 136px;}}
  .card-label {{color: {MUTED}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em;}}
  .card-value {{font-size: 2rem; font-weight: 700; color: {NAVY}; line-height: 1.2;}}
  .card-note {{color: {MUTED}; font-size: 0.82rem;}}
  .pill {{display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600;}}
  .section {{font-size: 1.15rem; font-weight: 700; color: {NAVY}; margin: 0.4rem 0 0.6rem 0;}}
  table.factors {{width: 100%; border-collapse: collapse; font-size: 0.92rem;}}
  table.factors th {{text-align: left; color: {MUTED}; font-weight: 600; border-bottom: 1px solid #E3E6EA; padding: 6px 4px;}}
  table.factors td {{border-bottom: 1px solid #F0F2F4; padding: 8px 4px;}}
  .up {{color: #C0392B; font-weight: 600;}}
  .down {{color: #2E7D3A; font-weight: 600;}}
</style>
""", unsafe_allow_html=True)


def pill(text, fg, bg):
    return f'<span class="pill" style="color:{fg}; background:{bg};">{text}</span>'


def card(label, value, note="", value_colour=NAVY):
    return (f'<div class="card"><div class="card-label">{label}</div>'
            f'<div class="card-value" style="color:{value_colour};">{value}</div>'
            f'<div class="card-note">{note}</div></div>')


@st.cache_resource(show_spinner="Loading model…")
def get_model():
    if not os.path.exists(MODEL_PATH):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        train_and_save(DATA_PATH, MODEL_PATH)
    return load(MODEL_PATH)


m = get_model()

# ------------------------------------------------------------- header
st.markdown('<div class="app-title">CVD Risk Assessment</div>', unsafe_allow_html=True)
st.markdown('<p class="app-sub">CardioLoop · Module 1 – Explainable CVD Risk Prediction · '
            'Research prototype, not for clinical use</p>', unsafe_allow_html=True)
st.write("")

# ------------------------------------------------------------- input form
with st.sidebar:
    st.header("Patient details")
    patient_id = st.text_input("Patient ID", "DEMO-001")
    yes_no = {"No": 0, "Yes": 1}

    st.subheader("Demographics")
    male = st.radio("Sex", ["Female", "Male"], index=1, horizontal=True) == "Male"
    age = st.slider("Age (years)", 30, 80, 60)

    st.subheader("Clinical measurements")
    sbp = st.slider("Systolic BP (mmHg)", 80, 250, 165)
    dbp = st.slider("Diastolic BP (mmHg)", 50, 150, 98)
    chol = st.slider("Total cholesterol (mg/dL)", 100, 500, 260)
    glucose = st.slider("Fasting glucose (mg/dL)", 50, 400, 95)
    bmi = st.slider("BMI (kg/m²)", 15.0, 50.0, 29.5, 0.1)
    hr = st.slider("Heart rate (bpm)", 40, 140, 80)

    st.subheader("Lifestyle")
    smoker = yes_no[st.radio("Current smoker", yes_no, index=1, horizontal=True)]
    cigs = st.slider("Cigarettes per day", 0, 60, 20 if smoker else 0, disabled=not smoker)

    st.subheader("Medical history")
    hyp = yes_no[st.radio("Hypertension", yes_no, index=1, horizontal=True)]
    diab = yes_no[st.radio("Diabetes", yes_no, horizontal=True)]
    stroke = yes_no[st.radio("Previous stroke", yes_no, horizontal=True)]
    bpmeds = yes_no[st.radio("On BP medication", yes_no, horizontal=True)]

patient = {
    "male": int(male), "age": age, "currentSmoker": smoker, "cigsPerDay": cigs if smoker else 0,
    "BPMeds": bpmeds, "prevalentStroke": stroke, "prevalentHyp": hyp, "diabetes": diab,
    "totChol": chol, "sysBP": sbp, "diaBP": dbp, "BMI": bmi, "heartRate": hr, "glucose": glucose,
}

try:
    p = predict_patient(m, patient, patient_id=patient_id)
except ValueError as e:
    st.error(str(e))
    st.stop()

# ------------------------------------------------------------- summary cards
band = p["risk_band"]
band_col = BAND_COLOURS[band]
lo, hi = p["risk_range"]
conf_note = ", ".join(p["confidence_reasons"]).capitalize() or "Inputs complete, narrow range"

c1, c2, c3, c4 = st.columns(4)
c1.markdown(card("10-year CVD risk", f"{p['risk_score']:.0%}", f"Patient {patient_id}"),
            unsafe_allow_html=True)
c2.markdown(card("Risk category", band.capitalize(), "Low < 10% · Moderate 10–20% · High ≥ 20%",
                 value_colour=band_col), unsafe_allow_html=True)
c3.markdown(card("Likely range", f"{lo:.0%} – {hi:.0%}", "Spread across 20 resampled models"),
            unsafe_allow_html=True)
c4.markdown(card("Confidence", p["confidence_flag"].capitalize(), conf_note,
                 value_colour="#2E7D3A" if p["confidence_flag"] == "high" else "#B7791F"),
            unsafe_allow_html=True)

st.write("")
st.divider()

# ------------------------------------------------------------- explanation
left, right = st.columns([3, 2], gap="large")

with left:
    st.markdown('<div class="section">Key factors behind this risk</div>', unsafe_allow_html=True)
    tf = pd.DataFrame(p["top_factors"])
    rows = ""
    for _, r in tf.iterrows():
        val = ("Yes" if r["value"] == 1 else "No") if pd.isna(r["unit"]) else f'{r["value"]:g} {r["unit"]}'
        effect = ('<span class="up">Raises risk</span>' if r["direction"] == "raises"
                  else '<span class="down">Lowers risk</span>')
        label, fg, bg = TYPE_STYLES[r["type"]]
        rows += (f"<tr><td><b>{r['name']}</b></td><td>{val}</td><td>{effect}</td>"
                 f"<td>{pill(label, fg, bg)}</td></tr>")
    st.markdown(f'<table class="factors"><tr><th>Factor</th><th>Patient value</th>'
                f'<th>Effect</th><th>Type</th></tr>{rows}</table>', unsafe_allow_html=True)

    st.write("")
    chart = (alt.Chart(tf).mark_bar(cornerRadiusEnd=3)
             .encode(x=alt.X("impact:Q", title="Contribution to risk (SHAP)"),
                     y=alt.Y("name:N", sort="-x", title=None,
                             axis=alt.Axis(labelLimit=220, labelOverlap=False, labelFontSize=12)),
                     color=alt.Color("direction:N", legend=None,
                                     scale=alt.Scale(domain=["raises", "lowers"],
                                                     range=["#C0392B", "#2E7D3A"])))
             .properties(height=alt.Step(34)))
    st.altair_chart(chart, width="stretch")

    modifiable = tf[tf["type"] == "modifiable"]
    if len(modifiable):
        st.info("Modifiable factors for this patient: " + ", ".join(modifiable["name"])
                + ". These are passed to the lifestyle recommendation module.")

with right:
    st.markdown('<div class="section">Similar past patients</div>', unsafe_allow_html=True)
    sim = pd.DataFrame(p["similar_patients"])
    sim["Outcome"] = sim["had_chd_in_10y"].map({True: "Developed CHD", False: "No CHD"})
    sim = sim.rename(columns={"age": "Age", "sysBP": "Systolic BP", "distance": "Distance"})
    sim["Distance"] = sim["Distance"].round(2)
    st.dataframe(sim[["Age", "Systolic BP", "Outcome", "Distance"]],
                 hide_index=True, width="stretch")
    st.caption(f"{p['similar_patients_event_rate']:.0%} of the 5 most similar patients in the "
               "training data developed coronary heart disease within 10 years. "
               "Distance: lower means more similar.")

st.divider()
with st.expander("Shared Patient Profile – Module 1 output (JSON sent to Modules 2–4)"):
    st.json(p)