import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  MapPin,
  Tag,
  DollarSign,
  CheckCircle2,
  PackageX
} from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Inventory({ initialSearch = '' }) {
  const { showToast } = useNotifications();
  const { isAdmin } = useAuth();
  const { refreshCounts, adjustCount } = useData();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_name: '',
    warehouse_id: '1',
    initial_quantity: 50,
    min_stock_level: 25,
    unit_price: 120.0,
    supplier_name: 'Apex Global Semiconductors',
    description: '',
  });

  // Fetch Categories & Warehouses on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catRes, whRes] = await Promise.all([
          api.getCategories(),
          api.getWarehouses(),
        ]);
        if (catRes.success && catRes.categories?.length > 0) {
          setCategories(catRes.categories);
          setFormData((prev) => ({
            ...prev,
            category_name: prev.category_name || catRes.categories[0].name,
          }));
        }
        if (whRes.success && whRes.warehouses?.length > 0) {
          setWarehouses(whRes.warehouses);
          setFormData((prev) => ({
            ...prev,
            warehouse_id: prev.warehouse_id || String(whRes.warehouses[0].id),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMetadata();
  }, []);

  // Fetch Inventory items
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getInventory({
        search,
        category: selectedCategory,
        warehouse_id: selectedWarehouse,
        status: selectedStatus,
        page,
        limit: 15,
      });

      if (res.success) {
        setItems(res.items || []);
        setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showToast('Failed to load inventory records', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedWarehouse, selectedStatus, page, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle Add Product
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.unit_price) {
      showToast('Please fill in required fields (Name, SKU, Price).', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createProduct(formData);
      if (res.success) {
        showToast(`Product "${formData.name}" added successfully!`, 'success');
        setIsAddOpen(false);
        setFormData({
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          category_name: categories[0]?.name || '',
          warehouse_id: '1',
          initial_quantity: 50,
          min_stock_level: 25,
          unit_price: 120.0,
          supplier_name: 'Apex Global Semiconductors',
          description: '',
        });
        adjustCount('products', 1);
        fetchInventory();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category_name: product.category_name,
      warehouse_id: String(product.warehouse_id || '1'),
      quantity: product.quantity,
      min_stock_level: product.min_stock_level,
      unit_price: product.unit_price,
      supplier_name: product.supplier_name || '',
      description: product.description || '',
    });
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setActionLoading(true);
    try {
      const res = await api.updateProduct(editingProduct.id, formData);
      if (res.success) {
        showToast('Product updated successfully.', 'success');
        setIsEditOpen(false);
        setEditingProduct(null);
        fetchInventory();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setActionLoading(true);
    try {
      const res = await api.deleteProduct(deletingProduct.id);
      if (res.success) {
        showToast(res.message, 'success');
        setIsDeleteOpen(false);
        setDeletingProduct(null);
        adjustCount('products', -1);
        fetchInventory();
        refreshCounts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Low stock counter among fetched items
  const lowStockCount = items.filter((i) => i.stock_status === 'Low Stock' || i.stock_status === 'Out of Stock').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Title and "Add Product" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              Inventory Catalog
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {pagination.total} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock quantities, thresholds, storage aisles, and multi-hub tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormData({
                sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                name: '',
                category_name: categories[0]?.name || 'Industrial Electronics',
                warehouse_id: String(warehouses[0]?.id || '1'),
                initial_quantity: 60,
                min_stock_level: 25,
                unit_price: 145.0,
                supplier_name: 'Apex Global Semiconductors',
                description: '',
              });
              setIsAddOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Automatic Low-Stock Warning Banner if any items low in view */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                Low-Stock Threshold Alert: {lowStockCount} items requiring restocking
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Some inventory levels have dropped below configured safety minimums. Replenish or transfer stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Low Stock' ? '' : 'Low Stock')}
            className="px-3 py-1.5 rounded-lg font-semibold bg-white text-amber-800 border border-amber-300 hover:bg-amber-100/50 transition-colors flex-shrink-0"
          >
            {selectedStatus === 'Low Stock' ? 'Clear Filter' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, Product Name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-slate-700"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter */}
        <div>
          <select
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-slate-700"
          >
            <option value="">All Warehouses ({warehouses.length})</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.location.split(',')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-slate-700"
          >
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock (Healthy)</option>
            <option value="Low Stock">Low Stock (Under Min)</option>
            <option value="Out of Stock">Out of Stock (Zero)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4 font-semibold">Product ID / SKU</th>
                <th className="py-3.5 px-4 font-semibold">Product Name</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Warehouse Location</th>
                <th className="py-3.5 px-4 font-semibold text-right">Available Qty</th>
                <th className="py-3.5 px-4 font-semibold text-right">Min Level</th>
                <th className="py-3.5 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-3.5 px-4 font-semibold text-center">Stock Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Fetching inventory items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <PackageX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No products matched the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((prod) => (
                  <tr key={`${prod.id}-${prod.warehouse_id}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {prod.sku}
                    </td>

                    {/* Product Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate" title={prod.name}>
                      {prod.name}
                      <span className="block text-[11px] font-normal text-slate-400">
                        Aisle: {prod.aisle} • Shelf: {prod.shelf}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        {prod.category_name}
                      </span>
                    </td>

                    {/* Warehouse Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prod.warehouse_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-5">{prod.warehouse_location}</span>
                    </td>

                    {/* Available Quantity */}
                    <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                      <span
                        className={
                          prod.quantity === 0
                            ? 'text-rose-600 text-sm'
                            : prod.quantity <= prod.min_stock_level
                            ? 'text-amber-600 text-sm'
                            : 'text-slate-900 text-sm'
                        }
                      >
                        {Number(prod.quantity).toLocaleString()}
                      </span>
                    </td>

                    {/* Min Stock Level */}
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium whitespace-nowrap">
                      {prod.min_stock_level}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${Number(prod.unit_price).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={prod.stock_status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(prod)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setDeletingProduct(prod);
                            setIsDeleteOpen(true);
                          }}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Inventory Product"
        subtitle="Add a catalog item with initial warehouse inventory and safety stock thresholds"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Product Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Title / Specification *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ultra-High Frequency RF Transceiver Module"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.initial_quantity}
                onChange={(e) => setFormData({ ...formData, initial_quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Safety Level</label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Warehouse Hub</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Manufacturer</label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Logistics Specifications</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Engineering details, packaging requirements..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Register Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory Item"
        subtitle={`Editing ${editingProduct?.sku} - ${editingProduct?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warehouse Stock (Units)</label>
              <input
                type="number"
                min="0"
                value={formData.quantity !== undefined ? formData.quantity : 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Safety Threshold</label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Product from Catalog"
        message={`Are you sure you want to permanently delete product "${deletingProduct?.name}" (${deletingProduct?.sku})? This will also remove warehouse inventory allocations.`}
        confirmText="Confirm Delete"
        loading={actionLoading}
        isDanger={true}
      />
    </div>
  );
}
