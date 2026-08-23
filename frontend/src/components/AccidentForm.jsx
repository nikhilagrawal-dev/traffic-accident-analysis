import React, { useState } from 'react';
import { MapPin, Clock, Cloud, Navigation, AlertTriangle, PlayCircle, RefreshCw, Activity, AlertCircle, Calendar } from 'lucide-react';

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

export default function AccidentForm({ onSubmit, onReset, isLoading }) {
  const [formData, setFormData] = useState(INITIAL_STATE);

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
    <div className="flex items-center group">
      <div className="flex items-center justify-center w-5 h-5">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={formData[name] === 1}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer transition-shadow"
        />
      </div>
      <label htmlFor={name} className="ml-2 block text-sm font-medium text-slate-700 group-hover:text-blue-700 cursor-pointer transition-colors">
        {label}
      </label>
    </div>
  );

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center">
        <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Group A: Location */}
      <Section icon={MapPin} title="Location & Incident">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputRow label="Start Latitude" name="Start_Lat" />
          <InputRow label="Start Longitude" name="Start_Lng" />
          <InputRow label="City" name="City" type="text" />
          <InputRow label="State" name="State" type="text" />
          <InputRow label="Distance Affected (mi)" name="Distance(mi)" />
          <InputRow label="Duration (Minutes)" name="Duration_Minutes" />
        </div>
        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong className="font-semibold text-blue-900">Spatial Features:</strong> Spatial hotspot features (Density, Hotspot Status, Cluster Size, Distance to Center) are automatically calculated by the backend from the accident location to preserve the leakage-free inference pipeline.
          </p>
        </div>
      </Section>

      {/* Group C: Weather */}
      <Section icon={Cloud} title="Weather Conditions">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
      </Section>

      {/* Group D & F: Infrastructure & Environmental */}
      <Section icon={Navigation} title="Infrastructure & Environmental Flags">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <InputRow label="Road Complexity Score" name="Road_Complexity_Score" type="number" />
          <InputRow label="Lighting (Night)" name="Lighting_Night" type="number" />
        </div>
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2">
            <CheckboxRow label="Amenity" name="Amenity" />
            <CheckboxRow label="Crossing" name="Crossing" />
            <CheckboxRow label="Junction" name="Junction" />
            <CheckboxRow label="Railway" name="Railway" />
            <CheckboxRow label="Station" name="Station" />
            <CheckboxRow label="Stop" name="Stop" />
            <CheckboxRow label="Traffic Signal" name="Traffic_Signal" />
            <CheckboxRow label="Intersection" name="Intersection_Indicator" />
            
            <div className="col-span-2 sm:col-span-4 border-t border-slate-200 my-2"></div>
            
            <CheckboxRow label="Fog" name="Fog_Indicator" />
            <CheckboxRow label="Rain" name="Rain_Indicator" />
            <CheckboxRow label="Snow" name="Snow_Indicator" />
            <CheckboxRow label="Poor Visibility" name="Poor_Visibility_Flag" />
            <CheckboxRow label="High Precipitation" name="High_Precipitation_Flag" />
            <CheckboxRow label="Extreme Temp" name="Extreme_Temperature_Flag" />
            <CheckboxRow label="Night Rain" name="Night_Rain" />
            <CheckboxRow label="Weekend Night" name="Weekend_Night" />
            <CheckboxRow label="Poor Vis + Rain" name="PoorVisibility_Rain" />
            <CheckboxRow label="RushHour Junction" name="RushHour_Junction" />
          </div>
        </div>
      </Section>

      {/* Group E: Time */}
      <Section icon={Calendar} title="Time & Seasonality">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-6">
          <InputRow label="Hour (0-23)" name="Hour" type="number" min="0" max="23" />
          <InputRow label="Weekday (0-6)" name="Weekday" type="number" min="0" max="6" />
          <InputRow label="Month (1-12)" name="Month" type="number" min="1" max="12" />
        </div>
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2">
          <CheckboxRow label="Is Weekend" name="Is_Weekend" />
          <CheckboxRow label="Is Night" name="Is_Night" />
          <CheckboxRow label="Is Rush Hour" name="Is_Rush_Hour" />
          <div className="hidden sm:block"></div>
          
          <CheckboxRow label="Spring" name="Season_Spring" />
          <CheckboxRow label="Summer" name="Season_Summer" />
          <CheckboxRow label="Fall" name="Season_Fall" />
          <div className="hidden sm:block"></div>

          <CheckboxRow label="Morning" name="TOD_Morning" />
          <CheckboxRow label="Afternoon" name="TOD_Afternoon" />
          <CheckboxRow label="Evening" name="TOD_Evening" />
        </div>
      </Section>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-6 z-10 bg-slate-100 p-2 rounded-xl shadow-[0_-20px_20px_-15px_rgba(241,245,249,1)]">
        <button
          type="button"
          onClick={() => { setFormData(INITIAL_STATE); if (onReset) onReset(); }}
          className="flex-1 bg-white text-slate-700 px-6 py-4 border border-slate-300 rounded-xl font-bold shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 flex justify-center items-center transition-all"
          disabled={isLoading}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Reset Defaults
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-md shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center transition-all transform active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Data...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 mr-2" />
              Predict Accident Severity
            </>
          )}
        </button>
      </div>
    </form>
  );
}
