"""
Fix script: generates the 3 missing inference artifacts and copies the model file.

Missing files:
  models/best_model_leakage_free.pkl   -> copy from models/best_model.pkl
  artifacts/train_core_points.csv      -> re-run DBSCAN on train split
  artifacts/train_dbscan_clusters.csv  -> cluster stats from same DBSCAN run
"""

import shutil
import json
import pickle
import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.cluster import DBSCAN

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = ROOT / "artifacts"
MODELS = ROOT / "models"

# ──────────────────────────────────────────────
# 1. Copy model file
# ──────────────────────────────────────────────
src = MODELS / "best_model.pkl"
dst = MODELS / "best_model_leakage_free.pkl"
if dst.exists():
    print(f"[SKIP] {dst.name} already exists.")
else:
    shutil.copy2(src, dst)
    print(f"[OK]   Copied {src.name} -> {dst.name}")

# ──────────────────────────────────────────────
# 2. Reconstruct train split (same seed as training)
# ──────────────────────────────────────────────
print("\nLoading dataset...")
df = pd.read_csv(ROOT / "data" / "dataset_with_hotspots.csv")

OLD_SPATIAL = [
    "Hotspot_Label", "Hotspot_Flag", "Noise_Flag",
    "Cluster_Size", "Distance_To_Cluster_Center", "Local_Accident_Density",
]
df.drop(columns=[c for c in OLD_SPATIAL if c in df.columns], inplace=True)

y = df["Severity"]
X = df.drop(columns=["Severity"])
X_train, _, _, _ = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_train = X_train.copy()
print(f"Train split: {len(X_train):,} rows")

# ──────────────────────────────────────────────
# 3. Re-run DBSCAN to get core points
# ──────────────────────────────────────────────
EPS_KM = 0.5
R_EARTH_KM = 6371.0088
eps_rad = EPS_KM / R_EARTH_KM
MIN_SAMPLES = 5

print("Running DBSCAN (this may take a minute)...")
train_coords_rad = np.radians(X_train[["Start_Lat", "Start_Lng"]].to_numpy())

dbscan = DBSCAN(
    eps=eps_rad,
    min_samples=MIN_SAMPLES,
    metric="haversine",
    algorithm="ball_tree",
    n_jobs=-1,
)
train_labels = dbscan.fit_predict(train_coords_rad)
core_indices = dbscan.core_sample_indices_
print(f"DBSCAN done. Clusters: {len(set(train_labels)) - (1 if -1 in train_labels else 0):,}")

# ──────────────────────────────────────────────
# 4. Save train_core_points.csv
# ──────────────────────────────────────────────
core_lats = X_train.iloc[core_indices]["Start_Lat"].values
core_lngs = X_train.iloc[core_indices]["Start_Lng"].values
core_labels_arr = train_labels[core_indices]

core_df = pd.DataFrame({
    "Core_Lat": core_lats,
    "Core_Lng": core_lngs,
    "Hotspot_Label": core_labels_arr,
})
core_df.to_csv(ARTIFACTS / "train_core_points.csv", index=False)
print(f"[OK]   Saved train_core_points.csv ({len(core_df):,} rows)")

# ──────────────────────────────────────────────
# 5. Save train_dbscan_clusters.csv
# ──────────────────────────────────────────────
X_train["_label"] = train_labels
hotspot_mask = X_train["_label"] != -1
train_hotspots = X_train[hotspot_mask]

cluster_centers = []
for lbl, group in train_hotspots.groupby("_label"):
    cluster_centers.append({
        "Hotspot_Label": lbl,
        "Cluster_Size": len(group),
        "Center_Lat": group["Start_Lat"].mean(),
        "Center_Lng": group["Start_Lng"].mean(),
    })

cluster_stats = pd.DataFrame(cluster_centers)
cluster_stats.to_csv(ARTIFACTS / "train_dbscan_clusters.csv", index=False)
print(f"[OK]   Saved train_dbscan_clusters.csv ({len(cluster_stats):,} clusters)")

# ──────────────────────────────────────────────
# 6. Update inference_spatial_metadata.json
# ──────────────────────────────────────────────
metadata = {
    "train_rows": len(X_train),
    "dbscan_eps_km": EPS_KM,
    "dbscan_min_samples": MIN_SAMPLES,
    "dbscan_metric": "haversine",
    "coordinate_system": "radians (WGS84)",
    "density_rounding_rule": "lat/lng rounded to 2 dp, joined with _",
    "density_fallback": 0,
    "number_of_core_points": len(core_df),
    "number_of_clusters": len(cluster_stats),
}
with open(ARTIFACTS / "inference_spatial_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print("[OK]   Updated inference_spatial_metadata.json")

print("\n✅ All missing artifacts generated. Restart the backend server.")
