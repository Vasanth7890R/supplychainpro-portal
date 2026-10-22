import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Warehouse,
  Truck,
  ShoppingCart,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api';
import { useData } from '../context/DataContext';
import StatCard from '../components/common/StatCard';
import MonthlyStockChart from '../components/dashboard/MonthlyStockChart';
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart';
import LowStockAlerts from '../components/dashboard/LowStockAlerts';
import RecentOrders from '../components/dashboard/RecentOrders';
import RecentMovements from '../components/dashboard/RecentMovements';
import WarehouseSummary from '../components/dashboard/WarehouseSummary';

export default function Dashboard({ setCurrentTab }) {
  const { counts, refreshCounts: syncGlobalCounts } = useData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await api.getDashboardSummary();
      if (res.success) {
        setData(res.data);
      }
      await syncGlobalCounts();
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading supply chain telemetry...</p>
      </div>
    );
  }

  const kpi = {
    totalProducts: counts.products ?? (data?.kpi?.totalProducts ?? 0),
    totalWarehouses: counts.warehouses ?? (data?.kpi?.totalWarehouses ?? 0),
    totalSuppliers: counts.suppliers ?? (data?.kpi?.totalSuppliers ?? 0),
    totalOrders: counts.orders ?? (data?.kpi?.totalOrders ?? 0),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0B1528] to-blue-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              Autonomous Logistics Hub
            </span>
            <span className="text-xs text-slate-400">• Multi-Region Active</span>
          </div>
          <h2 className="text-2xl font-black mt-1 font-['Outfit'] tracking-tight">
            Distributed Supply Chain Overview
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Monitoring inventory velocity, low-stock alerts, cross-warehouse shipments, and supplier logistics across 5 global hubs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
          <button
            onClick={() => setCurrentTab('inventory')}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-1.5"
          >
            Manage Inventory
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Four Statistic Cards (Total Products: 248, Warehouses: 5, Suppliers: 12, Orders: 36) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={kpi.totalProducts}
          subtitle="SKUs cataloged"
          icon={Boxes}
          colorScheme="blue"
          trend={12.4}
          trendLabel="vs last month"
        />

        <StatCard
          title="Total Warehouses"
          value={kpi.totalWarehouses}
          subtitle="Global hubs active"
          icon={Warehouse}
          colorScheme="emerald"
          trend={100}
          trendType="badge"
          trendLabel="Operational"
        />

        <StatCard
          title="Total Suppliers"
          value={kpi.totalSuppliers}
          subtitle="Tier-1 verified vendors"
          icon={Truck}
          colorScheme="purple"
          trend={98.4}
          trendType="badge"
          trendLabel="Fulfillment Rate"
        />

        <StatCard
          title="Total Orders"
          value={kpi.totalOrders}
          subtitle="Active & completed"
          icon={ShoppingCart}
          colorScheme="amber"
          trend={15.2}
          trendLabel="vs last quarter"
        />
      </div>

      {/* 2. Charts Row: Monthly Stock-Level Line Chart & Category Doughnut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyStockChart data={data?.monthlyStockTrends || []} />
        </div>
        <div>
          <CategoryDonutChart data={data?.categoryDistribution || []} />
        </div>
      </div>

      {/* 3. Low-Stock Alerts Table */}
      <LowStockAlerts
        alerts={data?.lowStockAlerts || []}
        onNavigateToInventory={() => setCurrentTab('inventory')}
      />

      {/* 4. Recent Orders & Movements Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrders
          orders={data?.recentOrders || []}
          onNavigateToOrders={() => setCurrentTab('orders')}
        />
        <RecentMovements movements={data?.recentMovements || []} />
      </div>

      {/* 5. Warehouse Stock Summary */}
      <WarehouseSummary
        warehouses={data?.warehouseSummary || []}
        onNavigateToWarehouses={() => setCurrentTab('warehouses')}
      />
    </div>
  );
}
