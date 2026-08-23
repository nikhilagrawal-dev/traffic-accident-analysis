import React from 'react';
import { Database, FileText, AlertCircle, Scaling } from 'lucide-react';

export default function DataCredibilitySection() {
  return (
    <section id="data-credibility" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Data Credibility & External Validation</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Publicly distributed datasets are often rightfully questioned for their real-world reliability. This project addresses those concerns directly by subjecting its learned spatial assumptions to an independent, authoritative federal dataset.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Provenance Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mr-4">
                <Database className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Dataset Provenance</h3>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6">
              The training data is sourced from the US Accidents dataset. While distributed via Kaggle, the underlying records are authentic, real-world traffic incident reports aggregated from state and municipal transportation authorities, law enforcement agencies, and traffic APIs across the United States.
            </p>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Final Leakage-Free Scale</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">299,794 <span className="text-base font-medium text-slate-500">records</span></p>
              </div>
            </div>
          </div>

          {/* FARS Block */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">FARS External Validation</h3>
              </div>
            </div>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
              STATUS: EXPLORATORY / PARTIAL EXTERNAL VALIDATION
            </div>

            <p className="text-slate-700 leading-relaxed mb-6 font-medium">
              An independent external comparison was performed against FARS (Fatality Analysis Reporting System), a federal NHTSA dataset, to test whether our DBSCAN-identified hotspot regions align with real-world fatal crash concentrations.
            </p>

            <div className="bg-white border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
              <h4 className="text-sm font-bold text-amber-900 mb-2">Honest Finding</h4>
              <p className="text-amber-800 text-sm leading-relaxed italic">
                The analysis found lower fatal-crash enrichment inside the identified DBSCAN hotspot regions than the random baseline.
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-sm text-slate-600 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                <span>This does <strong>not</strong> establish that the model generalizes to fatal crashes.</span>
              </li>
              <li className="flex items-start text-sm text-slate-600 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                <span>This does <strong>not</strong> prove causality between any spatial feature and accident severity.</span>
              </li>
              <li className="flex items-start text-sm text-slate-600 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                <span>This does <strong>not</strong> prove that the source dataset is universally reliable.</span>
              </li>
            </ul>

            <p className="text-sm text-slate-500 leading-relaxed bg-white/60 p-4 rounded-lg">
              This null result provides an important boundary condition: the hotspot structure learned from the primary dataset does not straightforwardly correspond to fatal-crash concentration in this comparison. It also demonstrates that the project tested its spatial assumptions against an external reference dataset rather than relying solely on internal model metrics.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
