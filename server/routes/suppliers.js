const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/suppliers
// Supports search and status filter
router.get('/', async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;

    let sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT p.id) as product_count
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (s.name LIKE ? OR s.code LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status.trim()) {
      sql += ` AND s.status = ?`;
      params.push(status.trim());
    }

    sql += ` GROUP BY s.id ORDER BY s.id ASC`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, suppliers: rows });
  } catch (err) {
    console.error('Fetch suppliers error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve suppliers list.' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const supplier = rows[0];
    const [products] = await db.query('SELECT id, sku, name, category_name, unit_price FROM products WHERE supplier_id = ?', [supplier.id]);

    res.json({
      success: true,
      supplier: {
        ...supplier,
        products
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve supplier.' });
  }
});

// POST /api/suppliers (Add supplier)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, name, contact_person, email, phone, address, supplied_products, status = 'Active', rating = 4.8 } = req.body;

    if (!code || !name || !contact_person || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Code, Name, Contact Person, Email, and Phone are required.' });
    }

    const [existing] = await db.query('SELECT id FROM suppliers WHERE code = ?', [code.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Supplier code "${code}" already exists.` });
    }

    const [result] = await db.query(`
      INSERT INTO suppliers (code, name, contact_person, email, phone, address, supplied_products, status, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code.trim(), name.trim(), contact_person.trim(), email.trim(), phone.trim(), address || '', supplied_products || '', status, parseFloat(rating) || 4.5]);

    res.status(201).json({ success: true, message: 'Supplier added successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add supplier.' });
  }
});

// PUT /api/suppliers/:id (Edit supplier)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, supplied_products, status, rating } = req.body;

    const [existing] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    await db.query(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, supplied_products = ?, status = ?, rating = ?
      WHERE id = ?
    `, [
      name || existing[0].name,
      contact_person || existing[0].contact_person,
      email || existing[0].email,
      phone || existing[0].phone,
      address !== undefined ? address : existing[0].address,
      supplied_products !== undefined ? supplied_products : existing[0].supplied_products,
      status || existing[0].status,
      rating !== undefined ? parseFloat(rating) : existing[0].rating,
      id
    ]);

    res.json({ success: true, message: 'Supplier details updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update supplier.' });
  }
});

// DELETE /api/suppliers/:id (Delete supplier - Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE products SET supplier_id = NULL, supplier_name = "Unassigned" WHERE supplier_id = ?', [id]);
    await db.query('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({ success: true, message: 'Supplier removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete supplier.' });
  }
});

module.exports = router;
