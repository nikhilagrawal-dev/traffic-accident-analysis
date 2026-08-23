import React from 'react';
import { FormInput, FileTerminal, Map, Database, BrainCircuit, Activity, BarChart2 } from 'lucide-react';

export default function PipelineSection() {
  const steps = [
    { num: "01", icon: FormInput, title: "Accident Conditions", desc: "Raw location, weather, and time data is captured." },
    { num: "02", icon: FileTerminal, title: "Feature Engineering", desc: "Temporal indicators, weather scoring, and logic flags are parsed." },
    { num: "03", icon: Map, title: "Spatial Analysis", desc: "BallTree maps coordinates to canonical leakage-free DBSCAN clusters." },
    { num: "04", icon: Database, title: "52-Feature Vector", desc: "47 input features + 5 backend-derived spatial features form the final model vector." },
    { num: "05", icon: BrainCircuit, title: "Optimized XGBoost", desc: "Gradient boosting model evaluates the non-linear feature interactions." },
    { num: "06", icon: Activity, title: "Severity Prediction", desc: "A multi-class probability distribution generates the severity estimate." },
    { num: "07", icon: BarChart2, title: "SHAP Explanation", desc: "TreeExplainer breaks down the precise feature contributions." }
  ];

  return (
    <section id="pipeline" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            A real-time end-to-end machine learning pipeline running on FastAPI and React.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line connecting steps on desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-blue-100 transform -translate-x-1/2"></div>
          
          <div className="space-y-8 md:space-y-0">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={idx} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''} md:justify-between w-full`}>
                  
                  <div className={`md:w-[45%] w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative z-10 ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                    <div className={`flex items-center mb-3 ${isEven ? 'justify-start' : 'md:justify-end justify-start'}`}>
                      {!isEven && <span className="hidden md:inline-block text-4xl font-black text-slate-100 mr-4">{step.num}</span>}
                      <div className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm">
                        <step.icon className="w-5 h-5" />
                      </div>
                      {isEven && <span className="hidden md:inline-block text-4xl font-black text-slate-100 ml-4">{step.num}</span>}
                      
                      {/* Mobile Number */}
                      <span className="md:hidden text-2xl font-black text-slate-200 ml-auto">{step.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </div>

                  {/* Node on the line */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-blue-500 items-center justify-center z-20">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>

                  <div className="hidden md:block md:w-[45%]"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
