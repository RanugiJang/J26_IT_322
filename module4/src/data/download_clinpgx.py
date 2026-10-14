"""Step 1b — Drug-gene data from ClinPGx (successor to PharmGKB).

Downloads relationships, clinical annotations, drugs, genes and variants, then
unzips each into data/raw/clinpgx/<name>/.

drugs.tsv carries ATC codes and cross-references (incl. DrugBank IDs) — this is
what the entity-resolution step (Step 2) uses to join ClinPGx to DrugBank.

If the API URLs fail, open https://www.clinpgx.org/downloads in a browser,
download the same zip files, and drop them into data/raw/clinpgx/ — then
re-run this script; it will just unzip them.

Run:  python -m src.data.download_clinpgx
"""
from __future__ import annotations

import zipfile

from .common import download, load_config, path


def main() -> None:
    cfg = load_config()
    out_dir = path(f"{cfg['paths']['raw']}/clinpgx/x").parent
    print("\n== ClinPGx / PharmGKB ==")

    missing = []
    for fname in cfg["clinpgx"]["files"]:
        dest = out_dir / fname
        ok = any(download(base + fname, dest) for base in cfg["clinpgx"]["base_urls"])
        if not ok:
            missing.append(fname)
            continue
        target = out_dir / fname.replace(".zip", "")
        if not target.exists():
            try:
                with zipfile.ZipFile(dest) as z:
                    z.extractall(target)
                print(f"  [unzipped] {target.name}/ -> {', '.join(sorted(z.namelist())[:4])} ...")
            except zipfile.BadZipFile:
                print(f"  [error] {fname} is not a valid zip (maybe an HTML licence page). Delete it and download manually.")
                dest.unlink()
                missing.append(fname)

    if missing:
        print("\n  [action needed] download manually from https://www.clinpgx.org/downloads :")
        for m in missing:
            print("   -", m)
        print(f"  put them in {out_dir} and re-run.")
    else:
        print("\n  all ClinPGx files ready.")


if __name__ == "__main__":
    main()
