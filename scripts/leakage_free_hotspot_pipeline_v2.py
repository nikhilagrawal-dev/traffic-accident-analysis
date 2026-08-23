import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.cluster import DBSCAN
from sklearn.neighbors import BallTree

print("=" * 80)
print("1. LOADING DATA AND SPLITTING")
print("=" * 80)

INPUT = Path("data/dataset_with_hotspots.csv")
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)

df = pd.read_csv(INPUT)

OLD_SPATIAL = [
    "Hotspot_Label",
    "Hotspot_Flag",
    "Noise_Flag",
    "Cluster_Size",
    "Distance_To_Cluster_Center",
    "Local_Accident_Density",
]
existing = [c for c in OLD_SPATIAL if c in df.columns]
if existing:
    df.drop(columns=existing, inplace=True)

y = df["Severity"]
X = df.drop(columns=["Severity"])

TEST_SIZE = 0.2
RANDOM_STATE = 42

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
X_train = X_train.copy()
X_test = X_test.copy()

print(f"X_train: {X_train.shape}")
print(f"X_test:  {X_test.shape}")

print("\n" + "=" * 80)
print("2. BUILD TRAIN DENSITY MAP")
print("=" * 80)

def apply_density(df, density_map):
    lat_r = df["Start_Lat"].round(2)
    lng_r = df["Start_Lng"].round(2)
    cells = lat_r.astype(str) + "_" + lng_r.astype(str)
    return cells.map(density_map).fillna(0).astype(np.int32)

train_lat_r = X_train["Start_Lat"].round(2)
train_lng_r = X_train["Start_Lng"].round(2)
train_cells = train_lat_r.astype(str) + "_" + train_lng_r.astype(str)
density_map = train_cells.value_counts().to_dict()

X_train["Local_Accident_Density"] = apply_density(X_train, density_map)
X_test["Local_Accident_Density"] = apply_density(X_test, density_map)

print("\n" + "=" * 80)
print("3. FIT DBSCAN ON TRAIN")
print("=" * 80)

EPS_KM = 0.5
R_EARTH_KM = 6371.0088
eps_rad = EPS_KM / R_EARTH_KM
MIN_SAMPLES = 5

train_coords_rad = np.radians(X_train[["Start_Lat", "Start_Lng"]].to_numpy())

dbscan = DBSCAN(
    eps=eps_rad, min_samples=MIN_SAMPLES, metric="haversine", algorithm="ball_tree", n_jobs=-1
)
train_labels_raw = dbscan.fit_predict(train_coords_rad)

core_indices = dbscan.core_sample_indices_
core_coords_rad = train_coords_rad[core_indices]
core_labels = train_labels_raw[core_indices]

print(f"DBSCAN raw clusters: {len(set(train_labels_raw)) - (1 if -1 in train_labels_raw else 0)}")
print(f"Core points: {len(core_indices)}")

# Save core points
core_lats = X_train.iloc[core_indices]["Start_Lat"].values
core_lngs = X_train.iloc[core_indices]["Start_Lng"].values
pd.DataFrame({
    "Core_Lat": core_lats,
    "Core_Lng": core_lngs,
    "Hotspot_Label": core_labels
}).to_csv(ARTIFACTS / "train_core_points.csv", index=False)

print("\n" + "=" * 80)
print("4. CANONICAL SPATIAL ASSIGNMENT")
print("=" * 80)

core_tree = BallTree(core_coords_rad, metric="haversine")

def assign_clusters(coords_rad, tree, core_lbls, eps_r):
    dist_rad, idx = tree.query(coords_rad, k=1)
    nearest_lbls = core_lbls[idx[:, 0]]
    assigned = np.where(dist_rad[:, 0] <= eps_r, nearest_lbls, -1).astype(np.int32)
    return assigned

train_assigned_labels = assign_clusters(train_coords_rad, core_tree, core_labels, eps_rad)
X_train["Hotspot_Label"] = train_assigned_labels
X_train["Hotspot_Flag"] = (train_assigned_labels != -1).astype(np.uint8)
X_train["Noise_Flag"] = (train_assigned_labels == -1).astype(np.uint8)

test_coords_rad = np.radians(X_test[["Start_Lat", "Start_Lng"]].to_numpy())
test_assigned_labels = assign_clusters(test_coords_rad, core_tree, core_labels, eps_rad)
X_test["Hotspot_Label"] = test_assigned_labels
X_test["Hotspot_Flag"] = (test_assigned_labels != -1).astype(np.uint8)
X_test["Noise_Flag"] = (test_assigned_labels == -1).astype(np.uint8)

print("\n" + "=" * 80)
print("5. CLUSTER STATISTICS")
print("=" * 80)

hotspot_mask = X_train["Hotspot_Label"] != -1
train_hotspots = X_train[hotspot_mask]

cluster_size_map = train_hotspots["Hotspot_Label"].value_counts().to_dict()

# Calculate centers
cluster_centers = []
for lbl, group in train_hotspots.groupby("Hotspot_Label"):
    cluster_centers.append({
        "Hotspot_Label": lbl,
        "Cluster_Size": len(group),
        "Center_Lat": group["Start_Lat"].mean(),
        "Center_Lng": group["Start_Lng"].mean()
    })
cluster_stats = pd.DataFrame(cluster_centers)
cluster_stats.to_csv(ARTIFACTS / "train_dbscan_clusters.csv", index=False)

center_map = cluster_stats.set_index("Hotspot_Label")[["Center_Lat", "Center_Lng"]].to_dict('index')

def apply_stats(df, c_size_map, c_center_map, coords_rad):
    df["Cluster_Size"] = df["Hotspot_Label"].map(c_size_map).fillna(0).astype(np.int32)
    
    dist = np.zeros(len(df))
    mask = df["Hotspot_Label"].to_numpy() != -1
    
    if mask.any():
        lbls = df.loc[mask, "Hotspot_Label"].to_numpy()
        c_coords = np.radians(np.array([
            (c_center_map[l]["Center_Lat"], c_center_map[l]["Center_Lng"]) for l in lbls
        ]))
        p_coords = coords_rad[mask]
        
        dlat = c_coords[:, 0] - p_coords[:, 0]
        dlon = c_coords[:, 1] - p_coords[:, 1]
        a = (np.sin(dlat / 2) ** 2 + 
             np.cos(p_coords[:, 0]) * np.cos(c_coords[:, 0]) * np.sin(dlon / 2) ** 2)
        dist[mask] = 2 * R_EARTH_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
        
    df["Distance_To_Cluster_Center"] = dist
    return df

X_train = apply_stats(X_train, cluster_size_map, center_map, train_coords_rad)
X_test = apply_stats(X_test, cluster_size_map, center_map, test_coords_rad)

X_train_model = X_train.drop(columns=["Hotspot_Label"])
X_test_model = X_test.drop(columns=["Hotspot_Label"])

print("\n" + "=" * 80)
print("6. SAVE ARTIFACTS")
print("=" * 80)

X_train_model.to_csv(ARTIFACTS / "X_train_leakage_free.csv", index=False)
X_test_model.to_csv(ARTIFACTS / "X_test_leakage_free.csv", index=False)
y_train.to_csv(ARTIFACTS / "y_train_leakage_free.csv", index=False)
y_test.to_csv(ARTIFACTS / "y_test_leakage_free.csv", index=False)

with open(ARTIFACTS / "density_map.json", "w") as f:
    json.dump(density_map, f, indent=2)
    
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
    "number_of_core_points": len(core_indices),
    "number_of_clusters": len(cluster_stats),
    "maximum_cluster_size": int(cluster_stats["Cluster_Size"].max()),
    "feature_schema_version": "leakage_free_final",
    "model_version": "XGBoost (Optimized) - leakage_free"
}
with open(ARTIFACTS / "inference_spatial_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
    
print("Pipeline complete.")
