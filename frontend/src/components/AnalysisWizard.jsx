import React, { useState } from 'react';
import { MapPin, Cloud, Navigation, Calendar, Activity, ChevronRight, ChevronLeft, PlayCircle, RefreshCw } from 'lucide-react';

const INITIAL_STATE = {
  Start_Lat: 40.068884, Start_Lng: -75.326146, "Distance(mi)": 0.5,
  City: "Philadelphia", State: "PA", "Temperature(F)": 72.0, "Humidity(%)": 50.0,
  "Pressure(in)": 29.9, "Visibility(mi)": 10.0, Wind_Direction: "S",
  "Wind_Speed(mph)": 5.0, "Precipitation(in)": 0.0, Weather_Condition: "Clear",
  Amenity: 0, Crossing: 0, Junction: 0, Railway: 0, Station: 0, Stop: 0,
  Traffic_Signal: 0, Lighting_Night: 0, Hour: 14, Weekday: 2, Is_Weekend: 0,
  Month: 5, Is_Night: 0, Is_Rush_Hour: 0, Duration_Minutes: 30.0,
  Season_Spring: 1, Season_Summer: 0, Season_Fall: 0, TOD_Morning: 0,
  TOD_Afternoon: 1, TOD_Evening: 0, Fog_Indicator: 0, Rain_Indicator: 0,
  Snow_Indicator: 0, Poor_Visibility_Flag: 0, High_Precipitation_Flag: 0,
  Extreme_Temperature_Flag: 0, Weather_Severity_Score: 0.0, Road_Complexity_Score: 0,
  Intersection_Indicator: 0, Night_Rain: 0, Weekend_Night: 0, PoorVisibility_Rain: 0,
  RushHour_Junction: 0
};

export default function AnalysisWizard({ onSubmit, onReset, isLoading }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: "Location & Incident", icon: MapPin },
    { id: 2, title: "Weather", icon: Cloud },
    { id: 3, title: "Road & Infrastructure", icon: Navigation },
    { id: 4, title: "Time & Season", icon: Calendar },
    { id: 5, title: "Environmental Flags", icon: Activity }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = value;
    if (type === 'number' || type === 'range') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      parsedValue = checked ? 1 : 0;
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, explain: true });
  };

  const InputRow = ({ label, name, type = 'number', step = 'any', ...props }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        step={step}
        className="w-full rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 sm:text-sm px-3.5 py-2.5 border transition-colors"
        required
        {...props}
      />
    </div>
  );

  const CheckboxRow = ({ label, name }) => (
    <div className="flex items-center group bg-white p-3 border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-center w-5 h-5">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={formData[name] === 1}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
        />
      </div>
      <label htmlFor={name} className="ml-2 block text-sm font-medium text-slate-700 cursor-pointer w-full">
        {label}
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Wizard Header */}
      <div className="bg-slate-900 px-6 py-4">
        <h2 className="text-xl font-bold text-white mb-4">Accident Analysis Workflow</h2>
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 -z-0"></div>
          {steps.map((s) => {
            const isActive = s.id === step;
            const isPast = s.id < step;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : isPast ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                  {isPast ? "✓" : s.id}
                </div>
                <span className={`text-[10px] uppercase font-bold mt-2 hidden sm:block ${isActive ? 'text-blue-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-blue-600" /> Location & Incident Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputRow label="Start Latitude" name="Start_Lat" />
              <InputRow label="Start Longitude" name="Start_Lng" />
              <InputRow label="City" name="City" type="text" />
              <InputRow label="State" name="State" type="text" />
              <InputRow label="Distance Affected (mi)" name="Distance(mi)" />
              <InputRow label="Duration (Minutes)" name="Duration_Minutes" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Cloud className="w-6 h-6 mr-2 text-blue-600" /> Weather Conditions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputRow label="Temperature (F)" name="Temperature(F)" />
              <InputRow label="Humidity (%)" name="Humidity(%)" />
              <InputRow label="Pressure (in)" name="Pressure(in)" />
              <InputRow label="Visibility (mi)" name="Visibility(mi)" />
              <InputRow label="Wind Speed (mph)" name="Wind_Speed(mph)" />
              <InputRow label="Precipitation (in)" name="Precipitation(in)" />
              <InputRow label="Wind Direction" name="Wind_Direction" type="text" />
              <InputRow label="Condition (e.g. Clear)" name="Weather_Condition" type="text" />
              <InputRow label="Severity Score" name="Weather_Severity_Score" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Navigation className="w-6 h-6 mr-2 text-blue-600" /> Road & Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <InputRow label="Road Complexity Score" name="Road_Complexity_Score" type="number" />
              <InputRow label="Lighting (Night)" name="Lighting_Night" type="number" />
            </div>
            <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Infrastructure Proximity</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CheckboxRow label="Amenity" name="Amenity" />
              <CheckboxRow label="Crossing" name="Crossing" />
              <CheckboxRow label="Junction" name="Junction" />
              <CheckboxRow label="Railway" name="Railway" />
              <CheckboxRow label="Station" name="Station" />
              <CheckboxRow label="Stop" name="Stop" />
              <CheckboxRow label="Traffic Signal" name="Traffic_Signal" />
              <CheckboxRow label="Intersection" name="Intersection_Indicator" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600" /> Time & Seasonality
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
              <InputRow label="Hour (0-23)" name="Hour" type="number" min="0" max="23" />
              <InputRow label="Weekday (0-6)" name="Weekday" type="number" min="0" max="6" />
              <InputRow label="Month (1-12)" name="Month" type="number" min="1" max="12" />
            </div>
            <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Temporal Indicators</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <CheckboxRow label="Is Weekend" name="Is_Weekend" />
              <CheckboxRow label="Is Night" name="Is_Night" />
              <CheckboxRow label="Is Rush Hour" name="Is_Rush_Hour" />
              <CheckboxRow label="Spring" name="Season_Spring" />
              <CheckboxRow label="Summer" name="Season_Summer" />
              <CheckboxRow label="Fall" name="Season_Fall" />
              <CheckboxRow label="Morning" name="TOD_Morning" />
              <CheckboxRow label="Afternoon" name="TOD_Afternoon" />
              <CheckboxRow label="Evening" name="TOD_Evening" />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-600" /> Environmental Flags
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <CheckboxRow label="Fog" name="Fog_Indicator" />
              <CheckboxRow label="Rain" name="Rain_Indicator" />
              <CheckboxRow label="Snow" name="Snow_Indicator" />
              <CheckboxRow label="Poor Visibility" name="Poor_Visibility_Flag" />
              <CheckboxRow label="High Precip." name="High_Precipitation_Flag" />
              <CheckboxRow label="Extreme Temp" name="Extreme_Temperature_Flag" />
              <CheckboxRow label="Night Rain" name="Night_Rain" />
              <CheckboxRow label="Weekend Night" name="Weekend_Night" />
              <CheckboxRow label="Poor Vis + Rain" name="PoorVisibility_Rain" />
              <CheckboxRow label="RushHour Junction" name="RushHour_Junction" />
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Ready for analysis</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                The 47 base features have been collected. Upon submission, the backend derives 5 additional leakage-free spatial features using the canonical training BallTree (47 input features + 5 backend-derived spatial features = 52 model features) before passing to the XGBoost model.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => { setFormData(INITIAL_STATE); if (onReset) onReset(); setStep(1); }}
            className="flex items-center text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors order-3 sm:order-1"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Defaults
          </button>

          <div className="flex gap-3 order-1 sm:order-2 w-full sm:w-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center"
                disabled={isLoading}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
            )}
            
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center"
              >
                Next Step
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/30 transition-all flex items-center justify-center disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Analyze Accident
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
