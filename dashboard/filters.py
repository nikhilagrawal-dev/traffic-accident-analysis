import pandas as pd
import streamlit as st

WEEKDAY_MAP = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
}
WEEKDAY_REVERSE_MAP = {v: k for k, v in WEEKDAY_MAP.items()}

MONTH_MAP = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
}
MONTH_REVERSE_MAP = {v: k for k, v in MONTH_MAP.items()}

def render_sidebar_filters(df: pd.DataFrame) -> dict:
    """
    Renders sidebar filter controls organized into logical expandable sections.
    """
    st.sidebar.header("🔍 Analytics Filters")

    # 1. Location Filters Group
    with st.sidebar.expander("📍 Location Filters", expanded=True):
        available_states = sorted(df["State"].dropna().astype(str).unique().tolist()) if "State" in df.columns else []
        selected_states = st.multiselect(
            "State(s)",
            options=available_states,
            default=[],
            help="Leave empty to select all states"
        )
        
        if selected_states and "State" in df.columns and "City" in df.columns:
            filtered_city_df = df[df["State"].isin(selected_states)]
            available_cities = sorted(filtered_city_df["City"].dropna().astype(str).unique().tolist())
        elif "City" in df.columns:
            available_cities = sorted(df["City"].value_counts().head(100).index.astype(str).tolist())
        else:
            available_cities = []
            
        selected_cities = st.multiselect(
            "City / Cities",
            options=available_cities,
            default=[],
            help="Leave empty to select all cities"
        )

    # 2. Accident & Hotspot Filters Group
    with st.sidebar.expander("⚠️ Accident & Hotspot Filters", expanded=True):
        available_severities = sorted(df["Severity"].unique().tolist()) if "Severity" in df.columns else [1, 2, 3, 4]
        selected_severities = st.multiselect(
            "Severity Level",
            options=available_severities,
            default=available_severities,
            format_func=lambda x: f"Severity {x}"
        )
        
        hotspot_choice = st.radio(
            "Accident Category",
            options=["All Accidents", "Hotspots Only (Clusters)", "Noise Points Only"],
            index=0
        )

    # 3. Temporal Filters Group
    with st.sidebar.expander("⏰ Temporal Filters", expanded=False):
        hour_range = st.slider(
            "Hour of Day",
            min_value=0,
            max_value=23,
            value=(0, 23)
        )
        
        selected_weekdays = st.multiselect(
            "Day of Week",
            options=list(WEEKDAY_REVERSE_MAP.keys()),
            default=[]
        )
        
        selected_months = st.multiselect(
            "Month",
            options=list(MONTH_REVERSE_MAP.keys()),
            default=[]
        )
        
        is_night_choice = st.selectbox("Day / Night", ["All", "Night Only", "Day Only"])
        is_rush_hour_choice = st.selectbox("Rush Hour Status", ["All", "Rush Hour Only", "Non-Rush Hour Only"])

    # 4. Weather Filters Group
    with st.sidebar.expander("🌤️ Weather Filters", expanded=False):
        if "Weather_Condition" in df.columns:
            top_weather = df["Weather_Condition"].dropna().value_counts().head(25).index.tolist()
            selected_weather = st.multiselect(
                "Weather Condition",
                options=sorted(top_weather),
                default=[],
                help="Top weather conditions listed. Leave empty for all."
            )
        else:
            selected_weather = []

    return {
        "states": selected_states,
        "cities": selected_cities,
        "severities": selected_severities,
        "hotspot_choice": hotspot_choice,
        "hour_range": hour_range,
        "weekdays": [WEEKDAY_REVERSE_MAP[w] for w in selected_weekdays],
        "months": [MONTH_REVERSE_MAP[m] for m in selected_months],
        "is_night_choice": is_night_choice,
        "is_rush_hour_choice": is_rush_hour_choice,
        "weather": selected_weather
    }

def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """
    Applies pure filtering on df according to filters dictionary without mutating original df.
    """
    filtered = df
    
    # Filter by State
    if filters.get("states") and "State" in filtered.columns:
        filtered = filtered[filtered["State"].isin(filters["states"])]
        
    # Filter by City
    if filters.get("cities") and "City" in filtered.columns:
        filtered = filtered[filtered["City"].isin(filters["cities"])]
        
    # Filter by Severity
    if filters.get("severities") and "Severity" in filtered.columns:
        filtered = filtered[filtered["Severity"].isin(filters["severities"])]
        
    # Filter by Hotspot / Noise Choice
    hotspot_choice = filters.get("hotspot_choice")
    if hotspot_choice == "Hotspots Only (Clusters)":
        if "Hotspot_Flag" in filtered.columns:
            filtered = filtered[filtered["Hotspot_Flag"] == 1]
        elif "Hotspot_Label" in filtered.columns:
            filtered = filtered[filtered["Hotspot_Label"] != -1]
    elif hotspot_choice == "Noise Points Only":
        if "Noise_Flag" in filtered.columns:
            filtered = filtered[filtered["Noise_Flag"] == 1]
        elif "Hotspot_Label" in filtered.columns:
            filtered = filtered[filtered["Hotspot_Label"] == -1]
            
    # Filter by Hour Range
    hour_range = filters.get("hour_range")
    if hour_range and "Hour" in filtered.columns:
        min_h, max_h = hour_range
        filtered = filtered[(filtered["Hour"] >= min_h) & (filtered["Hour"] <= max_h)]
        
    # Filter by Weekday
    if filters.get("weekdays") and "Weekday" in filtered.columns:
        filtered = filtered[filtered["Weekday"].isin(filters["weekdays"])]
        
    # Filter by Month
    if filters.get("months") and "Month" in filtered.columns:
        filtered = filtered[filtered["Month"].isin(filters["months"])]
        
    # Filter by Is Night
    is_night_choice = filters.get("is_night_choice")
    if is_night_choice == "Night Only" and "Is_Night" in filtered.columns:
        filtered = filtered[filtered["Is_Night"] == 1]
    elif is_night_choice == "Day Only" and "Is_Night" in filtered.columns:
        filtered = filtered[filtered["Is_Night"] == 0]
        
    # Filter by Rush Hour
    is_rush_hour_choice = filters.get("is_rush_hour_choice")
    if is_rush_hour_choice == "Rush Hour Only" and "Is_Rush_Hour" in filtered.columns:
        filtered = filtered[filtered["Is_Rush_Hour"] == 1]
    elif is_rush_hour_choice == "Non-Rush Hour Only" and "Is_Rush_Hour" in filtered.columns:
        filtered = filtered[filtered["Is_Rush_Hour"] == 0]
        
    # Filter by Weather Condition
    if filters.get("weather") and "Weather_Condition" in filtered.columns:
        filtered = filtered[filtered["Weather_Condition"].isin(filters["weather"])]
        
    return filtered
