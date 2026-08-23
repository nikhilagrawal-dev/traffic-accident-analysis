import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.cluster import DBSCAN

print("Loading original dataset to reconstruct train split...")
INPUT = Path("data/dataset_with_hotspots.csv")
df = pd.read_csv(INPUT)

# Drop any old spatial features
OLD_SPATIAL_FEATURES = [
    "Hotspot_Label",
    "Hotspot_Flag",
    "Noise_Flag",
    "Cluster_Size",
    "Distance_To_Cluster_Center",
    "Local_Accident_Density",
]
existing_old = [c for c in OLD_SPATIAL_FEATURES if c in df.columns]
if existing_old:
    df.drop(columns=existing_old, inplace=True)

y = df["Severity"]
X = df.drop(columns=["Severity"])

TEST_SIZE = 0.2
RANDOM_STATE = 42
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
X_train = X_train.copy()

print(f"X_train reconstructed with {len(X_train)} rows.")

# 1. Reconstruct Density Map
print("Building density map...")
train_lat_rounded = X_train["Start_Lat"].round(2)
train_lng_rounded = X_train["Start_Lng"].round(2)
train_grid_cell = train_lat_rounded.astype(str) + "_" + train_lng_rounded.astype(str)
density_map = train_grid_cell.value_counts().to_dict()

with open("artifacts/density_map.json", "w") as f:
    json.dump(density_map, f, indent=2)
print(f"Saved artifacts/density_map.json with {len(density_map)} cells.")

# 2. Re-run DBSCAN to extract Core Points
print("Re-running DBSCAN to extract core points...")
EPS_KM = 0.5
R_EARTH_KM = 6371.0088
eps_rad = EPS_KM / R_EARTH_KM
MIN_SAMPLES = 5

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

core_lats = X_train.iloc[core_indices]["Start_Lat"].values
core_lngs = X_train.iloc[core_indices]["Start_Lng"].values
core_labels_arr = train_labels[core_indices]

core_df = pd.DataFrame({
    "Core_Lat": core_lats,
    "Core_Lng": core_lngs,
    "Hotspot_Label": core_labels_arr
})
core_df.to_csv("artifacts/train_core_points.csv", index=False)
print(f"Saved artifacts/train_core_points.csv with {len(core_df)} core points.")

# 3. Save inference spatial metadata
print("Saving inference spatial metadata...")
metadata = {
    "train_rows": len(X_train),
    "dbscan_eps_km": EPS_KM,
    "dbscan_min_samples": MIN_SAMPLES,
    "dbscan_metric": "haversine",
    "coordinate_system": "radians (WGS84) for distance",
    "distance_calculation": "haversine (earth radius = 6371.0088 km)",
    "density_rounding_rule": "latitude and longitude rounded to 2 decimal places, concatenated with underscore",
    "density_fallback": 0,
    "spatial_assignment_threshold_km": EPS_KM,
    "number_of_core_points": len(core_df),
    "number_of_clusters": int(len(set(core_labels_arr))),
    "maximum_cluster_size": int(pd.Series(train_labels).value_counts().drop(-1, errors='ignore').max()),
    "feature_schema_version": "leakage_free_final",
    "model_version": "XGBoost (Optimized) - leakage_free"
}
with open("artifacts/inference_spatial_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print("Saved artifacts/inference_spatial_metadata.json.")
print("Done.")
