# Exercise Quality Model - results (REHAB24-6)

Task: classify one exercise repetition as **correct / incorrect** from joint positions.
Data: REHAB24-6 standardized joint positions (12 joints x XYZ, hip-centred), 6 exercises, 10 people,
1,057 repetitions after removing 15 flagged as bad motion-capture.

## How it was tested (important)
**Leave-one-person-out:** train on all people except one, test on the held-out person, repeat for everyone.
`subject_id` in the CSVs is a *video* id, so the person id comes from `Segmentation.csv`.
A random split leaks the person's identity into the test set and gives 80-95% - not a valid result.

## Results - balanced accuracy on unseen people (%)  [chance = 50]
| Exercise | Random Forest per exercise (chosen) | Random Forest, one pooled model | LSTM per exercise | LSTM pooled (3-seed mean) |
|---|---|---|---|---|
| Arm abduction | 73.6 | 69.1 | 69.1 | 65.2 |
| Arm VW | 67.1 | 65.4 | 54.9 | 50.9 |
| Push-up | 82.2 | 72.0 | 81.2 | 70.9 |
| Leg abduction | 71.4 | 73.5 | 70.0 | 67.5 |
| Leg lunge | 78.8 | 79.6 | 51.4 | 57.4 |
| Squat | 70.2 | 74.7 | 62.3 | 66.6 |
| **Mean** | **73.9** | **72.4** | **64.8** | **63.1** (60.2-66.1 across seeds) |

Plain accuracy of the chosen model (majority-class guess in brackets): arm abduction 73.6 (50.6), arm VW 67.3 (54.8),
push-up 82.3 (52.1), leg abduction 72.9 (57.1), leg lunge 79.3 (55.2), squat 75.4 (68.1). Mean 75.1 (56.3).

## Chosen model
Per-exercise **Random Forest** (300 trees) on engineered features + **per-person median normalisation**.
Features per repetition: min / max / range / mean / std / speed / time-of-peak for 8 joint angles (elbow, shoulder, knee,
ankle, left and right), left-right range-of-motion asymmetry, repetition duration, and a 10-point trajectory shape.
Chosen *before* the final run as the single pipeline reported (the earlier six-way comparison used the same test, so a
small optimistic bias remains; a nested test would remove it).

## Findings
1. Hand-built features beat the LSTM. With ~100-200 repetitions per exercise the LSTM is unstable
   (60-66% pooled depending only on the random seed) and is at or below chance on Arm VW, Leg lunge and Squat.
2. One pooled Random Forest is almost as good as six separate ones (72.4 vs 73.9, within noise).
3. How many repetitions the app needs (typical-movement estimate from k repetitions, balanced accuracy):
   k=3: 67.9 | k=5: 71.1 | k=10: 72.9 | all (~20): 74.0. Use **at least 5 repetitions per set**.
4. Results vary a lot between people (arm abduction: 29% to 100% depending on who is held out).

## Limitations (state these in the report)
* Only 8-10 people, general rehabilitation exercises, not cardiac patients.
* Motion-capture data; phone video through MediaPipe will be noisier (domain gap, not measured here).
* Per-person normalisation hides a patient who does every repetition wrongly in the same way. A real system needs
  therapist reference repetitions or a fixed reference.
* The accuracy of the saved model on its own training data is meaningless (a forest memorises); only the table above counts.

## Suggested wording
"Models were evaluated with leave-one-person-out cross-validation (8-10 participants per exercise). A Random Forest on
engineered joint-angle features with per-person normalisation reached a mean balanced accuracy of 73.9% (chance 50%),
outperforming an LSTM (64.8%). Performance varies substantially between individuals owing to the small cohort."

## Files
`train_exercise_models.py` features + evaluation | `exercise_quality_models.pkl` final models | `exercise_inference.py` use in the app |
`lstm_lib.py`, `lstm_eval_per_exercise.py`, `lstm_eval_pooled.py` LSTM experiments | `reps_needed.py` repetitions-needed test.
Run from the folder that contains `Segmentation.csv` and `standardized_data/` (the REHAB24-6 repo).
