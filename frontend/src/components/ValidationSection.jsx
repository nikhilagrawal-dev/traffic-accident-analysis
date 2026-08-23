import React from 'react';
import { ShieldCheck, Database, Check, AlertTriangle } from 'lucide-react';

export default function ValidationSection() {
  const checks = [
    "Leakage Audit",
    "Spatial Reproducibility",
    "Train/Inference Consistency",
    "Model Compatibility",
    "SHAP Validation",
    "API Validation",
    "Schema Validation",
    "Inference Verification"
  ];

  return (
    <section id="validation" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Trust & Validation</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            The platform is built on rigorous verification protocols to ensure mathematical reproducibility between the training laboratory and production inference.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Engineering Validation */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center mb-6">
              <div className="bg-emerald-100 p-2.5 rounded-xl mr-4 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Engineering Validation</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              On a deterministic verification sample of 5,000 rows, production inference reproduced the exact same 52-feature representation as the stored training preprocessing output.
            </p>

            <div className="bg-slate-900 rounded-2xl p-6 text-white mb-8 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                <span className="text-slate-400 font-medium">Exact Feature Matches</span>
                <span className="text-2xl font-bold text-emerald-400">5,000 / 5,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Maximum Absolute Error</span>
                <span className="text-2xl font-mono text-blue-400">0.0</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
              {checks.map((check, idx) => (
                <div key={idx} className="flex items-center text-sm font-medium text-slate-700">
                  <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                  {check}
                </div>
              ))}
            </div>
          </div>

          {/* External FARS Validation */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="bg-amber-100 p-2.5 rounded-xl mr-4 text-amber-700">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">FARS External Comparison</h3>
            </div>
            
            <div className="inline-flex self-start px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-6">
              Status: Exploratory / Partial
            </div>

            <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
              An external comparison with FARS found lower fatal-crash enrichment within the identified DBSCAN hotspot regions than the random baseline. This result is a boundary condition, not evidence that the model generalizes to fatal-crash concentration.
            </p>

            <a href="#data-credibility" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Read the full external validation analysis &rarr;
            </a>
          </div>

        </div>

        {/* Limitations Notice */}
        <div className="mt-12 bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center text-left">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-2">System Limitations</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              This platform is a <strong>decision-support and analytical demonstration system</strong>. It is not an emergency response system, a causal inference engine, a replacement for professional crash investigation, or a guarantee of accident outcomes. Predictions represent historical probabilistic associations.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
