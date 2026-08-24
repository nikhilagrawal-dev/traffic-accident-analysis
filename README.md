# 🚦 Traffic Accident Severity Predictor

An end-to-end machine learning application for predicting **traffic accident severity in the United States**, built on a leakage-free spatial machine learning pipeline, XGBoost, FastAPI, and a modern React dashboard.

The system combines environmental, temporal, infrastructure, and spatial information to estimate accident severity, and surfaces **probability distributions, spatial intelligence, and SHAP-based explanations** for every prediction.

---

## 🚀 Live Demo

🔗 **[Traffic Accident Intelligence — Live Demo](https://traffic-accident-analysis-one.vercel.app/)**

## 🌐 Production Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://traffic-accident-analysis-one.vercel.app/ |
| Backend | Render | https://traffic-accident-analysis-izr7.onrender.com |
| API Documentation | FastAPI Swagger | https://traffic-accident-analysis-izr7.onrender.com/docs |
| Health Check | FastAPI | https://traffic-accident-analysis-izr7.onrender.com/health |

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Dataset](#-dataset)
- [Data Preprocessing](#-data-preprocessing)
- [Feature Engineering](#️-feature-engineering)
- [Leakage-Free Spatial Methodology](#️-leakage-free-spatial-methodology)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Model Selection](#-model-selection)
- [Model Evaluation](#-model-evaluation)
- [Class Imbalance](#️-class-imbalance)
- [SHAP Explainability](#-shap-explainability)
- [System Architecture](#️-system-architecture)
- [Project Structure](#-project-structure)
- [Frontend](#️-frontend)
- [Frontend API Configuration](#-frontend-api-configuration)
- [Backend](#-backend)
- [API Reference](#-api-reference)
- [Prediction Response](#-prediction-response)
- [Production Verification](#-production-verification)
- [Local Installation](#-local-installation)
- [Prediction Workflow](#-prediction-workflow)
- [Example Result](#-example-result)
- [Reset Functionality](#-reset-functionality)
- [Limitations](#️-limitations)
- [Future Improvements](#-future-improvements)
- [Security Considerations](#️-security-considerations)
- [Technologies Used](#-technologies-used)
- [Key Results](#-key-results)
- [Project Highlights](#-project-highlights)

---

## 🎯 Project Overview

Traffic accidents vary significantly in severity depending on environmental conditions, road infrastructure, weather, time, location, and other contextual factors.

This project implements a machine learning system that predicts accident severity across **four severity classes**:

| Severity | Description |
|:---:|---|
| 1 | Lowest severity |
| 2 | Moderate severity |
| 3 | High severity |
| 4 | Highest severity |

The system integrates data preprocessing, feature engineering, spatial machine learning (DBSCAN, BallTree), an optimized XGBoost classifier, SHAP explainability, a FastAPI backend, and a React + Vite + Tailwind + Recharts frontend — deployed via Vercel and Render.

---

## 🎯 Problem Statement

Traffic accident severity prediction is a challenging classification problem because outcomes depend on multiple interacting factors, including:

- Weather conditions, temperature, humidity, visibility, precipitation
- Road infrastructure — traffic signals, junctions, railway crossings
- Time of day, rush hour, weekday/weekend
- Geographic location, local accident density, spatial clustering

The core technical challenge is building a reliable **leakage-free spatial machine learning pipeline** while maintaining strong predictive performance.

---

## 🎯 Objectives

1. Build a robust traffic accident severity classification model.
2. Handle missing and inconsistent accident data.
3. Extract meaningful temporal and environmental features.
4. Incorporate spatial information without introducing target leakage.
5. Compare candidate machine learning models.
6. Select an optimized model based on validation performance.
7. Provide probability estimates across all severity classes.
8. Provide model explanations using SHAP.
9. Build a production-ready FastAPI inference API.
10. Develop an interactive React frontend.
11. Deploy the frontend and backend independently.
12. Integrate the production frontend with the production backend.

---

## ✨ Key Features

### 🤖 Machine Learning Prediction
Predicts accident severity using an optimized XGBoost model.

### 📊 Probability Distribution
The application displays the probability associated with each severity class, e.g.:

```text
Severity 1 → 0.1%
Severity 2 → 63.3%
Severity 3 → 31.3%
Severity 4 → 5.3%
```

### 🗺️ Spatial Intelligence
The backend derives additional spatial information from geographic coordinates, including:

- Local accident density
- Hotspot information
- Cluster information
- Distance to cluster center

### 🔍 SHAP Explainability
SHAP explains how individual features contribute to a prediction. The API returns SHAP-based feature contributions when explanations are enabled.

### 🌦️ Environmental Features
The prediction pipeline incorporates temperature, humidity, visibility, precipitation, and other weather-related indicators.

### ⏰ Temporal Features
Timestamp information is transformed into: `Hour`, `Month`, `Is_Rush_Hour`, `Is_Weekend`, `Is_Night`.

---

## 📊 Dataset

The project uses a US traffic accident dataset. After preprocessing, the final leakage-free dataset contains:

> **299,794 rows**

The dataset covers accident location, weather, road infrastructure, time, environmental conditions, traffic conditions, and accident characteristics. The final ML pipeline uses a combination of original and engineered features.

---

## 🧹 Data Preprocessing

| Stage | Description |
|---|---|
| **1. Data Cleaning** | Missing and inconsistent values are handled before model training. |
| **2. Temporal Processing** | Timestamps are transformed into `Hour`, `Month`, `Is_Rush_Hour`, `Is_Weekend`, `Is_Night`, `Weekday`. |
| **3. Weather Parsing** | Weather-related information is parsed into model-compatible numerical features. |
| **4. Missing Value Handling** | Ensures the final model receives valid input features. |
| **5. Categorical Processing** | High-cardinality categorical variables are transformed using frequency encoding. |

---

## ⚙️ Feature Engineering

The final inference pipeline works with:

```
47 base input features
 +
 5 backend-derived spatial features
 =
52 total model features
```

The five spatial features are generated by the backend during inference, so the frontend does not need to calculate them manually.

---

## 🗺️ Leakage-Free Spatial Methodology

One of the most important aspects of this project is preventing **target leakage** — spatial features can accidentally introduce information from the target variable into training or inference. To prevent this, all spatial information is constructed strictly from training data.

**DBSCAN**
DBSCAN is fitted only on the training data to identify spatial clusters and accident hotspots. The inference pipeline never refits DBSCAN using test or production data.

**BallTree**
A BallTree is built from the relevant training spatial information. For each inference point, the system searches for the nearest relevant training point, with spatial assignment capped at a maximum distance of **0.5 km** — preventing inference from using future or target-derived information.

**Local Accident Density**
Calculated exclusively from training data, cached in a lookup structure, and reused during inference — so accident information from a live request never influences the spatial features.

**Why this matters:** a model can appear highly accurate if target- or test-set information leaks into feature engineering. This project therefore follows a strict one-directional flow:

```
Training Data → Spatial Feature Construction → Cached Spatial Information
             → Model Training → Production Inference
```

rather than recalculating target-dependent spatial information using the entire dataset.

---

## 🤖 Machine Learning Pipeline

```
Raw Dataset
   → Data Cleaning
   → Missing Value Handling
   → Feature Engineering
   → Temporal Features
   → Weather Processing
   → Categorical Encoding
   → Train/Test Split
   → Leakage-Free Spatial Processing
   → Model Training
   → Cross Validation
   → Model Selection
   → Final Model
   → FastAPI Inference
```

---

## 🏆 Model Selection

Two candidate models were evaluated:

- Random Forest
- **XGBoost**

**Selected model: Optimized XGBoost** — chosen for its performance on the classification task and its ability to efficiently handle the engineered feature space.

---

## 📈 Model Evaluation

| Metric | Score |
|---|---:|
| CV Weighted F1 | 0.8613 ± 0.0008 |
| Test Accuracy | 0.8731 |
| Test Weighted F1 | 0.8619 |
| Test Macro F1 | 0.5524 |

---

## ⚠️ Class Imbalance

The dataset contains significant class imbalance. Majority classes are predicted more effectively than minority classes — Severity 1 and Severity 4 in particular remain more challenging to predict.

This is reflected in the gap between **Macro F1 (0.5524)** and **Weighted F1 (0.8619)**. Accuracy and weighted F1 should not be interpreted as evidence that all four severity classes are predicted equally well.

---

## 🔍 SHAP Explainability

The project integrates **SHAP** (SHapley Additive exPlanations) into the inference pipeline using a `TreeExplainer` for the XGBoost model. When explanations are enabled:

```json
{ "explain": true }
```

the API returns SHAP-based feature contributions, giving visibility into *why* a prediction was made — not just the predicted class.

---

## 🏗️ System Architecture

**Frontend**
```
React → Vite → Tailwind CSS → Recharts → Vercel
```

**Backend**
```
FastAPI → Input Validation → Feature Processing → Spatial Feature Inference
        → XGBoost → SHAP TreeExplainer → JSON Response → Render
```

**Complete Architecture**
```
                    USER
                      │
                      ▼
              React Dashboard
                      │
                    HTTPS
                      │
                      ▼
                   Vercel
                      │
                POST /predict
                      │
                      ▼
              FastAPI Backend
                   (Render)
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
      Spatial Inference      XGBoost
             │                 │
             └────────┬────────┘
                      │
                      ▼
              SHAP Explainability
                      │
                      ▼
                JSON Response
                      │
                      ▼
              React Dashboard
```

---

## 📁 Project Structure

```
traffic-accident-analysis/
│
├── app/
│   └── main.py
│
├── artifacts/
├── dashboard/
├── data/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── models/
├── notebooks/
├── scripts/
├── tests/
│
├── .env
├── .gitignore
├── PROJECT_CONTEXT.md
├── README.md
├── main.py
└── requirements.txt
```

---

## 🖥️ Frontend

Built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**. The dashboard provides sections for:

- Project Overview
- Methodology
- Spatial Intelligence
- Accident Analysis
- Model Intelligence
- Validation
- Prediction Results

The **Analyze** workflow collects the required base features and sends them to the production API.

### 🔌 Frontend API Configuration

The frontend API service uses an environment variable rather than hardcoding the backend URL:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
```

For production, Vercel sets:

```
VITE_API_URL=https://traffic-accident-analysis-izr7.onrender.com
```

This allows the same frontend codebase to work in both local development and production.

---

## ⚡ Backend

Implemented using **FastAPI**. Responsibilities include:

- Receiving prediction requests
- Validating input
- Processing the 47 base features
- Deriving spatial features
- Running the XGBoost model
- Calculating probabilities
- Generating SHAP explanations
- Returning structured JSON results

---

## 🔗 API Reference

### Health Check

```
GET /health
```

Production endpoint: `https://traffic-accident-analysis-izr7.onrender.com/health`

Expected response:

```json
{
  "status": "healthy",
  "pipeline_loaded": true
}
```

### Swagger Documentation

FastAPI automatically provides interactive API docs:
`https://traffic-accident-analysis-izr7.onrender.com/docs`

### Prediction

```
POST /predict
```

Accepts the required 47 base features; the backend automatically derives the additional spatial features. SHAP explanations can be enabled via:

```json
{ "explain": true }
```

---

## 📦 Prediction Response

A successful production prediction returns:

- `predicted_severity`
- `probabilities`
- `spatial_information`
- `shap_explanation`

The frontend uses these values to display predicted severity, confidence, probability distribution, spatial information, and SHAP feature contributions.

---

## 🚀 Production Deployment

The application is deployed as two independent services.

**Frontend — Vercel**
`https://traffic-accident-analysis-one.vercel.app/`

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Backend — Render**
`https://traffic-accident-analysis-izr7.onrender.com`

Runs via Uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**CORS Configuration**
The FastAPI backend allows the production Vercel origin (`https://traffic-accident-analysis-one.vercel.app`) to communicate with the API:

```
Vercel Frontend → HTTPS Request → Render FastAPI
```

---

## 🧪 Production Verification

The deployed application was verified end-to-end:

```
Vercel → HTTPS → Render → FastAPI → XGBoost → Spatial Inference → SHAP → JSON Response → React UI
```

Verified functionality includes: frontend loading, backend health check, Vercel → Render integration, CORS, production prediction, probability distribution, SHAP explanation, spatial information, reset functionality, error handling, responsive behavior, cold-start behavior, and console/network verification.

---

## 💻 Local Installation

### Prerequisites

- Python 3
- Node.js
- npm
- Git

### 🔧 Backend Setup

```bash
git clone https://github.com/nikhilagrawal-dev/traffic-accident-analysis.git
cd traffic-accident-analysis

# Create a virtual environment
python3 -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend available at: `http://127.0.0.1:8000`
Swagger docs at: `http://127.0.0.1:8000/docs`

### 🎨 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:5173`

### 🔗 Local Frontend → Backend Configuration

| Environment | API URL |
|---|---|
| Local | `http://127.0.0.1:8000` |
| Production | `https://traffic-accident-analysis-izr7.onrender.com` |

The production URL is configured through `VITE_API_URL` rather than hardcoded into the frontend.

---

## 🔄 Prediction Workflow

```
1.  User opens dashboard
2.  User navigates to Analyze
3.  User enters accident information
4.  Frontend validates input
5.  React sends POST /predict
6.  FastAPI receives request
7.  Backend processes base features
8.  Spatial features are derived
9.  XGBoost generates prediction
10. Probability distribution generated
11. SHAP explanation generated
12. Backend returns JSON
13. React renders results
```

---

## 📊 Example Result

| Field | Value |
|---|---|
| Predicted Severity | 2 |
| Classification | Moderate |
| Confidence | 63.30% |

Along with a full **probability distribution** across Severity 1–4, plus **spatial information** and **SHAP explanation**.

---

## 🔄 Reset Functionality

After a prediction, the user can reset the analysis. Reset clears:

- Prediction result
- Probability distribution
- SHAP explanation
- Spatial information
- Current result state
- Analysis form state

---

## ⚠️ Limitations

1. **Class Imbalance** — Minority classes, particularly Severity 1 and Severity 4, remain difficult to predict.
2. **Macro F1 (0.5524)** — Indicates performance is not uniform across all severity classes.
3. **Weather Information** — The system relies on the available accident dataset rather than dynamically retrieving live weather data.
4. **Spatial Coverage** — Spatial inference is bounded by the training data's spatial coverage and the defined nearest-point methodology.

---

## 🔮 Future Improvements

1. **Better Minority-Class Handling** — SMOTE, class weighting, advanced resampling, threshold optimization.
2. **Real-Time Weather** — Integrate a live weather API for current environmental conditions.
3. **Model Improvements** — Evaluate LightGBM, CatBoost, neural networks, and ensemble approaches.
4. **Improved Spatial Modeling** — Explore additional spatial techniques and geographically aware validation.
5. **Production Monitoring** — Track API latency, prediction volume, error rates, model drift, and data drift.

---

## 🛡️ Security Considerations

The production frontend does not require exposure of private API credentials. It uses `VITE_API_URL`, which is a configuration value — not a secret. Sensitive credentials and API keys are never committed to GitHub, and environment files containing secrets remain excluded via `.gitignore`.

---

## 🧰 Technologies Used

| Category | Stack |
|---|---|
| **Machine Learning** | Python, Pandas, NumPy, Scikit-learn, XGBoost, SHAP |
| **Spatial Analysis** | DBSCAN, BallTree |
| **Backend** | FastAPI, Uvicorn |
| **Frontend** | React, Vite, Tailwind CSS, Recharts |
| **Deployment** | Vercel, Render |
| **Development** | Git, GitHub |

---

## 📌 Key Results

| Metric | Value |
|---|---:|
| Dataset Size | 299,794 rows |
| Base Features | 47 |
| Backend-Derived Spatial Features | 5 |
| Final Model Features | 52 |
| Selected Model | Optimized XGBoost |
| CV Weighted F1 | 0.8613 ± 0.0008 |
| Test Accuracy | 0.8731 |
| Test Weighted F1 | 0.8619 |
| Test Macro F1 | 0.5524 |

---

## ⭐ Project Highlights

```
Data → Preprocessing → Feature Engineering → Leakage-Free Spatial Modeling
     → Model Training → Cross Validation → XGBoost → SHAP Explainability
     → FastAPI → React Dashboard → Vercel + Render → Production ML Application
```

This project demonstrates a complete end-to-end machine learning workflow — with a focus not only on model performance, but on **leakage prevention, explainability, spatial inference, API integration, frontend/backend integration, and production deployment**.

---
