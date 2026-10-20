"""Step 6 — CardioLoop Module 4 demo: explainable cardiac drug-interaction checker (research prototype).

Run from inside module4/:
    streamlit run app.py
"""
from __future__ import annotations

import html
import json

import streamlit as st

from src.data.common import load_config, path
from src.demo.helpers import (LEVEL_STYLE, NOT_TESTED, build_genotypes, choice_index, drug_options,
                              genotype_choices, load_patients, match_options, missing_from_options,
                              model_card, overall_reason, parse_free_text, patient_label, pgx_table,
                              summary_counts, tested_genes)
from src.explain.engine import DDIEngine

st.set_page_config(page_title="CardioLoop · Drug Interaction Check", page_icon="🫀", layout="wide")

st.markdown("""
<style>
.block-container {padding-top: 1.6rem; max-width: 1200px;}
.cl-banner {border-radius: 10px; padding: 14px 18px; margin: 6px 0 14px 0; border-left: 6px solid;}
.cl-banner .lvl {font-size: 1.35rem; font-weight: 700;}
.cl-banner .act {opacity: .85; margin-top: 2px;}
.cl-pill {display:inline-block; padding: 2px 10px; border-radius: 999px; font-weight: 600; font-size: .85rem;
          border: 1px solid; margin-right: 6px;}
.cl-src {opacity:.7; font-size:.85rem;}
.cl-why {font-size: 1.02rem; margin: 6px 0 4px 0;}
.cl-proto {display:inline-block; font-size:.75rem; letter-spacing:.04em; text-transform:uppercase;
           padding:2px 8px; border-radius:4px; background:rgba(180,35,47,.1); color:#b4232f; font-weight:700;}
</style>""", unsafe_allow_html=True)


# ------------------------------------------------------------------ load once
@st.cache_resource(show_spinner="Loading knowledge graph and GNN models…")
def get_engine() -> DDIEngine:
    return DDIEngine(load_config())


cfg = load_config()
try:
    eng = get_engine()
except FileNotFoundError as e:
    st.error(f"{e}\n\nRun Steps 2–4 first (build_kg → splits → features → train_gnn).")
    st.stop()

OPTIONS = drug_options(eng.name, eng.row)
GT_CHOICES = genotype_choices(eng.pgx)
PATIENTS = load_patients(path("config/demo_patients.yaml"))
CUSTOM = {"id": "CUSTOM", "name": "New patient", "age": None, "sex": None, "cohort": None,
          "conditions": [], "current": [], "new": None, "genotype": {}, "note": None}


def pill(level: str, text: str | None = None) -> str:
    col, bg, icon, _ = LEVEL_STYLE.get(level, LEVEL_STYLE["None"])
    return (f'<span class="cl-pill" style="color:{col};background:{bg};border-color:{col}">'
            f'{icon} {html.escape(text or level)}</span>')


# ------------------------------------------------------------------ sidebar: patient profile
with st.sidebar:
    st.markdown('<span class="cl-proto">Research prototype</span>', unsafe_allow_html=True)
    st.header("Patient profile")
    labels = [patient_label(p) for p in PATIENTS] + ["➕ New patient (enter manually)"]
    pick = st.selectbox("Patient", labels, index=0, help="Fictional demo patients (Shared Patient Profile format)")
    patient = PATIENTS[labels.index(pick)] if labels.index(pick) < len(PATIENTS) else CUSTOM
    pid = patient["id"]

    if pid != "CUSTOM":
        facts = " · ".join(str(x) for x in (f"{patient['age']} y" if patient.get("age") else None,
                                             patient.get("sex"), patient.get("cohort")) if x)
        st.caption(facts)
        if patient["conditions"]:
            st.markdown("**Conditions:** " + ", ".join(patient["conditions"]))
        if patient.get("note"):
            st.info(patient["note"], icon="📝")

    st.subheader("Genotype")
    st.caption("Pharmacogenomic test results. Leave as *Not tested* if unknown.")
    selected_gt = {}
    for gene, opts in GT_CHOICES.items():
        labels_g = [o[0] for o in opts]
        i = choice_index(opts, patient["genotype"].get(gene))
        lab = st.selectbox(gene, labels_g, index=i, key=f"gt_{pid}_{gene}")
        selected_gt[gene] = opts[labels_g.index(lab)][1]

    with st.expander("About the model"):
        st.markdown(
            "- Knowledge graph: DrugBank (via TDC) + DDInter + ClinPGx + gnomAD\n"
            f"- {eng.gi.n_drugs:,} drugs · {eng.gi.n_genes:,} genes · {eng.gi.n_vars} PGx variants\n"
            f"- Graph attention network (GATv2), models loaded: {', '.join(eng.models)}\n"
            f"- Engine start-up {eng.load_seconds:.1f} s")
        mc = model_card(path(cfg["paths"]["reports"]))
        if not mc.empty:
            st.caption("Cardiac test pairs")
            st.dataframe(mc, hide_index=True, width="stretch")


# ------------------------------------------------------------------ main: prescription
st.title("🫀 Cardiac drug interaction check")
st.caption("CardioLoop · Module 4 — Explainable graph neural network for drug–drug and drug–gene interactions")

c1, c2 = st.columns([3, 2], gap="large")
with c1:
    current_sel = st.multiselect("Current medicines", OPTIONS, default=match_options(patient["current"], OPTIONS),
                                 key=f"cur_{pid}", placeholder="Type to search…")
    not_listed = missing_from_options(patient["current"], OPTIONS)
    extra = st.text_input("Other medicines (comma-separated, combinations like ezetimibe/simvastatin allowed)",
                          value=", ".join(not_listed), key=f"extra_{pid}")
with c2:
    new_opts = ["— none —"] + OPTIONS
    default_new = match_options([patient["new"]] if patient["new"] else [], OPTIONS)
    new_sel = st.selectbox("New prescription", new_opts,
                           index=new_opts.index(default_new[0]) if default_new else 0, key=f"new_{pid}")
    st.write("")
    run = st.button("Check interactions", type="primary", width="stretch")

current = current_sel + parse_free_text(extra)
new = None if new_sel == "— none —" else new_sel
genotypes = build_genotypes(selected_gt)
inputs_key = json.dumps([pid, current, new, genotypes], sort_keys=True)

if run:
    if len(current) + (1 if new else 0) < 1:
        st.warning("Add at least one medicine.")
    else:
        st.session_state["result"] = eng.check(current, new, genotypes)
        st.session_state["result_key"] = inputs_key

res = st.session_state.get("result")
if res is None:
    st.info("Pick a patient (left), review the medicines and press **Check interactions**.", icon="👈")
    st.stop()
if st.session_state.get("result_key") != inputs_key:
    st.caption("⚠️ Inputs changed since the last check — press **Check interactions** to update.")

# ------------------------------------------------------------------ results: summary
level = res["overall_level"]
col, bg, icon, action = LEVEL_STYLE.get(level, LEVEL_STYLE["None"])
st.markdown(f'<div class="cl-banner" style="background:{bg};border-color:{col}">'
            f'<div class="lvl" style="color:{col}">{icon} Overall risk: {level}</div>'
            f'<div class="act">{action}</div>'
            f'<div class="act cl-src">{html.escape(overall_reason(res))}</div></div>', unsafe_allow_html=True)

n = summary_counts(res)
m1, m2, m3, m4 = st.columns(4)
m1.metric("Medicines checked", n["medicines"])
m2.metric("Pairs flagged", f"{n['flagged']} / {n['pairs']}")
m3.metric("Genetic alerts", n["genetic"])
m4.metric("Response time", f"{n['ms']:.0f} ms", help="Requirement: under 3,000 ms")

if res["unknown"]:
    st.warning("Not recognised (not in the knowledge graph): " + ", ".join(res["unknown"]), icon="❓")

# ------------------------------------------------------------------ results: drug pairs
st.subheader("Drug–drug interactions")
if not res["pairs"]:
    st.caption("Fewer than two recognised medicines — nothing to compare.")
show_low = st.toggle("Show low-risk pairs", value=len(res["pairs"]) <= 4)
for p in res["pairs"]:
    if p["level"] == "Low" and not show_low:
        continue
    with st.container(border=True):
        st.markdown(f"#### {html.escape(p['name_a'])} + {html.escape(p['name_b'])}")
        st.markdown(pill(p["level"]) + f'<span class="cl-src">{html.escape(p["level_source"])}</span>',
                    unsafe_allow_html=True)
        left, right = st.columns([3, 2], gap="large")
        with left:
            st.markdown(f'<div class="cl-why"><b>Why:</b> {html.escape(p["mechanism"])}</div>', unsafe_allow_html=True)
            src = p["mechanism_source"]
            if src.startswith("model"):
                src += f" · confidence {p['mechanism_confidence']:.0%}"
            st.caption(src)
            if p["documented"]:
                st.markdown(f"**Documented in:** {p['documented']}"
                            + (f" · DDInter severity **{p['severity']}**" if p["severity"] else ""))
            if p["shared_genes"]:
                st.markdown("**Shared pharmacogenes:** " + ", ".join(p["shared_genes"]))
        with right:
            st.markdown(f"**Interaction probability:** {p['risk']:.2f} ± {p['uncertainty']:.2f}")
            st.progress(min(max(float(p["risk"]), 0.0), 1.0))
            st.caption(f"GNN {'(drug with known history)' if p['model_used'] == 'warm' else '(new-drug model)'}"
                       " · ± = Monte-Carlo dropout spread")
        if p["level"] in ("High", "Moderate") and p.get("replace"):
            if p["alternatives"]:
                alt = "; ".join(f"**{a['drug']}** ({a['worst_level']} risk with the other medicines)"
                                for a in p["alternatives"])
                st.success(f"Lower-risk alternative to {p['replace']}: {alt}", icon="💊")
            else:
                st.warning(f"No lower-risk option in the same class as {p['replace']} — "
                           "if co-prescribed, monitor closely.", icon="👁️")
        if p["attention_evidence"]:
            with st.expander("Model evidence (graph attention)"):
                st.caption("Neighbours the network paid most attention to; links shared by both drugs come first.")
                for e in p["attention_evidence"]:
                    st.markdown(f"- {html.escape(e)}")

# ------------------------------------------------------------------ results: pharmacogenomics
st.subheader("🧬 Pharmacogenomic alerts")
tested = tested_genes(selected_gt)
if res["pgx"]:
    st.dataframe(
        pgx_table(res["pgx"]), hide_index=True, width="stretch",
        column_config={**{k: st.column_config.ProgressColumn(k, format="percent", min_value=0.0, max_value=1.0)
                          for k in ("Sri Lankan Tamil", "South Asian", "European")},
                       "Status": st.column_config.TextColumn(width="medium"),
                       "Drug": st.column_config.TextColumn(width="small")})
    st.caption("Allele frequency = share of chromosomes carrying the variant (gnomAD v4; Sri Lankan Tamil = "
               "1000 Genomes STU). Most dosing guidance was developed in European populations.")
else:
    st.caption("No gene–drug rules apply to these medicines" + (f" (tested: {', '.join(tested)})." if tested else "."))

# ------------------------------------------------------------------ footer
st.divider()
f1, f2 = st.columns([3, 1])
f1.caption("Decision support only — final prescribing decisions rest with the clinician. "
           "Research prototype; not validated for clinical use. All patients shown are fictional.")
f2.download_button("Download result (JSON)", json.dumps(res, indent=2, default=str),
                   file_name=f"ddi_check_{pid}.json", mime="application/json", width="stretch")
