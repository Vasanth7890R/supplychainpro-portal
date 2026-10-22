import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    products: 246,
    warehouses: 5,
    suppliers: 12,
    orders: 36,
    totalUnits: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(Date.now());

  // Function to refresh counts from the server
  const refreshCounts = useCallback(async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      // Fetch full summary or lightweight counts
      const res = await api.getDashboardSummary();
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.kpi) {
          setCounts({
            products: Number(res.data.kpi.totalProducts) || 0,
            warehouses: Number(res.data.kpi.totalWarehouses) || 0,
            suppliers: Number(res.data.kpi.totalSuppliers) || 0,
            orders: Number(res.data.kpi.totalOrders) || 0,
            totalUnits: Number(res.data.kpi.totalUnits) || 0,
            totalInventoryValue: Number(res.data.kpi.totalInventoryValue) || 0,
            lowStockCount: Number(res.data.kpi.lowStockCount) || 0,
          });
          setLastSynced(Date.now());
        }
      }
    } catch (err) {
      console.warn('Data sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Initial load when user logs in or mounts
  useEffect(() => {
    if (user) {
      refreshCounts();
    }
  }, [user, refreshCounts]);

  // Window focus & periodic live sync (every 10s)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshCounts();
    }, 10000);

    const onFocus = () => {
      refreshCounts();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, refreshCounts]);

  // Optimistic delta adjuster for immediate UI feedback on add/delete
  const adjustCount = (field, delta = 1) => {
    setCounts((prev) => ({
      ...prev,
      [field]: Math.max(0, (Number(prev[field]) || 0) + delta),
    }));
  };

  return (
    <DataContext.Provider
      value={{
        counts,
        dashboardData,
        isSyncing,
        lastSynced,
        refreshCounts,
        adjustCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
