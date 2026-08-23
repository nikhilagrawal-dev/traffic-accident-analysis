import React from 'react';
import { Map, Info, MapPin, Radio, Activity, Target } from 'lucide-react';

export default function SpatialInfo({ spatialInfo }) {
  if (!spatialInfo) return null;

  const metrics = [
    { label: "Local Density", value: spatialInfo.local_accident_density, icon: Activity },
    { label: "Cluster Size", value: spatialInfo.cluster_size, icon: Target },
    { label: "Center Dist.", value: `${spatialInfo.distance_to_cluster_center_km.toFixed(5)} km`, icon: MapPin },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center">
        <div className="bg-blue-100 p-1.5 rounded-lg mr-3 text-blue-600">
          <Map className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Spatial Hotspot Analysis</h2>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center">
              <Radio className="w-4 h-4 mr-2" /> Hotspot Status
            </span>
            {spatialInfo.hotspot_flag === 1 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 shadow-sm border border-rose-200">
                DETECTED
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600 shadow-sm border border-slate-300">
                NONE
              </span>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Noise Status
            </span>
            {spatialInfo.noise_flag === 1 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
                NOISE
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200">
                CLUSTERED
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <m.icon className="w-4 h-4 text-blue-500 mb-1.5" />
              <span className="text-xl font-bold text-slate-800">{m.value}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase text-center mt-1">{m.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-auto p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-800 flex items-start leading-relaxed">
            <Info className="w-4 h-4 mr-2.5 flex-shrink-0 text-blue-500 mt-0.5" />
            <span>Derived automatically from the leakage-free spatial pipeline mapping to canonical training artifacts.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
