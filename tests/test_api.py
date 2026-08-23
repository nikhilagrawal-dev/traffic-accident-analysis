from fastapi.testclient import TestClient
from app.main import app
import pytest

def test_predict_endpoint():
    payload = {
        "Start_Lat": 40.068884, "Start_Lng": -75.326146, "Distance(mi)": 0.5,
        "City": "Philadelphia", "State": "PA", "Temperature(F)": 72.0, "Humidity(%)": 50.0,
        "Pressure(in)": 29.9, "Visibility(mi)": 10.0, "Wind_Direction": "S",
        "Wind_Speed(mph)": 5.0, "Precipitation(in)": 0.0, "Weather_Condition": "Clear",
        "Amenity": 0, "Crossing": 0, "Junction": 0, "Railway": 0, "Station": 0, "Stop": 0,
        "Traffic_Signal": 0, "Lighting_Night": 0, "Hour": 14, "Weekday": 2, "Is_Weekend": 0,
        "Month": 5, "Is_Night": 0, "Is_Rush_Hour": 0, "Duration_Minutes": 30.0,
        "Season_Spring": 1, "Season_Summer": 0, "Season_Fall": 0, "TOD_Morning": 0,
        "TOD_Afternoon": 1, "TOD_Evening": 0, "Fog_Indicator": 0, "Rain_Indicator": 0,
        "Snow_Indicator": 0, "Poor_Visibility_Flag": 0, "High_Precipitation_Flag": 0,
        "Extreme_Temperature_Flag": 0, "Weather_Severity_Score": 0.0, "Road_Complexity_Score": 0,
        "Intersection_Indicator": 0, "Night_Rain": 0, "Weekend_Night": 0, "PoorVisibility_Rain": 0,
        "RushHour_Junction": 0, "explain": True
    }
    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text)
        assert response.status_code == 200
        data = response.json()
        assert "predicted_severity" in data
        assert "spatial_information" in data
        assert "shap_explanation" in data
