import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Truck,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Orders() {
  const { showToast } = useNotifications();
  const { isAdmin } = useAuth();
  const { refreshCounts, adjustCount } = useData();

  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    warehouse_id: '1',
    product_id: '',
    quantity: 10,
    shipping_carrier: 'DHL Global Forwarding',
    notes: '',
  });

  // Load auxiliary data
  useEffect(() => {
    async function loadAux() {
      try {
        const [whRes, pRes] = await Promise.all([
          api.getWarehouses(),
          api.getInventory({ limit: 100 }),
        ]);
        if (whRes.success) setWarehouses(whRes.warehouses || []);
        if (pRes.success) {
          setProducts(pRes.items || []);
          if (pRes.items && pRes.items.length > 0) {
            setFormData((prev) => ({ ...prev, product_id: String(pRes.items[0].id) }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAux();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOrders({
        search,
        status: statusFilter,
        warehouse_id: warehouseFilter,
        page,
        limit: 15,
      });
      if (res.success) {
        setOrders(res.orders || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, warehouseFilter, page, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status inline
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showToast(res.message, 'success');
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  // Open order tracking details
  const openTracking = async (orderId) => {
    try {
      const res = await api.getOrder(orderId);
      if (res.success) {
        setTrackingOrder(res.order);
      }
    } catch (err) {
      showToast('Failed to fetch order tracking', 'error');
    }
  };

  // Create Order
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.warehouse_id || !formData.product_id) {
      showToast('Customer name, warehouse, and product are required.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createOrder({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || 'client@enterprise.com',
        warehouse_id: formData.warehouse_id,
        items: [
          {
            product_id: formData.product_id,
            quantity: parseInt(formData.quantity, 10) || 1,
          },
        ],
        shipping_carrier: formData.shipping_carrier,
        notes: formData.notes,
      });

      if (res.success) {
        showToast(`Order created successfully: ${res.orderNumber}`, 'success');
        setIsCreateOpen(false);
        setFormData({
          customer_name: '',
          customer_email: '',
          warehouse_id: '1',
          product_id: products[0]?.id ? String(products[0].id) : '',
          quantity: 10,
          shipping_carrier: 'DHL Global Forwarding',
          notes: '',
        });
        adjustCount('orders', 1);
        fetchOrders();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Order
  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return;
    setActionLoading(true);
    try {
      const res = await api.deleteOrder(deletingOrder.id);
      if (res.success) {
        showToast(res.message, 'success');
        setIsDeleteOpen(false);
        adjustCount('orders', -1);
        fetchOrders();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove order', 'error');
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
              Order Fulfillment & Tracking
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {pagination.total} Commercial Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor consignment pipelines, dispatch milestones, carrier tracking, and order states
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Commercial Order
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Tracking..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Fulfillment Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div>
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Fulfillment Hubs</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4 font-semibold">Order ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                <th className="py-3.5 px-4 font-semibold">Fulfillment Warehouse</th>
                <th className="py-3.5 px-4 font-semibold text-right">Units / Items</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Order Date</th>
                <th className="py-3.5 px-4 font-semibold">Expected Delivery</th>
                <th className="py-3.5 px-4 font-semibold text-center">Order Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Fetching orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No orders match the current filter.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {ord.order_number}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {ord.tracking_number}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate" title={ord.customer_name}>
                      {ord.customer_name}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {ord.shipping_carrier}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ord.warehouse_name || 'Global Hub'}</span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                      {ord.total_units ? `${ord.total_units} units` : `${ord.item_count} items`}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${Number(ord.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                      {ord.order_date}
                    </td>

                    {/* Expected Delivery */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold">
                      {ord.expected_delivery}
                    </td>

                    {/* Status updater dropdown */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="py-1 px-2.5 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none transition-colors"
                        style={{
                          backgroundColor:
                            ord.status === 'Delivered'
                              ? '#ecfdf5'
                              : ord.status === 'In Transit'
                              ? '#f0f9ff'
                              : ord.status === 'Dispatched'
                              ? '#faf5ff'
                              : '#eff6ff',
                          color:
                            ord.status === 'Delivered'
                              ? '#047857'
                              : ord.status === 'In Transit'
                              ? '#0369a1'
                              : ord.status === 'Dispatched'
                              ? '#7e22ce'
                              : '#1d4ed8',
                          borderColor:
                            ord.status === 'Delivered'
                              ? '#a7f3d0'
                              : ord.status === 'In Transit'
                              ? '#bae6fd'
                              : ord.status === 'Dispatched'
                              ? '#e9d5ff'
                              : '#bfdbfe',
                        }}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTracking(ord.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Track Consignment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Track
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setDeletingOrder(ord);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Order (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Order Tracking Modal */}
      <Modal
        isOpen={Boolean(trackingOrder)}
        onClose={() => setTrackingOrder(null)}
        title={`Order Tracking: ${trackingOrder?.order_number}`}
        subtitle={`Handled by ${trackingOrder?.shipping_carrier} • Tracking #${trackingOrder?.tracking_number}`}
        maxWidth="max-w-2xl"
      >
        {trackingOrder && (
          <div className="space-y-6 text-xs">
            {/* Customer & Status Header */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Consignee</p>
                <h4 className="text-sm font-bold text-slate-900">{trackingOrder.customer_name}</h4>
                <p className="text-slate-500 text-[11px]">{trackingOrder.customer_email}</p>
              </div>

              <div className="text-right">
                <StatusBadge status={trackingOrder.status} />
                <p className="text-xs font-extrabold text-slate-900 mt-1">
                  ${Number(trackingOrder.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Visual Tracking Milestones */}
            <div>
              <h5 className="font-bold text-slate-800 mb-3 font-['Outfit'] text-sm">
                Consignment Journey Milestones
              </h5>
              <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {trackingOrder.timeline?.map((step, idx) => (
                  <div key={idx} className="relative flex items-start justify-between">
                    <span
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        step.completed ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      {step.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <div>
                      <p className={`font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.step}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {step.completed ? 'Milestone achieved & verified' : 'Pending route transition'}
                      </p>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{step.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h5 className="font-bold text-slate-800 mb-2 font-['Outfit'] text-sm">
                Allocated Consignment Items
              </h5>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trackingOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.product_name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setTrackingOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
              >
                Close Tracking
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Commercial Order"
        subtitle="Initiate order fulfillment and auto-deduct hub inventory"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer / Enterprise Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Siemens Energy Global"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Email</label>
              <input
                type="email"
                placeholder="procurement@siemens.com"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fulfillment Warehouse *</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logistics Freight Carrier</label>
              <select
                value={formData.shipping_carrier}
                onChange={(e) => setFormData({ ...formData, shipping_carrier: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="DHL Global Forwarding">DHL Global Forwarding</option>
                <option value="FedEx International Priority">FedEx International Priority</option>
                <option value="UPS Worldwide Express">UPS Worldwide Express</option>
                <option value="Maersk Air Cargo">Maersk Air Cargo</option>
                <option value="Kuehne + Nagel Logistics">Kuehne + Nagel Logistics</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Select Catalog Product *</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} (${Number(p.unit_price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Shipping Notes</label>
            <input
              type="text"
              placeholder="e.g. Temperature controlled cargo, fragile micro-optics"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Dispatch Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Order Record"
        message={`Are you sure you want to delete order "${deletingOrder?.order_number}" (${deletingOrder?.customer_name})?`}
        confirmText="Confirm Delete"
        loading={actionLoading}
        isDanger={true}
      />
    </div>
  );
}
