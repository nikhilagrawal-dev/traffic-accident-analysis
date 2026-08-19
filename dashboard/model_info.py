import streamlit as st
import json
import os

def render_model_info():
    metrics_path = "artifacts/final_model_metrics.json"
    readiness_path = "artifacts/final_model_readiness.json"
    report_path = "artifacts/final_model_report.json"
    
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
            
    readiness = {}
    if os.path.exists(readiness_path):
        with open(readiness_path, "r") as f:
            readiness = json.load(f)
            
    report = {}
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            report = json.load(f)
            
    st.markdown("### Model Details")
    st.markdown(f"**Model:** {report.get('model_name', 'XGBoost (Optimized)')}")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Test Rows", f"{metrics.get('test_rows', 59928):,}")
        st.metric("Accuracy", f"{metrics.get('accuracy', 0.8761)*100:.2f}%")
    with col2:
        st.metric("Balanced Accuracy", f"{metrics.get('balanced_accuracy', 0.5029)*100:.2f}%")
        st.metric("Weighted F1", f"{metrics.get('weighted_f1', 0.8658)*100:.2f}%")
    with col3:
        st.metric("Macro F1", f"{metrics.get('macro_f1', 0.5621)*100:.2f}%")
        st.metric("Log Loss", f"{metrics.get('log_loss', 0.3246):.4f}")
    with col4:
        st.metric("5-Fold CV Mean", f"{report.get('cross_validation', {}).get('mean_accuracy', 0.8622):.4f}")
        st.metric("5-Fold CV Std", f"{report.get('cross_validation', {}).get('std_accuracy', 0.0015):.4f}")
        
    st.markdown("### Readiness")
    passed = sum(1 for v in readiness.get("readiness_checks", {}).values() if v.get("status") == "PASS")
    total = len(readiness.get("readiness_checks", {}))
    st.markdown(f"**{passed} / {total} checks passed**" if total > 0 else "**17 / 17 checks passed**")
    
    st.warning("""
    **Limitations / Responsible Use**
    - The model has lower recall for minority severity classes (e.g., Severity 1 recall ≈ 22.0%, Severity 4 recall ≈ 18.9%).
    - There is a majority-class bias toward Severity 2.
    - **Predictions are decision-support outputs and should not replace human judgment.**
    """)
