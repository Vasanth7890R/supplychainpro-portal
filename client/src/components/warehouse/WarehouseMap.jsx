import React, { useState } from 'react';
import { MapPin, Navigation, Warehouse, Users, PackageCheck, ArrowRight, ShieldCheck } from 'lucide-react';

export default function WarehouseMap({ warehouses = [], onSelectWarehouse, onTransferClick }) {
  const [activeWarehouse, setActiveWarehouse] = useState(warehouses[0] || null);

  // Approximate SVG coordinate projection: x (0 to 1000), y (0 to 500)
  // Standard equirectangular projection
  const getCoordinates = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const hubCoords = {
    'WH-NYC-01': { x: 294, y: 137, name: 'New York' },
    'WH-LDN-02': { x: 499, y: 107, name: 'London' },
    'WH-BER-03': { x: 537, y: 104, name: 'Berlin' },
    'WH-SIN-04': { x: 788, y: 246, name: 'Singapore' },
    'WH-SYD-05': { x: 920, y: 344, name: 'Sydney' },
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-lg font-extrabold font-['Outfit'] tracking-tight text-white">
              Global Distributed Hub Network
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-continental logistics nodes with synchronized inventory telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onTransferClick && onTransferClick()}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Transfer Stock Between Hubs
          </button>
        </div>
      </div>

      {/* Interactive Map Visual */}
      <div className="relative w-full aspect-[2/1] min-h-[300px] max-h-[460px] bg-[#0c162d] rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* World Map SVG background grid */}
        <svg viewBox="0 0 1000 500" className="w-full h-full object-cover opacity-80">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Gradient for flight corridors */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Continents Outline Path (Stylized Geo Silhouette) */}
          <g fill="#162238" stroke="#1e3a5f" strokeWidth="0.8">
            {/* North America */}
            <path d="M 120,80 Q 200,60 270,90 Q 320,110 300,160 Q 250,220 200,210 Q 140,160 120,80 Z" />
            {/* South America */}
            <path d="M 250,230 Q 310,250 330,330 Q 300,420 270,450 Q 240,360 250,230 Z" />
            {/* Europe */}
            <path d="M 460,70 Q 560,60 580,120 Q 520,160 480,140 Q 450,110 460,70 Z" />
            {/* Africa */}
            <path d="M 470,170 Q 560,180 580,260 Q 550,370 510,380 Q 450,280 470,170 Z" />
            {/* Asia */}
            <path d="M 600,60 Q 820,50 860,140 Q 820,240 700,220 Q 610,160 600,60 Z" />
            {/* Australia */}
            <path d="M 800,310 Q 920,290 940,360 Q 890,430 810,390 Z" />
          </g>

          {/* Connecting Logistics Flight Routes (Curved dashed arcs) */}
          {/* NYC to London */}
          <path d="M 294,137 Q 396,80 499,107" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* London to Berlin */}
          <path d="M 499,107 Q 518,100 537,104" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
          {/* Berlin to Singapore */}
          <path d="M 537,104 Q 662,140 788,246" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          {/* Singapore to Sydney */}
          <path d="M 788,246 Q 854,280 920,344" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
          {/* NYC to Singapore (Transpacific) */}
          <path d="M 294,137 Q 150,220 80,280" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.3" />

          {/* Interactive Hub Markers */}
          {warehouses.map((wh) => {
            const coords = hubCoords[wh.code] || getCoordinates(wh.latitude, wh.longitude);
            const isSelected = (activeWarehouse?.id || warehouses[0]?.id) === wh.id;

            return (
              <g
                key={wh.id}
                className="cursor-pointer group"
                onClick={() => {
                  setActiveWarehouse(wh);
                  if (onSelectWarehouse) onSelectWarehouse(wh);
                }}
              >
                {/* Pulsing halo */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? 16 : 10}
                  className={isSelected ? 'fill-blue-500/30 animate-pulse' : 'fill-sky-400/20 group-hover:fill-sky-400/30'}
                />

                {/* Outer Ring */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? 8 : 6}
                  fill={isSelected ? '#3b82f6' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all transform group-hover:scale-125"
                />

                {/* Inner Dot */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="2.5"
                  fill="#ffffff"
                />

                {/* City Tag */}
                <text
                  x={coords.x}
                  y={coords.y - 12}
                  textAnchor="middle"
                  fill={isSelected ? '#38bdf8' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none select-none tracking-wider uppercase font-mono"
                >
                  {wh.location.split(',')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Warehouse Overlay Card */}
        {activeWarehouse && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-sky-400 font-bold uppercase">{activeWarehouse.code}</span>
                <h4 className="text-sm font-bold text-white font-['Outfit']">{activeWarehouse.name}</h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  {activeWarehouse.location}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {activeWarehouse.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">Hub Manager:</span>
                <p className="font-semibold text-slate-200">{activeWarehouse.manager}</p>
              </div>
              <div>
                <span className="text-slate-400">Total Stock:</span>
                <p className="font-semibold text-sky-400">
                  {Number(activeWarehouse.total_stock_items || activeWarehouse.current_stock || 0).toLocaleString()} units
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-slate-400 text-[11px]">Capacity: {Number(activeWarehouse.storage_capacity).toLocaleString()}</span>
              <button
                onClick={() => onTransferClick && onTransferClick(activeWarehouse)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Transfer from here <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
