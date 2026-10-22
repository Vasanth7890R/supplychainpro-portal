import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Warehouses from './pages/Warehouses';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Login from './pages/Login';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070e1b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-spin">
            <span className="w-3 h-3 bg-white rounded-full"></span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Initializing SupplyChainPro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  const handleGlobalSearch = (term) => {
    setGlobalSearchTerm(term);
    setCurrentTab('inventory');
  };

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      onGlobalSearch={handleGlobalSearch}
    >
      {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
      {currentTab === 'inventory' && <Inventory initialSearch={globalSearchTerm} />}
      {currentTab === 'warehouses' && <Warehouses />}
      {currentTab === 'suppliers' && <Suppliers />}
      {currentTab === 'orders' && <Orders />}
      {currentTab === 'reports' && <Reports />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
}
