import streamlit as st
import pandas as pd
from data_loader import load_data, get_kpis
from filters import render_sidebar_filters, apply_filters
from charts import (
    plot_severity_distribution,
    plot_accidents_by_state,
    plot_accidents_by_hour,
    plot_accidents_by_weekday,
    plot_weather_conditions,
    plot_severity_by_weather,
    plot_rush_hour_analysis,
    plot_day_night_analysis,
    plot_road_infrastructure_analysis,
    plot_hotspot_vs_noise
)
from maps import render_map_component

# 1. Page Configuration
st.set_page_config(
    page_title="Traffic Accident Analytics",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Header Section with Theme-Adaptive High-Contrast Formatting
st.title("🚗 Traffic Accident Hotspot Detection & Severity Analysis")
st.caption("Layer 1: Exploratory Spatial & Feature Analytics Dashboard")

# 3. Data Loading
df = load_data("data/dataset_with_hotspots.csv")

# 4. Sidebar Filters (Grouped in Expanders)
selected_filters = render_sidebar_filters(df)
filtered_df = apply_filters(df, selected_filters)

# 5. Overview KPIs
kpis = get_kpis(filtered_df)

kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)

with kpi1:
    st.metric(label="Total Accidents", value=f"{kpis['total_accidents']:,}")

with kpi2:
    st.metric(label="DBSCAN Hotspots", value=f"{kpis['num_hotspots']:,}")

with kpi3:
    st.metric(label="States Covered", value=f"{kpis['num_states']}")

with kpi4:
    st.metric(label="Noise Points %", value=f"{kpis['noise_pct']:.1f}%")

with kpi5:
    st.metric(label="Avg Severity", value=f"{kpis['avg_severity']:.2f}")

st.markdown("---")

# 6. Empty Dataset Guard
if filtered_df.empty:
    st.warning("⚠️ No accident records match your selected filter criteria. Please adjust your sidebar filters.")
    st.stop()

# 7. Dashboard Main Content Tabs
tab_map, tab_severity, tab_temporal, tab_weather, tab_infra = st.tabs([
    "🗺️ DBSCAN Hotspot Map",
    "📊 Severity Analytics",
    "⏰ Temporal Analytics",
    "🌤️ Weather Analytics",
    "🛣️ Infrastructure Analytics"
])

# --- TAB 1: Hotspot Map ---
with tab_map:
    st.subheader("Geographic DBSCAN Hotspot Distribution")
    st.caption("Interactive map visualizing DBSCAN accident cluster centroids (sized by cluster volume) and sampled noise points.")
    
    col_map, col_pie = st.columns([3, 1])
    
    with col_map:
        render_map_component(filtered_df)
        
    with col_pie:
        fig_hn = plot_hotspot_vs_noise(filtered_df)
        if fig_hn:
            st.plotly_chart(fig_hn, use_container_width=True)
        
        st.info("""
        **DBSCAN Classification Legend:**
        - **Hotspot Cluster**: High-density accident cluster detected by DBSCAN algorithm (`eps = 0.5 km`, `min_samples = 5`).
        - **Noise Point**: Isolated or low-density accident occurrence (`Hotspot_Label = -1`).
        """)

# --- TAB 2: Severity Analytics ---
with tab_severity:
    st.subheader("Accident Severity & State Breakdown")
    col_s1, col_s2 = st.columns(2)
    
    with col_s1:
        fig_sev = plot_severity_distribution(filtered_df)
        if fig_sev:
            st.plotly_chart(fig_sev, use_container_width=True)
            
    with col_s2:
        fig_state = plot_accidents_by_state(filtered_df, top_n=15)
        if fig_state:
            st.plotly_chart(fig_state, use_container_width=True)

# --- TAB 3: Temporal Analytics ---
with tab_temporal:
    st.subheader("Temporal Distribution & Volume Patterns")
    
    fig_hour = plot_accidents_by_hour(filtered_df)
    if fig_hour:
        st.plotly_chart(fig_hour, use_container_width=True)
        
    col_t1, col_t2 = st.columns(2)
    with col_t1:
        fig_week = plot_accidents_by_weekday(filtered_df)
        if fig_week:
            st.plotly_chart(fig_week, use_container_width=True)
            
    with col_t2:
        fig_rush = plot_rush_hour_analysis(filtered_df)
        if fig_rush:
            st.plotly_chart(fig_rush, use_container_width=True)

    fig_dn = plot_day_night_analysis(filtered_df)
    if fig_dn:
        st.plotly_chart(fig_dn, use_container_width=True)

# --- TAB 4: Weather Analytics ---
with tab_weather:
    st.subheader("Weather Conditions & Environmental Volume")
    
    col_w1, col_w2 = st.columns(2)
    with col_w1:
        fig_w = plot_weather_conditions(filtered_df, top_n=10)
        if fig_w:
            st.plotly_chart(fig_w, use_container_width=True)
            
    with col_w2:
        fig_w_sev = plot_severity_by_weather(filtered_df, top_n=8)
        if fig_w_sev:
            st.plotly_chart(fig_w_sev, use_container_width=True)

# --- TAB 5: Infrastructure Analytics ---
with tab_infra:
    st.subheader("Road Features & Infrastructure Feature Associations")
    fig_infra = plot_road_infrastructure_analysis(filtered_df)
    if fig_infra:
        st.plotly_chart(fig_infra, use_container_width=True)