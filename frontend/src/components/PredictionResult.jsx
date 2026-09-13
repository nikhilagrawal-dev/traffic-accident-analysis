import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, MapPin, Clock, Cloud, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_CONFIG = {
  1: { label: "Minor",    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "text-emerald-600 bg-emerald-100", badge: "bg-emerald-100 text-emerald-800" },
  2: { label: "Moderate", bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900",    icon: "text-blue-600 bg-blue-100",    badge: "bg-blue-100 text-blue-800"    },
  3: { label: "Severe",   bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   icon: "text-amber-600 bg-amber-100",   badge: "bg-amber-100 text-amber-800"  },
  4: { label: "Critical", bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-900",    icon: "text-rose-600 bg-rose-100",    badge: "bg-rose-100 text-rose-800"    },
};

function formatLocalTime(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

function TopSHAPFactors({ shapData, predicted_severity }) {
  if (!shapData?.feature_contributions) return null;
  const contribs = shapData.feature_contributions;
  const sorted = Object.entries(contribs)
    .map(([k, v]) => ({ name: k, value: v }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4);

  return (
    <div className="mt-6 text-left">
      <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">Why this prediction?</h4>
      <div className="space-y-2">
        {sorted.map(({ name, value }) => (
          <div key={name} className="flex items-center justify-between text-xs">
            <span className="font-medium opacity-80 truncate max-w-[65%]">{name.replace(/_/g, ' ')}</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${value > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PredictionResult({ result }) {
  const [showDetail, setShowDetail] = useState(false);

  if (!result) return null;

  const { predicted_severity, probabilities, shap_explanation, city_resolved, state_resolved, local_time, weather_context } = result;

  const cfg = SEVERITY_CONFIG[predicted_severity] || {
    label: `Severity ${predicted_severity}`,
    bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800",
    icon: "text-slate-600 bg-slate-100", badge: "bg-slate-100 text-slate-700",
  };

  const confidence = probabilities[predicted_severity.toString()]
    ? (probabilities[predicted_severity.toString()] * 100).toFixed(1)
    : "0.0";

  const localTimeStr = formatLocalTime(local_time);

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      {/* ── Primary Result ─────────────────────────────────────────── */}
      <div className="p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${cfg.icon}`}>
            <ShieldAlert className="w-9 h-9" />
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">
          Estimated Severity Under Current Conditions
        </p>
        <div className="text-7xl font-black tracking-tight">{predicted_severity}</div>
        <h3 className="text-2xl font-bold mt-1 opacity-90">{cfg.label}</h3>

        <div className="mt-4">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm">
            Confidence: <span className="ml-1.5 font-bold">{confidence}%</span>
          </span>
        </div>

        {/* Context line */}
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-medium opacity-75">
          {city_resolved && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {city_resolved}{state_resolved ? `, ${state_resolved}` : ''}
            </span>
          )}
          {weather_context && (
            <span className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" /> {Math.round(weather_context.temperature_f)}°F · {weather_context.condition}
            </span>
          )}
          {localTimeStr && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {localTimeStr} local
            </span>
          )}
        </div>

        {/* Top SHAP summary */}
        {shap_explanation && <TopSHAPFactors shapData={shap_explanation} predicted_severity={predicted_severity} />}

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-white/30 backdrop-blur-sm rounded-xl text-left">
          <p className="text-xs opacity-75 flex leading-relaxed">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              This is an ML-based estimate based on historical accident patterns and current context.
              It is <strong>not</strong> a guaranteed prediction of a future accident.
            </span>
          </p>
        </div>
      </div>

      {/* ── View Detailed Analysis toggle ──────────────────────────── */}
      <div className="border-t border-black/5">
        <button
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => setShowDetail(v => !v)}
        >
          {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetail ? 'Hide Detailed Analysis' : 'View Detailed Analysis'}
        </button>

        {showDetail && (
          <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Probability distribution */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-60">Class Probability Distribution</h4>
              <div className="space-y-2">
                {[1,2,3,4].map(cls => {
                  const p = probabilities[cls.toString()] || 0;
                  const pct = (p * 100).toFixed(1);
                  return (
                    <div key={cls} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-10 opacity-75">S{cls}</span>
                      <div className="flex-1 bg-black/10 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-current opacity-60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity reference */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-60">Severity Reference</h4>
              <ul className="text-xs space-y-1.5 opacity-80">
                {[
                  [1,'emerald','Lowest traffic impact'],
                  [2,'blue','Moderate traffic impact'],
                  [3,'amber','Significant traffic impact'],
                  [4,'rose','Major traffic disruption'],
                ].map(([s, c, desc]) => (
                  <li key={s} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full bg-${c}-500`} />
                      Severity {s}
                    </span>
                    <span className="opacity-70">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
