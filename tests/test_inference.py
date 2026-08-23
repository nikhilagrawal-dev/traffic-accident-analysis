import pytest
from app.inference import LeakageFreeInferencePipeline
import json
import pandas as pd

@pytest.fixture(scope="module")
def pipeline():
    return LeakageFreeInferencePipeline()

@pytest.fixture
def valid_request():
    return {
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
        "RushHour_Junction": 0
    }

def test_valid_normal_request(pipeline, valid_request):
    res = pipeline.predict(valid_request.copy())
    assert "predicted_severity" in res

def test_missing_required_field(pipeline, valid_request):
    req = valid_request.copy()
    del req["Start_Lat"]
    with pytest.raises(KeyError):
        pipeline.predict(req)

def test_unknown_city(pipeline, valid_request):
    req = valid_request.copy()
    req["City"] = "Unknown City Never Seen"
    res = pipeline.predict(req)
    assert "predicted_severity" in res

def test_unknown_weather(pipeline, valid_request):
    req = valid_request.copy()
    req["Weather_Condition"] = "Acid Rain"
    res = pipeline.predict(req)
    assert "predicted_severity" in res

def test_location_inside_hotspot(pipeline, valid_request):
    req = valid_request.copy()
    req["Start_Lat"] = 40.068884
    req["Start_Lng"] = -75.326146
    res = pipeline.predict(req)
    assert res["spatial_information"]["hotspot_flag"] == 1

def test_location_outside_hotspot(pipeline, valid_request):
    req = valid_request.copy()
    req["Start_Lat"] = 0.0
    req["Start_Lng"] = 0.0
    res = pipeline.predict(req)
    assert res["spatial_information"]["hotspot_flag"] == 0
    assert res["spatial_information"]["noise_flag"] == 1

def test_explain_true(pipeline, valid_request):
    res = pipeline.predict(valid_request.copy(), explain=True)
    assert res["shap_explanation"] is not None
    assert "base_value" in res["shap_explanation"]

def test_deterministic(pipeline, valid_request):
    res1 = pipeline.predict(valid_request.copy(), explain=True)
    res2 = pipeline.predict(valid_request.copy(), explain=True)
    assert res1 == res2
