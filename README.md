# 🚦 Traffic Accident Intelligence

**An end-to-end machine learning application for traffic accident severity prediction with spatial and live contextual information.**

The system combines historical accident patterns, environmental and temporal information, leakage-free spatial intelligence, live weather enrichment, an optimized XGBoost classifier, SHAP explainability, and a React + FastAPI web application.

| | |
|---|---|
| **Project type** | AI/ML decision-support prototype |
| **Primary task** | Four-class accident severity classification |
| **Final dataset** | 299,794 processed records |
| **Final model** | Optimized XGBoost |

---

## 🚀 Live Demo

| Service | Link |
|---|---|
| Frontend | [traffic-accident-analysis-one.vercel.app](https://traffic-accident-analysis-one.vercel.app/) |
| Backend | [traffic-accident-analysis-izr7.onrender.com](https://traffic-accident-analysis-izr7.onrender.com) |
| Swagger API Docs | [/docs](https://traffic-accident-analysis-izr7.onrender.com/docs) |
| Health Check | [/health](https://traffic-accident-analysis-izr7.onrender.com/health) |

> **Note:** The backend is hosted on Render's free tier and may take a few seconds to wake up on first request. The FastAPI backend is configured with CORS to accept requests only from the production Vercel origin (`https://traffic-accident-analysis-one.vercel.app`).

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Dataset](#-dataset)
- [Data Preprocessing](#-data-preprocessing)
- [Feature Engineering](#️-feature-engineering)
- [Leakage-Free Spatial Intelligence](#️-leakage-free-spatial-intelligence)
- [Live Weather Context](#️-live-weather-context)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Model Selection](#-model-selection)
- [Model Evaluation](#-model-evaluation)
- [Class Imbalance](#️-class-imbalance)
- [SHAP Explainability](#-shap-explainability)
- [FARS Exploratory Comparison](#-fars-exploratory-comparison)
- [System Architecture](#️-system-architecture)
- [Project Structure](#-project-structure)
- [Frontend](#️-frontend)
- [Backend and API](#-backend-and-api)
- [Prediction Workflow](#-prediction-workflow)
- [Validation and Reproducibility](#-validation-and-reproducibility)
- [Deployment](#-deployment)
- [Local Installation](#-local-installation)
- [Limitations](#️-limitations)
- [Future Improvements](#-future-improvements)
- [Security Considerations](#️-security-considerations)
- [Technologies Used](#-technologies-used)
- [Key Results](#-key-results)
- [Project Highlights](#-project-highlights)
- [References](#-references)
- [Project Positioning](#️-project-positioning)

---

## 🎯 Project Overview

Traffic accident severity depends on multiple interacting environmental, temporal, spatial, and contextual factors. This project develops a web-based AI system that predicts accident severity using historical accident patterns enriched with spatial information and live weather context.

The system provides:

- Predicted accident severity
- Probability distribution across four severity classes
- Spatial information
- SHAP-based feature contributions
- Live weather-enriched inference
- An interactive web dashboard

### Severity Classes

| Severity | Description |
|:---:|---|
| 1 | Lowest severity |
| 2 | Moderate severity |
| 3 | High severity |
| 4 | Highest severity |

> The severity labels are treated as the classification target defined by the dataset. They should not be interpreted as a causal measure of accident outcome.

---

## 🎯 Problem Statement

Accident severity is influenced by multiple interacting factors, including:

- Weather conditions
- Temperature, humidity, visibility, and precipitation
- Road and infrastructure characteristics
- Time-of-day and temporal patterns
- Geographic location
- Local accident density and spatial clustering

The challenge is to combine these factors into a reliable machine-learning pipeline while avoiding data leakage and providing interpretable predictions.

**The project therefore focuses on:**
Severity Prediction + Spatial Intelligence + Live Context + Explainable AI

---

## 🎯 Objectives

1. Predict traffic accident severity using machine learning.
2. Enrich predictions with spatial and contextual information.
3. Integrate live weather information.
4. Generate leakage-free spatial features.
5. Compare candidate machine-learning models.
6. Select the final model using validation performance.
7. Provide probability estimates for all severity classes.
8. Explain predictions using SHAP.
9. Build a FastAPI inference backend.
10. Develop an interactive React frontend.
11. Validate inference and spatial reproducibility.
12. Deploy the complete prototype.

---

## 📊 Dataset

### Primary Historical Dataset

The primary accident dataset is the **US Accidents dataset (2016–2023)**, obtained via Kaggle. The original dataset contains approximately **7.7 million accident records** across 40+ columns.

### Sampling Strategy

Processing the complete dataset was computationally expensive, particularly for spatial processing, so a manageable subset was selected using reproducible random sampling with a fixed seed:

```python
df_full.sample(n=300000, random_state=42)
```

Random sampling was used instead of taking the first 300,000 rows, since the original data may be ordered by date, state, or source — taking the first *N* rows could otherwise produce a biased subset.

### Final Dataset

After subsequent preprocessing and cleaning, the final leakage-free dataset contained **299,794 records**, covering location, time, weather, road/infrastructure, and other contextual characteristics.

### Data Pipeline Sources

| Source / Component | Purpose |
|---|---|
| US Accidents dataset | Primary historical accident records |
| Geocoding | Geographic / context enrichment |
| OpenWeather API | Live weather context during inference |
| NHTSA FARS | Exploratory external comparison |

> These sources are **not** treated as one raw merged accident dataset. The US Accidents data forms the primary modeling dataset; other sources provide contextual enrichment or external comparison only.

---

## 🧹 Data Preprocessing

The preprocessing pipeline includes:

- Data cleaning
- Missing-value handling
- Temporal feature extraction
- Weather transformation
- Categorical processing (including frequency encoding)
- Train/test splitting
- Leakage-free spatial processing

Temporal information is transformed into features such as:

`Hour` · `Month` · `Weekday` · `Is_Rush_Hour` · `Is_Weekend` · `Is_Night`

Preprocessing artifacts are fitted using training data only and reused during inference to maintain consistency.

---

## ⚙️ Feature Engineering

```
47 base features
      +
5 backend-derived spatial features
      =
52 total model features
```

### Five Spatial Features

1. `Local_Accident_Density`
2. `Hotspot_Flag`
3. `Noise_Flag`
4. `Cluster_Size`
5. `Distance_To_Cluster_Center`

These features are generated by the backend spatial pipeline rather than manually entered by the frontend user.

---

## 🗺️ Leakage-Free Spatial Intelligence

Spatial information can introduce leakage if test or target-related data is used while constructing training features. The project therefore constructs spatial artifacts from training data only, and reuses the resulting deterministic representation during inference.

**DBSCAN** identifies density-based spatial accident regions. The clustering representation is constructed using training data and is never refitted on test or production inference data.

**BallTree** supports efficient spatial neighbor/distance queries. For each inference point, the system searches for the nearest relevant training point, with spatial assignment capped at a maximum distance of **0.5 km** — this prevents an inference request from being matched to a distant, less-relevant training cluster. Inference uses the canonical training spatial representation rather than rebuilding spatial information from the complete dataset.

### Leakage Prevention Flow

```
Training Data
     ↓
Spatial Feature Construction
     ↓
Cached / Deterministic Spatial Artifacts
     ↓
Model Training
     ↓
Production Inference
```

**Additional safeguards:**

- Training-only spatial artifacts
- Training-only frequency encoders
- Safe handling of unseen categories
- Exclusion of target-derived hotspot labels from inappropriate model inputs
- Held-out test set for final evaluation
- Deterministic preprocessing artifacts

---

## 🌦️ Live Weather Context

The backend uses the **OpenWeather API** to enrich a city-based prediction request with current weather information, including:

Temperature · Humidity · Pressure · Visibility · Wind speed · Wind direction · Precipitation · Weather condition · Day/night context

The API response is transformed into the feature representation expected by the trained model.

> **Scope note:** The project does not directly process raw satellite imagery, radar imagery, or CCTV footage — it consumes structured weather data from the OpenWeather API. Live traffic and road-condition feeds are planned as future improvements.

---

## 🤖 Machine Learning Pipeline

```
Raw Accident Dataset
        ↓
Data Cleaning
        ↓
Missing Value Handling
        ↓
Feature Engineering
        ↓
Temporal Features
        ↓
Weather Processing
        ↓
Categorical Encoding
        ↓
Train/Test Split
        ↓
Leakage-Free Spatial Processing
        ↓
Model Training
        ↓
Cross Validation
        ↓
Model Selection
        ↓
Optimized XGBoost
        ↓
FastAPI Inference
        ↓
Prediction + Probabilities + SHAP
```

---

## 🏆 Model Selection

Two candidate models were evaluated:

| Model | Optimized CV Weighted F1 |
|---|:---:|
| Random Forest | 82.52% |
| **XGBoost** | **85.91%** |

XGBoost was selected as the final model based on validation performance.

> XGBoost itself is an established algorithm; the project's contribution is the integrated pipeline combining accident severity prediction, spatial intelligence, live context, explainability, and deployment.

---

## 📈 Model Evaluation

Final held-out test results:

| Metric | Score |
|---|:---:|
| Test Accuracy | 87.31% |
| Test Weighted F1 | 86.19% |
| Test Macro F1 | 55.24% |
| Balanced Accuracy | 49.54% |
| Log Loss | 0.3301 |

Five-fold cross-validation produced a weighted F1 of approximately **86.15% ± 0.07%**.

### Interpreting the Results

The 87.31% accuracy represents overall performance on the held-out test set. However, accuracy alone is not sufficient because the severity classes are imbalanced — the lower Macro F1 and balanced accuracy indicate that minority-class performance remains a limitation.

---

## ⚠️ Class Imbalance

The dataset is significantly imbalanced toward the majority severity class. As a result:

- Weighted F1 is substantially higher than Macro F1.
- Macro F1 exposes weaker performance across minority classes.
- Balanced accuracy is also lower.

In particular, Severity 1 and Severity 4 — the two minority classes — remain the most difficult to predict reliably. The model should **not** be interpreted as performing equally well on all four severity classes. This limitation is explicitly reported rather than hidden behind the overall accuracy.

---

## 🔍 SHAP Explainability

The system integrates **SHAP** (SHapley Additive exPlanations) using a tree-based explainer for the XGBoost model. When explanation is enabled, the API returns feature-level SHAP contributions, which the dashboard uses to show which features were associated with the model's prediction.

> SHAP explains the model's behavior and feature contribution — it does **not** establish causality. A feature having a high SHAP contribution does not mean that feature directly caused the accident or its severity.

---

## 🔎 FARS Exploratory Comparison

**FARS** (Fatality Analysis Reporting System) is a fatal-crash dataset maintained by NHTSA, used here for an exploratory / partial external comparison.

**Purpose:** Examine whether DBSCAN hotspot regions identified from the primary accident dataset also showed elevated concentrations of fatal crashes.

**Result:** Unfavorable — fatal-crash enrichment inside the identified DBSCAN hotspot regions was *lower* than the random baseline. This is treated as a boundary condition, not a successful validation result.

**The comparison does not establish:**

- Generalization of the model to fatal crashes
- That DBSCAN hotspots represent fatal-crash concentrations
- That spatial features cause accident severity
- Universal reliability of the primary dataset

The result is reported transparently, since external comparison should not only report favorable findings.

---

## 🏗️ System Architecture

### High-Level Architecture

```
                    USER
                      │
                      ▼
              React + Vite
                      │
                      ▼
                 FastAPI
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      Geocoding              Local Time
          │                       │
          └───────────┬───────────┘
                      ▼
               OpenWeather
                      │
                      ▼
             Feature Engineering
                      │
                 47 Base Features
                      │
                      ▼
             DBSCAN + BallTree
                      │
                5 Spatial Features
                      │
                      ▼
               52 Total Features
                      │
                      ▼
                 XGBoost
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      Prediction                SHAP
          │                       │
          └───────────┬───────────┘
                      ▼
               React Dashboard
```

### Technology Architecture

**Frontend:** React → Vite → Tailwind CSS → Recharts → Vercel

**Backend:** FastAPI → Validation → Feature Processing → Spatial Inference → XGBoost → SHAP → JSON Response → Render

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
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── models/
├── notebooks/
├── scripts/
├── tests/
│
├── .gitignore
├── PROJECT_CONTEXT.md
├── README.md
├── main.py
└── requirements.txt
```

---

## 🖥️ Frontend

Built using **React**, **Vite**, **Tailwind CSS**, and **Recharts**.

The dashboard provides:

- Project overview
- Methodology
- Spatial intelligence
- Accident analysis
- Model intelligence
- Validation
- Prediction results

The **Analyze** workflow collects the required base information and sends it to the backend prediction API.

### 🔌 Frontend API Configuration

The frontend API service uses an environment variable rather than hardcoding the backend URL, so the same codebase works in both local development and production:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
```

| Environment | API URL |
|---|---|
| Local | `http://127.0.0.1:8000` |
| Production | `https://traffic-accident-analysis-izr7.onrender.com` |

---

## ⚡ Backend and API

The backend is implemented using **FastAPI**. Responsibilities include:

- Receiving prediction requests
- Validating input
- Processing the 47 base features
- Deriving five spatial features
- Running XGBoost inference
- Generating class probabilities
- Generating SHAP explanations
- Returning structured JSON

### Health Check

```
GET /health
```

Expected response:

```json
{
  "status": "healthy",
  "pipeline_loaded": true
}
```

### Prediction

```
POST /predict
```

The prediction endpoint accepts the required base inputs. Spatial features are derived by the backend. SHAP explanations can be enabled with:

```json
{ "explain": true }
```

A successful prediction response can return:

- `predicted_severity`
- `probabilities`
- `spatial_information`
- `shap_explanation`

---

## 🔄 Prediction Workflow

1. User opens dashboard
2. User enters accident/context information
3. Frontend validates input
4. React sends `POST /predict`
5. FastAPI receives request
6. Backend enriches contextual information
7. Base features are processed
8. Spatial features are derived
9. XGBoost generates prediction
10. Probability distribution is generated
11. SHAP explanation is generated
12. Backend returns JSON
13. React renders results

### 📊 Example Result

| Field | Value |
|---|---|
| Predicted Severity | 2 |
| Classification | Moderate |
| Confidence | 63.30% |

```text
Severity 1 → 0.1%
Severity 2 → 63.3%
Severity 3 → 31.3%
Severity 4 → 5.3%
```

Alongside the probability distribution, the response includes full **spatial information** and a **SHAP explanation** for the prediction.

### 🔄 Reset Functionality

After a prediction, the user can reset the analysis. Reset clears:

- Prediction result
- Probability distribution
- SHAP explanation
- Spatial information
- Current result state
- Analysis form state

---

## 🧪 Validation and Reproducibility

The deployed system was tested at multiple levels.

### Automated Tests

```
18 passed
0 failed
1 warning
```

The warning relates to a dependency deprecation and does not represent a test failure.

### Exact Inference Consistency

A 5,000-row deterministic comparison produced:

| Check | Result |
|---|:---:|
| Matching rows | 5,000 / 5,000 |
| Mismatches | 0 |
| Max absolute feature difference | 0.0 |
| Mean absolute feature difference | 0.0 |

### Spatial Reproducibility

For 5,000 tested samples:

| Check | Result |
|---|:---:|
| Spatial-feature matches | 5,000 / 5,000 |
| Max observed numerical difference | ≈ 2.39 × 10⁻¹² |

These checks verify that the production inference pipeline reproduces the intended training-time feature transformation.

### Production Verification

The deployed application was verified end-to-end:

```
Vercel → HTTPS → Render → FastAPI → XGBoost → Spatial Inference → SHAP → JSON Response → React UI
```

Verified functionality includes: frontend loading, backend health check, Vercel → Render integration, CORS, production prediction, probability distribution, SHAP explanation, spatial information, reset functionality, error handling, responsive behavior, cold-start behavior, and console/network verification.

---

## 🚀 Deployment

The application is deployed as two independent services.

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://traffic-accident-analysis-one.vercel.app/ |
| Backend | Render | https://traffic-accident-analysis-izr7.onrender.com |

### Frontend — Vercel Settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Backend — Render

Runs via Uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The FastAPI backend's CORS configuration allows only the production Vercel origin to call the API.

### Communication Flow

```
React / Vercel
     ↓  HTTPS
FastAPI / Render
     ↓
ML + Spatial Pipeline
     ↓
JSON Response
     ↓
React Dashboard
```

The frontend uses an environment variable for the backend URL: `VITE_API_URL`

---

## 💻 Local Installation

### Prerequisites

- Python 3
- Node.js
- npm
- Git

### Clone

```bash
git clone https://github.com/nikhilagrawal-dev/traffic-accident-analysis.git
cd traffic-accident-analysis
```

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- Backend: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`

### Environment Configuration

For production:

```
VITE_API_URL=https://traffic-accident-analysis-izr7.onrender.com
```

The OpenWeather API key must be stored as a backend environment variable:

```
OPENWEATHER_API_KEY=your_key_here
```

> **Never commit private API keys or `.env` files to GitHub.**

---

## ⚠️ Limitations

1. **Class Imbalance** — Minority severity classes remain more difficult to predict.
2. **Macro F1** — A score of 55.24% indicates performance is not uniform across all severity classes.
3. **Geographic Scope** — The model is based on the geographic and historical coverage of the US Accidents dataset.
4. **External Validation** — The FARS comparison was exploratory and did not establish generalization to fatal crashes.
5. **Decision-Support Scope** — The system is a prototype for analytical decision support. It does **not**:
   - Guarantee accident severity
   - Predict exact accident outcomes
   - Directly prevent accidents
   - Detect accidents from CCTV
   - Replace professional traffic-safety analysis
   - Function as an emergency-response system

---

## 🔮 Future Improvements

- Integrate real-time traffic data
- Integrate real-time road-condition data
- Improve minority-class performance using SMOTE, class weighting, advanced resampling, and threshold optimization
- Evaluate additional models such as LightGBM, CatBoost, and ensemble approaches
- Evaluate larger geographic datasets
- Improve geographically aware validation
- Expand external validation
- Add interactive geographic risk visualization
- Explore integration with traffic-management systems
- Add production monitoring for API latency, prediction volume, error rates, and model/data drift

---

## 🛡️ Security Considerations

- Private API keys are stored as environment variables.
- Secrets are not committed to GitHub.
- `.env` files remain excluded via `.gitignore`.
- `VITE_API_URL` is configuration, not a secret.
- The backend keeps private service credentials server-side.

---

## 🧰 Technologies Used

| Category | Technologies |
|---|---|
| Machine Learning | Python, Pandas, NumPy, Scikit-learn, XGBoost, SHAP |
| Spatial Analysis | DBSCAN, BallTree |
| Weather | OpenWeather API |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

---

## 📌 Key Results

| Metric | Value |
|---|:---:|
| Original Dataset | ~7.7 million records |
| Selected Subset | 300,000 records |
| Final Processed Dataset | 299,794 records |
| Base Features | 47 |
| Spatial Features | 5 |
| Final Model Features | 52 |
| Selected Model | Optimized XGBoost |
| Test Accuracy | 87.31% |
| Test Weighted F1 | 86.19% |
| Test Macro F1 | 55.24% |
| Balanced Accuracy | 49.54% |
| Log Loss | 0.3301 |
| Automated Tests | 18/18 passed |
| Inference Consistency | 5,000/5,000 |
| Spatial Reproducibility | 5,000/5,000 |

---

## ⭐ Project Highlights

```
Historical Accident Data
          ↓
Random 300K Subset
          ↓
Preprocessing
          ↓
Feature Engineering
          ↓
Leakage-Free Spatial Intelligence
          ↓
DBSCAN + BallTree
          ↓
52 Model Features
          ↓
XGBoost
          ↓
SHAP Explainability
          ↓
FastAPI
          ↓
React Dashboard
          ↓
Vercel + Render
```

This project demonstrates an end-to-end machine-learning workflow with emphasis on:

Accident severity prediction · Spatial intelligence · Live weather enrichment · Leakage prevention · Explainability · Automated validation · Reproducible inference · Frontend/backend integration · Cloud deployment

---

## 📚 References

- Chen, T. & Guestrin, C. — *XGBoost*
- Lundberg, S. M. & Lee, S.-I. — *SHAP / model explainability*
- Ester, M. et al. — *DBSCAN*
- NHTSA — *Fatality Analysis Reporting System (FARS)*
- OpenWeather API
- US Accidents dataset

---

## ⚖️ Project Positioning

This project is an **AI/ML research and analytics prototype** for accident severity decision support.

Its predictions represent patterns learned from historical data and should not be interpreted as deterministic or causal conclusions. The current system is intended for demonstration and analytical use — broader geographic validation, improved minority-class performance, additional real-time data sources, and expanded external validation would be required before operational deployment.
