import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Activity } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue', // 'blue', 'emerald', 'amber', 'purple'
  trend,
  trendLabel = 'vs last month',
  trendType = 'percent', // 'percent' | 'badge'
}) {
  const colorMap = {
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600 border border-blue-100 shadow-blue-500/10',
      accent: 'border-l-4 border-l-blue-500',
      pill: 'bg-blue-50 text-blue-700 border-blue-200',
      glow: 'hover:shadow-blue-500/5',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-500/10',
      accent: 'border-l-4 border-l-emerald-500',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'hover:shadow-emerald-500/5',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 border border-amber-100 shadow-amber-500/10',
      accent: 'border-l-4 border-l-amber-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
      glow: 'hover:shadow-amber-500/5',
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-600 border border-purple-100 shadow-purple-500/10',
      accent: 'border-l-4 border-l-purple-500',
      pill: 'bg-purple-50 text-purple-700 border-purple-200',
      glow: 'hover:shadow-purple-500/5',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div
      className={`group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-slate-200/80 hover:shadow-md transition-all duration-200 ${scheme.accent} ${scheme.glow} relative flex flex-col justify-between`}
    >
      {/* Top Header & Icon */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              {title}
            </p>
            <div className="flex items-baseline gap-2 pt-1">
              <h3 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
            </div>
            {subtitle && (
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div
            className={`p-3 rounded-2xl ${scheme.bgIcon} flex-shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm`}
          >
            {Icon && <Icon className="w-5 h-5 stroke-[2.2]" />}
          </div>
        </div>
      </div>

      {/* Bottom Trend & Status Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between gap-2 text-xs">
        {trend !== undefined && trend !== null ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {trendType === 'badge' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                {trend}%
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                  Number(trend) >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {Number(trend) >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(Number(trend))}%
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-500 truncate" title={trendLabel}>
              {trendLabel}
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-medium text-slate-400 truncate">
            {subtitle || 'Catalog Telemetry'}
          </div>
        )}

        {/* Live Indicator Dot */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500 flex-shrink-0"
          title="Connected & synchronized"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
