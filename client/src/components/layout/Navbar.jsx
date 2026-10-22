import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function Navbar({ currentTab, setCurrentTab, setIsMobileOpen, onGlobalSearch }) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dbStatus, setDbStatus] = useState({ type: 'mysql', database: 'supplychainpro' });
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getSystemStatus();
        if (res.success) {
          setDbStatus(res.database);
        }
      } catch (err) {
        // ignore
      }
    }
    checkStatus();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch && searchValue.trim()) {
      onGlobalSearch(searchValue.trim());
      setCurrentTab('inventory');
    }
  };

  const pageTitles = {
    dashboard: 'Supply Chain Operations Dashboard',
    inventory: 'Inventory & Stock Management',
    warehouses: 'Distributed Warehouses & Locations',
    suppliers: 'Supplier & Vendor Directory',
    orders: 'Customer Order Tracking & Fulfillment',
    reports: 'Reports & Analytics Center',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            {pageTitles[currentTab] || 'SupplyChainPro'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Real-time multi-warehouse synchronization & logistics portal
          </p>
        </div>
      </div>

      {/* Right: Search, DB Pill, Notifications, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, product, order..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 lg:w-72 transition-all placeholder:text-slate-400"
          />
        </form>

        {/* Database Status Indicator */}
        <div
          title={`Connected to ${dbStatus.type?.toUpperCase()} Database (${dbStatus.database})`}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>{dbStatus.type === 'mysql' ? 'MySQL Connected' : 'SQLite DB'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread system alerts</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors ${!n.read_status ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${n.type === 'low_stock'
                              ? 'bg-amber-100 text-amber-700'
                              : n.type === 'transfer'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 inline-block">
                            {new Date(n.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.read_status && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge / Role Display */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.role === 'admin' ? 'S' : 'N')}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || (user?.role === 'admin' ? 'Sabarivasan M' : 'Nirajana')}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
              {user?.role === 'admin' ? 'System Admin' : 'Warehouse Staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
