# 🚦 Traffic Accident Intelligence Platform

An end-to-end machine learning platform for **traffic accident severity prediction, spatial intelligence, explainable AI, and external validation**.

The project combines historical traffic accident data, leakage-free spatial feature engineering using **DBSCAN and BallTree**, machine learning model selection, **XGBoost severity prediction**, SHAP explainability, FastAPI inference, and a production-style React dashboard.

The platform is designed not only to make predictions, but also to explain **how the prediction pipeline works, how spatial information is derived, how leakage is prevented, and where the model's limitations lie**.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.x-blue" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/XGBoost-Model-orange" alt="XGBoost">
  <img src="https://img.shields.io/badge/Tests-Passing-brightgreen" alt="Tests">
</p>

---

## 📚 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Technical Contribution](#-key-technical-contribution)
- [Leakage Prevention](#-leakage-prevention)
- [Dataset](#-dataset)
- [Data Credibility & FARS External Comparison](#-data-credibility--fars-external-comparison)
- [Machine Learning](#-machine-learning)
- [Final Model — XGBoost Optimized](#-final-model)
- [Random Forest Comparison](#-random-forest-comparison)
- [Model Limitation](#️-model-limitation)
- [Severity Classes](#-severity-classes)
- [Explainable AI — SHAP](#-explainable-ai--shap)
- [Spatial Intelligence](#️-spatial-intelligence)
- [Web Application](#️-web-application)
- [Frontend User Experience](#-frontend-user-experience)
- [Validation & Reproducibility](#-validation--reproducibility)
- [Responsive Design](#-responsive-design)
- [Notebook Pipeline](#-notebook-pipeline)
- [Project Structure](#-project-structure)
- [Technology Stack](#️-technology-stack)
- [Installation](#️-installation)
- [Running the Backend](#️-running-the-backend)
- [Running the Frontend](#️-running-the-frontend)
- [Running Tests](#-running-tests)
- [Important Model Limitations](#️-important-model-limitations)
- [Scientific Boundaries](#-scientific-boundaries)
- [Final Results at a Glance](#-final-results-at-a-glance)
- [What Makes This Project Different](#-what-makes-this-project-different)

---

## 📌 Project Overview

Traffic accident severity is influenced by multiple interacting factors including:

- Geographic location
- Weather conditions
- Road infrastructure
- Time of day
- Traffic conditions
- Visibility
- Environmental conditions

A simple classification model can learn these relationships, but spatial features introduce an important challenge: **data leakage**.

If accident hotspots are calculated using the complete dataset before train/test splitting, information from the test set can indirectly influence the training features. This project addresses that problem through a **leakage-free spatial preprocessing pipeline**.

The final system performs:

```text
Accident Data
      ↓
Data Understanding & EDA
      ↓
Preprocessing & Feature Engineering
      ↓
Training-Only Spatial Artifacts
      ↓
DBSCAN + BallTree Spatial Assignment
      ↓
47 Input Features + 5 Spatial Features
      ↓
52 Model Features
      ↓
Random Forest / XGBoost Model Selection
      ↓
XGBoost Final Model
      ↓
FastAPI Inference API
      ↓
React Intelligence Dashboard
      ↓
Prediction + Probability + Spatial Analysis + SHAP
```

---

## 🎯 Objectives

The project aims to:

1. Analyze historical traffic accident data.
2. Understand temporal, weather, infrastructure, and geographic patterns.
3. Detect accident hotspots using DBSCAN.
4. Build leakage-free spatial features for machine learning.
5. Compare Random Forest and XGBoost models.
6. Select the final model using cross-validation.
7. Evaluate the selected model on a held-out test set.
8. Explain individual predictions using SHAP.
9. Provide spatial intelligence alongside severity predictions.
10. Perform exploratory external comparison using FARS.
11. Provide a production-style web interface for interactive analysis.
12. Validate inference reproducibility against the training pipeline.

---

## 🧠 Key Technical Contribution

### Leakage-Free Spatial Intelligence

The most important methodological component of the project is the treatment of spatial features.

Instead of calculating spatial information independently using the entire dataset, the project creates canonical spatial artifacts from the **training data only**. At inference time, new accident coordinates are projected onto these precomputed spatial structures.

**Spatial pipeline**

```text
Training Coordinates
        ↓
      DBSCAN
        ↓
Training Spatial Clusters
        ↓
      BallTree
        ↓
Canonical Spatial Assignment
        ↓
Saved Spatial Artifacts
        ↓
Inference Coordinates
        ↓
Spatial Feature Generation
```

Five spatial features are generated by the backend:

| # | Feature |
|---|---------|
| 1 | `Local_Accident_Density` |
| 2 | `Hotspot_Flag` |
| 3 | `Noise_Flag` |
| 4 | `Cluster_Size` |
| 5 | `Distance_To_Cluster_Center` |

The five spatial features are **not** manually entered by the user — they are generated automatically by the backend inference pipeline.

```text
47 Form Input Features
        +
5 Backend-Derived Spatial Features
        =
52 Total Model Features
```

---

## 🔐 Leakage Prevention

The project explicitly prevents spatial and preprocessing leakage through:

- Spatial artifacts derived from training data.
- Canonical DBSCAN/BallTree assignment.
- `Hotspot_Label` excluded from model features.
- Frequency encoders fitted using training data only.
- Unseen test categories encoded safely.
- Test set held out for final evaluation.
- Production inference reproducing the training transformation.
- Deterministic preprocessing artifacts.

**Production inference transformation verified against the training transformation:**

| Metric | Result |
|---|---|
| Total rows | 5,000 |
| Fully matching rows | 5,000 |
| Mismatching rows | 0 |
| Maximum absolute feature difference | 0.0 |
| Mean absolute feature difference | 0 |

---

## 📊 Dataset

The project uses the **US Accidents dataset**, distributed through Kaggle.

Kaggle serves as the distribution platform; the underlying dataset consists of real-world traffic accident records aggregated from transportation and traffic-related sources across the United States.

**Final leakage-free dataset scale:** `299,794 records`

The project does not treat the dataset as a perfect or universally representative source. Instead, it subjects its spatial assumptions to an additional external comparison using FARS.

---

## 🌎 Data Credibility & FARS External Comparison

To avoid relying solely on internal train/test metrics, the project performed an exploratory external comparison against:

> **FARS — Fatality Analysis Reporting System**
> A federal fatal-crash dataset maintained by the National Highway Traffic Safety Administration (NHTSA).

**Status:** `EXPLORATORY / PARTIAL EXTERNAL VALIDATION`

**Finding:** Lower fatal-crash enrichment inside the identified DBSCAN hotspot regions than the random baseline.

This result is treated as a **boundary condition**, not as a successful validation claim. It does **not** establish that:

- The model generalizes to fatal crashes.
- Spatial features cause accident severity.
- The source dataset is universally reliable.
- DBSCAN hotspots represent concentrations of fatal crashes.

The result is nevertheless useful because it demonstrates that the project's spatial assumptions were subjected to an independent external comparison rather than being judged only by internal model metrics.

---

## 🤖 Machine Learning

Two model families were evaluated:

- Random Forest
- XGBoost

Model selection was based on **cross-validation weighted F1**, before the held-out test set was evaluated.

### Model Selection

| Model | CV Weighted F1 |
|---|---|
| Random Forest (Optimized) | 82.52% |
| **XGBoost (Optimized)** | **85.91%** |

XGBoost achieved the higher cross-validation weighted F1 and was selected as the final model.

---

## 🏆 Final Model

### XGBoost Optimized

**Final Held-Out Test Performance**

| Metric | Result |
|---|---|
| Test Accuracy | 87.31% |
| Test Weighted F1 | 86.19% |
| Test Macro F1 | 55.24% |
| Balanced Accuracy | 49.54% |
| Log Loss | 0.3301 |

**Confirmatory 5-Fold CV**

- Mean Weighted F1: **86.15%**
- Std: **0.07%**

Fold scores: `0.8609` · `0.8619` · `0.8617` · `0.8625` · `0.8604`

---

## 🌲 Random Forest Comparison

Random Forest was evaluated as a competing model.

| Metric | Random Forest |
|---|---|
| CV Weighted F1 | 82.52% |
| Test Accuracy | 85.08% |
| Test Weighted F1 | 82.63% |
| Test Macro F1 | 42.44% |
| Balanced Accuracy | 38.58% |
| Log Loss | 0.3842 |

**Why XGBoost?**

| | XGBoost | Random Forest |
|---|---|---|
| CV Weighted F1 | 85.91% | 82.52% |
| Test Weighted F1 | 86.19% | 82.63% |

XGBoost was selected based on stronger cross-validation performance and subsequently demonstrated stronger held-out test performance.

---

## ⚠️ Model Limitation

The difference between Weighted F1 and Macro F1 is important.

**For XGBoost:**

- Weighted F1 = 86.19%
- Macro F1 = 55.24%

Weighted F1 is substantially higher because the dataset is highly imbalanced toward the majority severity class. Macro F1 gives every severity class equal importance and therefore exposes weaker performance on minority severity classes.

Similarly, **Balanced Accuracy is 49.54%**.

These metrics are reported explicitly rather than hiding the minority-class limitation behind overall accuracy.

---

## 🧩 Severity Classes

The model predicts four accident severity classes:

| Class | Meaning |
|---|---|
| Severity 1 | Lowest |
| Severity 2 | Moderate |
| Severity 3 | Severe |
| Severity 4 | Highest |

The exact severity meaning is treated as an **ordinal class label** rather than a causal interpretation.

---

## 🔍 Explainable AI — SHAP

The project integrates **SHAP (SHapley Additive exPlanations)** to explain model predictions.

SHAP is used to answer: *Which features contributed most to this model prediction?*

The platform displays:

- Top feature contributions
- Positive contributions
- Negative contributions
- Feature importance for individual predictions
- Human-readable feature names

**Example features include:**
Longitude · Incident Duration · Distance to Cluster Center · Temperature · Month · Weather Severity · Traffic Infrastructure

**Important limitation:** SHAP values represent model *association*, not causation. A positive SHAP value means that a feature contributed toward the model's prediction — it does not mean that the feature *caused* the accident or caused its severity.

---

## 🗺️ Spatial Intelligence

The dashboard exposes the spatial reasoning performed by the backend.

**Spatial workflow:**

```text
Coordinates
     ↓
DBSCAN Spatial Structure
     ↓
BallTree Projection
     ↓
Spatial Assignment
     ↓
5 Derived Features
```

**The dashboard displays:**

- Local Accident Density
- Hotspot Status
- Noise Status
- Cluster Size
- Distance to Cluster Center

These values are generated by the backend and are not user-entered features.

---

## 🖥️ Web Application

### Backend — FastAPI

Responsible for:

- Model loading
- Input validation
- Spatial feature generation
- Feature transformation
- Model inference
- Probability generation
- SHAP explanation
- Spatial information
- Health checks

### Frontend — React + Vite

Responsible for:

- Interactive analysis workflow
- Input collection
- Prediction visualization
- Probability charts
- SHAP visualization
- Spatial intelligence display
- Model information
- Data credibility information
- Validation information
- Responsive design

**Visualization stack:** Recharts · Lucide React · Tailwind CSS

---

## 🧭 Frontend User Experience

The dashboard is structured as a **storytelling platform** rather than a simple prediction form.

1. **Hero** — Introduces the Traffic Accident Intelligence platform and highlights the final model performance.
2. **Problem** — Explains why accident severity and spatial patterns require more than simple classification.
3. **Pipeline** — Shows the complete machine learning workflow.
4. **Spatial Intelligence** — Explains DBSCAN, BallTree, and the leakage-free spatial feature generation process.
5. **Data Credibility & External Validation** — Explains dataset provenance, why external comparison was performed, FARS methodology, exploratory findings, and model boundaries.
6. **Analyze** — Provides a guided five-step workflow:

   ```text
   Location → Weather → Infrastructure → Time → Environmental Flags
   ```

7. **Prediction Report** — Displays predicted severity, confidence, four-class probability distribution, spatial hotspot information, and SHAP explanation.
8. **Model Intelligence** — Displays Random Forest comparison, XGBoost performance, cross-validation metrics, held-out test metrics, model selection reasoning, and class imbalance limitation.
9. **Trust & Validation** — Displays leakage prevention, reproducibility, inference consistency, FARS external comparison summary, and system limitations.

---

## 🔬 Validation & Reproducibility

The final system has been extensively tested.

**API Tests (pytest)**
```text
9 passed
```

**Inference Consistency**

| Metric | Result |
|---|---|
| Total rows | 5,000 |
| Fully matching rows | 5,000 |
| Mismatching rows | 0 |
| Maximum absolute feature difference | 0.0 |

**Spatial Reproducibility**

| Feature | Matches |
|---|---|
| `Local_Accident_Density` | 5000 / 5000 |
| `Hotspot_Flag` | 5000 / 5000 |
| `Noise_Flag` | 5000 / 5000 |
| `Cluster_Size` | 5000 / 5000 |
| `Distance_To_Cluster_Center` | 5000 / 5000 |

Maximum absolute error: `2.39e-12`

**Frontend Build**
```text
npm run build
✓ Vite production build successful
✓ 2444 modules transformed
```

**End-to-End Browser Testing**

The application was tested through automated browser workflows covering:

- Application startup
- Navigation
- Five-step prediction workflow
- Multiple predictions
- Reset functionality
- API communication
- Probability visualization
- SHAP visualization
- Spatial information
- Error handling
- Responsive layouts
- Console errors
- Network failures

**Final E2E result:**
```text
Prediction 1 successful → Reset PASS
Prediction 2 successful → Reset PASS
Prediction 3 successful → Reset PASS

ALL TESTS PASSED
```

---

## 📱 Responsive Design

The application was tested at:

| Resolution | Device |
|---|---|
| 1440 × 900 | Desktop |
| 1024 × 768 | Laptop |
| 768 × 1024 | Tablet |
| 375 × 812 | Mobile |

**Verified:**

- No horizontal overflow
- Responsive cards
- Responsive charts
- Mobile navigation
- Usable prediction workflow
- Correct result layout
- No clipped SHAP labels
- No unexplained large whitespace

---

## 📓 Notebook Pipeline

The project follows a sequential data science workflow.

| Stage | Purpose |
|---|---|
| 01 | Data Understanding |
| 02 | Exploratory Data Analysis |
| 03 | Data Preprocessing |
| 04 | Feature Engineering |
| 05 | DBSCAN Hotspot Detection |
| 06A | Leakage-Free ML Data Preparation |
| 06B | Model Training & Selection |
| 07 | Advanced Model Evaluation |
| 08 | SHAP Explainability |
| 09 | Final Validation & Readiness |

The notebooks are located in `notebooks/`.

---

## 📁 Project Structure

```text
traffic-accident-analysis/
│
├── app/
│   ├── main.py
│   ├── inference.py
│   └── schemas.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.*
│   └── test-e2e.js
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
│   ├── 08_*.ipynb
│   └── 09_*.ipynb
│
├── models/
│   ├── best_model_leakage_free.pkl
│   ├── random_forest_model_leakage_free.pkl
│   ├── model_metadata_leakage_free.json
│   └── training_report_leakage_free.json
│
├── artifacts/
│   ├── feature_list.json
│   ├── feature_schema.json
│   ├── frequency_encoders.pkl
│   ├── X_train_leakage_free.csv
│   ├── X_test_leakage_free.csv
│   ├── fars_hotspot_validation.csv
│   └── ...
│
├── scripts/
│   ├── verify_inference_api.py
│   ├── verify_spatial_reproducibility.py
│   └── verify_test_transformation.py
│
├── tests/
│   ├── test_api.py
│   └── test_inference.py
│
├── requirements.txt
├── .gitignore
└── README.md
```

> Large model and artifact files are intentionally excluded from source control where appropriate.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Language | Python |
| Data Processing | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Gradient Boosting | XGBoost |
| Explainable AI | SHAP |
| Spatial ML | DBSCAN |
| Spatial Search | BallTree |
| Backend | FastAPI |
| API Server | Uvicorn |
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Pytest |
| E2E Testing | Puppeteer |
| Version Control | Git |

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nikhilagrawal-dev/traffic-accident-analysis.git
cd traffic-accident-analysis
```

### 2. Create Virtual Environment

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

### 3. Install Python Dependencies

```bash
python -m pip install -r requirements.txt
```

---

## ▶️ Running the Backend

From the project root:

```bash
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

| Resource | URL |
|---|---|
| API | `http://127.0.0.1:8000` |
| Health Check | `http://127.0.0.1:8000/health` |
| Swagger Documentation | `http://127.0.0.1:8000/docs` |
| Prediction Endpoint | `POST /predict` |

---

## ▶️ Running the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will normally run at `http://localhost:5173`.

The frontend communicates with the FastAPI backend running on port `8000`.

---

## 🧪 Running Tests

> Activate the virtual environment first.

**Pytest**
```bash
.venv/bin/python -m pytest -q
```

**Inference Consistency**
```bash
.venv/bin/python scripts/verify_inference_api.py
```

**Spatial Reproducibility**
```bash
.venv/bin/python scripts/verify_spatial_reproducibility.py
```

**Test Transformation Verification**
```bash
.venv/bin/python scripts/verify_test_transformation.py
```

**Frontend Production Build**
```bash
cd frontend
npm run build
```

---

## ⚠️ Important Model Limitations

This system is a **machine learning research and analytics platform**.

**It is not:**

- An emergency response system.
- A traffic control system.
- A causal inference engine.
- A guarantee of accident severity.
- A system for predicting fatal crashes.
- A substitute for professional traffic-safety analysis.

Predictions should therefore be interpreted as model outputs based on learned historical patterns, not deterministic outcomes.

---

## 🔬 Scientific Boundaries

Several limitations are intentionally disclosed:

**Class Imbalance**
The majority severity class dominates the dataset, resulting in a substantial difference between Weighted F1 and Macro F1.

**Spatial Generalization**
The FARS external comparison found lower fatal-crash enrichment within DBSCAN hotspot regions than the random baseline. Therefore, the spatial hotspot representation should not automatically be interpreted as a representation of fatal-crash concentration.

**SHAP Interpretation**
SHAP explains model associations and contributions. It does not establish causal relationships.

**Dataset Provenance**
The dataset is distributed through a public platform. External comparison was therefore included as an additional analytical check rather than assuming universal reliability.

---

## 📈 Final Results at a Glance

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           XGBOOST OPTIMIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Accuracy              87.31%
Test Weighted F1            86.19%
Test Macro F1                55.24%
Balanced Accuracy            49.54%
5-Fold CV Weighted F1       86.15% ± 0.07%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

47 Input Features
        +
5 Backend-Derived Spatial Features
        =
52 Model Features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚀 What Makes This Project Different?

This project goes beyond simply training a classifier.

1. **Leakage-Free Spatial ML** — Spatial information is generated using training-derived DBSCAN/BallTree artifacts rather than recomputing spatial relationships using the complete dataset.
2. **Model Selection Discipline** — Random Forest and XGBoost were compared using cross-validation before final held-out evaluation.
3. **Explainable Predictions** — Every prediction can be accompanied by SHAP feature contributions.
4. **Spatial Intelligence** — Predictions incorporate five backend-derived spatial features describing local accident structure.
5. **External Comparison** — The project performs an exploratory comparison against FARS and reports the unfavorable finding transparently.
6. **Reproducible Inference** — The production transformation was tested against the training transformation across 5,000 deterministic samples with zero feature mismatch.
7. **Production-Style Interface** — The final React dashboard turns the underlying ML pipeline into an interactive intelligence platform rather than exposing only a raw prediction endpoint.

---

