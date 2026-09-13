"""
enrichment.py — city-level data enrichment layer for /predict-by-city.

Responsibilities:
  1. Geocode city → lat, lng, state, timezone
  2. Fetch live weather → exact model feature keys & units
  3. Derive time features from city-local datetime
  4. Calculate all 13 engineered flags using the same logic as training notebooks
  5. Apply standard-road-scenario infrastructure defaults

All output dictionaries use the EXACT feature names expected by the
leakage-free inference pipeline (inference.py / feature_list_leakage_free.json).

No model code is modified here.
"""

import httpx
import datetime
import pytz

# ---------------------------------------------------------------------------
# Standard Road Scenario Defaults
# These are used when infrastructure/incident data is not available from the
# simplified UI. Documented as assumptions, NOT observed road conditions.
#
#  Feature              Default  Reason                        Training Mean/Median
#  ─────────────────────────────────────────────────────────────────────────────
#  Distance(mi)         0.03     Median incident length         Median: 0.028 mi
#  Duration_Minutes     75.0     Median clearance time          Median: 74.8 min
#                                (scenario assumption — unknown before event)
#  Amenity              0        Rare; standard road baseline   Mean: 1.2%
#  Crossing             0        Non-intersection baseline      Mean: 11.3%
#  Junction             0        Non-intersection baseline      Mean: 7.3%
#  Railway              0        Very rare on standard road     Mean: 0.9%
#  Station              0        Very rare on standard road     Mean: 2.6%
#  Stop                 0        Rare on standard road          Mean: 2.7%
#  Traffic_Signal       0        Non-intersection baseline      Mean: 14.8%
#  Lighting_Night       0        Conservative (no spec. light)  Mean: 30.7%
#
# LIMITATION: All defaults assume a non-complex, standard road segment.
#             The system does NOT know the actual road infrastructure.
#             Advanced Options allow the user to override these values.
# ---------------------------------------------------------------------------
DEFAULTS = {
    "Distance(mi)": 0.03,
    "Duration_Minutes": 75.0,
    "Amenity": 0,
    "Crossing": 0,
    "Junction": 0,
    "Railway": 0,
    "Station": 0,
    "Stop": 0,
    "Traffic_Signal": 0,
    "Lighting_Night": 0,
}

# ---------------------------------------------------------------------------
# WMO Weather Code → Weather_Condition mapping
# Maps Open-Meteo's WMO weather codes to the exact categorical strings seen
# during model training (from US accident dataset Weather_Condition column).
# Unseen categories are encoded as 0.0 by frequency_encoders.pkl (training
# behavior) — so we only map to values actually present in training data.
# ---------------------------------------------------------------------------
WMO_CODE_MAP = {
    0:  "Clear",
    1:  "Fair",
    2:  "Partly Cloudy",
    3:  "Cloudy",
    45: "Fog",
    48: "Fog",
    51: "Light Drizzle",
    53: "Light Drizzle",
    55: "Light Drizzle",
    56: "Light Drizzle",
    57: "Light Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    66: "Light Rain",
    67: "Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Snow",
    77: "Snow",
    80: "Light Rain",
    81: "Rain",
    82: "Heavy Rain",
    85: "Light Snow",
    86: "Snow",
    95: "T-Storm",
    96: "T-Storm",
    99: "T-Storm",
}


def _wind_degrees_to_label(degrees: float) -> str:
    """Convert wind direction degrees to 16-point compass label."""
    idx = int((degrees / 22.5) + 0.5) % 16
    labels = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]
    return labels[idx]


async def fetch_city_data(city_name: str):
    """
    Geocode a city name to coordinates, state and IANA timezone string.
    Uses the Open-Meteo geocoding API (no API key required).

    Returns: (lat, lng, state, timezone_str)
    Raises ValueError for unknown/ambiguous city.
    """
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    if "results" not in data or len(data["results"]) == 0:
        raise ValueError(
            f"City '{city_name}' could not be found. "
            "Please verify the city name and try again."
        )

    r = data["results"][0]
    lat = r["latitude"]
    lng = r["longitude"]
    state = r.get("admin1") or r.get("country", "")
    timezone_str = r.get("timezone", "UTC")
    return lat, lng, state, timezone_str


async def fetch_weather_data(lat: float, lng: float) -> dict:
    """
    Fetch current weather from Open-Meteo and return a dict with the exact
    feature keys and units required by the inference pipeline.

    Unit conversions:
      temperature_2m      °C  → Temperature(F)     °F    (×9/5 + 32)
      relative_humidity_2m %  → Humidity(%)         %     (direct)
      surface_pressure    hPa → Pressure(in)        inHg  (×0.02953)
      visibility          m   → Visibility(mi)      mi    (÷1609.34)
      wind_speed_10m      km/h→ Wind_Speed(mph)     mph   (÷1.60934)
      wind_direction_10m  °   → Wind_Direction      label (compass)
      precipitation       mm  → Precipitation(in)  in    (÷25.4)
      weather_code        WMO → Weather_Condition   str   (WMO_CODE_MAP)
      is_day              0/1 → Is_Night            0/1   (inverted)
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,"
        f"weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day"
        f"&hourly=visibility&forecast_days=1"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    current = data["current"]
    hourly  = data.get("hourly", {})

    # Visibility: first hourly value (m) or 10000 m default (≈6.2 mi)
    vis_m = 10000.0
    vis_list = hourly.get("visibility", [])
    if vis_list and vis_list[0] is not None:
        vis_m = float(vis_list[0])

    temp_f      = (float(current["temperature_2m"]) * 9 / 5) + 32
    humidity    = float(current["relative_humidity_2m"])
    pressure_in = float(current["surface_pressure"]) * 0.02953
    vis_mi      = vis_m / 1609.34
    wind_mph    = float(current["wind_speed_10m"]) / 1.60934
    precip_in   = float(current["precipitation"]) / 25.4
    wind_dir    = _wind_degrees_to_label(float(current["wind_direction_10m"]))
    wmo_code    = int(current["weather_code"])
    weather_cond = WMO_CODE_MAP.get(wmo_code, "Clear")
    is_night    = 0 if current["is_day"] == 1 else 1

    return {
        "Temperature(F)":   temp_f,
        "Humidity(%)":      humidity,
        "Pressure(in)":     pressure_in,
        "Visibility(mi)":   vis_mi,
        "Wind_Speed(mph)":  wind_mph,
        "Precipitation(in)": precip_in,
        "Wind_Direction":   wind_dir,
        "Weather_Condition": weather_cond,
        "Is_Night":         is_night,
    }


def derive_time_features(dt: datetime.datetime) -> dict:
    """
    Derive all time-related model features from a timezone-aware datetime.
    Uses the exact definitions from Feature Engineering notebook (04).

    TOD definitions:
      Morning   = 06:00 – 11:59
      Afternoon = 12:00 – 17:59
      Evening   = 18:00 – 21:59
      Night     = 22:00 – 05:59  (Is_Night from weather API; TOD all-zero)

    Rush Hour: 07:00–09:00 or 16:00–18:00 (inclusive)
    """
    h  = dt.hour
    wd = dt.weekday()   # 0=Mon … 6=Sun
    m  = dt.month

    is_weekend  = 1 if wd >= 5 else 0
    is_rush_hr  = 1 if (7 <= h <= 9) or (16 <= h <= 18) else 0

    season_spring = 1 if m in (3, 4, 5)  else 0
    season_summer = 1 if m in (6, 7, 8)  else 0
    season_fall   = 1 if m in (9, 10, 11) else 0

    tod_morning   = 1 if 6  <= h < 12 else 0
    tod_afternoon = 1 if 12 <= h < 18 else 0
    tod_evening   = 1 if 18 <= h < 22 else 0

    return {
        "Hour":           h,
        "Weekday":        wd,
        "Month":          m,
        "Is_Weekend":     is_weekend,
        "Is_Rush_Hour":   is_rush_hr,
        "Season_Spring":  season_spring,
        "Season_Summer":  season_summer,
        "Season_Fall":    season_fall,
        "TOD_Morning":    tod_morning,
        "TOD_Afternoon":  tod_afternoon,
        "TOD_Evening":    tod_evening,
    }


def calculate_engineered_features(base_feats: dict) -> dict:
    """
    Reproduce the exact feature engineering logic from training notebook 04.
    Inputs must already use the exact model feature keys (with parentheses).

    Returns the 13 engineered/interaction features.
    """
    weather_cond = str(base_feats.get("Weather_Condition", "")).lower()
    vis   = float(base_feats.get("Visibility(mi)",    10.0))
    precip= float(base_feats.get("Precipitation(in)",  0.0))
    temp  = float(base_feats.get("Temperature(F)",    70.0))

    is_night   = int(base_feats.get("Is_Night",     0))
    is_weekend = int(base_feats.get("Is_Weekend",   0))
    is_rush_hr = int(base_feats.get("Is_Rush_Hour", 0))

    junction       = int(base_feats.get("Junction",       0))
    crossing       = int(base_feats.get("Crossing",       0))
    traffic_signal = int(base_feats.get("Traffic_Signal", 0))
    railway        = int(base_feats.get("Railway",        0))
    station        = int(base_feats.get("Station",        0))
    stop           = int(base_feats.get("Stop",           0))

    # Weather flags (exact regexes from notebook 04)
    fog   = 1 if ("fog"   in weather_cond or "haze" in weather_cond) else 0
    rain  = 1 if ("rain"  in weather_cond or "drizzle" in weather_cond
                  or "thunderstorm" in weather_cond or "t-storm" in weather_cond) else 0
    snow  = 1 if ("snow"  in weather_cond or "sleet" in weather_cond
                  or "ice" in weather_cond) else 0

    poor_vis   = 1 if vis    < 1.0  else 0
    high_precip= 1 if precip > 0.1  else 0
    extreme_t  = 1 if (temp  < 32 or temp > 95) else 0

    weather_score = fog + rain + snow + poor_vis + high_precip + extreme_t

    # Road flags (exact logic from notebook 04)
    road_complex = crossing + junction + railway + station + stop + traffic_signal
    intersection = 1 if (junction == 1 or traffic_signal == 1 or crossing == 1) else 0

    # Interaction flags (exact logic from notebook 04)
    night_rain      = 1 if (is_night   and rain)      else 0
    weekend_night   = 1 if (is_weekend and is_night)  else 0
    poor_vis_rain   = 1 if (poor_vis   and rain)      else 0
    rush_jn         = 1 if (is_rush_hr and junction)  else 0

    return {
        "Fog_Indicator":           fog,
        "Rain_Indicator":          rain,
        "Snow_Indicator":          snow,
        "Poor_Visibility_Flag":    poor_vis,
        "High_Precipitation_Flag": high_precip,
        "Extreme_Temperature_Flag":extreme_t,
        "Weather_Severity_Score":  float(weather_score),
        "Road_Complexity_Score":   int(road_complex),
        "Intersection_Indicator":  intersection,
        "Night_Rain":              night_rain,
        "Weekend_Night":           weekend_night,
        "PoorVisibility_Rain":     poor_vis_rain,
        "RushHour_Junction":       rush_jn,
    }
