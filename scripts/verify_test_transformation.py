import pandas as pd
import numpy as np
import json
from sklearn.neighbors import BallTree

print("Loading test dataset...")
X_test_leakage_free = pd.read_csv("artifacts/X_test_leakage_free.csv")
sample_df = X_test_leakage_free.copy()

print("Loading inference artifacts...")
with open("artifacts/density_map.json", "r") as f:
    density_map = json.load(f)
core_points = pd.read_csv("artifacts/train_core_points.csv")
clusters = pd.read_csv("artifacts/train_dbscan_clusters.csv")
core_coords_rad = np.radians(core_points[["Core_Lat", "Core_Lng"]].to_numpy())
core_labels = core_points["Hotspot_Label"].to_numpy()

R_EARTH_KM = 6371.0088
eps_rad = 0.5 / R_EARTH_KM
core_tree = BallTree(core_coords_rad, metric="haversine")
cluster_size_map = clusters.set_index("Hotspot_Label")["Cluster_Size"].to_dict()
cluster_center_map = clusters.set_index("Hotspot_Label")[["Center_Lat", "Center_Lng"]].to_dict('index')

print("Generating inference features...")
# Density
test_grid_cells = sample_df["Start_Lat"].round(2).astype(str) + "_" + sample_df["Start_Lng"].round(2).astype(str)
inf_density = test_grid_cells.map(density_map).fillna(0).astype(np.int32)

# Assignment
test_coords_rad = np.radians(sample_df[["Start_Lat", "Start_Lng"]].to_numpy())
test_distances_rad, test_core_indices = core_tree.query(test_coords_rad, k=1)
nearest_core_labels = core_labels[test_core_indices[:, 0]]
inf_hotspot_label = np.where(test_distances_rad[:, 0] <= eps_rad, nearest_core_labels, -1).astype(np.int32)

inf_hotspot_flag = (inf_hotspot_label != -1).astype(np.uint8)
inf_noise_flag = (inf_hotspot_label == -1).astype(np.uint8)
inf_cluster_size = pd.Series(inf_hotspot_label).map(cluster_size_map).fillna(0).astype(np.int32)

inf_distance = np.zeros(len(sample_df))
mask = inf_hotspot_label != -1
if mask.any():
    lbls = inf_hotspot_label[mask]
    c_coords = np.radians(np.array([(cluster_center_map[l]["Center_Lat"], cluster_center_map[l]["Center_Lng"]) for l in lbls]))
    p_coords = test_coords_rad[mask]
    dlat = c_coords[:, 0] - p_coords[:, 0]
    dlon = c_coords[:, 1] - p_coords[:, 1]
    a = (np.sin(dlat / 2) ** 2 + np.cos(p_coords[:, 0]) * np.cos(c_coords[:, 0]) * np.sin(dlon / 2) ** 2)
    inf_distance[mask] = 2 * R_EARTH_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))

print("\n" + "="*50)
def compare_exact(name, expected, actual):
    matches = (expected == actual).sum()
    print(f"{name}: Matches={matches}, Mismatches={len(expected)-matches}")
    if matches != len(expected): print("FAILED")
def compare_float(name, expected, actual, tol=1e-8):
    diff = np.abs(expected - actual)
    mismatches = (diff > tol).sum()
    print(f"{name}: Matches={len(expected)-mismatches}, Mismatches={mismatches}")
    if mismatches > 0: print("FAILED")

compare_exact("Local_Accident_Density", sample_df["Local_Accident_Density"].values, inf_density.values)
compare_exact("Hotspot_Flag", sample_df["Hotspot_Flag"].values, inf_hotspot_flag)
compare_exact("Noise_Flag", sample_df["Noise_Flag"].values, inf_noise_flag)
compare_exact("Cluster_Size", sample_df["Cluster_Size"].values, inf_cluster_size)
compare_float("Distance_To_Cluster_Center", sample_df["Distance_To_Cluster_Center"].values, inf_distance)
