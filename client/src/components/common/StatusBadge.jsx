import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const s = status.trim();

  // Stock statuses
  if (s === 'In Stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
        In Stock
      </span>
    );
  }

  if (s === 'Low Stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Low Stock
      </span>
    );
  }

  if (s === 'Out of Stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
        Out of Stock
      </span>
    );
  }

  // Order statuses
  if (s === 'Processing') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
        Processing
      </span>
    );
  }

  if (s === 'Dispatched') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
        Dispatched
      </span>
    );
  }

  if (s === 'In Transit') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
        In Transit
      </span>
    );
  }

  if (s === 'Delivered') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        Delivered
      </span>
    );
  }

  // Warehouse / Supplier Statuses
  if (s === 'Active') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        Active
      </span>
    );
  }

  if (s === 'Maintenance') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Maintenance
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {status}
    </span>
  );
}
