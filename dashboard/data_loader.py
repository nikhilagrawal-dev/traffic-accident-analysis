import os
import pandas as pd
import streamlit as st

REQUIRED_COLUMNS = [
    "Severity", "Start_Lat", "Start_Lng", "City", "State",
    "Hour", "Weekday", "Month", "Is_Night", "Is_Rush_Hour",
    "Hotspot_Label", "Hotspot_Flag", "Noise_Flag"
]

@st.cache_data(show_spinner="Loading accident dataset with DBSCAN hotspots...")
def load_data(file_path: str = "data/dataset_with_hotspots.csv") -> pd.DataFrame:
    """
    Loads dataset_with_hotspots.csv with Streamlit caching.
    Validates file existence and essential schema columns.
    """
    if not os.path.exists(file_path):
        st.error(f"Dataset file not found at path: `{file_path}`. Please check the dataset location.")
        st.stop()
        
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        st.error(f"Error reading CSV file: {e}")
        st.stop()
        
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        st.error(f"Dataset schema error. Missing required columns: {missing_cols}")
        st.stop()
        
    return df

def get_kpis(df: pd.DataFrame) -> dict:
    """
    Calculates overview KPIs from the filtered or full dataset.
    """
    total_accidents = len(df)
    if total_accidents == 0:
        return {
            "total_accidents": 0,
            "num_hotspots": 0,
            "num_states": 0,
            "noise_count": 0,
            "noise_pct": 0.0,
            "avg_severity": 0.0
        }
        
    # Hotspot clusters exclude noise label -1
    if "Hotspot_Label" in df.columns:
        hotspot_labels = df[df["Hotspot_Label"] != -1]["Hotspot_Label"]
        num_hotspots = int(hotspot_labels.nunique())
    else:
        num_hotspots = 0
        
    num_states = int(df["State"].dropna().nunique()) if "State" in df.columns else 0
    
    if "Noise_Flag" in df.columns:
        noise_count = int((df["Noise_Flag"] == 1).sum())
    elif "Hotspot_Label" in df.columns:
        noise_count = int((df["Hotspot_Label"] == -1).sum())
    else:
        noise_count = 0
        
    noise_pct = (noise_count / total_accidents) * 100.0
    avg_severity = float(df["Severity"].mean()) if "Severity" in df.columns else 0.0
    
    return {
        "total_accidents": total_accidents,
        "num_hotspots": num_hotspots,
        "num_states": num_states,
        "noise_count": noise_count,
        "noise_pct": noise_pct,
        "avg_severity": avg_severity
    }
