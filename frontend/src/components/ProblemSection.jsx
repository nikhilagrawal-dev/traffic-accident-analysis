import React from 'react';
import { CloudRain, Navigation, Map, Clock } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">The Problem</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Traffic accident severity depends on significantly more than just the vehicles involved. Traditional prediction systems often treat every accident independently, missing the broader context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="mx-auto bg-sky-100 w-12 h-12 flex items-center justify-center rounded-xl text-sky-600 mb-4">
              <CloudRain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Environmental Context</h3>
            <p className="text-sm text-slate-500">Weather conditions, temperature, humidity, and severe weather indicators.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="mx-auto bg-slate-100 w-12 h-12 flex items-center justify-center rounded-xl text-slate-600 mb-4">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Road Infrastructure</h3>
            <p className="text-sm text-slate-500">Proximity to junctions, traffic signals, railway crossings, and intersections.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="mx-auto bg-amber-100 w-12 h-12 flex items-center justify-center rounded-xl text-amber-600 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Temporal Dynamics</h3>
            <p className="text-sm text-slate-500">Time of day, seasonality, rush hour patterns, and weekend behaviors.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 text-center ring-1 ring-blue-500/20">
            <div className="mx-auto bg-blue-100 w-12 h-12 flex items-center justify-center rounded-xl text-blue-600 mb-4">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Spatial Context</h3>
            <p className="text-sm text-slate-500 font-medium text-blue-800">Historical accident density, cluster proximity, and exact geographic positioning.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-blue-900 rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 text-white/5">
            <Map className="w-64 h-64" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Adding Spatial Intelligence</h3>
          <p className="text-blue-100 text-lg leading-relaxed relative z-10">
            This platform introduces <strong className="text-white">leakage-free spatial intelligence</strong>. By projecting incoming accidents onto canonical training-set clusters via BallTree architecture, the system understands whether an accident is occurring in a known dense hotspot, a clustered region, or isolated space—without leaking future test data into the model.
          </p>
        </div>
      </div>
    </section>
  );
}
