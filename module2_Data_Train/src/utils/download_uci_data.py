"""
Download and cache the genuine UCI Heart Disease Clinical Dataset (Cleveland, Hungary, Switzerland, VA).
Total 920 cardiac patient records containing genuine exercise stress test data.
"""

import os
import ssl
import urllib.request
import pandas as pd

def download_uci_dataset(output_path="module2/data/uci_heart_disease.csv"):
    if os.path.exists(output_path):
        print(f"Dataset already exists at {output_path}")
        return pd.read_csv(output_path)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    cols = [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal", "num"
    ]

    urls = {
        'Cleveland': 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data',
        'Hungary': 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.hungarian.data',
        'Switzerland': 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.switzerland.data',
        'VA': 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.va.data'
    }

    frames = []
    for name, url in urls.items():
        print(f"Fetching {name} data from UCI repository...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            d = pd.read_csv(resp, header=None, names=cols, na_values="?")
            d["hospital"] = name
            frames.append(d)

    df = pd.concat(frames, ignore_index=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Successfully saved {len(df)} records to {output_path}")
    return df

if __name__ == '__main__':
    download_uci_dataset()
