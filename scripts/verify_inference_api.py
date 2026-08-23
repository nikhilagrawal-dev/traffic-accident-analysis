import pandas as pd
import numpy as np
from app.inference import LeakageFreeInferencePipeline
import json

print("Loading pipeline...")
pipeline = LeakageFreeInferencePipeline()

print("Loading dataset...")
X_train = pd.read_csv("artifacts/X_train_leakage_free.csv")
sample_df = X_train.sample(5000, random_state=42).copy()
feature_schema = pipeline.feature_schema

spatial_cols = ["Local_Accident_Density", "Hotspot_Flag", "Noise_Flag", "Cluster_Size", "Distance_To_Cluster_Center"]

matches = 0
mismatches = 0
max_diff = 0.0
total_diff = 0.0

print("Running consistency test...")
for i, (_, row) in enumerate(sample_df.iterrows()):
    req_dict = row.drop(spatial_cols).to_dict()
    # Apply inference pipeline
    req_encoded = pipeline._apply_encoding(req_dict.copy())
    spatial_feats = pipeline._compute_spatial(req_dict)
    req_encoded.update(spatial_feats)
    
    row_mismatch = False
    for feat in feature_schema:
        if isinstance(row[feat], str):
            val1 = float(pipeline.frequency_encoders.get(feat, {}).get(row[feat], 0.0))
        else:
            val1 = float(row[feat])
            
        val2 = float(req_encoded[feat])
        
        diff = abs(val1 - val2)
        if diff > 1e-8:
            row_mismatch = True
            max_diff = max(max_diff, diff)
            total_diff += diff
            
    if row_mismatch:
        mismatches += 1
    else:
        matches += 1
        
print("="*50)
print("FINAL CONSISTENCY TEST")
print("="*50)
print(f"Total rows: {len(sample_df)}")
print(f"Fully matching rows: {matches}")
print(f"Mismatching rows: {mismatches}")
print(f"Maximum absolute feature difference: {max_diff}")
print(f"Mean absolute feature difference: {total_diff / (mismatches * 52) if mismatches > 0 else 0}")
