import React from 'react';
import { Database, Network, Map, Layout, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function SpatialIntelligenceSection() {
  return (
    <section id="spatial" className="py-24 bg-slate-900 text-slate-200 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Leakage-Free Spatial Intelligence</h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-6">
            Many accident prediction models calculate hotspot features by mapping all data at once, leaking test coordinates into the training set. This system is designed and validated to avoid target/data leakage using a strict bipartite architecture.
          </p>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-left inline-block">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Leakage-Free Methodology</h4>
            <ul className="text-slate-300 text-sm space-y-3">
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Spatial artifacts derived from training data</span></li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Canonical DBSCAN/BallTree assignment</span></li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Hotspot_Label excluded from model features</span></li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Frequency encoders fitted on training data</span></li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Test set held out for final evaluation</span></li>
              <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" /> <span>Production inference reproduces training transformation</span></li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center border border-blue-700/50">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-white mb-2">1. Training DBSCAN</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  DBSCAN is fitted <span className="text-emerald-400 font-semibold">exclusively</span> on the training coordinates. It identifies dense accident regions (hotspots), clustered regions, and isolated noise.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-700/50">
                  <Network className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-white mb-2">2. BallTree Construction</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  The verified DBSCAN core points are loaded into a specialized <span className="text-white font-semibold">BallTree</span> index, acting as the canonical spatial memory.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center border border-emerald-700/50">
                  <Map className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-xl font-bold text-white mb-2">3. Inference Projection</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  When a new accident is submitted, the API queries the BallTree. If the accident is within 0.5km of a core point, it inherits that cluster's statistics. Otherwise, it is classified as noise.
                </p>
              </div>
            </div>
            
            <div className="p-5 bg-blue-900/20 border border-blue-800/50 rounded-xl mt-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-300">Form Input Features</span>
                <span className="text-lg font-bold text-slate-200">47</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-emerald-400">Backend-Derived Spatial</span>
                <span className="text-lg font-bold text-emerald-400">+ 5</span>
              </div>
              <div className="border-t border-blue-800/50 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Total Model Features</span>
                <span className="text-xl font-black text-white">52</span>
              </div>
              <p className="text-xs text-blue-300 font-medium mt-4">
                <Zap className="inline-block w-4 h-4 mr-1 mb-0.5" />
                The spatial features (Density, Hotspot Flag, Noise Flag, Cluster Size, Distance) are derived completely automatically by the backend.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full"></div>
            <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-2">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Incoming</span>
                </div>
                
                <div className="flex-1 px-4 flex justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-500" />
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-900 border border-blue-700 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    <Layout className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">BallTree</span>
                </div>
                
                <div className="flex-1 px-4 flex justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-500" />
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-900 border border-emerald-700 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Features</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Local Accident Density</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+ Feature</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Hotspot Flag</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+ Feature</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Noise Flag</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+ Feature</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Cluster Size</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+ Feature</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Distance To Center</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+ Feature</span>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
