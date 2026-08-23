import React from 'react';
import { Target, CheckCircle, Activity, BrainCircuit, Trophy, AlertTriangle } from 'lucide-react';

export default function ModelIntelligenceSection() {
  return (
    <section id="model" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Model Intelligence & Comparison</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            The prediction engine uses an Optimized XGBoost classifier trained on a 52-dimensional feature space derived from a leakage-free spatial architecture.
          </p>
        </div>

        {/* Final Performance Hero */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          <div className="relative z-10 text-center mb-10">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center justify-center">
              <Trophy className="w-4 h-4 mr-2" />
              XGBoost Optimized — Final Held-Out Test
            </h3>
          </div>
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">87.31%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Test Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">86.19%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Weighted F1</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">55.24%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Macro F1</div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">49.54%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Balanced Accuracy</div>
            </div>
          </div>
        </div>

        {/* Model Selection Methodology */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">?</span>
            Why XGBoost?
          </h3>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-700 leading-relaxed mb-4">
              XGBoost achieved the highest cross-validation weighted F1 (85.91% vs 82.52%) and delivered stronger held-out test performance (86.19% vs 82.63% weighted F1).
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-sm font-medium text-slate-500 text-center">
                Model selection was finalized using cross-validation before the held-out test set was evaluated. The test set was not used to select or tune the final model.
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Random Forest Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <BrainCircuit className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Random Forest (Optimized)</h3>
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Evaluated Candidate</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Model Selection Metric</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-medium">CV Weighted F1</span>
                  <span className="font-bold text-slate-900 text-lg">82.52%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Final Held-Out Test Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Test Accuracy</span>
                    <span className="font-bold text-slate-900">85.08%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Test Weighted F1</span>
                    <span className="font-bold text-slate-900">82.63%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Test Macro F1</span>
                    <span className="font-bold text-slate-900">42.44%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Balanced Accuracy</span>
                    <span className="font-bold text-slate-900">38.58%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XGBoost Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col border border-slate-800">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 text-white/5">
              <BrainCircuit className="w-48 h-48" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-900/50">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">XGBoost (Optimized)</h3>
                  <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" /> Selected Model
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Model Selection Metric</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">CV Weighted F1</span>
                  <span className="font-bold text-blue-400 text-lg">85.91%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Final Held-Out Test Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Test Accuracy</span>
                    <span className="font-bold text-white">87.31%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Test Weighted F1</span>
                    <span className="font-bold text-white">86.19%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Test Macro F1</span>
                    <span className="font-bold text-white">55.24%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Balanced Accuracy</span>
                    <span className="font-bold text-white">49.54%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Limitation Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start">
          <AlertTriangle className="w-6 h-6 text-amber-600 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 mb-2">Model Limitation</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              Weighted F1 (86.19%) is substantially higher than Macro F1 (55.24%) because the model performs much better on the majority severity class than on minority classes. Macro F1 gives each severity class equal weight and therefore exposes weaker minority-class performance.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
