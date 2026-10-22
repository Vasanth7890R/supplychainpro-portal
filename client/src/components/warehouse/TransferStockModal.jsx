import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { api } from '../../api';
import { useNotifications } from '../../context/NotificationContext';
import { ArrowRight, RefreshCw } from 'lucide-react';

export default function TransferStockModal({ isOpen, onClose, warehouses = [], initialSourceWh, onSuccess }) {
  const { showToast } = useNotifications();
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('Inter-warehouse inventory rebalancing');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductStock, setSelectedProductStock] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultSrc = initialSourceWh?.id || (warehouses[0]?.id ? String(warehouses[0].id) : '');
      setFromWhId(String(defaultSrc));

      const defaultDest = warehouses.find((w) => String(w.id) !== String(defaultSrc));
      setToWhId(defaultDest ? String(defaultDest.id) : '');
    }
  }, [isOpen, initialSourceWh, warehouses]);

  // Load available products for source warehouse
  useEffect(() => {
    if (!fromWhId) return;
    async function loadWarehouseProducts() {
      setLoadingProducts(true);
      try {
        const res = await api.getWarehouse(fromWhId);
        if (res.success && res.warehouse?.inventory) {
          const inv = res.warehouse.inventory.filter((item) => item.quantity > 0);
          setAvailableProducts(inv);
          if (inv.length > 0) {
            setProductId(String(inv[0].product_id));
            setSelectedProductStock(inv[0].quantity);
            setQuantity(Math.min(10, inv[0].quantity));
          } else {
            setProductId('');
            setSelectedProductStock(0);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadWarehouseProducts();
  }, [fromWhId]);

  const handleProductChange = (prodId) => {
    setProductId(prodId);
    const item = availableProducts.find((p) => String(p.product_id) === String(prodId));
    if (item) {
      setSelectedProductStock(item.quantity);
      setQuantity(Math.min(10, item.quantity));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWhId || !toWhId || !productId || quantity <= 0) {
      showToast('Please select valid origin, destination, product, and quantity.', 'error');
      return;
    }

    if (fromWhId === toWhId) {
      showToast('Source and Destination warehouses must be different.', 'error');
      return;
    }

    if (quantity > selectedProductStock) {
      showToast(`Requested quantity exceeds available stock (${selectedProductStock}).`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.transferStock({
        from_warehouse_id: fromWhId,
        to_warehouse_id: toWhId,
        product_id: productId,
        quantity: parseInt(quantity, 10),
        reason
      });

      if (res.success) {
        showToast(res.message, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Transfer failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inter-Warehouse Stock Transfer"
      subtitle="Transfer inventory items securely between regional logistics fulfillment nodes"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Source & Destination Warehouse selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Source Hub (From)</label>
            <select
              value={fromWhId}
              onChange={(e) => setFromWhId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination Hub (To)</label>
            <select
              value={toWhId}
              onChange={(e) => setToWhId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {warehouses
                .filter((w) => String(w.id) !== String(fromWhId))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.location})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Product selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700">Select Product to Transfer</label>
            {loadingProducts && <span className="text-[10px] text-blue-600 font-medium">Loading items...</span>}
          </div>

          {availableProducts.length === 0 ? (
            <p className="p-3 bg-amber-50 text-amber-700 rounded-lg text-xs">
              No products with available stock in the selected source warehouse.
            </p>
          ) : (
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {availableProducts.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  [{p.sku}] {p.name} — ({p.quantity} units in stock)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quantity & Stock Check */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity to Transfer
            </label>
            <input
              type="number"
              min="1"
              max={selectedProductStock || 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Available at Origin</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>{selectedProductStock} units</span>
              <span className="text-[10px] text-slate-400 font-normal">In Storage</span>
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Transfer Justification / Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Urgent client replenishment in EMEA"
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || availableProducts.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Transfer...
              </>
            ) : (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                Confirm Transfer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
