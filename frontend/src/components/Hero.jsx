import React from 'react';
import { Target, Activity, CheckCircle, Database } from 'lucide-react';

export default function Hero() {
  const stats = [
    { label: "Test Accuracy", value: "87.31%", icon: Target },
    { label: "Weighted F1", value: "86.19%", icon: Activity },
    { label: "CV Weighted F1", value: "86.13%", icon: CheckCircle },
    { label: "Features", value: "52", icon: Database },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="px-6 py-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Accident Analysis Dashboard
          </h2>
          <p className="mt-4 text-slate-600 text-lg leading-relaxed">
            Predict accident severity using environmental, road, temporal, and spatial conditions. The underlying model is optimized with leakage-free spatial features.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto flex-shrink-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-start justify-center">
              <div className="flex items-center text-blue-600 mb-2">
                <stat.icon className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
