import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# Standard palette for severity levels
SEVERITY_COLORS = {
    "Severity 1": "#2ecc71",  # Green (Low severity)
    "Severity 2": "#f1c40f",  # Yellow (Moderate)
    "Severity 3": "#e67e22",  # Orange (High)
    "Severity 4": "#e74c3c"   # Red (Critical)
}

WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def _apply_theme(fig):
    """Applies clean, modern formatting to Plotly figure."""
    fig.update_layout(
        font_family="Inter, Roboto, sans-serif",
        margin=dict(l=30, r=30, t=40, b=30),
        hoverlabel=dict(font_size=13),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    return fig

def plot_severity_distribution(df: pd.DataFrame):
    """Plot distribution of accident severities with clear labels."""
    if df.empty or "Severity" not in df.columns:
        return None
        
    counts = df["Severity"].value_counts().reset_index()
    counts.columns = ["Severity_Raw", "Count"]
    counts["Severity_Label"] = counts["Severity_Raw"].map(lambda x: f"Severity {x}")
    counts = counts.sort_values("Severity_Raw")
    
    fig = px.bar(
        counts,
        x="Severity_Label",
        y="Count",
        color="Severity_Label",
        color_discrete_map=SEVERITY_COLORS,
        text="Count",
        title="<b>Accident Severity Distribution</b>",
        labels={"Count": "Total Accidents", "Severity_Label": "Severity Level"}
    )
    fig.update_traces(textposition="outside")
    return _apply_theme(fig)

def plot_accidents_by_state(df: pd.DataFrame, top_n: int = 15):
    """Plot Top N States by accident count."""
    if df.empty or "State" not in df.columns:
        return None
        
    state_counts = df["State"].value_counts().head(top_n).reset_index()
    state_counts.columns = ["State", "Count"]
    state_counts = state_counts.sort_values(by="Count", ascending=True)
    
    fig = px.bar(
        state_counts,
        x="Count",
        y="State",
        orientation="h",
        text="Count",
        color="Count",
        color_continuous_scale="Viridis",
        title=f"<b>Accident Volume by Top {top_n} States</b>",
        labels={"Count": "Total Accidents", "State": "State Code"}
    )
    fig.update_traces(textposition="outside")
    return _apply_theme(fig)

def plot_accidents_by_hour(df: pd.DataFrame):
    """Plot accidents by hour of day split by severity."""
    if df.empty or "Hour" not in df.columns:
        return None
        
    if "Severity" in df.columns:
        hourly = df.groupby(["Hour", "Severity"]).size().reset_index(name="Count")
        hourly["Severity_Label"] = hourly["Severity"].map(lambda x: f"Severity {x}")
        fig = px.line(
            hourly,
            x="Hour",
            y="Count",
            color="Severity_Label",
            color_discrete_map=SEVERITY_COLORS,
            markers=True,
            title="<b>Accident Volume by Hour and Severity</b>",
            labels={"Count": "Accident Volume", "Hour": "Hour of Day (0-23)", "Severity_Label": "Severity"}
        )
    else:
        hourly = df.groupby("Hour").size().reset_index(name="Count")
        fig = px.line(
            hourly,
            x="Hour",
            y="Count",
            markers=True,
            title="<b>Accident Volume by Hour</b>",
            labels={"Count": "Accident Volume", "Hour": "Hour of Day (0-23)"}
        )
        
    fig.update_xaxes(dtick=1)
    return _apply_theme(fig)

def plot_accidents_by_weekday(df: pd.DataFrame):
    """Plot accidents by day of week."""
    if df.empty or "Weekday" not in df.columns:
        return None
        
    weekday_counts = df["Weekday"].value_counts().reset_index()
    weekday_counts.columns = ["Weekday", "Count"]
    weekday_counts["DayName"] = weekday_counts["Weekday"].map(lambda x: WEEKDAY_LABELS[int(x)] if 0 <= int(x) <= 6 else str(x))
    weekday_counts = weekday_counts.sort_values("Weekday")
    
    fig = px.bar(
        weekday_counts,
        x="DayName",
        y="Count",
        color="Count",
        color_continuous_scale="Purples",
        text="Count",
        title="<b>Accident Volume by Day of Week</b>",
        labels={"Count": "Accident Volume", "DayName": "Day of Week"}
    )
    fig.update_traces(textposition="outside")
    return _apply_theme(fig)

def plot_weather_conditions(df: pd.DataFrame, top_n: int = 10):
    """Plot top N weather conditions."""
    if df.empty or "Weather_Condition" not in df.columns:
        return None
        
    w_counts = df["Weather_Condition"].dropna().value_counts().head(top_n).reset_index()
    w_counts.columns = ["Weather_Condition", "Count"]
    w_counts = w_counts.sort_values("Count", ascending=True)
    
    fig = px.bar(
        w_counts,
        x="Count",
        y="Weather_Condition",
        orientation="h",
        color="Count",
        color_continuous_scale="Teal",
        text="Count",
        title=f"<b>Accident Volume by Weather Condition (Top {top_n})</b>",
        labels={"Count": "Accident Volume", "Weather_Condition": "Weather Condition"}
    )
    fig.update_traces(textposition="outside")
    return _apply_theme(fig)

def plot_severity_by_weather(df: pd.DataFrame, top_n: int = 8):
    """Stacked bar chart of severity across top weather conditions."""
    if df.empty or "Weather_Condition" not in df.columns or "Severity" not in df.columns:
        return None
        
    top_w = df["Weather_Condition"].dropna().value_counts().head(top_n).index.tolist()
    sub_df = df[df["Weather_Condition"].isin(top_w)]
    
    grouped = sub_df.groupby(["Weather_Condition", "Severity"]).size().reset_index(name="Count")
    grouped["Severity_Label"] = grouped["Severity"].map(lambda x: f"Severity {x}")
    
    fig = px.bar(
        grouped,
        x="Weather_Condition",
        y="Count",
        color="Severity_Label",
        color_discrete_map=SEVERITY_COLORS,
        title=f"<b>Severity Distribution Across Common Weather Conditions</b>",
        labels={"Count": "Accident Volume", "Weather_Condition": "Weather Condition", "Severity_Label": "Severity"},
        barmode="stack"
    )
    return _apply_theme(fig)

def plot_rush_hour_analysis(df: pd.DataFrame):
    """Rush Hour vs Non-Rush Hour comparison."""
    if df.empty or "Is_Rush_Hour" not in df.columns:
        return None
        
    df_copy = df.copy()
    df_copy["Rush_Status"] = df_copy["Is_Rush_Hour"].map({1: "Rush Hour", 0: "Non-Rush Hour"})
    
    if "Severity" in df_copy.columns:
        grouped = df_copy.groupby(["Rush_Status", "Severity"]).size().reset_index(name="Count")
        grouped["Severity_Label"] = grouped["Severity"].map(lambda x: f"Severity {x}")
        fig = px.bar(
            grouped,
            x="Rush_Status",
            y="Count",
            color="Severity_Label",
            color_discrete_map=SEVERITY_COLORS,
            barmode="group",
            text="Count",
            title="<b>Rush-Hour vs Non-Rush-Hour Accident Volume</b>",
            labels={"Count": "Accident Volume", "Rush_Status": "Status", "Severity_Label": "Severity"}
        )
        fig.update_traces(textposition="outside")
    else:
        counts = df_copy["Rush_Status"].value_counts().reset_index()
        counts.columns = ["Rush_Status", "Count"]
        fig = px.bar(
            counts,
            x="Rush_Status",
            y="Count",
            text="Count",
            title="<b>Rush-Hour vs Non-Rush-Hour Accident Volume</b>"
        )
        fig.update_traces(textposition="outside")
        
    return _apply_theme(fig)

def plot_day_night_analysis(df: pd.DataFrame):
    """Day vs Night accident comparison."""
    if df.empty or "Is_Night" not in df.columns:
        return None
        
    df_copy = df.copy()
    df_copy["Time_Of_Day"] = df_copy["Is_Night"].map({1: "Night", 0: "Day"})
    
    if "Severity" in df_copy.columns:
        grouped = df_copy.groupby(["Time_Of_Day", "Severity"]).size().reset_index(name="Count")
        grouped["Severity_Label"] = grouped["Severity"].map(lambda x: f"Severity {x}")
        fig = px.bar(
            grouped,
            x="Time_Of_Day",
            y="Count",
            color="Severity_Label",
            color_discrete_map=SEVERITY_COLORS,
            barmode="group",
            text="Count",
            title="<b>Day vs Night Accident Volume</b>",
            labels={"Count": "Accident Volume", "Time_Of_Day": "Period", "Severity_Label": "Severity"}
        )
        fig.update_traces(textposition="outside")
    else:
        counts = df_copy["Time_Of_Day"].value_counts().reset_index()
        counts.columns = ["Time_Of_Day", "Count"]
        fig = px.bar(
            counts,
            x="Time_Of_Day",
            y="Count",
            text="Count",
            title="<b>Day vs Night Accident Volume</b>"
        )
        fig.update_traces(textposition="outside")
        
    return _apply_theme(fig)

def plot_road_infrastructure_analysis(df: pd.DataFrame):
    """Accident counts associated with road infrastructure features."""
    infra_cols = [c for c in ["Traffic_Signal", "Junction", "Crossing", "Stop", "Station", "Amenity", "Railway"] if c in df.columns]
    if df.empty or not infra_cols:
        return None
        
    counts = {}
    for col in infra_cols:
        counts[col] = (df[col] == 1).sum()
        
    infra_df = pd.DataFrame(list(counts.items()), columns=["Feature", "Accident Count"]).sort_values("Accident Count", ascending=True)
    
    fig = px.bar(
        infra_df,
        x="Accident Count",
        y="Feature",
        orientation="h",
        color="Accident Count",
        color_continuous_scale="Blues",
        text="Accident Count",
        title="<b>Accidents Associated with Road & Infrastructure Features</b>",
        labels={"Accident Count": "Associated Accidents", "Feature": "Infrastructure Feature"}
    )
    fig.update_traces(textposition="outside")
    return _apply_theme(fig)

def plot_hotspot_vs_noise(df: pd.DataFrame):
    """Donut chart comparing Hotspot Cluster Accidents vs Noise Points."""
    if df.empty or ("Hotspot_Flag" not in df.columns and "Hotspot_Label" not in df.columns):
        return None
        
    if "Hotspot_Flag" in df.columns:
        hotspot_count = (df["Hotspot_Flag"] == 1).sum()
        noise_count = (df["Hotspot_Flag"] == 0).sum()
    else:
        hotspot_count = (df["Hotspot_Label"] != -1).sum()
        noise_count = (df["Hotspot_Label"] == -1).sum()
        
    pie_df = pd.DataFrame({
        "Category": ["Hotspot Clusters", "Noise Points"],
        "Count": [hotspot_count, noise_count]
    })
    
    fig = px.pie(
        pie_df,
        names="Category",
        values="Count",
        color="Category",
        color_discrete_map={"Hotspot Clusters": "#e74c3c", "Noise Points": "#95a5a6"},
        hole=0.4,
        title="<b>DBSCAN Classification Ratio</b>"
    )
    return _apply_theme(fig)
