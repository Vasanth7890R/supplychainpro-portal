import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  Truck,
  ShoppingCart,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCheck,
  Boxes as LogoIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function Sidebar({ currentTab, setCurrentTab, isMobileOpen, setIsMobileOpen }) {
  const { user, logout, switchDemoRole } = useAuth();
  const { counts } = useData();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'inventory', name: 'Inventory Management', icon: Boxes, badge: counts.products },
    { id: 'warehouses', name: 'Warehouses & Map', icon: Warehouse, badge: counts.warehouses },
    { id: 'suppliers', name: 'Supplier Management', icon: Truck, badge: counts.suppliers },
    { id: 'orders', name: 'Order Management', icon: ShoppingCart, badge: counts.orders },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3, badge: 'CSV' },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-80 bg-[#0B1528] text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/80 bg-[#091222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <LogoIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight font-['Outfit']">SupplyChain</span>
                <span className="font-bold text-sky-400 text-lg font-['Outfit']">Pro</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Enterprise Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Main Navigation</p>

          {navigation.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="whitespace-nowrap truncate font-medium text-[13.5px]">{item.name}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold tabular-nums flex-shrink-0 ml-2 transition-all ${
                      isActive
                        ? 'bg-blue-700/90 text-white shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 border border-slate-700/50 group-hover:text-white group-hover:border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Role Switcher Banner */}
        <div className="p-4 mx-4 mb-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Access Role
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                user?.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {user?.role === 'admin' ? 'Admin' : 'Staff'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => switchDemoRole('admin')}
              className={`py-1.5 px-2 rounded-lg font-bold transition-colors text-center text-xs ${
                user?.role === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchDemoRole('staff')}
              className={`py-1.5 px-2 rounded-lg font-bold transition-colors text-center text-xs ${
                user?.role === 'staff'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Staff
            </button>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#091222] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.role === 'admin' ? 'S' : 'N')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate" title={user?.name}>
                {user?.name || (user?.role === 'admin' ? 'Sabarivasan M' : 'Nirajana')}
              </p>
              <p className="text-[10px] text-sky-400 font-semibold truncate">
                {user?.role === 'admin' ? 'System Administrator' : 'Warehouse Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
