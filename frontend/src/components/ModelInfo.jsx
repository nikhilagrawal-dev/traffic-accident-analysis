import React from 'react';
import { Database, Layers, CheckSquare } from 'lucide-react';

export default function ModelInfo() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-600" />
          Model Information
        </h2>
      </div>
      <div className="p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium text-slate-500">Model</dt>
            <dd className="mt-1 text-sm text-slate-900 font-semibold">XGBoost (Optimized)</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Training Approach</dt>
            <dd className="mt-1 text-sm text-slate-900 font-semibold">Leakage-free spatial preprocessing</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Features</dt>
            <dd className="mt-1 text-sm text-slate-900 font-semibold">52</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Prediction Classes</dt>
            <dd className="mt-1 text-sm text-slate-900 font-semibold">4</dd>
          </div>
          <div className="sm:col-span-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Verified Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-xs text-slate-500">CV Weighted F1</dt>
                <dd className="mt-1 text-sm text-slate-900 font-medium">0.8613</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Test Accuracy</dt>
                <dd className="mt-1 text-sm text-emerald-600 font-medium">0.8731</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Test Weighted F1</dt>
                <dd className="mt-1 text-sm text-emerald-600 font-medium">0.8619</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Test Macro F1</dt>
                <dd className="mt-1 text-sm text-slate-900 font-medium">0.5524</dd>
              </div>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
