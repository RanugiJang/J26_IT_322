# Module 4 — Knowledge graph summary

## Nodes
| Type | Count |
|---|---|
| Drug | 2,132 (207 cardiac) |
| Gene | 1,440 |
| Variant (PGx) | 13 |

## Edges
| Type | Count |
|---|---|
| Drug–drug (DrugBank, 86 mechanisms) | 191,808 |
| Drug–drug (DDInter only, severity) | 94,060 |
| — involving a cardiac drug | 75,166 |
| — both drugs cardiac | 8,256 |
| Drug–gene (ClinPGx) | 7,270 (1,052 cardiac) |
| Gene–variant | 0 |

## Entity resolution
- Drug nodes matched to ClinPGx: 1,709 / 2,132
- DDInter drug names matched: 1,589 / 1,939
- DrugBank edges with DDInter severity: 27,032

## Cardiac interaction severity
| Severity | Edges |
|---|---|
| not in DDInter | 46,943 |
| Moderate | 14,424 |
| Unknown | 9,014 |
| Major | 3,816 |
| Minor | 969 |

## Most-connected cardiac drugs
| Drug | Interactions |
|---|---|
| amiodarone | 1,002 |
| warfarin | 1,001 |
| diltiazem | 955 |
| verapamil | 913 |
| metoprolol | 875 |
| simvastatin | 861 |
| lidocaine | 839 |
| ticlopidine | 837 |
| isradipine | 829 |
| lovastatin | 828 |

## Most common mechanisms (cardiac edges)
| Mechanism | Edges |
|---|---|
| The risk or severity of adverse effects can be increased when #Drug1 is combined with #Drug2. | 13,738 |
| The metabolism of #Drug2 can be decreased when combined with #Drug1. | 8,527 |
| #Drug1 may increase the hypotensive activities of #Drug2. | 6,551 |
| The serum concentration of #Drug2 can be increased when it is combined with #Drug1. | 6,425 |
| #Drug1 may decrease the antihypertensive activities of #Drug2. | 2,336 |
| #Drug1 may increase the anticoagulant activities of #Drug2. | 2,088 |
| The therapeutic efficacy of #Drug2 can be decreased when used in combination with #Drug1. | 2,058 |
| The serum concentration of #Drug2 can be decreased when it is combined with #Drug1. | 1,702 |
