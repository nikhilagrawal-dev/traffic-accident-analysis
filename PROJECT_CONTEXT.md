# Traffic Accident Analysis — Project Context

## Project
Traffic Accident Hotspot Detection and Severity Prediction.

## Dashboard Layer
The Streamlit dashboard is Layer 1 of the application.

Layer 1 is analytics and visualization only.

It must NOT retrain models, rerun preprocessing, rerun feature engineering, or rerun DBSCAN.

## Dataset

Primary dashboard dataset:

data/dataset_with_hotspots.csv

This is the finalized output of Notebook 05.

The dataset contains approximately 300K accident records and 54 columns.

## Important Geographic Features

Start_Lat
Start_Lng
City
State

These are used for geographic analysis and mapping.

## Important Accident Features

Severity
Distance(mi)
Duration_Minutes

## Important Temporal Features

Hour
Weekday
Is_Weekend
Month
Is_Night
Is_Rush_Hour
TOD_Morning
TOD_Afternoon
TOD_Evening

## Important Weather Features

Temperature(F)
Humidity(%)
Pressure(in)
Visibility(mi)
Wind_Speed(mph)
Precipitation(in)
Weather_Condition

Weather engineered features include:

Fog_Indicator
Rain_Indicator
Snow_Indicator
Poor_Visibility_Flag
High_Precipitation_Flag
Extreme_Temperature_Flag
Weather_Severity_Score

## Road / Infrastructure Features

Amenity
Crossing
Junction
Railway
Station
Stop
Traffic_Signal
Road_Complexity_Score
Intersection_Indicator

## DBSCAN Hotspot Features

Hotspot_Label
Hotspot_Flag
Noise_Flag
Cluster_Size
Distance_To_Cluster_Center

Final DBSCAN configuration:

eps = 0.5 km
min_samples = 5

The finalized run produced approximately:

8,623 clusters
105,178 noise points
largest cluster = 2.15% of dataset

These values should be calculated from the CSV rather than hard-coded into the dashboard.

## Dashboard Architecture

dashboard/
├── app.py
├── data_loader.py
├── filters.py
├── charts.py
└── maps.py

app.py:
Main Streamlit application.

data_loader.py:
CSV loading, caching and validation.

filters.py:
Reusable filtering logic.

charts.py:
Plotly visualizations.

maps.py:
Folium geographic visualizations.

## Layer 1 Features

The dashboard should include:

1. Overview KPIs
2. Sidebar filters
3. Severity analytics
4. Temporal analytics
5. Weather analytics
6. State/location analytics
7. Road/infrastructure analytics
8. DBSCAN hotspot map
9. Hotspot summary

## Future Layers

Notebook 08:
Explainability.

Notebook 09:
Final model/inference integration.

These are NOT part of Layer 1.

Do not create fake prediction functionality.

Do not implement XGBoost prediction yet.

Do not implement SHAP yet.