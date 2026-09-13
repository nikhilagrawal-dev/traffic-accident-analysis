import React, { useState } from 'react';
import { MapPin, Cloud, Navigation, Calendar, Activity, PlayCircle, RefreshCw, Settings, Info } from 'lucide-react';

const ADVANCED_DEFAULTS = {
  Duration_Minutes: 75.0,
  "Distance(mi)": 0.03,
  Amenity: 0,
  Crossing: 0,
  Junction: 0,
  Railway: 0,
  Station: 0,
  Stop: 0,
  Traffic_Signal: 0,
  Lighting_Night: 0
};

export default function AnalysisWizard({ onSubmit, onReset, isLoading }) {
  const [city, setCity] = useState("Philadelphia");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState(ADVANCED_DEFAULTS);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      city,
      advanced_options: advancedOptions,
      explain: true
    });
  };

  const handleAdvancedChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = value;
    if (type === 'number' || type === 'range') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      parsedValue = checked ? 1 : 0;
    }
    setAdvancedOptions(prev => ({ ...prev, [name]: parsedValue }));
  };

  const CheckboxRow = ({ label, name }) => (
    <div className="flex items-center group bg-white p-2 border border-slate-200 rounded shadow-sm hover:border-blue-300 transition-colors">
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={advancedOptions[name] === 1}
        onChange={handleAdvancedChange}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
      />
      <label htmlFor={name} className="ml-2 block text-xs font-medium text-slate-700 cursor-pointer w-full">
        {label}
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🚗 Traffic Accident Analysis</h2>
        <p className="text-slate-300 text-sm">Estimate accident severity under current conditions.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Select City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full text-lg rounded-xl border-slate-300 bg-slate-50 shadow-inner focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 px-4 py-4 border transition-colors"
            placeholder="Enter a city name..."
            required
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Upon clicking analyze, the system will automatically resolve location, fetch live weather, synchronize with local time, and predict the estimated severity.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Options {advancedOpen ? '(Hide)' : '(Show)'}
          </button>
          
          {advancedOpen && (
            <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-slate-500 mb-4 uppercase tracking-wide font-bold">Standard Road Scenario Assumptions</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Minutes)</label>
                  <input type="number" name="Duration_Minutes" value={advancedOptions.Duration_Minutes} onChange={handleAdvancedChange} className="w-full p-2 text-sm border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Distance (mi)</label>
                  <input type="number" name="Distance(mi)" value={advancedOptions["Distance(mi)"]} onChange={handleAdvancedChange} step="any" className="w-full p-2 text-sm border rounded" />
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-600 mb-2 mt-4">Infrastructure</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <CheckboxRow label="Crossing" name="Crossing" />
                <CheckboxRow label="Junction" name="Junction" />
                <CheckboxRow label="Traffic Signal" name="Traffic_Signal" />
                <CheckboxRow label="Stop" name="Stop" />
                <CheckboxRow label="Station" name="Station" />
                <CheckboxRow label="Railway" name="Railway" />
                <CheckboxRow label="Amenity" name="Amenity" />
                <CheckboxRow label="Night Lighting" name="Lighting_Night" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => { setCity("Philadelphia"); setAdvancedOptions(ADVANCED_DEFAULTS); if (onReset) onReset(); }}
            className="text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors w-full sm:w-auto text-center"
            disabled={isLoading}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-2/3 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Severity...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Analyze Severity
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
