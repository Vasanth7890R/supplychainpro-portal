const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

// GET /api/orders
// Supports search, status, warehouse filter, and pagination
router.get('/', async (req, res) => {
  try {
    const { search = '', status = '', warehouse_id = '', page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.warehouse_id,
        w.name as warehouse_name,
        w.location as warehouse_location,
        o.total_amount,
        o.status,
        o.order_date,
        o.expected_delivery,
        o.tracking_number,
        o.shipping_carrier,
        o.notes,
        o.created_at,
        COUNT(oi.id) as item_count,
        COALESCE(SUM(oi.quantity), 0) as total_units
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params = [];

    if (search.trim()) {
      baseQuery += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.tracking_number LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (status.trim()) {
      baseQuery += ` AND o.status = ?`;
      params.push(status.trim());
    }

    if (warehouse_id.trim()) {
      baseQuery += ` AND o.warehouse_id = ?`;
      params.push(warehouse_id.trim());
    }

    baseQuery += ` GROUP BY o.id`;

    // Count
    const countSql = `SELECT COUNT(*) as total FROM (${baseQuery}) as filtered`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Order & paginate
    baseQuery += ` ORDER BY o.id DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limitNum, offset];

    const [rows] = await db.query(baseQuery, queryParams);

    res.json({
      success: true,
      orders: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const [oRows] = await db.query(`
      SELECT o.*, w.name as warehouse_name, w.location as warehouse_location
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (!oRows || oRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = oRows[0];
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    // Tracking milestones simulation
    const milestones = [
      { step: 'Order Created', date: order.order_date, completed: true },
      { step: 'Processing & Pick-Pack', date: order.order_date, completed: ['Processing', 'Dispatched', 'In Transit', 'Delivered'].includes(order.status) },
      { step: 'Dispatched from Hub', date: order.order_date, completed: ['Dispatched', 'In Transit', 'Delivered'].includes(order.status) },
      { step: 'In Transit with Freight Carrier', date: order.order_date, completed: ['In Transit', 'Delivered'].includes(order.status) },
      { step: 'Delivered to Customer', date: order.expected_delivery, completed: order.status === 'Delivered' }
    ];

    res.json({
      success: true,
      order: {
        ...order,
        items,
        timeline: milestones
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// POST /api/orders (Create Order)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      warehouse_id,
      items = [], // [{ product_id, quantity }]
      order_date,
      expected_delivery,
      shipping_carrier = 'DHL Global Forwarding',
      notes = ''
    } = req.body;

    if (!customer_name || !warehouse_id || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer name, warehouse, and at least one item are required.' });
    }

    const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingNum = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const today = order_date || new Date().toISOString().split('T')[0];
    const expDate = expected_delivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate total and prepare items
    let totalAmount = 0;
    const preparedItems = [];

    for (const item of items) {
      const [pRows] = await db.query('SELECT id, name, unit_price FROM products WHERE id = ?', [item.product_id]);
      if (pRows && pRows.length > 0) {
        const prod = pRows[0];
        const qty = parseInt(item.quantity, 10) || 1;
        const lineTotal = +(qty * prod.unit_price).toFixed(2);
        totalAmount += lineTotal;
        preparedItems.push({
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.unit_price,
          totalPrice: lineTotal
        });
      }
    }

    // Insert order
    const [ordRes] = await db.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, warehouse_id, total_amount, status, order_date, expected_delivery, tracking_number, shipping_carrier, notes)
      VALUES (?, ?, ?, ?, ?, 'Processing', ?, ?, ?, ?, ?)
    `, [orderNum, customer_name.trim(), customer_email || 'client@example.com', parseInt(warehouse_id, 10), totalAmount, today, expDate, trackingNum, shipping_carrier, notes]);

    const orderId = ordRes.insertId;

    // Insert order items and deduct inventory
    for (const pItem of preparedItems) {
      await db.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, pItem.productId, pItem.productName, pItem.quantity, pItem.unitPrice, pItem.totalPrice]);

      // Deduct warehouse inventory
      await db.query(`
        UPDATE inventory 
        SET quantity = MAX(0, quantity - ?) 
        WHERE product_id = ? AND warehouse_id = ?
      `, [pItem.quantity, pItem.productId, parseInt(warehouse_id, 10)]);

      // Stock movement
      await db.query(`
        INSERT INTO stock_movements (movement_type, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, reference_id, reason, performed_by)
        VALUES ('ORDER_FULFILLMENT', ?, ?, ?, NULL, ?, ?, 'Order fulfillment dispatch', ?)
      `, [pItem.productId, pItem.productName, parseInt(warehouse_id, 10), pItem.quantity, orderNum, req.user.name || 'Sales Desk']);
    }

    // Notification
    await db.query(`
      INSERT INTO notifications (title, message, type)
      VALUES ('New Order Created', 'Order ' || ? || ' registered for ' || ? || ' (Value: $' || ? || ').', 'order_status')
    `, [orderNum, customer_name, totalAmount.toFixed(2)]);

    res.status(201).json({
      success: true,
      message: `Order ${orderNum} created successfully!`,
      orderId,
      orderNumber: orderNum
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order: ' + err.message });
  }
});

// PATCH /api/orders/:id/status (Update order status)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Processing', 'Dispatched', 'In Transit', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const [oRows] = await db.query('SELECT order_number, customer_name FROM orders WHERE id = ?', [id]);
    if (!oRows || oRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Add status notification
    await db.query(`
      INSERT INTO notifications (title, message, type)
      VALUES ('Order Status Updated', 'Order ' || ? || ' is now marked as ' || ? || '.', 'order_status')
    `, [oRows[0].order_number, status]);

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await db.query('DELETE FROM orders WHERE id = ?', [id]);

    res.json({ success: true, message: 'Order deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete order.' });
  }
});

module.exports = router;
