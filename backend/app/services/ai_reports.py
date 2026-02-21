import csv
from pathlib import Path

def generate_catalog_report(products):
    path = Path("reports/catalog_report.csv")
    path.parent.mkdir(exist_ok=True)
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Product ID", "Issues"])
        for p in products:
            w.writerow([p["id"], ", ".join(p.get("issues", []))])
    return path
