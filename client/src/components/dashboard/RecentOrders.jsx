import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function RecentOrders({ orders = [], onNavigateToOrders }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Recent Orders</h3>
            <p className="text-xs text-slate-500">Live order fulfillment stream across global distribution hubs</p>
          </div>
        </div>

        <button
          onClick={onNavigateToOrders}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          View all orders
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <th className="pb-3 font-semibold">Order ID</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Fulfillment Hub</th>
              <th className="pb-3 font-semibold text-right">Amount</th>
              <th className="pb-3 font-semibold text-center">Status</th>
              <th className="pb-3 font-semibold text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-semibold text-slate-900">{ord.order_number}</td>
                  <td className="py-3 font-medium text-slate-900 max-w-[140px] truncate" title={ord.customer_name}>
                    {ord.customer_name}
                  </td>
                  <td className="py-3 text-slate-500">{ord.warehouse_name || 'Global Hub'}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ${Number(ord.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="py-3 text-right text-slate-400">{ord.order_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
