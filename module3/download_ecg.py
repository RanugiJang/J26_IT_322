
import wfdb
from pathlib import Path

# Create a folder for downloaded ECG data
data_dir = Path("data/mitdb")
data_dir.mkdir(parents=True, exist_ok=True)

# Download one recording and its annotations
wfdb.dl_database(
    "mitdb",
    dl_dir=str(data_dir),
    records=["100"]
)

print("ECG recording downloaded successfully!")
print("Saved in:", data_dir.resolve())
