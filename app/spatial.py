from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

R_EARTH_KM = 6371.0088
PROJECT_ROOT = Path(__file__).resolve().parent.parent

class ClusterSpatialService:
    """
    Spatial query service for canonical DBSCAN accident clusters.

    Indexes genuine cluster centroids from `train_dbscan_clusters.csv`
    using a Haversine BallTree for sub-millisecond nearby-cluster lookups.
    """
    def __init__(self, artifacts_dir: Path | None = None):
        self.artifacts_dir = artifacts_dir or (PROJECT_ROOT / "artifacts")
        self._load_clusters()

    def _load_clusters(self):
        clusters_path = self.artifacts_dir / "train_dbscan_clusters.csv"
        if not clusters_path.exists():
            raise FileNotFoundError(f"Missing cluster artifact: {clusters_path}")

        self.clusters_df = pd.read_csv(clusters_path)
        # Ensure valid columns exist
        expected_cols = {"Hotspot_Label", "Cluster_Size", "Center_Lat", "Center_Lng"}
        if not expected_cols.issubset(set(self.clusters_df.columns)):
            raise ValueError(f"train_dbscan_clusters.csv missing required columns: {expected_cols - set(self.clusters_df.columns)}")

        coords_rad = np.radians(self.clusters_df[["Center_Lat", "Center_Lng"]].to_numpy())
        self.tree = BallTree(coords_rad, metric="haversine")

    def get_nearby_clusters(
        self,
        lat: float,
        lng: float,
        radius_km: float = 30.0,
        limit: int = 50
    ) -> dict:
        query_rad = np.radians([[lat, lng]])
        r_rad = radius_km / R_EARTH_KM

        indices, distances = self.tree.query_radius(
            query_rad,
            r=r_rad,
            return_distance=True,
            sort_results=True
        )

        idx_list = indices[0][:limit]
        dist_list = distances[0][:limit]

        results = []
        for idx, dist_rad in zip(idx_list, dist_list):
            row = self.clusters_df.iloc[idx]
            dist_km = float(dist_rad * R_EARTH_KM)
            results.append({
                "cluster_id": int(row["Hotspot_Label"]),
                "hotspot_label": int(row["Hotspot_Label"]),
                "cluster_size": int(row["Cluster_Size"]),
                "latitude": float(row["Center_Lat"]),
                "longitude": float(row["Center_Lng"]),
                "distance_km": round(dist_km, 3)
            })

        return {
            "center_latitude": lat,
            "center_longitude": lng,
            "radius_km": radius_km,
            "total_found": len(indices[0]),
            "limit": limit,
            "clusters": results,
            "metadata": {
                "source": "artifacts/train_dbscan_clusters.csv",
                "distance_metric": "haversine (R_EARTH = 6371.0088 km)",
                "coordinate_system": "WGS84",
                "clustering_method": "DBSCAN (eps=0.5 km, min_samples=5)"
            }
        }

_cluster_service = None

def get_cluster_service() -> ClusterSpatialService:
    global _cluster_service
    if _cluster_service is None:
        _cluster_service = ClusterSpatialService()
    return _cluster_service
