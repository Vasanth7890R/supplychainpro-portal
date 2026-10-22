import React from 'react';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Wrench } from 'lucide-react';

export default function RecentMovements({ movements = [] }) {
  const getMovementBadge = (type) => {
    switch (type) {
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <ArrowLeftRight className="w-3 h-3" /> TRANSFER
          </span>
        );
      case 'PURCHASE_RECEIPT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3" /> RECEIPT
          </span>
        );
      case 'ORDER_FULFILLMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowUpRight className="w-3 h-3" /> FULFILLMENT
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3" /> ADJUSTMENT
          </span>
        );
      default:
        return <span className="text-[10px] font-bold text-slate-600">{type}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
      <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Recent Stock Movements</h3>
          <p className="text-xs text-slate-500">Audit trail of inter-warehouse transfers, receipts, and allocations</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {movements.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent stock movements recorded.</p>
        ) : (
          movements.map((mov) => (
            <div
              key={mov.id}
              className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 transition-colors border border-slate-100 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getMovementBadge(mov.movement_type)}
                  <span className="font-mono text-[11px] text-slate-400">{mov.reference_id}</span>
                </div>
                <p className="font-semibold text-slate-900 truncate max-w-sm sm:max-w-md" title={mov.product_name}>
                  {mov.product_name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {mov.from_warehouse && mov.to_warehouse
                    ? `${mov.from_warehouse} ➔ ${mov.to_warehouse}`
                    : mov.to_warehouse
                    ? `Received at ${mov.to_warehouse}`
                    : `Dispatched from ${mov.from_warehouse}`}
                  {' • '}{mov.reason}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className={`text-sm font-extrabold ${mov.quantity > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} units
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{mov.performed_by}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
