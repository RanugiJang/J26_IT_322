# Module 4 — Explainable GNN Framework for Cardiac Drug Interaction Prediction

CardioLoop · J26-IT-322 · Component 4

## Setup (once)

```bash
git checkout main && git pull
git checkout -b feature/module4-ddi-gnn
# copy this module4/ folder into the repo root, then:
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r module4/requirements.txt
cd module4
```

Add to the repo `.gitignore` (raw data must never be committed — DrugBank is CC BY-NC and FAERS is large):

```
module4/data/
module4/.venv/
```

## Step 1 — Get the data

Run in order from inside `module4/`:

| # | Command | Gets | Time |
|---|---------|------|------|
| 1a | `python -m src.data.download_ddi` | TDC DrugBank DDI (~192k pairs, 86 typed mechanisms) + DDInter severity | ~2 min |
| 1b | `python -m src.data.download_clinpgx` | ClinPGx (PharmGKB) relationships, clinical annotations, drugs, genes, variants | ~1 min |
| 1c | `python -m src.data.fetch_population` | gnomAD v4 + 1000 Genomes (incl. Sri Lankan Tamil, STU) frequencies for 13 cardiac PGx variants | ~2 min |
| 1d | `python -m src.data.download_faers` | FAERS 2025 Q1–Q4 (validation only) | 10–20 min |
| 1e | `python -m src.data.check_data` | Inventory report → `reports/data_inventory.md` | seconds |

Then commit:

```bash
git add module4/ .gitignore
git commit -m "Module 4: Step 1 data acquisition pipeline"
git push -u origin feature/module4-ddi-gnn
```

## Step 2 — Knowledge graph

```bash
pip install -r requirements.txt          # adds networkx, matplotlib, pytest
python -m pytest -q                      # unit tests for drug-name matching
python -m src.kg.build_kg                # builds the graph -> data/interim/, reports/kg_summary.md
python -m src.kg.visualize               # slide figure -> reports/figures/kg_warfarin.png
python -m src.kg.visualize clopidogrel   # any other drug
```

| Output | Content |
|--------|---------|
| `nodes_drug.csv` | DrugBank ID, name, ATC codes, `is_cardiac`, SMILES |
| `nodes_gene.csv` / `nodes_variant.csv` | Pharmacogenes; PGx variants with gnomAD SAS / STU / NFE / EAS frequencies |
| `edges_ddi.csv` | Drug–drug edges: mechanism (86 DrugBank types) + DDInter severity |
| `edges_drug_gene.csv` | Drug–gene edges: PK/PD, best ClinPGx evidence level, phenotype category |
| `edges_gene_variant.csv` | Gene–variant edges |
| `name_index.csv` | Name/synonym/brand → DrugBank ID (ambiguous names excluded) |

Design: the GNN trains on the full DrugBank network; every drug is tagged `is_cardiac` (ATC B01, C01–C03, C07–C10) and evaluation/demo focus on edges involving a cardiac drug.

## Step 3 — Splits + baselines

```bash
pip install -r requirements.txt          # adds scikit-learn, xgboost, rdkit
python -m pytest -q                      # 11 tests: name matching, split leakage, feature symmetry
python -m src.kg.build_kg                # rebuild graph with improved drug matching
python -m src.model.splits               # labelled pairs, warm + cold splits
python -m src.model.features             # drug feature vectors
python -m src.model.baselines            # DDInter lookup + XGBoost -> reports/baselines.md
```

- **Matching fixes:** bracket qualifiers, salt/ester suffixes, space/hyphen-insensitive names, manual synonyms (`config/drug_synonyms.csv`), and ClinPGx drugs without a DrugBank ID kept as `PGKB:<id>` (e.g. ticagrelor). Remaining gaps → `reports/missing_cardiac_drugs.csv`.
- **Negatives:** one drug of each positive pair swapped for a random drug (degree-balanced); never a documented interaction.
- **Warm split:** random pairs held out (standard benchmark). **Cold split:** whole drugs held out, cardiac and non-cardiac stratified — test drugs never appear in training.
- **Baselines:** B1 DDInter lookup (current practice), B2 XGBoost on chemical fingerprint + ATC + pharmacogene features. Metrics: AUROC, AUPRC, sensitivity, specificity, precision, F1 — for all pairs and cardiac pairs.

## Manual actions

1. **DrugBank academic licence** — apply at https://go.drugbank.com/academic_research with your SLIIT email. Academic downloads are currently paused by DrugBank; when they reopen, put `full_database.xml` in `data/raw/drugbank/`. Until then the TDC DrugBank-derived set is the DrugBank source.
2. **ClinPGx** — if the script reports `[action needed]`, download the listed zips from https://www.clinpgx.org/downloads into `data/raw/clinpgx/` and re-run 1b.

## Source → role map

| Source | Role in the pipeline |
|--------|----------------------|
| DrugBank (TDC-derived now, full XML later) | Drug–drug edges + mechanism templates (training labels, explanation text) |
| DDInter | Severity labels → rule-based baseline |
| ClinPGx (PharmGKB) | Drug–gene edges, CPIC evidence levels, DrugBank ID cross-references |
| gnomAD v4 + 1000G STU | South Asian vs European/East Asian allele frequencies |
| FAERS | External validation only — never used for training |

## Layout

```
module4/
  config/        config.yaml, pgx_variants.csv
  src/data/      Step 1 scripts
  data/raw/      downloads (git-ignored)
  data/interim/  Step 2 output
  data/processed/ graph tensors (Step 3)
  reports/
```

## Roadmap

1. Data acquisition ✅
2. Entity resolution + knowledge graph ✅
3. **Splits + baselines (DDInter lookup, XGBoost)** ← you are here
4. GNN + class-imbalance handling
5. Attention attribution → clinical-language explanations
6. FAERS cross-check + population transferability
7. Shared Patient Profile integration
