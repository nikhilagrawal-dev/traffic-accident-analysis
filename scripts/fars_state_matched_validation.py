import pandas as pd
import numpy as np
from scipy.spatial import cKDTree

R = 6371.0088
THRESHOLDS = [0.5, 1, 2, 5]

PRIMARY_PATH = "data/dataset_with_hotspots.csv"
FARS_PATH = "external_data/fars/FARS2023_accidents_clean.csv"

STATE_NAMES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas",
    "CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware",
    "FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho",
    "IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas",
    "KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland",
    "MA":"Massachusetts","MI":"Michigan","MN":"Minnesota",
    "MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska",
    "NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico",
    "NY":"New York","NC":"North Carolina","ND":"North Dakota",
    "OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania",
    "RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota",
    "TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
    "VA":"Virginia","WA":"Washington","WV":"West Virginia",
    "WI":"Wisconsin","WY":"Wyoming","DC":"District of Columbia"
}


def to_xyz(lat, lon):
    lat = np.radians(lat)
    lon = np.radians(lon)

    return np.column_stack([
        np.cos(lat) * np.cos(lon),
        np.cos(lat) * np.sin(lon),
        np.sin(lat)
    ])


def chord_to_km(d):
    return 2 * R * np.arcsin(np.clip(d / 2, 0, 1))


print("=" * 75)
print("STATE-MATCHED FARS DBSCAN HOTSPOT VALIDATION")
print("=" * 75)

primary = pd.read_csv(PRIMARY_PATH)
fars = pd.read_csv(FARS_PATH)

print(f"\nPrimary dataset: {len(primary):,}")
print(f"FARS dataset:    {len(fars):,}")

# Convert primary state codes to FARS state names
primary = primary.copy()
primary["State_Name"] = primary["State"].map(STATE_NAMES)

hotspots = primary[
    primary["Hotspot_Label"] != -1
].copy()

print(f"Hotspot points:  {len(hotspots):,}")

common_states = sorted(
    set(primary["State_Name"].dropna().unique())
    & set(fars["STATENAME"].dropna().unique())
)

print(f"Potential common states: {len(common_states)}")

results = []

for state in common_states:

    primary_state = primary[
        primary["State_Name"] == state
    ].copy()

    fars_state = fars[
        fars["STATENAME"] == state
    ].copy()

    if len(primary_state) < 100:
        continue

    if len(fars_state) < 20:
        continue

    state_hotspots = hotspots[
        hotspots["State_Name"] == state
    ][["Start_Lat", "Start_Lng"]].dropna()

    if len(state_hotspots) == 0:
        continue

    hotspot_xyz = to_xyz(
        state_hotspots["Start_Lat"].to_numpy(),
        state_hotspots["Start_Lng"].to_numpy()
    )

    tree = cKDTree(hotspot_xyz)

    # FARS distances
    fars_xyz = to_xyz(
        fars_state["LATITUDE"].to_numpy(),
        fars_state["LONGITUD"].to_numpy()
    )

    d, _ = tree.query(fars_xyz, k=1)
    fars_dist = chord_to_km(d)

    # Primary-state baseline
    baseline = primary_state[
        ["Start_Lat", "Start_Lng"]
    ].dropna()

    baseline_xyz = to_xyz(
        baseline["Start_Lat"].to_numpy(),
        baseline["Start_Lng"].to_numpy()
    )

    d, _ = tree.query(baseline_xyz, k=1)
    baseline_dist = chord_to_km(d)

    row = {
        "state": state,
        "primary_n": len(primary_state),
        "fars_n": len(fars_state),
        "hotspot_points": len(state_hotspots),
    }

    for threshold in THRESHOLDS:

        fars_pct = (
            (fars_dist <= threshold).mean() * 100
        )

        primary_pct = (
            (baseline_dist <= threshold).mean() * 100
        )

        row[f"fars_{threshold}km_pct"] = fars_pct
        row[f"primary_{threshold}km_pct"] = primary_pct

        row[f"enrichment_{threshold}km"] = (
            fars_pct / primary_pct
            if primary_pct > 0
            else np.nan
        )

    results.append(row)


results = pd.DataFrame(results)

print("\n" + "-" * 75)
print("STATE-MATCHED RESULTS")
print("-" * 75)

if results.empty:

    print("No valid state-level comparisons were produced.")

else:

    display_cols = [
        "state",
        "primary_n",
        "fars_n",
        "hotspot_points",
        "fars_0.5km_pct",
        "primary_0.5km_pct",
        "enrichment_0.5km",
        "fars_1km_pct",
        "primary_1km_pct",
        "enrichment_1km",
        "fars_2km_pct",
        "primary_2km_pct",
        "enrichment_2km",
        "fars_5km_pct",
        "primary_5km_pct",
        "enrichment_5km",
    ]

    print(
        results[
            display_cols
        ].sort_values(
            "fars_n",
            ascending=False
        ).to_string(index=False)
    )

    print("\n" + "-" * 75)
    print("AGGREGATE STATE-MATCHED RESULTS")
    print("-" * 75)

    for threshold in THRESHOLDS:

        f = f"fars_{threshold}km_pct"
        p = f"primary_{threshold}km_pct"
        e = f"enrichment_{threshold}km"

        valid = results[[f, p, e]].dropna()

        print(f"\n<= {threshold} km")
        print(f"FARS mean:       {valid[f].mean():.2f}%")
        print(f"Primary mean:    {valid[p].mean():.2f}%")
        print(f"Enrichment mean: {valid[e].mean():.2f}x")
        print(f"States tested:   {len(valid)}")

output = "artifacts/fars_state_matched_validation.csv"

results.to_csv(output, index=False)

print("\n" + "=" * 75)
print("VALIDATION COMPLETE")
print("=" * 75)
print(f"\nSaved: {output}")
