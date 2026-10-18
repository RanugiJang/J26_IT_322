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
from module1 import FACTORS, load, predict_patient, train_and_save

DATA_PATH = os.path.join(HERE, "..", "data", "framingham.csv")
MODEL_PATH = os.path.join(HERE, "..", "outputs", "module1_model.joblib")

st.set_page_config(page_title="Module 1 – CVD Risk", page_icon="❤️", layout="wide")


@st.cache_resource(show_spinner="Loading model…")
def get_model():
    if not os.path.exists(MODEL_PATH):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        train_and_save(DATA_PATH, MODEL_PATH)
    return load(MODEL_PATH)


m = get_model()

st.title("❤️ Explainable CVD Risk Prediction")
st.caption("Module 1 · J26-IT-322 · Research prototype – not for clinical use")

# ------------------------------------------------------------- input form
with st.sidebar:
    st.header("Patient details")
    patient_id = st.text_input("Patient ID", "DEMO-001")
    yes_no = {"No": 0, "Yes": 1}

    st.subheader("Fixed")
    male = st.radio("Sex", ["Female", "Male"], index=1, horizontal=True) == "Male"
    age = st.slider("Age (years)", 30, 80, 60)
    stroke = yes_no[st.radio("Previous stroke", yes_no, horizontal=True)]

    st.subheader("Modifiable")
    smoker = yes_no[st.radio("Current smoker", yes_no, index=1, horizontal=True)]
    cigs = st.slider("Cigarettes per day", 0, 60, 20 if smoker else 0, disabled=not smoker)
    sbp = st.slider("Systolic BP (mmHg)", 80, 250, 165)
    dbp = st.slider("Diastolic BP (mmHg)", 50, 150, 98)
    chol = st.slider("Total cholesterol (mg/dL)", 100, 500, 260)
    glucose = st.slider("Glucose (mg/dL)", 50, 400, 95)
    bmi = st.slider("BMI (kg/m²)", 15.0, 50.0, 29.5, 0.1)
    hr = st.slider("Heart rate (bpm)", 40, 140, 80)
    hyp = yes_no[st.radio("Hypertension", yes_no, index=1, horizontal=True)]
    diab = yes_no[st.radio("Diabetes", yes_no, horizontal=True)]

    st.subheader("Treatment")
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

# ------------------------------------------------------------- headline
band_colour = {"low": "green", "moderate": "orange", "high": "red"}[p["risk_band"]]
c1, c2, c3 = st.columns(3)
c1.metric("10-year CVD risk", f"{p['risk_score']:.0%}")
c1.markdown(f"Band: :{band_colour}[**{p['risk_band'].upper()}**]")
lo, hi = p["risk_range"]
c2.metric("Likely range", f"{lo:.0%} – {hi:.0%}")
c2.caption("Spread across 20 models trained on resampled data")
c3.metric("Confidence", p["confidence_flag"].upper())
c3.caption(", ".join(p["confidence_reasons"]) or "Inputs complete, narrow range")

st.divider()

# ------------------------------------------------------------- explanation
left, right = st.columns([3, 2])

with left:
    st.subheader("Why this risk?")
    tf = pd.DataFrame(p["top_factors"])
    for _, r in tf.iterrows():
        val = ("yes" if r["value"] == 1 else "no") if pd.isna(r["unit"]) else f'{r["value"]:g} {r["unit"]}'
        arrow = "🔺" if r["direction"] == "raises" else "🔻"
        tag = {"fixed": "🔒 fixed", "modifiable": "✅ can change", "treatment": "💊 treatment"}[r["type"]]
        st.markdown(f"{arrow} **{r['name']}** ({val}) {r['direction']} risk · _{tag}_")

    chart = (alt.Chart(tf).mark_bar()
             .encode(x=alt.X("impact:Q", title="Impact on risk"),
                     y=alt.Y("name:N", sort="-x", title=None),
                     color=alt.Color("direction:N", title=None,
                                     scale=alt.Scale(domain=["raises", "lowers"],
                                                     range=["#d62728", "#2ca02c"])))
             .properties(height=230))
    st.altair_chart(chart, width="stretch")
    st.caption("SHAP impact (log-odds). Positive = raises risk.")

    modifiable = tf[tf["type"] == "modifiable"]
    if len(modifiable):
        st.info("**Factors this patient can change:** " +
                ", ".join(modifiable["name"]) + ". These go to Module 2 for recommendations.")

with right:
    st.subheader("Similar past patients")
    sim = pd.DataFrame(p["similar_patients"])
    sim["outcome"] = sim["had_chd_in_10y"].map({True: "❤️‍🩹 CHD", False: "✓ No CHD"})
    st.dataframe(sim[["age", "sysBP", "outcome", "distance"]], hide_index=True,
                 width="stretch")
    st.caption(f"{p['similar_patients_event_rate']:.0%} of the 5 most similar patients "
               "had CHD within 10 years.")

st.divider()
with st.expander("Shared Patient Profile (JSON sent to Modules 2–4)"):
    st.json(p)
