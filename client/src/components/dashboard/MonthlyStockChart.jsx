import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function MonthlyStockChart({ data = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs border border-slate-700/60">
          <p className="font-bold text-slate-200 mb-1.5">{label} 2026</p>
          <div className="space-y-1">
            <p className="text-blue-400 flex items-center justify-between gap-4">
              <span>Total Stock:</span>
              <span className="font-semibold">{payload[0]?.value?.toLocaleString()} units</span>
            </p>
            <p className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Inbound:</span>
              <span className="font-semibold">+{payload[1]?.value?.toLocaleString()}</span>
            </p>
            <p className="text-rose-400 flex items-center justify-between gap-4">
              <span>Outbound:</span>
              <span className="font-semibold">-{payload[2]?.value?.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Monthly Stock-Level Dynamics</h3>
          <p className="text-xs text-slate-500">Aggregate inventory levels vs inbound shipments and outbound dispatches</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>6-Month Trend</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="stockLevel"
              name="Net Stock Units"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#1d4ed8' }}
            />
            <Line
              type="monotone"
              dataKey="inbound"
              name="Inbound Goods"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="outbound"
              name="Outbound Deliveries"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#f43f5e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
