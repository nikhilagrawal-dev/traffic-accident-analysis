import json
from pathlib import Path

import numpy as np
import pandas as pd

from scipy.spatial import cKDTree
from sklearn.cluster import DBSCAN
from sklearn.model_selection import train_test_split


# ============================================================
# CONFIG
# ============================================================

INPUT = Path("data/dataset_with_hotspots.csv")
ARTIFACTS = Path("artifacts")

R_EARTH_KM = 6371.0088

EPS_KM = 0.5
MIN_SAMPLES = 5

TEST_SIZE = 0.20
RANDOM_STATE = 42

ARTIFACTS.mkdir(parents=True, exist_ok=True)


# ============================================================
# HELPERS
# ============================================================

def latlon_to_radians(df):
    return np.radians(
        df[["Start_Lat", "Start_Lng"]].to_numpy(dtype=np.float64)
    )


def haversine_distance_km(a_rad, b_rad):
    """
    Pairwise distance from one point a to many points b.
    """
    dlat = b_rad[:, 0] - a_rad[0]
    dlon = b_rad[:, 1] - a_rad[1]

    x = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(a_rad[0])
        * np.cos(b_rad[:, 0])
        * np.sin(dlon / 2.0) ** 2
    )

    return 2.0 * R_EARTH_KM * np.arcsin(
        np.sqrt(np.clip(x, 0.0, 1.0))
    )


def haversine_to_centers(points_rad, centers_rad):
    """
    Nearest center distance for each point.
    Uses a BallTree through sklearn for efficient haversine search.
    """
    from sklearn.neighbors import BallTree

    tree = BallTree(centers_rad, metric="haversine")

    distances_rad, indices = tree.query(
        points_rad,
        k=1
    )

    distances_km = distances_rad[:, 0] * R_EARTH_KM
    nearest_indices = indices[:, 0]

    return distances_km, nearest_indices


def build_train_density(train_df):
    """
    Fit Local_Accident_Density using TRAIN ONLY.

    Original feature definition:
    latitude/longitude rounded to 2 decimal places,
    approximately a 1.1 km grid.
    """
    train = train_df.copy()

    train["Lat_Rounded"] = train["Start_Lat"].round(2)
    train["Lng_Rounded"] = train["Start_Lng"].round(2)

    train["Grid_Cell"] = (
        train["Lat_Rounded"].astype(str)
        + "_"
        + train["Lng_Rounded"].astype(str)
    )

    density_map = train["Grid_Cell"].value_counts().to_dict()

    return density_map


def apply_train_density(df, density_map):
    """
    Apply a TRAIN-FITTED density map.

    Unknown test cells receive 0 because no training accidents
    were observed in that grid cell.
    """
    result = df.copy()

    lat_rounded = result["Start_Lat"].round(2)
    lng_rounded = result["Start_Lng"].round(2)

    grid_cells = (
        lat_rounded.astype(str)
        + "_"
        + lng_rounded.astype(str)
    )

    return grid_cells.map(density_map).fillna(0).astype(np.int32)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 80)
print("LEAKAGE-FREE HOTSPOT / SPATIAL FEATURE PIPELINE")
print("=" * 80)

print(f"\nLoading: {INPUT}")

df = pd.read_csv(INPUT)

print(f"Dataset shape: {df.shape}")

required = [
    "Severity",
    "Start_Lat",
    "Start_Lng",
]

missing = [c for c in required if c not in df.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")


# ============================================================
# REMOVE OLD FULL-DATASET SPATIAL FEATURES
# ============================================================

OLD_SPATIAL_FEATURES = [
    "Hotspot_Label",
    "Hotspot_Flag",
    "Noise_Flag",
    "Cluster_Size",
    "Distance_To_Cluster_Center",
    "Local_Accident_Density",
]

existing_old = [
    c for c in OLD_SPATIAL_FEATURES
    if c in df.columns
]

print("\nRemoving old spatial features:")
for col in existing_old:
    print(f"  - {col}")

base_df = df.drop(columns=existing_old).copy()


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X = base_df.drop(columns=["Severity"])
y = base_df["Severity"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y,
)

X_train = X_train.copy()
X_test = X_test.copy()

print("\n" + "=" * 80)
print("TRAIN / TEST SPLIT")
print("=" * 80)

print(f"Total: {len(base_df):,}")
print(f"Train: {len(X_train):,}")
print(f"Test : {len(X_test):,}")

print("\nTrain class distribution:")
print(y_train.value_counts(normalize=True).sort_index())

print("\nTest class distribution:")
print(y_test.value_counts(normalize=True).sort_index())


# ============================================================
# 1. LOCAL ACCIDENT DENSITY
# ============================================================

print("\n" + "=" * 80)
print("1. TRAIN-ONLY LOCAL ACCIDENT DENSITY")
print("=" * 80)

density_map = build_train_density(X_train)

X_train["Local_Accident_Density"] = apply_train_density(
    X_train,
    density_map
)

X_test["Local_Accident_Density"] = apply_train_density(
    X_test,
    density_map
)

print(f"Training grid cells: {len(density_map):,}")

print("\nTrain density:")
print(X_train["Local_Accident_Density"].describe())

print("\nTest density:")
print(X_test["Local_Accident_Density"].describe())

unseen_test_cells = (
    X_test["Local_Accident_Density"] == 0
).sum()

print(
    f"\nTest rows in unseen training cells: "
    f"{unseen_test_cells:,} "
    f"({unseen_test_cells / len(X_test) * 100:.2f}%)"
)


# ============================================================
# 2. DBSCAN FIT ONLY ON TRAINING COORDINATES
# ============================================================

print("\n" + "=" * 80)
print("2. TRAIN-ONLY DBSCAN")
print("=" * 80)

eps_rad = EPS_KM / R_EARTH_KM

train_coords_rad = latlon_to_radians(X_train)

print(f"eps: {EPS_KM} km")
print(f"eps radians: {eps_rad}")
print(f"min_samples: {MIN_SAMPLES}")
print(f"Training points: {len(train_coords_rad):,}")

print("\nFitting DBSCAN on TRAIN ONLY...")

dbscan = DBSCAN(
    eps=eps_rad,
    min_samples=MIN_SAMPLES,
    metric="haversine",
    algorithm="ball_tree",
    n_jobs=-1,
)

train_labels = dbscan.fit_predict(train_coords_rad)

X_train["Hotspot_Label"] = train_labels.astype(np.int32)

n_clusters = len(set(train_labels)) - (
    1 if -1 in train_labels else 0
)

n_noise = int((train_labels == -1).sum())

print("\nDBSCAN results:")
print(f"Clusters: {n_clusters:,}")
print(f"Noise: {n_noise:,}")
print(f"Noise percentage: {n_noise / len(train_labels) * 100:.2f}%")


# ============================================================
# 3. TRAIN CLUSTER STATISTICS
# ============================================================

print("\n" + "=" * 80)
print("3. BUILD TRAIN-ONLY CLUSTER STATISTICS")
print("=" * 80)

train_hotspots = X_train[
    X_train["Hotspot_Label"] != -1
].copy()

cluster_stats = (
    train_hotspots
    .groupby("Hotspot_Label")
    .agg(
        Cluster_Size=("Start_Lat", "size"),
        Center_Lat=("Start_Lat", "mean"),
        Center_Lng=("Start_Lng", "mean"),
    )
    .reset_index()
)

print(f"Train hotspot clusters: {len(cluster_stats):,}")

print("\nCluster-size statistics:")
print(
    cluster_stats["Cluster_Size"]
    .describe()
    .to_string()
)


# ============================================================
# 4. TRAIN HOTSPOT FEATURES
# ============================================================

X_train["Hotspot_Flag"] = (
    X_train["Hotspot_Label"] != -1
).astype(np.uint8)

X_train["Noise_Flag"] = (
    X_train["Hotspot_Label"] == -1
).astype(np.uint8)

cluster_size_map = (
    cluster_stats
    .set_index("Hotspot_Label")["Cluster_Size"]
    .to_dict()
)

X_train["Cluster_Size"] = (
    X_train["Hotspot_Label"]
    .map(cluster_size_map)
    .fillna(0)
    .astype(np.int32)
)


# ============================================================
# 5. DISTANCE TO TRAIN CLUSTER CENTER
# ============================================================

print("\nCalculating TRAIN distance-to-center...")

if len(cluster_stats) > 0:

    centers_rad = np.radians(
        cluster_stats[
            ["Center_Lat", "Center_Lng"]
        ].to_numpy()
    )

    train_hotspot_coords = latlon_to_radians(
        X_train
    )

    train_distances, train_center_idx = (
        haversine_to_centers(
            train_hotspot_coords,
            centers_rad
        )
    )

    # Only hotspot rows should receive a center distance.
    X_train["Distance_To_Cluster_Center"] = np.where(
        X_train["Hotspot_Label"].to_numpy() != -1,
        train_distances,
        0.0
    )

else:
    X_train["Distance_To_Cluster_Center"] = 0.0


# ============================================================
# 6. ASSIGN TEST POINTS TO TRAIN-LEARNED HOTSPOTS
# ============================================================

print("\n" + "=" * 80)
print("4. ASSIGN TEST POINTS TO TRAIN-LEARNED HOTSPOTS")
print("=" * 80)

core_indices = dbscan.core_sample_indices_

core_coords = train_coords_rad[core_indices]
core_labels = train_labels[core_indices]

print(f"DBSCAN core points: {len(core_coords):,}")

from sklearn.neighbors import BallTree

core_tree = BallTree(
    core_coords,
    metric="haversine"
)

test_coords_rad = latlon_to_radians(X_test)

test_distances_rad, test_core_indices = core_tree.query(
    test_coords_rad,
    k=1
)

test_distances_km = (
    test_distances_rad[:, 0] * R_EARTH_KM
)

nearest_core_labels = (
    core_labels[test_core_indices[:, 0]]
)

# A test point becomes part of a learned hotspot only if
# it lies within DBSCAN eps of a TRAIN core point.
test_labels = np.where(
    test_distances_rad[:, 0] <= eps_rad,
    nearest_core_labels,
    -1
).astype(np.int32)

X_test["Hotspot_Label"] = test_labels

X_test["Hotspot_Flag"] = (
    X_test["Hotspot_Label"] != -1
).astype(np.uint8)

X_test["Noise_Flag"] = (
    X_test["Hotspot_Label"] == -1
).astype(np.uint8)


# ============================================================
# 7. TEST CLUSTER SIZE = TRAIN CLUSTER SIZE
# ============================================================

X_test["Cluster_Size"] = (
    X_test["Hotspot_Label"]
    .map(cluster_size_map)
    .fillna(0)
    .astype(np.int32)
)


# ============================================================
# 8. TEST DISTANCE TO TRAIN CLUSTER CENTER
# ============================================================

cluster_center_map = {
    int(row.Hotspot_Label): (
        float(row.Center_Lat),
        float(row.Center_Lng)
    )
    for row in cluster_stats.itertuples()
}

test_distance_to_center = np.zeros(len(X_test))

hotspot_test_mask = (
    X_test["Hotspot_Label"].to_numpy() != -1
)

if hotspot_test_mask.any():

    hotspot_labels_test = (
        X_test.loc[
            hotspot_test_mask,
            "Hotspot_Label"
        ].to_numpy()
    )

    center_coords = np.radians(
        np.array([
            cluster_center_map[int(label)]
            for label in hotspot_labels_test
        ])
    )

    point_coords = test_coords_rad[
        hotspot_test_mask
    ]

    # Haversine distance point -> its TRAIN cluster center
    dlat = (
        center_coords[:, 0]
        - point_coords[:, 0]
    )

    dlon = (
        center_coords[:, 1]
        - point_coords[:, 1]
    )

    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(point_coords[:, 0])
        * np.cos(center_coords[:, 0])
        * np.sin(dlon / 2) ** 2
    )

    test_distance_to_center[
        hotspot_test_mask
    ] = (
        2
        * R_EARTH_KM
        * np.arcsin(
            np.sqrt(np.clip(a, 0, 1))
        )
    )

X_test["Distance_To_Cluster_Center"] = (
    test_distance_to_center
)


# ============================================================
# 9. VALIDATION SUMMARY
# ============================================================

print("\n" + "=" * 80)
print("5. LEAKAGE-FREE VALIDATION SUMMARY")
print("=" * 80)

print("\nTrain:")
print(
    "  Hotspot rows:",
    int(X_train["Hotspot_Flag"].sum()),
    f"({X_train['Hotspot_Flag'].mean() * 100:.2f}%)"
)

print(
    "  Noise rows:",
    int(X_train["Noise_Flag"].sum()),
    f"({X_train['Noise_Flag'].mean() * 100:.2f}%)"
)

print("\nTest:")
print(
    "  Assigned hotspot rows:",
    int(X_test["Hotspot_Flag"].sum()),
    f"({X_test['Hotspot_Flag'].mean() * 100:.2f}%)"
)

print(
    "  Unassigned/noise rows:",
    int(X_test["Noise_Flag"].sum()),
    f"({X_test['Noise_Flag'].mean() * 100:.2f}%)"
)

print("\nTest cluster sizes use TRAIN cluster counts only.")

print(
    "\nMaximum train cluster size:",
    X_train["Cluster_Size"].max()
)

print(
    "Maximum test cluster size:",
    X_test["Cluster_Size"].max()
)


# ============================================================
# 10. REMOVE HOTSPOT LABEL FROM MODEL FEATURES
# ============================================================

print("\n" + "=" * 80)
print("6. PREPARE MODEL FEATURES")
print("=" * 80)

# Hotspot_Label is an arbitrary DBSCAN identifier.
# Do NOT give this numeric ID to the classifier.
MODEL_DROP = ["Hotspot_Label"]

X_train_model = X_train.drop(columns=MODEL_DROP)
X_test_model = X_test.drop(columns=MODEL_DROP)

print(
    f"X_train model shape: {X_train_model.shape}"
)

print(
    f"X_test model shape : {X_test_model.shape}"
)


# ============================================================
# 11. SAVE ARTIFACTS
# ============================================================

print("\n" + "=" * 80)
print("7. SAVING ARTIFACTS")
print("=" * 80)

X_train_model.to_csv(
    ARTIFACTS / "X_train_leakage_free.csv",
    index=False
)

X_test_model.to_csv(
    ARTIFACTS / "X_test_leakage_free.csv",
    index=False
)

y_train.to_csv(
    ARTIFACTS / "y_train_leakage_free.csv",
    index=False
)

y_test.to_csv(
    ARTIFACTS / "y_test_leakage_free.csv",
    index=False
)

cluster_stats.to_csv(
    ARTIFACTS / "train_dbscan_clusters.csv",
    index=False
)


# Save the fitted clustering metadata.
metadata = {
    "eps_km": EPS_KM,
    "min_samples": MIN_SAMPLES,
    "random_state": RANDOM_STATE,
    "test_size": TEST_SIZE,
    "train_rows": int(len(X_train)),
    "test_rows": int(len(X_test)),
    "train_clusters": int(n_clusters),
    "train_noise_rows": int(n_noise),
    "train_noise_pct": float(
        n_noise / len(X_train) * 100
    ),
    "train_core_points": int(len(core_coords)),
    "hotspot_label_removed_from_model": True,
    "local_density_fit_on": "train_only",
    "dbscan_fit_on": "train_only",
    "test_hotspot_assignment": (
        "nearest_train_core_within_eps"
    ),
}

with open(
    ARTIFACTS / "leakage_free_spatial_metadata.json",
    "w"
) as f:
    json.dump(metadata, f, indent=2)


# ============================================================
# FINAL CHECKS
# ============================================================

print("\nSaved:")
print(
    "  artifacts/X_train_leakage_free.csv"
)
print(
    "  artifacts/X_test_leakage_free.csv"
)
print(
    "  artifacts/y_train_leakage_free.csv"
)
print(
    "  artifacts/y_test_leakage_free.csv"
)
print(
    "  artifacts/train_dbscan_clusters.csv"
)
print(
    "  artifacts/leakage_free_spatial_metadata.json"
)

print("\nFinal columns:")
print(
    list(X_train_model.columns)
)

print("\n" + "=" * 80)
print("LEAKAGE-FREE PIPELINE COMPLETE")
print("=" * 80)
