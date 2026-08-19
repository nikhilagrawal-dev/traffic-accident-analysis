import streamlit as st
import pandas as pd
import json
import joblib
import os
import numpy as np

@st.cache_resource(show_spinner="Loading best model...")
def load_model():
    model_path = "models/best_model.pkl"
    if not os.path.exists(model_path):
        return None
    try:
        return joblib.load(model_path)
    except Exception as e:
        st.error(f"Failed to load model: {e}")
        return None

@st.cache_data
def load_schema():
    schema_path = "artifacts/feature_schema.json"
    if not os.path.exists(schema_path):
        return None
    with open(schema_path, "r") as f:
        return json.load(f)

@st.cache_data
def load_feature_list():
    feature_list_path = "artifacts/feature_list.json"
    if not os.path.exists(feature_list_path):
        return None
    with open(feature_list_path, "r") as f:
        return json.load(f)["all_features"]

@st.cache_data
def load_encoders():
    encoder_path = "artifacts/frequency_encoders.pkl"
    if not os.path.exists(encoder_path):
        return None
    return joblib.load(encoder_path)

def build_feature_vector(user_inputs, encoders, feature_list):
    """
    Builds the final feature vector matching the model's exact schema.
    Applies frequency encoding for categorical variables.
    """
    vector = {}
    
    # 1. Start with user inputs and defaults
    for k, v in user_inputs.items():
        vector[k] = v
        
    # 2. Derived Features
    # Time
    hour = vector.get("Hour", 12)
    month = vector.get("Month", 1)
    weekday = vector.get("Weekday", 0)
    
    vector["Is_Weekend"] = 1 if weekday >= 5 else 0
    vector["Is_Night"] = 1 if (hour < 6 or hour >= 18) else 0
    vector["Is_Rush_Hour"] = 1 if (7 <= hour <= 9) or (16 <= hour <= 18) else 0
    
    vector["Season_Spring"] = 1 if month in [3, 4, 5] else 0
    vector["Season_Summer"] = 1 if month in [6, 7, 8] else 0
    vector["Season_Fall"] = 1 if month in [9, 10, 11] else 0
    
    vector["TOD_Morning"] = 1 if 6 <= hour < 12 else 0
    vector["TOD_Afternoon"] = 1 if 12 <= hour < 18 else 0
    vector["TOD_Evening"] = 1 if 18 <= hour < 24 else 0
    
    # Environment
    weather = vector.get("Weather_Condition", "")
    temp = vector.get("Temperature(F)", 70.0)
    precip = vector.get("Precipitation(in)", 0.0)
    vis = vector.get("Visibility(mi)", 10.0)
    
    vector["Fog_Indicator"] = 1 if 'Fog' in str(weather) else 0
    vector["Rain_Indicator"] = 1 if any(w in str(weather) for w in ['Rain', 'Drizzle', 'Showers']) else 0
    vector["Snow_Indicator"] = 1 if any(w in str(weather) for w in ['Snow', 'Ice', 'Wintry']) else 0
    
    vector["Poor_Visibility_Flag"] = 1 if vis < 2 else 0
    vector["High_Precipitation_Flag"] = 1 if precip > 0.5 else 0
    vector["Extreme_Temperature_Flag"] = 1 if temp < 32 or temp > 95 else 0
    
    vector["Weather_Severity_Score"] = (
        vector["Fog_Indicator"] + vector["Rain_Indicator"] + vector["Snow_Indicator"] + 
        vector["Poor_Visibility_Flag"] + vector["High_Precipitation_Flag"] + vector["Extreme_Temperature_Flag"]
    )
    
    # Infrastructure
    amenity = vector.get("Amenity", 0)
    crossing = vector.get("Crossing", 0)
    junction = vector.get("Junction", 0)
    railway = vector.get("Railway", 0)
    station = vector.get("Station", 0)
    stop = vector.get("Stop", 0)
    traffic_signal = vector.get("Traffic_Signal", 0)
    
    vector["Road_Complexity_Score"] = amenity + crossing + junction + railway + station + stop + traffic_signal
    vector["Intersection_Indicator"] = 1 if (crossing or junction or traffic_signal) else 0
    
    # Interactions
    vector["Night_Rain"] = vector["Is_Night"] * vector["Rain_Indicator"]
    vector["Weekend_Night"] = vector["Is_Weekend"] * vector["Is_Night"]
    vector["PoorVisibility_Rain"] = vector["Poor_Visibility_Flag"] * vector["Rain_Indicator"]
    vector["RushHour_Junction"] = vector["Is_Rush_Hour"] * vector["Junction"]
    
    # Defaults for other complex fields not explicitly asked
    defaults = {
        "Distance(mi)": 0.0,
        "Lighting_Night": vector["Is_Night"],
        "Duration_Minutes": 60.0,
        "Local_Accident_Density": 5.0,
        "Hotspot_Label": -1,
        "Hotspot_Flag": 0,
        "Noise_Flag": 1,
        "Cluster_Size": 0,
        "Distance_To_Cluster_Center": 0.0
    }
    for k, v in defaults.items():
        if k not in vector:
            vector[k] = v
            
    # 3. Apply Frequency Encoders for categorical features
    for col in ['City', 'State', 'Wind_Direction', 'Weather_Condition']:
        val = vector.get(col, '')
        if col in encoders:
            enc_dict = encoders[col]
            # fallback to 0 or min frequency if unseen
            vector[col] = enc_dict.get(val, 0.0)
            
    # 4. Construct final dataframe with EXACT column order
    try:
        final_df = pd.DataFrame([vector])[feature_list]
    except KeyError as e:
        raise ValueError(f"Missing expected features: {e}")
        
    return final_df

def render_prediction_tab():
    st.subheader("Predictive Modeling: Accident Severity")
    st.markdown("Use this interface to predict accident severity based on user-provided scenario parameters.")
    
    model = load_model()
    schema = load_schema()
    feature_list = load_feature_list()
    encoders = load_encoders()
    
    if not all([model, schema, feature_list, encoders]):
        st.error("Missing critical model artifacts. Check models/ and artifacts/ directories.")
        return
        
    states = sorted(list(encoders['State'].keys()))
    cities = sorted(list(encoders['City'].keys()))
    weather_conds = sorted(list(encoders['Weather_Condition'].keys()))
    wind_dirs = sorted(list(encoders['Wind_Direction'].keys()))

    with st.expander("1. Prediction & What-If Analysis Inputs", expanded=True):
        st.markdown("Adjust the scenario parameters below. The severity prediction will update automatically.")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown("**Location**")
            state = st.selectbox("State", states, index=states.index("FL") if "FL" in states else 0)
            city = st.selectbox("City", cities, index=cities.index("Miami") if "Miami" in cities else 0)
            lat = st.number_input("Latitude", value=25.7617, format="%.4f")
            lng = st.number_input("Longitude", value=-80.1918, format="%.4f")
            
        with col2:
            st.markdown("**Time**")
            month = st.slider("Month", 1, 12, 6)
            weekday = st.slider("Weekday (0=Mon)", 0, 6, 2)
            hour = st.slider("Hour (0-23)", 0, 23, 14)
            
        with col3:
            st.markdown("**Environment**")
            weather = st.selectbox("Weather Condition", weather_conds, index=weather_conds.index("Clear") if "Clear" in weather_conds else 0)
            temp = st.number_input("Temperature (F)", value=75.0)
            vis = st.number_input("Visibility (mi)", value=10.0)
            precip = st.number_input("Precipitation (in)", value=0.0)
            wind_spd = st.number_input("Wind Speed (mph)", value=5.0)
            wind_dir = st.selectbox("Wind Direction", wind_dirs, index=0)
            press = st.number_input("Pressure (in)", value=30.0)
            
        with col4:
            st.markdown("**Infrastructure**")
            amenity = st.checkbox("Amenity", value=False)
            crossing = st.checkbox("Crossing", value=False)
            junction = st.checkbox("Junction", value=False)
            railway = st.checkbox("Railway", value=False)
            station = st.checkbox("Station", value=False)
            stop = st.checkbox("Stop", value=False)
            traffic_signal = st.checkbox("Traffic Signal", value=False)
            
    # Compile Inputs
    user_inputs = {
        "State": state, "City": city, "Start_Lat": lat, "Start_Lng": lng,
        "Month": month, "Weekday": weekday, "Hour": hour,
        "Weather_Condition": weather, "Temperature(F)": temp, "Visibility(mi)": vis,
        "Precipitation(in)": precip, "Wind_Speed(mph)": wind_spd, "Wind_Direction": wind_dir,
        "Pressure(in)": press,
        "Amenity": int(amenity), "Crossing": int(crossing), "Junction": int(junction),
        "Railway": int(railway), "Station": int(station), "Stop": int(stop), "Traffic_Signal": int(traffic_signal)
    }
    
    st.markdown("---")
    
    try:
        X_pred = build_feature_vector(user_inputs, encoders, feature_list)
        
        # Exact feature count validation
        if X_pred.shape[1] != schema.get("feature_count", 53):
            st.error(f"Feature schema mismatch. Expected {schema.get('feature_count')} features, got {X_pred.shape[1]}.")
            return
            
        # Prediction
        pred = model.predict(X_pred)[0]
        
        target_classes = schema.get("target_classes", [1, 2, 3, 4])
        
        if hasattr(model, 'classes_'):
            class_idx = list(model.classes_).index(pred)
            predicted_severity = target_classes[class_idx]
        else:
            if pred not in target_classes and (pred + 1) in target_classes:
                predicted_severity = pred + 1
            else:
                predicted_severity = pred
            
        st.subheader(f"Predicted Accident Severity: Severity {predicted_severity}")
        
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_pred)[0]
            st.markdown("**Model Probabilities:**")
            
            prob_df = pd.DataFrame({
                "Severity": [f"Severity {c}" for c in target_classes],
                "Probability": proba
            })
            st.bar_chart(prob_df.set_index("Severity"))
            
    except Exception as e:
        st.error(f"Prediction failed: {e}")
        
    st.markdown("---")
    
    with st.expander("2. Explanation (Global Feature Importance)"):
        st.markdown("Generating local SHAP values dynamically for large models can be computationally expensive and unsafe in this deployment environment. Below is the global feature importance from the model training phase.")
        if os.path.exists("artifacts/shap_global_bar_plot.png"):
            st.image("artifacts/shap_global_bar_plot.png", caption="Global SHAP Feature Importance")
        elif os.path.exists("artifacts/shap_beeswarm_summary.png"):
            st.image("artifacts/shap_beeswarm_summary.png", caption="Global SHAP Summary")
        else:
            st.info("Global SHAP visualizations not found.")
            
    with st.expander("3. Model Information & Limitations"):
        import model_info
        model_info.render_model_info()
