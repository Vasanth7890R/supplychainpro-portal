import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Warehouse,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('admin@supplychainpro.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res?.success) {
      showToast('Welcome back to SupplyChainPro!', 'success');
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res?.message || 'Invalid email or password.');
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#070e1b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B1528] p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 mb-3">
            <Boxes className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-black font-['Outfit'] tracking-tight">
            SupplyChain<span className="text-sky-400">Pro</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Distributed Supply Chain & Inventory Tracking Portal
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@supplychainpro.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@supplychainpro.com', 'admin123')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 font-semibold text-center transition-colors flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin Demo</span>
                </div>
                <span className="text-[10px] text-blue-600/80 font-normal">Full privileges</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@supplychainpro.com', 'staff123')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-center transition-colors flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Staff Demo</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Fulfillment role</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
