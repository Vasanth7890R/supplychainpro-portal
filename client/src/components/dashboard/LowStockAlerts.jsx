import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function LowStockAlerts({ alerts = [], onNavigateToInventory }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Low-Stock & Depletion Alerts</h3>
            <p className="text-xs text-slate-500">Products requiring replenishment across warehouse hubs</p>
          </div>
        </div>

        <button
          onClick={onNavigateToInventory}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          View all in inventory
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Product Name</th>
              <th className="pb-3 font-semibold">Warehouse Hub</th>
              <th className="pb-3 font-semibold text-right">Available Qty</th>
              <th className="pb-3 font-semibold text-right">Min Level</th>
              <th className="pb-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">
                  All inventory items are currently above threshold!
                </td>
              </tr>
            ) : (
              alerts.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-semibold text-blue-600">{item.sku}</td>
                  <td className="py-3 font-medium text-slate-900 max-w-xs truncate" title={item.name}>
                    {item.name}
                  </td>
                  <td className="py-3 text-slate-500">{item.warehouse_name}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    <span className={item.quantity === 0 ? 'text-rose-600 font-extrabold' : 'text-amber-600'}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400 font-medium">{item.min_stock_level}</td>
                  <td className="py-3 text-center">
                    <StatusBadge status={item.stock_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
