import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  Layers,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../api';
import { useNotifications } from '../context/NotificationContext';

export default function Reports() {
  const { showToast } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('inventory'); // 'inventory', 'orders', 'movements', 'suppliers'
  const [dateRange, setDateRange] = useState('30days'); // '7days', '30days', 'quarter', 'year'

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics({ range: dateRange });
      if (res.success) {
        setData(res.analytics);
      }
    } catch (err) {
      showToast('Failed to load report analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleDownloadCsv = (type) => {
    const downloadUrl = api.getExportUrl(type);
    showToast(`Generating ${type.toUpperCase()} CSV report...`, 'info');
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              Reports & Intelligence Center
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              CSV Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, demand projections, category evaluations, and exportable financial reports
          </p>
        </div>

        {/* Global Export Button */}
        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days (Standard)</option>
            <option value="quarter">Past Quarter (Q3-Q4)</option>
            <option value="year">Full Year 2026</option>
          </select>

          <button
            onClick={() => handleDownloadCsv(reportType)}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download {reportType.toUpperCase()} CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'inventory', label: 'Inventory & Stock Report', icon: Boxes, desc: 'Current valuation, quantities & thresholds' },
          { id: 'orders', label: 'Sales & Orders Report', icon: ShoppingCart, desc: 'Revenue, fulfillment pipeline & carriers' },
          { id: 'movements', label: 'Stock Movement Report', icon: TrendingUp, desc: 'Inter-warehouse transfers & audit log' },
          { id: 'suppliers', label: 'Supplier Quality Report', icon: FileSpreadsheet, desc: 'Fulfillment ratings & supplied SKUs' },
        ].map((tab) => {
          const isActive = reportType === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                  : 'bg-white text-slate-800 border-slate-100 hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                  Ready
                </span>
              </div>
              <h4 className="font-bold text-xs">{tab.label}</h4>
              <p className={`text-[11px] mt-0.5 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Stock Quantity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Top Products by Stock Quantity</h3>
              <p className="text-xs text-slate-500">Highest volume SKUs across global warehouse network</p>
            </div>
            <button
              onClick={() => handleDownloadCsv('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Export <Download className="w-3 h-3" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.topProducts?.slice(0, 7) || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="sku"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-20}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} units ($${item.payload.total_value})`, 'Quantity']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue & Sales Growth */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Monthly Sales & Revenue ($)</h3>
              <p className="text-xs text-slate-500">B2B fulfillment revenue trajectory for 2026</p>
            </div>
            <button
              onClick={() => handleDownloadCsv('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Export <Download className="w-3 h-3" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.monthlySales || []}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow">
        <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Stock Distribution by Category</h3>
            <p className="text-xs text-slate-500">Financial allocation and inventory unit concentration</p>
          </div>

          <button
            onClick={() => handleDownloadCsv('inventory')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Category Matrix
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3 font-semibold">Category Name</th>
                <th className="pb-3 font-semibold text-right">Cataloged SKUs</th>
                <th className="pb-3 font-semibold text-right">Total Units</th>
                <th className="pb-3 font-semibold text-right">Inventory Valuation ($)</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {data?.categoryStock?.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{cat.category}</td>
                  <td className="py-3.5 text-right font-medium text-slate-600">{cat.product_count}</td>
                  <td className="py-3.5 text-right font-extrabold text-slate-900">
                    {Number(cat.total_quantity).toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-emerald-600">
                    ${Number(cat.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDownloadCsv('inventory')}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Download CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
