import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { BarChart2 } from 'lucide-react';

export default function ProbabilityChart({ probabilities }) {
  if (!probabilities) return null;

  const data = Object.keys(probabilities).map(key => ({
    name: `Severity ${key}`,
    probability: probabilities[key] * 100,
    rawProb: probabilities[key]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 shadow-xl rounded-lg border border-slate-700">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className="text-blue-400 font-bold text-lg">
            {(payload[0].value).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  const getFillColor = (name) => {
    if (name.includes('1')) return '#34d399'; // Emerald
    if (name.includes('2')) return '#60a5fa'; // Blue
    if (name.includes('3')) return '#fbbf24'; // Amber
    if (name.includes('4')) return '#fb7185'; // Rose
    return '#94a3b8';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center">
        <div className="bg-blue-100 p-1.5 rounded-lg mr-3 text-blue-600">
          <BarChart2 className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Probability Distribution</h2>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 50, left: 20, bottom: 10 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={80} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', rx: 8}} />
            <Bar dataKey="probability" radius={[0, 8, 8, 0]} barSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getFillColor(entry.name)} />
              ))}
              <LabelList dataKey="probability" position="right" formatter={(val) => `${val.toFixed(1)}%`} fill="#475569" fontSize={13} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
