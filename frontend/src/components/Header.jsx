import React from 'react';
import { ShieldCheck, XCircle } from 'lucide-react';

export default function Header({ health }) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Traffic Accident Severity Predictor
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-800">
                  v2.0
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                AI-powered traffic accident severity prediction using leakage-free machine learning and spatial hotspot analysis.
              </p>
            </div>
          </div>
          
          <div className="mt-5 md:mt-0 flex flex-col items-start md:items-end space-y-3">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>XGBoost Optimized</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>52 Features</span>
              </div>
            </div>
            <div className={`flex items-center space-x-2 rounded-full px-3 py-1 border ${isHealthy ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-rose-950/30 border-rose-900/50'}`}>
              {isHealthy ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">API Online</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-400 tracking-wide uppercase">API Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
