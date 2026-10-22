import React from 'react';
import { Warehouse, MapPin, UserCheck } from 'lucide-react';

export default function WarehouseSummary({ warehouses = [], onNavigateToWarehouses }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Warehouse Stock Summary</h3>
            <p className="text-xs text-slate-500">Real-time capacity utilization across regional fulfillment hubs</p>
          </div>
        </div>

        <button
          onClick={onNavigateToWarehouses}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Manage hubs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {warehouses.map((wh) => {
          const util = Number(wh.utilization_pct || 0);
          const barColor =
            util > 85 ? 'bg-rose-500' : util > 65 ? 'bg-amber-500' : 'bg-blue-600';

          return (
            <div
              key={wh.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">{wh.code}</span>
                  <h4 className="text-sm font-bold text-slate-900">{wh.name}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {wh.location}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {wh.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Capacity Used</span>
                  <span className="font-bold text-slate-800 text-[11px]">{util}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(util, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Stock: <strong className="text-slate-800">{Number(wh.current_stock || 0).toLocaleString()}</strong></span>
                <span>Max: {Number(wh.storage_capacity).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
