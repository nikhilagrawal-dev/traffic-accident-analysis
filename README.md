# 🚦 Traffic Accident Analysis & Severity Prediction

An end-to-end data science and machine learning project for analyzing traffic accidents, identifying accident hotspots, understanding accident patterns, and predicting accident severity using historical accident data.

The project combines exploratory data analysis, preprocessing, feature engineering, DBSCAN-based hotspot detection, machine learning, SHAP explainability, and an interactive Streamlit dashboard.

---

## 📌 Project Overview

Traffic accidents are influenced by multiple factors such as location, time, weather, road conditions, visibility, and infrastructure.

This project aims to:

- Analyze historical traffic accident data
- Identify high-risk accident hotspots
- Discover temporal and weather-related accident patterns
- Analyze infrastructure-related accident factors
- Train and evaluate machine learning models for accident severity prediction
- Explain model predictions using SHAP
- Provide an interactive dashboard for data exploration and prediction

The project is organized as a complete analytics and machine learning pipeline, with the final results integrated into a Streamlit dashboard.

---

## 🎯 Objectives

1. Perform exploratory analysis of traffic accident data.
2. Clean and preprocess the accident dataset.
3. Engineer meaningful features for analysis and prediction.
4. Detect geographical accident hotspots using DBSCAN.
5. Analyze accident severity across different conditions.
6. Analyze temporal accident patterns.
7. Analyze the relationship between accidents and weather conditions.
8. Analyze infrastructure-related accident factors.
9. Train and evaluate machine learning models for severity prediction.
10. Explain model behavior using SHAP.
11. Validate the finalized model and its readiness.
12. Provide an interactive dashboard for users.

---

## 🏗️ Project Architecture

```text
Traffic Accident Analysis
│
├── Data
│   └── Raw / processed accident dataset
│
├── Data Science Pipeline
│   ├── Data Understanding
│   ├── Data Preprocessing
│   ├── Feature Engineering
│   ├── Hotspot Detection
│   ├── ML Data Preparation
│   ├── Model Training
│   ├── Model Evaluation
│   ├── SHAP Explainability
│   └── Final Model Validation
│
├── ML Models & Artifacts
│   ├── Trained model
│   ├── Feature schema
│   ├── Encoders
│   ├── Evaluation metrics
│   └── SHAP outputs
│
└── Streamlit Dashboard
    ├── Layer 1: Analytics
    └── Layer 2: Severity Prediction
```

---

## 📊 Dashboard

The project contains an interactive Streamlit dashboard divided into two major layers.

### Layer 1 — Accident Analytics

**🔥 DBSCAN Hotspot Map**
Displays geographical accident hotspots identified using DBSCAN clustering. Users can explore accident locations and hotspot regions.

**📈 Severity Analytics**
Provides analysis of accident severity across different conditions and categories.

**⏰ Temporal Analytics**
Analyzes accident patterns based on:
- Hour
- Day
- Weekday
- Month
- Time-related patterns

**🌦️ Weather Analytics**
Analyzes accident behavior under different weather conditions.

**🛣️ Infrastructure Analytics**
Analyzes infrastructure-related accident factors such as:
- Junctions
- Crossings
- Traffic signals
- Road-related conditions

**🔎 Interactive Filters**
The dashboard supports filtering by:
- State
- City
- Severity
- Time
- Weather
- Infrastructure-related attributes

The State → City filter dependency has been tested to safely handle changes in parent selections.

### 🤖 Layer 2 — Severity Prediction

Layer 2 integrates the finalized machine learning model into the Streamlit dashboard. Users can provide accident-related conditions and receive a predicted accident severity.

**Prediction Inputs**

The prediction interface supports attributes including:
- State
- City
- Latitude / Longitude
- Month
- Weekday
- Hour
- Weather Condition
- Temperature
- Humidity
- Visibility
- Precipitation
- Wind Speed
- Wind Direction
- Pressure
- Infrastructure-related conditions

The dashboard constructs the required feature vector according to the finalized model schema.

**📊 Prediction Output**

The prediction module provides:
- Predicted accident severity
- Class probabilities
- Probability visualization
- What-if prediction behavior

The finalized model expects **53 features**.

The dashboard uses the project's feature schema and frequency encoders to construct inference inputs consistently with the finalized training pipeline.

---

## 🧠 Machine Learning

The project includes a complete machine learning workflow for accident severity prediction.

**Finalized Model:** XGBoost Classifier

The trained model is stored at:
models/best_model.pkl


The model contains **four severity classes**.

The finalized feature schema contains **53 features**.

### 📈 Model Validation

The final validation pipeline evaluates the trained model using:
- Test-set evaluation
- Accuracy
- Weighted F1
- Macro F1
- Cross-validation
- Confusion Matrix
- Classification Report
- Error Analysis
- Readiness Checks

Important validation artifacts are stored in `artifacts/`. Key files include:
- `final_model_metrics.json`
- `final_model_report.json`
- `final_model_readiness.json`
- `final_classification_report.csv`
- `final_confusion_matrix.png`
- `final_error_analysis.csv`

### 🔍 SHAP Explainability

SHAP is used to understand how the finalized model makes predictions. The project generates explainability visualizations including:
- `shap_global_bar_plot.png`
- `shap_beeswarm_summary.png`
- `shap_dependence_top5.png`
- `shap_multiclass_heatmap.png`
- `shap_waterfall_case1.png`
- `shap_waterfall_case2.png`
- `shap_waterfall_case3.png`

SHAP analysis helps identify:
- Globally important features
- Feature impact on predictions
- Class-specific behavior
- Individual prediction explanations

---

## 📚 Notebook Pipeline

The project contains a sequential data science workflow:

| Notebook | Description |
|----------|-------------|
| 01 | Data Understanding / Initial Analysis |
| 02 | Exploratory Data Analysis |
| 03 | Data Preprocessing |
| 04 | Feature Engineering |
| 05 | DBSCAN Hotspot Detection |
| 06A | ML Data Preparation |
| 06B | Model Training / Test Set Preparation |
| 07 | Model Evaluation |
| 08 | SHAP Explainability |
| 09 | Final Model Validation & Readiness |

The notebooks are located in `notebooks/`.

---

## 📁 Project Structure

```
traffic-accident-analysis/
│
├── dashboard/
│   ├── app.py
│   ├── charts.py
│   ├── data_loader.py
│   ├── filters.py
│   ├── maps.py
│   ├── model_info.py
│   └── prediction.py
│
├── data/
│   └── dataset_with_hotspots.csv
│
├── models/
│   ├── best_model.pkl
│   ├── model_metadata.json
│   ├── feature_importance.json
│   ├── training_metrics.json
│   └── training_report.json
│
├── artifacts/
│   ├── X_train.csv
│   ├── X_test.csv
│   ├── y_train.csv
│   ├── y_test.csv
│   ├── feature_list.json
│   ├── feature_schema.json
│   ├── frequency_encoders.pkl
│   ├── final_model_metrics.json
│   ├── final_model_report.json
│   ├── final_model_readiness.json
│   ├── final_classification_report.csv
│   ├── final_confusion_matrix.png
│   ├── final_error_analysis.csv
│   ├── shap_global_bar_plot.png
│   ├── shap_beeswarm_summary.png
│   ├── shap_dependence_top5.png
│   ├── shap_metadata.json
│   ├── shap_multiclass_heatmap.png
│   ├── shap_waterfall_case1.png
│   ├── shap_waterfall_case2.png
│   └── shap_waterfall_case3.png
│
├── notebooks/
│   ├── 01_*.ipynb
│   ├── 02_*.ipynb
│   ├── 03_*.ipynb
│   ├── 04_*.ipynb
│   ├── 05_*.ipynb
│   ├── 06A_*.ipynb
│   ├── 06B_*.ipynb
│   ├── 07_*.ipynb
│   ├── 08_SHAP_Explainability.ipynb
│   └── 09_Final_Model_Validation_and_Readiness.ipynb
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🛠️ Technology Stack

| Category | Tools |
|----------|-------|
| Programming | Python |
| Data Analysis | Pandas, NumPy |
| Data Visualization | Plotly, Matplotlib |
| Machine Learning | Scikit-learn, XGBoost |
| Explainable AI | SHAP |
| Geospatial Analysis | DBSCAN, Folium, Streamlit-Folium |
| Dashboard | Streamlit |
| Development Tools | Git, GitHub, VS Code, Jupyter Notebook, Google Colab |

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nikhilagrawal-dev/traffic-accident-analysis.git
cd traffic-accident-analysis
```

### 2. Create a Virtual Environment

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows**
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
python -m pip install -r requirements.txt
```

Important ML inference dependencies include:
- joblib
- scikit-learn
- xgboost

### ▶️ Running the Dashboard

After activating the virtual environment:

```bash
python -m streamlit run dashboard/app.py
```


