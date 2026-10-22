import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function CategoryDonutChart({ data = [] }) {
  const totalUnits = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const pct = totalUnits > 0 ? ((item.value / totalUnits) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/60">
          <p className="font-bold text-slate-200">{item.name}</p>
          <p className="text-sky-400 mt-1 font-semibold">
            {item.value?.toLocaleString()} units ({pct}%)
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.payload.productCount || 0} distinct SKUs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow flex flex-col justify-between">
      <div className="pb-4 mb-2 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Inventory Distribution</h3>
          <p className="text-xs text-slate-500">Distribution of stock units by product category</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
          {totalUnits.toLocaleString()} units
        </span>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900 font-['Outfit']">
            {data.length}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Categories
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3 border-t border-slate-100 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600 truncate text-[11px] font-medium" title={item.name}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
