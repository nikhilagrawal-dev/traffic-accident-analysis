import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import PipelineSection from './components/PipelineSection';
import SpatialIntelligenceSection from './components/SpatialIntelligenceSection';
import DataCredibilitySection from './components/DataCredibilitySection';
import AnalysisWizard from './components/AnalysisWizard';
import PredictionResult from './components/PredictionResult';
import ProbabilityChart from './components/ProbabilityChart';
import SpatialInfo from './components/SpatialInfo';
import SHAPExplanation from './components/SHAPExplanation';
import ModelIntelligenceSection from './components/ModelIntelligenceSection';
import ValidationSection from './components/ValidationSection';
import SystemStatus from './components/SystemStatus';
import { checkHealth, predictSeverity } from './services/api';
import { LayoutDashboard } from 'lucide-react';

function App() {
  const [health, setHealth] = useState({ status: 'checking' });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch (err) {
        console.error("Health check failed:", err);
        setHealth({ status: 'unhealthy', pipeline_loaded: false });
      }
    };
    fetchHealth();
  }, []);

  const handlePredict = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const prediction = await predictSeverity(formData);
      setResult(prediction);
      
      // Scroll to results smoothly
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error("Prediction failed:", err);
      if (err.response?.status === 503) {
        setError("Prediction server unavailable. The inference pipeline may not be loaded.");
      } else if (err.response?.status === 422) {
        setError("Validation error. Please check your inputs.");
      } else if (!err.response) {
        setError("Prediction server unavailable. Please start the FastAPI backend and try again.");
      } else {
        setError("Prediction service encountered an error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 selection:bg-blue-200">
      <Navigation />
      
      <main className="flex-grow">
        <HeroSection />
        <ProblemSection />
        <PipelineSection />
        <SpatialIntelligenceSection />
        <DataCredibilitySection />

        <section id="analyze" className="py-24 bg-slate-100 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Analyze an Accident</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Step through the guided workflow to compile an environmental and infrastructure profile. Spatial data will be derived automatically.
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center shadow-sm max-w-5xl mx-auto">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto relative">
              {/* Left Column: Form Wizard */}
              <div className="lg:col-span-7 xl:col-span-8">
                <AnalysisWizard onSubmit={handlePredict} onReset={() => setResult(null)} isLoading={isLoading} />
              </div>
              
              {/* Right Column: Status & Results */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-28 space-y-8">
                  <SystemStatus health={health} result={result} />
                  
                  {result ? (
                    <div id="results-section" className="space-y-6 transition-opacity duration-500 ease-in-out opacity-100">
                      <PredictionResult result={result} />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed p-10 flex flex-col items-center justify-center text-center h-[350px]">
                      <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-300">
                        <LayoutDashboard className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700">Ready to analyze</h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-xs">
                        Complete the workflow and submit to generate the intelligence report.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extended Results: Charts & Spatial Data side-by-side */}
            {result && (
              <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 transition-opacity duration-700 ease-in-out opacity-100">
                <ProbabilityChart probabilities={result.probabilities} />
                <SpatialInfo spatialInfo={result.spatial_information} />
              </div>
            )}

            {/* SHAP section breaks out full width below */}
            {result && result.shap_explanation && (
              <div className="max-w-7xl mx-auto mt-8 transition-opacity duration-700 ease-in-out opacity-100">
                <SHAPExplanation shapData={result.shap_explanation} />
              </div>
            )}
          </div>
        </section>

        <ModelIntelligenceSection />
        <ValidationSection />
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold tracking-widest uppercase text-slate-300 mb-2">Traffic Accident Intelligence</p>
          <p className="text-sm opacity-80 mb-4 max-w-md mx-auto">
            Machine Learning &bull; Spatial Analytics &bull; Explainable AI
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs font-mono text-slate-500 mb-8">
            <span className="px-2 py-1 bg-slate-800 rounded">Python</span>
            <span className="px-2 py-1 bg-slate-800 rounded">XGBoost</span>
            <span className="px-2 py-1 bg-slate-800 rounded">FastAPI</span>
            <span className="px-2 py-1 bg-slate-800 rounded">React</span>
            <span className="px-2 py-1 bg-slate-800 rounded">SHAP</span>
            <span className="px-2 py-1 bg-slate-800 rounded">DBSCAN</span>
            <span className="px-2 py-1 bg-slate-800 rounded">BallTree</span>
          </div>
          <p className="opacity-60 text-xs mb-8">
            Built for analytical demonstration and research purposes.
          </p>
          <div className="flex justify-center space-x-6 text-xs font-semibold text-slate-500">
            <a href="#overview" className="hover:text-blue-400 transition-colors">Overview</a>
            <a href="#pipeline" className="hover:text-blue-400 transition-colors">Architecture</a>
            <a href="#analyze" className="hover:text-blue-400 transition-colors">Analyze</a>
            <a href="#validation" className="hover:text-blue-400 transition-colors">Validation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
