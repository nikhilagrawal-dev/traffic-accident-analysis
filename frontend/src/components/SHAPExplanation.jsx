import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

export default function SHAPExplanation({ shapData }) {
  if (!shapData || !shapData.feature_contributions) return null;

  const contributions = shapData.feature_contributions;
  
  const featureNameMapping = {
    "Start_Lng": "Longitude",
    "Start_Lat": "Latitude",
    "Distance_To_Cluster_Center": "Distance to cluster center",
    "Local_Accident_Density": "Local accident density",
    "Cluster_Size": "Cluster size",
    "Season_Spring": "Season: Spring",
    "Season_Summer": "Season: Summer",
    "Season_Fall": "Season: Fall",
    "Season_Winter": "Season: Winter",
    "Duration_Minutes": "Incident duration (min)",
    "Distance(mi)": "Distance affected (mi)",
    "Temperature(F)": "Temperature (F)",
    "Humidity(%)": "Humidity (%)",
    "Pressure(in)": "Pressure (in)",
    "Visibility(mi)": "Visibility (mi)",
    "Wind_Speed(mph)": "Wind Speed (mph)",
    "Precipitation(in)": "Precipitation (in)",
    "Weather_Condition_Freq": "Weather condition",
    "Wind_Direction_Freq": "Wind direction",
    "Weather_Severity_Score": "Weather severity score",
    "Road_Complexity_Score": "Road complexity score",
    "Hotspot_Flag": "Spatial hotspot",
    "Noise_Flag": "Spatial noise",
    "Is_Rush_Hour": "Rush hour",
    "Is_Weekend": "Weekend",
    "Is_Night": "Night time",
    "Hour": "Time of day (Hour)",
    "Month": "Month",
    "Weekday": "Day of week",
    "Traffic_Signal": "Traffic signal proximity",
    "Crossing": "Crossing proximity",
    "Junction": "Junction proximity",
    "Intersection_Indicator": "Intersection",
    "Lighting_Night": "Poor lighting at night",
    "RushHour_Junction": "Rush hour at junction",
    "Weekend_Night": "Weekend night",
    "PoorVisibility_Rain": "Poor visibility + rain"
  };

  const getHumanName = (key) => featureNameMapping[key] || key.replace(/_/g, ' ');

  // Convert to array, sort by absolute value, take top 10
  const sortedFeatures = Object.keys(contributions)
    .map(key => ({
      name: getHumanName(key),
      value: contributions[key],
      absVal: Math.abs(contributions[key])
    }))
    .sort((a, b) => b.absVal - a.absVal)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isPositive = val > 0;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-xl rounded-lg border border-slate-700">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className={`font-bold text-lg mt-1 ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isPositive ? '+' : ''}{val.toFixed(4)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center">
        <div className="bg-blue-100 p-2 rounded-lg mr-4 text-blue-600">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Why did the model make this prediction?</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Top 10 features influencing the result (SHAP values)</p>
        </div>
      </div>
      
      <div className="p-8">
        <div className="h-[350px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedFeatures} layout="vertical" margin={{ top: 10, right: 80, left: 60, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#334155', fontSize: 13, fontWeight: 500}} width={140} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
              <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
                {sortedFeatures.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#e11d48' : '#059669'} />
                ))}
                <LabelList
                  dataKey="value"
                  content={(props) => {
                    const { x, y, width, value } = props;
                    const isPositive = value > 0;
                    const displayValue = (isPositive ? '+' : '') + value.toFixed(3);
                    // In Recharts, for negative bars, x is the zero line and width is negative.
                    // For positive bars, x is the zero line and width is positive.
                    // We want positive labels at the right edge of the bar (x + width + 8).
                    // We want negative labels at the right edge of the bar, which is the zero line (x + 8).
                    const textX = isPositive ? x + width + 8 : x + 8;
                    const textAnchor = 'start';
                    
                    return (
                      <text 
                        x={textX} 
                        y={y + 14} 
                        fill="#64748b" 
                        fontSize={12} 
                        fontWeight={600} 
                        textAnchor={textAnchor}
                      >
                        {displayValue}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600 flex items-start leading-relaxed">
            <Info className="w-5 h-5 mr-3 flex-shrink-0 text-slate-400 mt-0.5" />
            <span>
              <strong>How SHAP works:</strong> SHAP answers "Which features contributed most to this model prediction?" rather than "Which factors caused the accident?" Positive values (red) push the prediction probability higher, negative values (green) push it lower. SHAP values represent model association, not causation.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
