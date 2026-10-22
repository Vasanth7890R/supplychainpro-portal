import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Navigation,
  ShieldCheck,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { api } from '../api';
import WarehouseMap from '../components/warehouse/WarehouseMap';
import TransferStockModal from '../components/warehouse/TransferStockModal';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Warehouses() {
  const { showToast } = useNotifications();
  const { isAdmin } = useAuth();
  const { refreshCounts, adjustCount } = useData();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSourceWh, setTransferSourceWh] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingWh, setDeletingWh] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    country: '',
    latitude: 0,
    longitude: 0,
    manager: '',
    email: '',
    phone: '',
    storage_capacity: 100000,
    status: 'Active',
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.getWarehouses();
      if (res.success) {
        setWarehouses(res.warehouses || []);
      }
    } catch (err) {
      showToast('Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.createWarehouse(formData);
      if (res.success) {
        showToast(`Warehouse "${formData.name}" added successfully!`, 'success');
        setIsAddOpen(false);
        adjustCount('warehouses', 1);
        fetchWarehouses();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add warehouse', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (wh) => {
    setEditingWh(wh);
    setFormData({
      code: wh.code,
      name: wh.name,
      location: wh.location,
      country: wh.country,
      latitude: wh.latitude,
      longitude: wh.longitude,
      manager: wh.manager,
      email: wh.email,
      phone: wh.phone,
      storage_capacity: wh.storage_capacity,
      status: wh.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingWh) return;
    setActionLoading(true);
    try {
      const res = await api.updateWarehouse(editingWh.id, formData);
      if (res.success) {
        showToast('Warehouse details updated successfully.', 'success');
        setIsEditOpen(false);
        fetchWarehouses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update warehouse', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWh) return;
    setActionLoading(true);
    try {
      const res = await api.deleteWarehouse(deletingWh.id);
      if (res.success) {
        showToast(res.message, 'success');
        setIsDeleteOpen(false);
        adjustCount('warehouses', -1);
        fetchWarehouses();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove warehouse', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              Warehouse Network & Hubs
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {warehouses.length} Active Nodes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic distribution, capacity limits, facility managers, and inter-hub transfer operations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setTransferSourceWh(null);
              setIsTransferOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50/70 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            Transfer Stock
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setFormData({
                  code: `WH-HUB-0${warehouses.length + 1}`,
                  name: '',
                  location: 'Tokyo, Japan',
                  country: 'Japan',
                  latitude: 35.6762,
                  longitude: 139.6503,
                  manager: '',
                  email: '',
                  phone: '+81 3 0000 0000',
                  storage_capacity: 110000,
                  status: 'Active',
                });
                setIsAddOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Warehouse Hub
            </button>
          )}
        </div>
      </div>

      {/* 1. Map-Style Location Visualization */}
      <WarehouseMap
        warehouses={warehouses}
        onTransferClick={(wh) => {
          setTransferSourceWh(wh || null);
          setIsTransferOpen(true);
        }}
      />

      {/* 2. Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const util = Number(wh.utilization_pct || 0);
          const barColor =
            util > 85 ? 'bg-rose-500' : util > 65 ? 'bg-amber-500' : 'bg-blue-600';

          return (
            <div
              key={wh.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover-shadow space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 uppercase">
                      {wh.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mt-0.5">
                      {wh.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {wh.location}
                    </p>
                  </div>

                  <StatusBadge status={wh.status} />
                </div>

                {/* Manager & Contact */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hub Manager:</span>
                    <span className="font-semibold text-slate-900">{wh.manager}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-blue-600 hover:underline">{wh.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telephone:</span>
                    <span>{wh.phone}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Storage Capacity</span>
                    <span className="font-bold text-slate-900">{util}% Utilized</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      Stored:{' '}
                      <strong className="text-slate-700">
                        {Number(wh.total_stock_items || 0).toLocaleString()}
                      </strong>{' '}
                      units
                    </span>
                    <span>Max: {Number(wh.storage_capacity).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setTransferSourceWh(wh);
                    setIsTransferOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Transfer From Here
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(wh)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit Hub"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setDeletingWh(wh);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Hub"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Transfer Modal */}
      <TransferStockModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        warehouses={warehouses}
        initialSourceWh={transferSourceWh}
        onSuccess={fetchWarehouses}
      />

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Warehouse Hub"
        subtitle="Provision a regional logistics depository node"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hub Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tokyo Central Logistics Hub"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City, Location *</label>
              <input
                type="text"
                required
                placeholder="Tokyo, Japan"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hub Manager *</label>
              <input
                type="text"
                required
                placeholder="Kenji Sato"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Storage Capacity *</label>
              <input
                type="number"
                min="1000"
                required
                value={formData.storage_capacity}
                onChange={(e) => setFormData({ ...formData, storage_capacity: parseInt(e.target.value, 10) || 100000 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Create Hub'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Warehouse Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Warehouse Hub"
        subtitle={`Editing ${editingWh?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hub Manager</label>
              <input
                type="text"
                required
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Storage Capacity</label>
              <input
                type="number"
                min="1000"
                value={formData.storage_capacity}
                onChange={(e) => setFormData({ ...formData, storage_capacity: parseInt(e.target.value, 10) || 100000 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Warehouse Hub"
        message={`Are you sure you want to delete "${deletingWh?.name}" (${deletingWh?.code})? Warehouses holding inventory cannot be removed until stock is transferred.`}
        confirmText="Confirm Delete"
        loading={actionLoading}
        isDanger={true}
      />
    </div>
  );
}
