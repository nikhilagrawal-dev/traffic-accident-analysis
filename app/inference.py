import json
import pickle
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from sklearn.neighbors import BallTree

R_EARTH_KM = 6371.0088

# robust project-root-relative paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent

class LeakageFreeInferencePipeline:
    def __init__(self, artifacts_dir=None, models_dir=None):
        self.artifacts_dir = Path(artifacts_dir) if artifacts_dir else PROJECT_ROOT / "artifacts"
        self.models_dir = Path(models_dir) if models_dir else PROJECT_ROOT / "models"
        
        # 1. Load model
        with open(self.models_dir / "best_model_leakage_free.pkl", "rb") as f:
            self.model = pickle.load(f)
            
        # 2. Load feature schema
        with open(self.artifacts_dir / "feature_list_leakage_free.json", "r") as f:
            self.feature_schema = json.load(f)["all_features"]
            
        # 3. Load frequency encoders
        with open(self.artifacts_dir / "frequency_encoders.pkl", "rb") as f:
            self.frequency_encoders = pickle.load(f)
            
        # 4. Load density map
        with open(self.artifacts_dir / "density_map.json", "r") as f:
            self.density_map = json.load(f)
            
        # 5. Load train core points & build BallTree
        core_points = pd.read_csv(self.artifacts_dir / "train_core_points.csv")
        core_coords_rad = np.radians(core_points[["Core_Lat", "Core_Lng"]].to_numpy())
        self.core_labels = core_points["Hotspot_Label"].to_numpy()
        self.core_tree = BallTree(core_coords_rad, metric="haversine")
        
        # 6. Load train cluster statistics
        clusters = pd.read_csv(self.artifacts_dir / "train_dbscan_clusters.csv")
        self.cluster_size_map = clusters.set_index("Hotspot_Label")["Cluster_Size"].to_dict()
        self.cluster_center_map = clusters.set_index("Hotspot_Label")[["Center_Lat", "Center_Lng"]].to_dict('index')
        
        with open(self.artifacts_dir / "inference_spatial_metadata.json", "r") as f:
            metadata = json.load(f)
            self.eps_rad = metadata["dbscan_eps_km"] / R_EARTH_KM
            
        # Optional: Initialize SHAP
        self.explainer = shap.TreeExplainer(self.model)
        
    def _apply_encoding(self, req_dict):
        # 8. Encode categorical variables using the SAME saved encoders
        for col, freq_map in self.frequency_encoders.items():
            if col in req_dict:
                # Unseen categories default to 0.0
                req_dict[col] = freq_map.get(req_dict[col], 0.0)
        return req_dict
        
    def _compute_spatial(self, req_dict):
        # 9. Compute the SAME 5 spatial features
        lat = req_dict["Start_Lat"]
        lng = req_dict["Start_Lng"]
        
        # Local_Accident_Density
        # For perfect reproduction, use pandas exactly as in training
        tmp_df = pd.DataFrame([{"Start_Lat": lat, "Start_Lng": lng}])
        cell_str = (tmp_df["Start_Lat"].round(2).astype(str) + "_" + tmp_df["Start_Lng"].round(2).astype(str)).iloc[0]
        density = int(self.density_map.get(cell_str, 0))
        
        # DBSCAN Canonical Assignment
        test_coords_rad = np.radians(np.array([[lat, lng]]))
        dist_rad, idx = self.core_tree.query(test_coords_rad, k=1)
        
        if dist_rad[0, 0] <= self.eps_rad:
            assigned_label = self.core_labels[idx[0, 0]]
        else:
            assigned_label = -1
            
        hotspot_flag = 1 if assigned_label != -1 else 0
        noise_flag = 1 if assigned_label == -1 else 0
        cluster_size = int(self.cluster_size_map.get(assigned_label, 0))
        
        distance_center = 0.0
        if assigned_label != -1:
            c_lat = self.cluster_center_map[assigned_label]["Center_Lat"]
            c_lng = self.cluster_center_map[assigned_label]["Center_Lng"]
            
            c_coords = np.radians(np.array([[c_lat, c_lng]]))
            dlat = c_coords[0, 0] - test_coords_rad[0, 0]
            dlon = c_coords[0, 1] - test_coords_rad[0, 1]
            a = (np.sin(dlat / 2) ** 2 + 
                 np.cos(test_coords_rad[0, 0]) * np.cos(c_coords[0, 0]) * np.sin(dlon / 2) ** 2)
            distance_center = 2 * R_EARTH_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
            
        return {
            "Local_Accident_Density": density,
            "Hotspot_Flag": hotspot_flag,
            "Noise_Flag": noise_flag,
            "Cluster_Size": cluster_size,
            "Distance_To_Cluster_Center": distance_center
        }
        
    def predict(self, req_dict, explain=False):
        # Translate pydantic aliases back to exact feature names if needed
        # We assume req_dict already uses exact feature names like 'Distance(mi)'
        
        req_encoded = self._apply_encoding(req_dict.copy())
        spatial_feats = self._compute_spatial(req_dict)
        
        req_encoded.update(spatial_feats)
        
        # 10. Construct exactly 52 features in exact order
        row_data = {feat: req_encoded[feat] for feat in self.feature_schema}
        
        df = pd.DataFrame([row_data])
        
        # 11. Enforce exact feature order
        assert len(df.columns) == 52, "Must have exactly 52 features"
        assert df.columns.tolist() == self.feature_schema, "Feature order mismatch"
        assert df.isnull().sum().sum() == 0, "Missing values not allowed"
        
        # 12. Call model.predict()
        preds = self.model.predict(df)
        pred_val = int(preds[0])
        # Handle XGBoost 0-indexed outputs
        if pred_val in [0, 1, 2, 3]:
            pred_val += 1
            
        # 13. Call model.predict_proba()
        proba = self.model.predict_proba(df)[0]
        # proba is array of length 4 for classes [0, 1, 2, 3] which map to [1, 2, 3, 4]
        prob_dict = {str(i+1): float(p) for i, p in enumerate(proba)}
        
        # 14. Optionally calculate SHAP
        shap_res = None
        if explain:
            shap_values = self.explainer.shap_values(df)
            if isinstance(shap_values, list):
                # old behavior
                shap_res = {
                    "base_value": float(self.explainer.expected_value[pred_val-1] if isinstance(self.explainer.expected_value, (list, np.ndarray)) else self.explainer.expected_value),
                    "feature_contributions": {feat: float(shap_values[pred_val-1][0][i]) for i, feat in enumerate(self.feature_schema)}
                }
            elif len(shap_values.shape) == 3:
                # new behavior (1, 52, 4)
                shap_res = {
                    "base_value": 0.0, # expected_value might be an array
                    "feature_contributions": {feat: float(shap_values[0, i, pred_val-1]) for i, feat in enumerate(self.feature_schema)}
                }
            else:
                shap_res = {
                    "base_value": float(self.explainer.expected_value),
                    "feature_contributions": {feat: float(shap_values[0][i]) for i, feat in enumerate(self.feature_schema)}
                }
                
        return {
            "predicted_severity": pred_val,
            "probabilities": prob_dict,
            "spatial_information": {
                "local_accident_density": spatial_feats["Local_Accident_Density"],
                "hotspot_flag": spatial_feats["Hotspot_Flag"],
                "noise_flag": spatial_feats["Noise_Flag"],
                "cluster_size": spatial_feats["Cluster_Size"],
                "distance_to_cluster_center_km": spatial_feats["Distance_To_Cluster_Center"]
            },
            "shap_explanation": shap_res
        }
