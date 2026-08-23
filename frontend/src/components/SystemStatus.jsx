import React from 'react';
import { Server, Cpu, Database, Network, TrendingUp, CheckCircle } from 'lucide-react';

export default function SystemStatus({ health, result }) {
  const isHealthy = health?.status === 'healthy';
  const pipelineLoaded = health?.pipeline_loaded;

  const StatusRow = ({ icon: Icon, label, active, pulseColor }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center text-slate-600">
        <Icon className="w-4 h-4 mr-3 text-slate-400" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center">
        {active ? (
          <>
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ready</span>
          </>
        ) : (
          <>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 mr-2"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Waiting</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center">
        <div className="bg-blue-100 p-1.5 rounded-lg mr-3 text-blue-600">
          <Server className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">System Status</h2>
      </div>
      <div className="px-6 py-2">
        <StatusRow icon={Network} label="Backend Server" active={isHealthy} pulseColor="emerald" />
        <StatusRow icon={Cpu} label="Inference Pipeline" active={pipelineLoaded} pulseColor="emerald" />
        <StatusRow icon={Database} label="Spatial Artifacts" active={pipelineLoaded} pulseColor="blue" />
        <StatusRow icon={TrendingUp} label="SHAP Explainer" active={pipelineLoaded} pulseColor="blue" />
      </div>
    </div>
  );
}
