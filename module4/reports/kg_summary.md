# Module 4 — Knowledge graph summary

## Nodes
| Type | Count |
|---|---|
| Drug | 1,887 (197 cardiac) |
| Gene | 1,364 |
| Variant (PGx) | 13 |

## Edges
| Type | Count |
|---|---|
| Drug–drug (DrugBank, 86 mechanisms) | 191,808 |
| Drug–drug (DDInter only, severity) | 60,249 |
| — involving a cardiac drug | 69,543 |
| — both drugs cardiac | 7,981 |
| Drug–gene (ClinPGx) | 6,781 (1,001 cardiac) |
| Gene–variant | 0 |

## Entity resolution
- Drug nodes matched to ClinPGx: 1,464 / 1,887
- DDInter drug names matched: 1,182 / 1,939
- DrugBank edges with DDInter severity: 25,911

## Cardiac interaction severity
| Severity | Edges |
|---|---|
| not in DDInter | 47,150 |
| Moderate | 10,627 |
| Unknown | 8,928 |
| Major | 2,026 |
| Minor | 812 |

## Most-connected cardiac drugs
| Drug | Interactions |
|---|---|
| amiodarone | 926 |
| warfarin | 920 |
| diltiazem | 895 |
| verapamil | 854 |
| metoprolol | 847 |
| ticlopidine | 798 |
| isradipine | 797 |
| simvastatin | 783 |
| lidocaine | 781 |
| lovastatin | 781 |

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
