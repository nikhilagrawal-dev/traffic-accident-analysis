# Traffic Accident Severity Predictor

## 1. Project Title & Problem Statement
This project predicts the severity of traffic accidents in the US using a machine learning model. Accurate severity prediction helps emergency responders prioritize resources and optimize traffic routing.

## 2. Objective
To build a robust, leakage-free spatial machine learning pipeline and deploy it behind a FastAPI backend with a modern React dashboard.

## 3. Dataset
The dataset contains US traffic accidents. After preprocessing, the final leakage-free dataset consists of 299,794 rows.

## 4. Data Preprocessing & Feature Engineering
Data cleaning included handling missing values, temporal feature extraction (Hour, Month, Is_Rush_Hour), and weather parsing. Frequency encoding was applied to high-cardinality categoricals.

## 5. Leakage-Free Spatial Methodology
To prevent target leakage, spatial features were built **strictly on the training set**:
- **DBSCAN & BallTree**: DBSCAN was fitted only on training data. A BallTree was constructed to assign inference points to the nearest core training point (max 0.5km distance).
- **Local Accident Density**: Computed exclusively on training data and cached in a lookup dictionary.

## 6. Model Training & Selection
Models tested included Random Forest and XGBoost. **XGBoost (Optimized)** was selected for its superior handling of imbalanced datasets and faster inference.

## 7. Evaluation Metrics
* XGBoost CV Weighted F1: `0.8613 ± 0.0008`
* Final Test Accuracy: `0.8731`
* Final Test Weighted F1: `0.8619`
* Final Test Macro F1: `0.5524`

*Limitation: Due to severe class imbalance, minority classes (Severity 1 & 4) remain challenging to predict accurately, as reflected by the lower Macro F1.*

## 8. SHAP Explainability
A `TreeExplainer` was integrated into the inference API to calculate SHAP values in real-time, explaining the model's feature contributions per prediction.

## 9. Project Architecture
- **Backend**: Python 3, FastAPI, scikit-learn, XGBoost, SHAP
- **Frontend**: React, Vite, Tailwind CSS 4.0, Recharts

## 10. Installation & Startup

### Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## 11. API Usage
**Endpoint**: `POST /predict`
Body requires the 47 base features (spatial features are automatically calculated by the backend).
Set `"explain": true` to receive SHAP feature contributions.

## 12. Future Improvements
- SMOTE or class-weighting fine-tuning for minority classes.
- Real-time weather API integration for live prediction.
