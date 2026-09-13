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
import { checkHealth, predictByCity } from './services/api';
import { AlertTriangle, CloudSun, LayoutDashboard, Sparkles } from 'lucide-react';

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
      const prediction = await predictByCity(formData);
      setResult(prediction);
      
      // Scroll to results smoothly
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error("Prediction failed:", err);
      const message = err?.message || '';
      if (message.includes('Live weather unavailable')) {
        setError("Live weather data is temporarily unavailable. Please try again shortly.");
      } else if (err.response?.status === 503) {
        setError("Prediction server unavailable. The inference pipeline may not be loaded.");
      } else if (err.response?.status === 422) {
        setError("Validation error. Please check your inputs.");
      } else if (!err.response) {
        setError("We could not complete the analysis right now. Please try again shortly.");
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
        <section id="analyze" className="py-16 sm:py-24 bg-slate-100 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                <Sparkles className="h-3.5 w-3.5" /> Live ML analysis
              </div>
              <h2 className="mt-4 text-3xl font-bold text-slate-950 tracking-tight sm:text-4xl">Traffic Accident Severity Analysis</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Enter a city to combine current environmental conditions with the trained severity model.
              </p>
              <p className="mt-2 text-sm text-slate-400 italic">
                This is an estimated severity under current conditions, based on historical patterns—not a guaranteed future outcome.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-8 flex max-w-5xl mx-auto items-start rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
                <AlertTriangle className="mr-3 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Analysis unavailable</p>
                  <p className="mt-1 text-sm text-amber-800">{error}</p>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-8 max-w-6xl mx-auto ${result ? 'xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]'}`}>
              <div>
                <AnalysisWizard
                  onSubmit={handlePredict}
                  onReset={() => { setResult(null); setError(null); }}
                  isLoading={isLoading}
                />
              </div>
              <div className="space-y-6">
                {result ? (
                  <div id="results-section" className="scroll-mt-24">
                    <PredictionResult result={result} />
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-blue-500">
                      {isLoading ? <CloudSun className="h-10 w-10 animate-pulse" /> : <LayoutDashboard className="h-10 w-10" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{isLoading ? 'Analyzing current conditions…' : 'Ready to analyze'}</h3>
                    <p aria-live="polite" className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                      {isLoading
                        ? 'Retrieving live conditions, aligning city-local time, and estimating severity.'
                        : 'Enter a city to see a live-context severity estimate and its model explanation.'}
                    </p>
                  </div>
                )}
                <SystemStatus health={health} result={result} />
              </div>
            </div>

            {result && (
              <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProbabilityChart probabilities={result.probabilities} />
                <SpatialInfo spatialInfo={result.spatial_information} />
              </div>
            )}

            {result && result.shap_explanation && (
              <div className="max-w-6xl mx-auto mt-8">
                <SHAPExplanation shapData={result.shap_explanation} />
              </div>
            )}
          </div>
        </section>

        <ProblemSection />
        <PipelineSection />
        <SpatialIntelligenceSection />
        <DataCredibilitySection />
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
