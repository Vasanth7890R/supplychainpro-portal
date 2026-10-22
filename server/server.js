const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./db/connection');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// Root & Health check
app.get('/api/health', (req, res) => {
  const dbInfo = db.getDbInfo();
  res.json({
    status: 'online',
    app: 'SupplyChainPro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbInfo
  });
});

// Serve frontend single-page application in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and start server
async function startServer() {
  try {
    await db.initDatabase();

    // Check if tables are seeded, if not run seed automatically
    try {
      const [products] = await db.query('SELECT COUNT(*) as count FROM products');
      if (!products || products[0].count === 0) {
        console.log('[Server] Database is unseeded. Running initial seed...');
        const seed = require('./db/seed');
        await seed();
      } else {
        console.log(`[Server] Database verified: ${products[0].count} products present.`);
      }
    } catch (checkErr) {
      console.log('[Server] Initializing schema and seed...');
      const seed = require('./db/seed');
      await seed();
    }

    app.listen(PORT, () => {
      const dbInfo = db.getDbInfo();
      console.log(`
=============================================================
 🚀 SupplyChainPro Server is running!
 📡 Port: http://localhost:${PORT}
 🗄️ Database: ${dbInfo.type.toUpperCase()} (${dbInfo.database})
 🔑 Admin Login: admin@supplychainpro.com / admin123
 🔑 Staff Login: staff@supplychainpro.com / staff123
=============================================================
      `);
    });
  } catch (err) {
    console.error('[Server Startup Failure]:', err);
    process.exit(1);
  }
}

startServer();
