from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Optional

class PredictionRequest(BaseModel):
    # Core temporal/location base features
    Start_Lat: float
    Start_Lng: float
    Distance_mi_: float = Field(alias="Distance(mi)")
    City: str
    State: str
    
    # Weather
    Temperature_F_: float = Field(alias="Temperature(F)")
    Humidity_percent_: float = Field(alias="Humidity(%)")
    Pressure_in_: float = Field(alias="Pressure(in)")
    Visibility_mi_: float = Field(alias="Visibility(mi)")
    Wind_Direction: str
    Wind_Speed_mph_: float = Field(alias="Wind_Speed(mph)")
    Precipitation_in_: float = Field(alias="Precipitation(in)")
    Weather_Condition: str
    
    # POI / Road Features
    Amenity: int
    Crossing: int
    Junction: int
    Railway: int
    Station: int
    Stop: int
    Traffic_Signal: int
    Lighting_Night: int
    
    # Temporal
    Hour: int
    Weekday: int
    Is_Weekend: int
    Month: int
    Is_Night: int
    Is_Rush_Hour: int
    Duration_Minutes: float
    
    # Seasons
    Season_Spring: int
    Season_Summer: int
    Season_Fall: int
    
    # TOD
    TOD_Morning: int
    TOD_Afternoon: int
    TOD_Evening: int
    
    # Weather indicators
    Fog_Indicator: int
    Rain_Indicator: int
    Snow_Indicator: int
    Poor_Visibility_Flag: int
    High_Precipitation_Flag: int
    Extreme_Temperature_Flag: int
    
    # Scores
    Weather_Severity_Score: float
    Road_Complexity_Score: int
    
    # Complex features
    Intersection_Indicator: int
    Night_Rain: int
    Weekend_Night: int
    PoorVisibility_Rain: int
    RushHour_Junction: int
    
    explain: bool = False
    
    model_config = ConfigDict(populate_by_name=True)

class SpatialInformation(BaseModel):
    local_accident_density: int
    hotspot_flag: int
    noise_flag: int
    cluster_size: int
    distance_to_cluster_center_km: float

class PredictionResponse(BaseModel):
    predicted_severity: int
    probabilities: Dict[str, float]
    spatial_information: SpatialInformation
    shap_explanation: Optional[Dict] = None
