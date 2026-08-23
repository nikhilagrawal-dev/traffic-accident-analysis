import React from 'react';
import { Target, Map, BrainCircuit, Activity } from 'lucide-react';

export default function HeroSection() {
  return (
    <section id="overview" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-3xl"></div>
        <div className="absolute top-[60%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold tracking-wide uppercase mb-6">
            <span className="flex h-2 w-2 relative mr-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            XGBoost Optimized Model Active
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Traffic Accident <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            An explainable machine-learning system that combines environmental, temporal, infrastructure, and leakage-free spatial features to estimate accident severity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#analyze" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-0.5">
              Analyze an Accident
            </a>
            <a href="#pipeline" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all">
              See How It Works
            </a>
          </div>
        </div>

        {/* Capability Badges */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Target className="w-8 h-8 text-rose-400 mb-3" />
            <span className="text-slate-200 font-semibold text-sm">Severity Prediction</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Map className="w-8 h-8 text-blue-400 mb-3" />
            <span className="text-slate-200 font-semibold text-sm">Spatial Hotspot Analysis</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center text-center">
            <BrainCircuit className="w-8 h-8 text-emerald-400 mb-3" />
            <span className="text-slate-200 font-semibold text-sm">Explainable AI</span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Activity className="w-8 h-8 text-amber-400 mb-3" />
            <span className="text-slate-200 font-semibold text-sm">52-Feature Intelligence</span>
          </div>
        </div>
      </div>
    </section>
  );
}
