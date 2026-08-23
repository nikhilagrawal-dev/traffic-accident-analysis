import pandas as pd
import numpy as np
from scipy.spatial import cKDTree

R = 6371.0088

PRIMARY_PATH = "data/dataset_with_hotspots.csv"
FARS_PATH = "external_data/fars/FARS2023_accidents_clean.csv"

THRESHOLDS = [0.5, 1, 2, 5]
REPS = 20
SEED = 42


def to_xyz(lat_deg, lon_deg):
    lat = np.radians(lat_deg)
    lon = np.radians(lon_deg)

    return np.column_stack([
        np.cos(lat) * np.cos(lon),
        np.cos(lat) * np.sin(lon),
        np.sin(lat),
    ])


def chord_to_km(chord_distance):
    return 2 * R * np.arcsin(
        np.clip(chord_distance / 2, 0, 1)
    )


print("=" * 70)
print("FARS INDEPENDENT DBSCAN HOTSPOT VALIDATION")
print("=" * 70)

primary = pd.read_csv(PRIMARY_PATH)
fars = pd.read_csv(FARS_PATH)

print(f"\nPrimary dataset: {len(primary):,} rows")
print(f"FARS dataset:    {len(fars):,} rows")

# DBSCAN hotspot points
hotspots = primary[
    primary["Hotspot_Label"] != -1
][["Start_Lat", "Start_Lng"]].dropna()

all_points = primary[
    ["Start_Lat", "Start_Lng"]
].dropna()

print(f"\nHotspot points: {len(hotspots):,}")
print(f"Primary geographic points: {len(all_points):,}")

hotspot_xyz = to_xyz(
    hotspots["Start_Lat"].to_numpy(),
    hotspots["Start_Lng"].to_numpy()
)

tree = cKDTree(hotspot_xyz)

# FARS points
fars_xyz = to_xyz(
    fars["LATITUDE"].to_numpy(),
    fars["LONGITUD"].to_numpy()
)

chord_distance, _ = tree.query(fars_xyz, k=1)
fars_distance = chord_to_km(chord_distance)

print("\n" + "-" * 70)
print("FARS DISTANCE TO NEAREST DBSCAN HOTSPOT")
print("-" * 70)

fars_percentages = {}

for threshold in THRESHOLDS:
    percentage = (fars_distance <= threshold).mean() * 100
    fars_percentages[threshold] = percentage

    print(
        f"<= {threshold:>4} km : "
        f"{(fars_distance <= threshold).sum():>6,} crashes "
        f"({percentage:6.2f}%)"
    )

# Random baseline
rng = np.random.default_rng(SEED)
baseline_results = []

print("\n" + "-" * 70)
print(f"RANDOM BASELINE ({REPS} REPETITIONS)")
print("-" * 70)

for rep in range(REPS):

    indices = rng.choice(
        len(all_points),
        size=len(fars),
        replace=False
    )

    sampled = all_points.iloc[indices]

    sample_xyz = to_xyz(
        sampled["Start_Lat"].to_numpy(),
        sampled["Start_Lng"].to_numpy()
    )

    chord_distance, _ = tree.query(sample_xyz, k=1)
    distance = chord_to_km(chord_distance)

    row = {}

    for threshold in THRESHOLDS:
        row[threshold] = (
            (distance <= threshold).mean() * 100
        )

    baseline_results.append(row)

baseline = pd.DataFrame(baseline_results)

print("\n" + "-" * 70)
print("RANDOM BASELINE SUMMARY")
print("-" * 70)

for threshold in THRESHOLDS:

    random_mean = baseline[threshold].mean()
    random_std = baseline[threshold].std(ddof=1)
    minimum = baseline[threshold].min()
    maximum = baseline[threshold].max()

    fars_percentage = fars_percentages[threshold]
    enrichment = fars_percentage / random_mean

    print(f"\n<= {threshold} km")
    print(f"FARS:       {fars_percentage:.2f}%")
    print(f"Random:     {random_mean:.2f}% (± {random_std:.2f}%)")
    print(f"Range:      {minimum:.2f}% - {maximum:.2f}%")
    print(f"Enrichment: {enrichment:.2f}x")

# Save results
output = []

for threshold in THRESHOLDS:

    random_mean = baseline[threshold].mean()
    random_std = baseline[threshold].std(ddof=1)
    fars_percentage = fars_percentages[threshold]

    output.append({
        "threshold_km": threshold,
        "fars_percentage": fars_percentage,
        "random_baseline_mean": random_mean,
        "random_baseline_std": random_std,
        "enrichment_ratio": fars_percentage / random_mean,
    })

results = pd.DataFrame(output)

results.to_csv(
    "artifacts/fars_hotspot_validation.csv",
    index=False
)

baseline.to_csv(
    "artifacts/fars_random_baseline_repetitions.csv",
    index=False
)

print("\n" + "=" * 70)
print("VALIDATION COMPLETE")
print("=" * 70)

print("\nSaved:")
print("  artifacts/fars_hotspot_validation.csv")
print("  artifacts/fars_random_baseline_repetitions.csv")
