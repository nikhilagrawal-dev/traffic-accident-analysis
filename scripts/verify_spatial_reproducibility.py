import pandas as pd
import numpy as np
import json
from sklearn.neighbors import BallTree
from pathlib import Path

print("Loading validation datasets...")
X_train_leakage_free = pd.read_csv("artifacts/X_train_leakage_free.csv")

# We need the original Start_Lat and Start_Lng. They are already in X_train_leakage_free!
sample_df = X_train_leakage_free.sample(n=5000, random_state=42).copy()

print("Loading inference artifacts...")
with open("artifacts/density_map.json", "r") as f:
    density_map = json.load(f)
    
core_points = pd.read_csv("artifacts/train_core_points.csv")
clusters = pd.read_csv("artifacts/train_dbscan_clusters.csv")

# Ensure core points are ordered properly just in case
core_coords_rad = np.radians(core_points[["Core_Lat", "Core_Lng"]].to_numpy())
core_labels = core_points["Hotspot_Label"].to_numpy()

R_EARTH_KM = 6371.0088
EPS_KM = 0.5
eps_rad = EPS_KM / R_EARTH_KM

print("Building BallTree from core points...")
core_tree = BallTree(core_coords_rad, metric="haversine")

cluster_size_map = clusters.set_index("Hotspot_Label")["Cluster_Size"].to_dict()
cluster_center_map = clusters.set_index("Hotspot_Label")[["Center_Lat", "Center_Lng"]].to_dict('index')

print("Generating inference features...")
# 1. Density
test_lat_rounded = sample_df["Start_Lat"].round(2)
test_lng_rounded = sample_df["Start_Lng"].round(2)
test_grid_cells = test_lat_rounded.astype(str) + "_" + test_lng_rounded.astype(str)
inf_density = test_grid_cells.map(density_map).fillna(0).astype(np.int32)

# 2. Assignment
test_coords_rad = np.radians(sample_df[["Start_Lat", "Start_Lng"]].to_numpy())
test_distances_rad, test_core_indices = core_tree.query(test_coords_rad, k=1)

nearest_core_labels = core_labels[test_core_indices[:, 0]]
inf_hotspot_label = np.where(test_distances_rad[:, 0] <= eps_rad, nearest_core_labels, -1).astype(np.int32)

# Flags
inf_hotspot_flag = (inf_hotspot_label != -1).astype(np.uint8)
inf_noise_flag = (inf_hotspot_label == -1).astype(np.uint8)

# Cluster Size
inf_cluster_size = pd.Series(inf_hotspot_label).map(cluster_size_map).fillna(0).astype(np.int32)

# Distance to Center
inf_distance = np.zeros(len(sample_df))
hotspot_mask = inf_hotspot_label != -1

if hotspot_mask.any():
    hotspot_labels = inf_hotspot_label[hotspot_mask]
    center_coords = np.radians(np.array([
        (cluster_center_map[lbl]["Center_Lat"], cluster_center_map[lbl]["Center_Lng"]) 
        for lbl in hotspot_labels
    ]))
    point_coords = test_coords_rad[hotspot_mask]
    
    dlat = center_coords[:, 0] - point_coords[:, 0]
    dlon = center_coords[:, 1] - point_coords[:, 1]
    
    a = (np.sin(dlat / 2) ** 2 + 
         np.cos(point_coords[:, 0]) * np.cos(center_coords[:, 0]) * np.sin(dlon / 2) ** 2)
    
    inf_distance[hotspot_mask] = 2 * R_EARTH_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))

# ====================
# COMPARISON
# ====================
print("\n" + "="*50)
print("PHASE 3 - REPRODUCIBILITY VALIDATION")
print("="*50)

def compare_exact(name, expected, actual):
    matches = (expected == actual).sum()
    mismatches = len(expected) - matches
    print(f"{name}: Matches={matches}, Mismatches={mismatches} ({mismatches/len(expected)*100:.2f}%)")
    if mismatches > 0:
        print(f"FAILED {name}")
        
def compare_float(name, expected, actual, tol=1e-8):
    diff = np.abs(expected - actual)
    max_diff = diff.max()
    mean_diff = diff.mean()
    mismatches = (diff > tol).sum()
    print(f"{name}: Matches={len(expected)-mismatches}, Mismatches={mismatches} ({mismatches/len(expected)*100:.2f}%)")
    print(f"    Max Abs Error = {max_diff:.2e}")
    print(f"    Mean Abs Error = {mean_diff:.2e}")
    if mismatches > 0:
        print(f"FAILED {name} (tol={tol})")

compare_exact("Local_Accident_Density", sample_df["Local_Accident_Density"].values, inf_density.values)
compare_exact("Hotspot_Flag", sample_df["Hotspot_Flag"].values, inf_hotspot_flag)
compare_exact("Noise_Flag", sample_df["Noise_Flag"].values, inf_noise_flag)
compare_exact("Cluster_Size", sample_df["Cluster_Size"].values, inf_cluster_size)
compare_float("Distance_To_Cluster_Center", sample_df["Distance_To_Cluster_Center"].values, inf_distance, tol=1e-8)

print("Validation completed.")
