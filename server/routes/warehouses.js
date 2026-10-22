const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/warehouses
// Returns warehouses with dynamic stock items count, total items, and capacity percentage
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        w.id,
        w.code,
        w.name,
        w.location,
        w.country,
        w.latitude,
        w.longitude,
        w.manager,
        w.email,
        w.phone,
        w.storage_capacity,
        w.status,
        w.created_at,
        COUNT(DISTINCT i.product_id) as total_products,
        COALESCE(SUM(i.quantity), 0) as total_stock_items,
        ROUND((COALESCE(SUM(i.quantity), 0) * 100.0) / w.storage_capacity, 1) as utilization_pct
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      GROUP BY w.id
      ORDER BY w.id ASC
    `);

    res.json({ success: true, warehouses: rows });
  } catch (err) {
    console.error('Fetch warehouses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch warehouses.' });
  }
});

// GET /api/warehouses/:id
router.get('/:id', async (req, res) => {
  try {
    const [wRows] = await db.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
    if (!wRows || wRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    }

    const warehouse = wRows[0];
    const [stockRows] = await db.query(`
      SELECT 
        p.id as product_id,
        p.sku,
        p.name,
        p.category_name,
        p.unit_price,
        p.min_stock_level,
        i.quantity,
        i.aisle,
        i.shelf,
        CASE
          WHEN i.quantity = 0 THEN 'Out of Stock'
          WHEN i.quantity <= p.min_stock_level THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.warehouse_id = ?
      ORDER BY i.quantity DESC
    `, [warehouse.id]);

    res.json({
      success: true,
      warehouse: {
        ...warehouse,
        inventory: stockRows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch warehouse details.' });
  }
});

// POST /api/warehouses (Add warehouse)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { code, name, location, country, latitude, longitude, manager, email, phone, storage_capacity, status = 'Active' } = req.body;

    if (!code || !name || !location || !manager || !storage_capacity) {
      return res.status(400).json({ success: false, message: 'Please provide code, name, location, manager, and storage capacity.' });
    }

    const [existing] = await db.query('SELECT id FROM warehouses WHERE code = ?', [code.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Warehouse code "${code}" is already in use.` });
    }

    const [result] = await db.query(`
      INSERT INTO warehouses (code, name, location, country, latitude, longitude, manager, email, phone, storage_capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim(),
      name.trim(),
      location.trim(),
      country || 'Global',
      latitude ? parseFloat(latitude) : 0,
      longitude ? parseFloat(longitude) : 0,
      manager.trim(),
      email || `${code.toLowerCase()}@supplychainpro.com`,
      phone || '+1 (555) 000-0000',
      parseInt(storage_capacity, 10),
      status
    ]);

    res.status(201).json({ success: true, message: 'Warehouse created successfully.', id: result.insertId });
  } catch (err) {
    console.error('Add warehouse error:', err);
    res.status(500).json({ success: false, message: 'Failed to add warehouse.' });
  }
});

// PUT /api/warehouses/:id (Edit warehouse)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, country, latitude, longitude, manager, email, phone, storage_capacity, status } = req.body;

    const [existing] = await db.query('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    }

    await db.query(`
      UPDATE warehouses
      SET name = ?, location = ?, country = ?, latitude = ?, longitude = ?, manager = ?, email = ?, phone = ?, storage_capacity = ?, status = ?
      WHERE id = ?
    `, [
      name || existing[0].name,
      location || existing[0].location,
      country || existing[0].country,
      latitude !== undefined ? parseFloat(latitude) : existing[0].latitude,
      longitude !== undefined ? parseFloat(longitude) : existing[0].longitude,
      manager || existing[0].manager,
      email || existing[0].email,
      phone || existing[0].phone,
      storage_capacity !== undefined ? parseInt(storage_capacity, 10) : existing[0].storage_capacity,
      status || existing[0].status,
      id
    ]);

    res.json({ success: true, message: 'Warehouse details updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update warehouse.' });
  }
});

// DELETE /api/warehouses/:id (Remove warehouse - Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if warehouse has active stock
    const [invRows] = await db.query('SELECT SUM(quantity) as totalQty FROM inventory WHERE warehouse_id = ?', [id]);
    const totalQty = invRows[0]?.totalQty || 0;

    if (totalQty > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warehouse with ${totalQty} units in storage. Please transfer or clear stock first.`
      });
    }

    await db.query('DELETE FROM warehouses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Warehouse deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove warehouse.' });
  }
});

// POST /api/warehouses/transfer (Inter-warehouse stock transfer)
router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const { from_warehouse_id, to_warehouse_id, product_id, quantity, reason } = req.body;

    const fromWhId = parseInt(from_warehouse_id, 10);
    const toWhId = parseInt(to_warehouse_id, 10);
    const prodId = parseInt(product_id, 10);
    const qty = parseInt(quantity, 10);

    if (!fromWhId || !toWhId || !prodId || !qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid source warehouse, destination warehouse, product, and positive quantity are required.' });
    }

    if (fromWhId === toWhId) {
      return res.status(400).json({ success: false, message: 'Source and destination warehouses must be different.' });
    }

    // Verify product
    const [prodRows] = await db.query('SELECT id, name, sku FROM products WHERE id = ?', [prodId]);
    if (!prodRows || prodRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const product = prodRows[0];

    // Check source warehouse stock
    const [srcInv] = await db.query('SELECT id, quantity FROM inventory WHERE product_id = ? AND warehouse_id = ?', [prodId, fromWhId]);
    const available = srcInv[0]?.quantity || 0;

    if (available < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in source warehouse. Available: ${available}, requested: ${qty}.`
      });
    }

    // Deduct from source warehouse
    await db.query('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?', [qty, prodId, fromWhId]);

    // Add or insert into destination warehouse
    const [destInv] = await db.query('SELECT id FROM inventory WHERE product_id = ? AND warehouse_id = ?', [prodId, toWhId]);
    if (destInv && destInv.length > 0) {
      await db.query('UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?', [qty, prodId, toWhId]);
    } else {
      await db.query(`
        INSERT INTO inventory (product_id, warehouse_id, quantity, aisle, shelf)
        VALUES (?, ?, ?, 'B-01', 'S-01')
      `, [prodId, toWhId, qty]);
    }

    // Record stock movement
    const xfrRef = `XFR-${Date.now().toString().slice(-6)}`;
    await db.query(`
      INSERT INTO stock_movements (movement_type, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, reference_id, reason, performed_by)
      VALUES ('TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?)
    `, [prodId, product.name, fromWhId, toWhId, qty, xfrRef, reason || 'Inter-warehouse rebalancing', req.user.name || 'Warehouse Staff']);

    // Log notification
    const [whFrom] = await db.query('SELECT name FROM warehouses WHERE id = ?', [fromWhId]);
    const [whTo] = await db.query('SELECT name FROM warehouses WHERE id = ?', [toWhId]);
    const fromName = whFrom[0]?.name || 'Origin';
    const toName = whTo[0]?.name || 'Destination';

    await db.query(`
      INSERT INTO notifications (title, message, type)
      VALUES ('Stock Transfer Completed', 'Transferred ' || ? || ' units of ' || ? || ' from ' || ? || ' to ' || ? || ' (' || ? || ').', 'transfer')
    `, [qty, product.name, fromName, toName, xfrRef]);

    res.json({
      success: true,
      message: `Successfully transferred ${qty} units of "${product.name}" from ${fromName} to ${toName}.`,
      reference: xfrRef
    });
  } catch (err) {
    console.error('Transfer stock error:', err);
    res.status(500).json({ success: false, message: 'Stock transfer failed: ' + err.message });
  }
});

module.exports = router;
