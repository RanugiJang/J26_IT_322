"""Shared helpers for Module 4 data scripts."""
from __future__ import annotations

import time
from pathlib import Path

import requests
import yaml
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[2]  # module4/


def load_config() -> dict:
    with open(ROOT / "config" / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def path(rel: str) -> Path:
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def download(url: str, dest: Path, retries: int = 3, timeout: int = 60) -> bool:
    """Stream a file to disk. Skips if it already exists. Returns True on success."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  [skip] {dest.name} already downloaded")
        return True

    tmp = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            with requests.get(url, stream=True, timeout=timeout,
                              headers={"User-Agent": "CardioLoop-Module4/0.1 (academic research)"}) as r:
                if r.status_code != 200:
                    print(f"  [http {r.status_code}] {url}")
                    return False
                total = int(r.headers.get("content-length", 0))
                with open(tmp, "wb") as f, tqdm(total=total, unit="B", unit_scale=True,
                                                desc=dest.name, leave=False) as bar:
                    for chunk in r.iter_content(chunk_size=1 << 16):
                        f.write(chunk)
                        bar.update(len(chunk))
            tmp.rename(dest)
            print(f"  [ok] {dest.name}")
            return True
        except requests.RequestException as e:
            print(f"  [retry {attempt}/{retries}] {url}: {e}")
            time.sleep(3 * attempt)
    if tmp.exists():
        tmp.unlink()
    return False
