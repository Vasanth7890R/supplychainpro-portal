const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: users[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
});

// GET /api/auth/system-status
router.get('/system-status', async (req, res) => {
  try {
    const dbInfo = db.getDbInfo();
    const [pCount] = await db.query('SELECT COUNT(*) as count FROM products');
    const [wCount] = await db.query('SELECT COUNT(*) as count FROM warehouses');
    const [sCount] = await db.query('SELECT COUNT(*) as count FROM suppliers');
    const [oCount] = await db.query('SELECT COUNT(*) as count FROM orders');

    return res.json({
      success: true,
      database: dbInfo,
      counts: {
        products: pCount[0]?.count || 0,
        warehouses: wCount[0]?.count || 0,
        suppliers: sCount[0]?.count || 0,
        orders: oCount[0]?.count || 0,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking system status.' });
  }
});

module.exports = router;
