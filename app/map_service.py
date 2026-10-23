import os
import sqlite3
import random
# pyrefly: ignore [missing-import]
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "artifacts" / "accidents_map.db"

def _ensure_db_exists():
    """Ensure accidents_map.db exists. If not, build it from dataset_with_hotspots.csv."""
    if not DB_PATH.exists():
        csv_path = PROJECT_ROOT / "data" / "dataset_with_hotspots.csv"
        if csv_path.exists():
            import pandas as pd
            df = pd.read_csv(
                csv_path,
                usecols=["City", "State", "Start_Lat", "Start_Lng", "Severity", "Hotspot_Flag"]
            )
            conn = sqlite3.connect(DB_PATH)
            df.to_sql("accidents", conn, if_exists="replace", index=False)
            conn.execute("CREATE INDEX idx_city ON accidents(City COLLATE NOCASE)")
            conn.execute("CREATE INDEX idx_lat_lng ON accidents(Start_Lat, Start_Lng)")
            conn.close()

def _get_connection():
    _ensure_db_exists()
    return sqlite3.connect(DB_PATH)

def get_accident_map_data(
    city: str,
    state: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 1500
) -> Dict[str, Any]:
    """
    Retrieve historical accident points for a given city and/or coordinates.
    Returns:
        points: list of [lat, lng, severity, is_hotspot, weight]
        summary stats: severity counts, average severity, hotspot proportion
        center: [lat, lng]
        bounds: [[min_lat, min_lng], [max_lat, max_lng]]
    """
    _ensure_db_exists()
    
    rows = []
    source = "historical_dataset"
    
    try:
        conn = _get_connection()
        cur = conn.cursor()
        
        # 1. Try querying by City name (and State if present)
        if state:
            cur.execute(
                """
                SELECT Start_Lat, Start_Lng, Severity, Hotspot_Flag
                FROM accidents
                WHERE City = ? COLLATE NOCASE AND State = ? COLLATE NOCASE
                LIMIT ?
                """,
                (city.strip(), state.strip(), limit)
            )
            rows = cur.fetchall()
            
        if len(rows) < 20:
            cur.execute(
                """
                SELECT Start_Lat, Start_Lng, Severity, Hotspot_Flag
                FROM accidents
                WHERE City = ? COLLATE NOCASE
                LIMIT ?
                """,
                (city.strip(), limit)
            )
            city_rows = cur.fetchall()
            if len(city_rows) > len(rows):
                rows = city_rows

        # 2. If fewer than 20 rows and coordinates provided, query spatial bounding box (~35km radius)
        if len(rows) < 20 and lat is not None and lng is not None:
            delta = 0.35
            cur.execute(
                """
                SELECT Start_Lat, Start_Lng, Severity, Hotspot_Flag
                FROM accidents
                WHERE Start_Lat BETWEEN ? AND ? AND Start_Lng BETWEEN ? AND ?
                LIMIT ?
                """,
                (lat - delta, lat + delta, lng - delta, lng + delta, limit)
            )
            geo_rows = cur.fetchall()
            if len(geo_rows) > len(rows):
                rows = geo_rows

        conn.close()
    except Exception as e:
        print(f"Error reading accidents_map.db: {e}")
        rows = []

    # 3. If no historical rows found (e.g. international city or unmapped location),
    # generate a realistic simulated spatial cluster so the map visualization is always functional
    if not rows and lat is not None and lng is not None:
        source = "synthetic_spatial_projection"
        rng = np.random.default_rng(seed=abs(int(lat * 1000 + lng * 1000)) % 100000)
        num_sim = 180
        sim_rows = []
        for _ in range(num_sim):
            # Cluster around main thoroughfares
            angle = rng.choice([0.0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi]) + rng.normal(0, 0.2)
            dist = rng.exponential(0.04)
            p_lat = lat + dist * np.sin(angle)
            p_lng = lng + dist * np.cos(angle)
            sev = int(rng.choice([1, 2, 3, 4], p=[0.1, 0.5, 0.3, 0.1]))
            is_hs = 1 if dist < 0.03 and rng.random() > 0.4 else 0
            sim_rows.append((p_lat, p_lng, sev, is_hs))
        rows = sim_rows

    if not rows:
        return {
            "city": city,
            "state": state or "",
            "source": source,
            "total_accidents": 0,
            "hotspot_count": 0,
            "center": [lat or 0.0, lng or 0.0],
            "severity_counts": {"1": 0, "2": 0, "3": 0, "4": 0},
            "average_severity": 0.0,
            "high_risk_ratio": 0.0,
            "points": [],
            "bounds": None
        }

    points = []
    sev_counts = {"1": 0, "2": 0, "3": 0, "4": 0}
    hotspot_total = 0
    total_sev = 0
    
    lats = []
    lngs = []

    for r_lat, r_lng, sev, hs in rows:
        r_lat = float(r_lat)
        r_lng = float(r_lng)
        sev = int(sev)
        hs = bool(hs)
        
        lats.append(r_lat)
        lngs.append(r_lng)
        
        sev_str = str(sev if 1 <= sev <= 4 else 2)
        sev_counts[sev_str] = sev_counts.get(sev_str, 0) + 1
        total_sev += sev
        if hs:
            hotspot_total += 1

        # Weight intensity for heatmap: Severity 1 = 0.35, 2 = 0.55, 3 = 0.8, 4 = 1.0
        # Hotspot adds an intensity boost
        base_weight = {1: 0.35, 2: 0.55, 3: 0.8, 4: 1.0}.get(sev, 0.5)
        if hs:
            base_weight = min(1.0, base_weight + 0.15)

        points.append({
            "lat": round(r_lat, 5),
            "lng": round(r_lng, 5),
            "severity": sev,
            "is_hotspot": hs,
            "weight": round(base_weight, 2)
        })

    center_lat = lat if lat is not None else float(np.mean(lats))
    center_lng = lng if lng is not None else float(np.mean(lngs))

    bounds = [
        [round(min(lats), 5), round(min(lngs), 5)],
        [round(max(lats), 5), round(max(lngs), 5)]
    ]

    total = len(points)
    avg_sev = round(total_sev / total, 2) if total > 0 else 0.0
    high_risk_ratio = round((sev_counts.get("3", 0) + sev_counts.get("4", 0)) / total * 100, 1) if total > 0 else 0.0

    return {
        "city": city,
        "state": state or "",
        "source": source,
        "total_accidents": total,
        "hotspot_count": hotspot_total,
        "center": [round(center_lat, 5), round(center_lng, 5)],
        "severity_counts": sev_counts,
        "average_severity": avg_sev,
        "high_risk_ratio": high_risk_ratio,
        "points": points,
        "bounds": bounds
    }
