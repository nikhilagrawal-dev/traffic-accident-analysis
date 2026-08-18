import folium
from folium.plugins import HeatMap
from streamlit_folium import st_folium
import pandas as pd
import numpy as np
import streamlit as st

def create_hotspot_map(df: pd.DataFrame, max_clusters: int = 1500, max_noise_samples: int = 800):
    """
    Creates an interactive Folium map visualizing DBSCAN hotspots and noise points.
    Uses cluster centroid aggregation and noise sampling to maintain high responsiveness (~300k rows).
    """
    if df.empty or "Start_Lat" not in df.columns or "Start_Lng" not in df.columns:
        st.warning("Insufficient location data to display map.")
        return None

    # Filter out missing coordinates
    valid_coords = df.dropna(subset=["Start_Lat", "Start_Lng"])
    if valid_coords.empty:
        st.warning("No valid geographic coordinates found in filtered dataset.")
        return None

    # Compute map centroid
    center_lat = float(valid_coords["Start_Lat"].mean())
    center_lng = float(valid_coords["Start_Lng"].mean())

    # Create base map
    m = folium.Map(
        location=[center_lat, center_lng],
        zoom_start=5,
        tiles="cartodbpositron"
    )

    # 1. DBSCAN Hotspot Cluster Layer (Centroid Aggregation)
    if "Hotspot_Label" in valid_coords.columns:
        clusters_df = valid_coords[valid_coords["Hotspot_Label"] != -1]
        
        if not clusters_df.empty:
            hotspot_group = folium.FeatureGroup(name="DBSCAN Hotspots (Clusters)", show=True)
            
            # Aggregate by Hotspot_Label
            grouped = clusters_df.groupby("Hotspot_Label").agg({
                "Start_Lat": "mean",
                "Start_Lng": "mean",
                "Cluster_Size": "first" if "Cluster_Size" in clusters_df.columns else "count",
                "Severity": "mean" if "Severity" in clusters_df.columns else lambda x: 2,
                "City": "first" if "City" in clusters_df.columns else lambda x: "N/A",
                "State": "first" if "State" in clusters_df.columns else lambda x: "N/A"
            }).reset_index()

            # Display top N clusters if extensive
            if len(grouped) > max_clusters:
                grouped = grouped.sort_values(by="Cluster_Size", ascending=False).head(max_clusters)

            for _, row in grouped.iterrows():
                cluster_id = int(row["Hotspot_Label"])
                lat = float(row["Start_Lat"])
                lng = float(row["Start_Lng"])
                c_size = int(row["Cluster_Size"]) if pd.notnull(row["Cluster_Size"]) else 1
                avg_sev = float(row["Severity"]) if pd.notnull(row["Severity"]) else 2.0
                city = str(row["City"])
                state = str(row["State"])

                # Marker radius & color coding
                radius = min(max(5, int(np.log1p(c_size) * 3)), 25)
                if avg_sev >= 3.0:
                    color = "#e74c3c"  # Red for high severity
                elif avg_sev >= 2.3:
                    color = "#e67e22"  # Orange
                else:
                    color = "#3498db"  # Blue

                popup_text = f"""
                <div style="font-family: sans-serif; min-width: 170px; font-size: 13px;">
                    <h4 style="margin: 0 0 6px 0; color: {color};">Hotspot Cluster #{cluster_id}</h4>
                    <b>Category:</b> DBSCAN Hotspot<br/>
                    <b>Location:</b> {city}, {state}<br/>
                    <b>Accident Count:</b> {c_size:,}<br/>
                    <b>Avg Severity:</b> {avg_sev:.2f} / 4.0<br/>
                </div>
                """

                folium.CircleMarker(
                    location=[lat, lng],
                    radius=radius,
                    popup=folium.Popup(popup_text, max_width=260),
                    tooltip=f"Hotspot #{cluster_id} | {c_size:,} accidents | Avg Sev: {avg_sev:.2f}",
                    color=color,
                    fill=True,
                    fill_color=color,
                    fill_opacity=0.65,
                    weight=1.5
                ).add_to(hotspot_group)

            hotspot_group.add_to(m)

    # 2. DBSCAN Noise Layer (Sampled Individual Unclustered Points)
    if "Hotspot_Label" in valid_coords.columns:
        noise_df = valid_coords[valid_coords["Hotspot_Label"] == -1]
        if not noise_df.empty:
            noise_group = folium.FeatureGroup(name="DBSCAN Noise Points (Sampled)", show=False)
            
            sample_size = min(len(noise_df), max_noise_samples)
            sampled_noise = noise_df.sample(n=sample_size, random_state=42)

            for _, row in sampled_noise.iterrows():
                lat = float(row["Start_Lat"])
                lng = float(row["Start_Lng"])
                sev = int(row["Severity"]) if "Severity" in row and pd.notnull(row["Severity"]) else 2
                city = str(row["City"]) if "City" in row else "N/A"

                folium.CircleMarker(
                    location=[lat, lng],
                    radius=3,
                    popup=f"DBSCAN Noise Point (Unclustered) | City: {city} | Severity: {sev}",
                    tooltip=f"Noise Point (Severity {sev})",
                    color="#7f8c8d",
                    fill=True,
                    fill_color="#95a5a6",
                    fill_opacity=0.4,
                    weight=0.5
                ).add_to(noise_group)

            noise_group.add_to(m)

    # 3. Density HeatMap Layer
    if len(valid_coords) > 0:
        heatmap_group = folium.FeatureGroup(name="Accident Density HeatMap", show=False)
        heat_sample = valid_coords.sample(n=min(len(valid_coords), 5000), random_state=42)
        heat_data = heat_sample[["Start_Lat", "Start_Lng"]].values.tolist()
        HeatMap(heat_data, radius=12, blur=15, max_zoom=10).add_to(heatmap_group)
        heatmap_group.add_to(m)

    folium.LayerControl().add_to(m)
    return m

def render_map_component(df: pd.DataFrame):
    """Renders the Folium map inside Streamlit UI."""
    map_obj = create_hotspot_map(df)
    if map_obj is not None:
        st_folium(map_obj, width=None, height=530, use_container_width=True)
