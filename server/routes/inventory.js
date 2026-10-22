const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/inventory/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/inventory
// Query parameters: search, category, warehouse_id, status, page, limit
router.get('/', async (req, res) => {
  try {
    const { search = '', category = '', warehouse_id = '', status = '', page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category_id,
        p.category_name,
        p.unit_price,
        p.min_stock_level,
        p.supplier_id,
        p.supplier_name,
        p.description,
        p.created_at,
        COALESCE(i.quantity, 0) as quantity,
        w.id as warehouse_id,
        COALESCE(w.name, 'Unassigned') as warehouse_name,
        COALESCE(w.location, 'Global') as warehouse_location,
        COALESCE(i.aisle, 'A-01') as aisle,
        COALESCE(i.shelf, 'S-01') as shelf,
        CASE
          WHEN COALESCE(i.quantity, 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(i.quantity, 0) <= p.min_stock_level THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE 1=1
    `;

    const params = [];

    if (search.trim()) {
      baseQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.supplier_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category.trim()) {
      baseQuery += ` AND p.category_name = ?`;
      params.push(category.trim());
    }

    if (warehouse_id.trim()) {
      baseQuery += ` AND w.id = ?`;
      params.push(warehouse_id.trim());
    }

    if (status.trim()) {
      if (status === 'Out of Stock') {
        baseQuery += ` AND COALESCE(i.quantity, 0) = 0`;
      } else if (status === 'Low Stock') {
        baseQuery += ` AND COALESCE(i.quantity, 0) > 0 AND COALESCE(i.quantity, 0) <= p.min_stock_level`;
      } else if (status === 'In Stock') {
        baseQuery += ` AND COALESCE(i.quantity, 0) > p.min_stock_level`;
      }
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${baseQuery}) as filtered`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Order & paginate
    baseQuery += ` ORDER BY p.id ASC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limitNum, offset];

    const [rows] = await db.query(baseQuery, queryParams);

    res.json({
      success: true,
      items: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      }
    });
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve inventory records.' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const [pRows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!pRows || pRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = pRows[0];
    const [stockRows] = await db.query(`
      SELECT i.*, w.name as warehouse_name, w.location as warehouse_location 
      FROM inventory i
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.product_id = ?
    `, [product.id]);

    res.json({
      success: true,
      product: {
        ...product,
        stock_breakdown: stockRows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
});

// POST /api/inventory (Add product)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      sku,
      category_name,
      unit_price,
      min_stock_level = 20,
      supplier_name,
      warehouse_id,
      initial_quantity = 0,
      description = ''
    } = req.body;

    if (!name || !sku || !unit_price) {
      return res.status(400).json({ success: false, message: 'Name, SKU, and Unit Price are required.' });
    }

    // Check SKU duplicate
    const [existing] = await db.query('SELECT id FROM products WHERE sku = ?', [sku.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Product with SKU "${sku}" already exists.` });
    }

    // Get category ID if available
    let catId = null;
    if (category_name) {
      const [cRows] = await db.query('SELECT id FROM categories WHERE name = ?', [category_name]);
      if (cRows && cRows.length > 0) catId = cRows[0].id;
    }

    // Get supplier ID if available
    let supId = null;
    if (supplier_name) {
      const [sRows] = await db.query('SELECT id FROM suppliers WHERE name = ?', [supplier_name]);
      if (sRows && sRows.length > 0) supId = sRows[0].id;
    }

    const [prodRes] = await db.query(`
      INSERT INTO products (sku, name, category_id, category_name, unit_price, min_stock_level, supplier_id, supplier_name, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [sku.trim(), name.trim(), catId, category_name || 'General Components', parseFloat(unit_price), parseInt(min_stock_level, 10), supId, supplier_name || 'Standard Vendor', description]);

    const newProductId = prodRes.insertId;
    const targetWhId = parseInt(warehouse_id, 10) || 1;
    const qty = parseInt(initial_quantity, 10) || 0;

    // Insert inventory record
    await db.query(`
      INSERT INTO inventory (product_id, warehouse_id, quantity, aisle, shelf)
      VALUES (?, ?, ?, 'A-01', 'S-01')
    `, [newProductId, targetWhId, qty]);

    // Record stock movement
    if (qty > 0) {
      await db.query(`
        INSERT INTO stock_movements (movement_type, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, reference_id, reason, performed_by)
        VALUES ('PURCHASE_RECEIPT', ?, ?, NULL, ?, ?, 'INIT-PROD', 'Initial stock initialization', ?)
      `, [newProductId, name.trim(), targetWhId, qty, req.user.name]);
    }

    // Check if low stock
    if (qty <= min_stock_level) {
      await db.query(`
        INSERT INTO notifications (title, message, type)
        VALUES (?, ?, 'low_stock')
      `, [`Low Stock Warning: ${sku.trim()}`, `Product ${name.trim()} was registered with low initial stock level (${qty} units).`]);
    }

    res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      productId: newProductId
    });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ success: false, message: 'Failed to add product: ' + err.message });
  }
});

// PUT /api/inventory/:id (Edit product)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category_name, unit_price, min_stock_level, supplier_name, quantity, warehouse_id, description } = req.body;

    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await db.query(`
      UPDATE products 
      SET name = ?, sku = ?, category_name = ?, unit_price = ?, min_stock_level = ?, supplier_name = ?, description = ?
      WHERE id = ?
    `, [
      name || existing[0].name,
      sku || existing[0].sku,
      category_name || existing[0].category_name,
      unit_price !== undefined ? parseFloat(unit_price) : existing[0].unit_price,
      min_stock_level !== undefined ? parseInt(min_stock_level, 10) : existing[0].min_stock_level,
      supplier_name || existing[0].supplier_name,
      description !== undefined ? description : existing[0].description,
      id
    ]);

    // Update quantity if supplied
    if (quantity !== undefined && warehouse_id) {
      const whId = parseInt(warehouse_id, 10);
      const newQty = parseInt(quantity, 10);

      const [inv] = await db.query('SELECT id, quantity FROM inventory WHERE product_id = ? AND warehouse_id = ?', [id, whId]);
      if (inv && inv.length > 0) {
        const diff = newQty - inv[0].quantity;
        await db.query('UPDATE inventory SET quantity = ? WHERE id = ?', [newQty, inv[0].id]);

        if (diff !== 0) {
          await db.query(`
            INSERT INTO stock_movements (movement_type, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, reference_id, reason, performed_by)
            VALUES ('ADJUSTMENT', ?, ?, ?, ?, ?, 'MANUAL-ADJ', 'Manual inventory level adjustment', ?)
          `, [id, name || existing[0].name, whId, whId, diff, req.user.name]);
        }
      } else {
        await db.query(`
          INSERT INTO inventory (product_id, warehouse_id, quantity, aisle, shelf)
          VALUES (?, ?, ?, 'A-01', 'S-01')
        `, [id, whId, newQty]);
      }
    }

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// DELETE /api/inventory/:id (Delete product - available to inventory managers)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [pRows] = await db.query('SELECT name FROM products WHERE id = ?', [id]);
    if (!pRows || pRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Safely remove dependent records first to guarantee smooth deletion across MySQL and SQLite
    await db.query('DELETE FROM stock_movements WHERE product_id = ?', [id]);
    await db.query('DELETE FROM order_items WHERE product_id = ?', [id]);
    await db.query('DELETE FROM inventory WHERE product_id = ?', [id]);
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ success: true, message: `Product "${pRows[0].name}" removed from catalog.` });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product: ' + err.message });
  }
});

module.exports = router;
