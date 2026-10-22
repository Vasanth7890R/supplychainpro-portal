const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let activeType = process.env.DB_TYPE || 'mysql';
let pool = null;
let sqliteDb = null;
let isConnected = false;

// Initialize MySQL pool
async function tryConnectMySQL() {
  const mysql = require('mysql2/promise');
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'supplychainpro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000,
  };

  try {
    // First, test connection or create database if not exists
    const adminConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 4000,
    });

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await adminConnection.end();

    const createdPool = mysql.createPool(config);
    // Test query
    const [test] = await createdPool.query('SELECT 1 + 1 AS result');
    console.log(`[Database] Connected successfully to MySQL database "${config.database}" at ${config.host}:${config.port}`);
    pool = createdPool;
    activeType = 'mysql';
    isConnected = true;
    return true;
  } catch (err) {
    console.warn(`[Database] MySQL connection attempt failed: ${err.message}`);
    return false;
  }
}

// Initialize SQLite fallback
function initSqlite() {
  return new Promise((resolve, reject) => {
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'supplychainpro.sqlite');
    console.log(`[Database] Using local SQLite database file: ${dbPath}`);

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[Database] Failed to open SQLite DB:', err);
        return reject(err);
      }
      sqliteDb = db;
      activeType = 'sqlite';
      isConnected = true;
      console.log('[Database] Connected to SQLite database successfully.');
      resolve(true);
    });
  });
}

// Convert MySQL SQL to SQLite syntax if needed
function adaptSqlForSqlite(sql) {
  let s = sql;
  s = s.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  s = s.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
  s = s.replace(/ENUM\([^)]+\)/gi, 'TEXT');
  s = s.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
  s = s.replace(/ENGINE=InnoDB\s+DEFAULT\s+CHARSET=utf8mb4/gi, '');
  s = s.replace(/TINYINT\(1\)/gi, 'INTEGER');
  s = s.replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  s = s.replace(/UNIQUE KEY\s+\w+\s*\([^)]+\),?/gi, ''); // remove inline composite unique key syntax if incompatible or clean it
  return s;
}

// Execute queries seamlessly across MySQL and SQLite
async function query(sql, params = []) {
  if (!isConnected) {
    await initDatabase();
  }

  if (activeType === 'mysql' && pool) {
    const [rows, fields] = await pool.query(sql, params);
    return [rows, fields];
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    const trimmed = sql.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN');

    if (isSelect) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve([rows || []]);
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve([{
          insertId: this.lastID,
          affectedRows: this.changes,
        }]);
      });
    }
  });
}

// Execute multiple statements or DDL
async function exec(sqlString) {
  if (!isConnected) {
    await initDatabase();
  }

  if (activeType === 'mysql' && pool) {
    // For MySQL, split by semicolon if needed
    const statements = sqlString.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await pool.query(stmt);
    }
    return true;
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    const adapted = adaptSqlForSqlite(sqlString);
    sqliteDb.exec(adapted, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

// Initialize database (MySQL first, SQLite fallback)
async function initDatabase() {
  if (isConnected) return;

  if (process.env.DB_TYPE === 'mysql') {
    const success = await tryConnectMySQL();
    if (success) {
      return;
    }
    console.log('[Database] Falling back to high-performance local SQLite database engine so the app runs immediately.');
  }

  await initSqlite();
}

function getDbInfo() {
  return {
    type: activeType,
    connected: isConnected,
    database: activeType === 'mysql' ? (process.env.DB_NAME || 'supplychainpro') : 'supplychainpro.sqlite',
    host: activeType === 'mysql' ? (process.env.DB_HOST || '127.0.0.1') : 'Local Embedded',
  };
}

module.exports = {
  query,
  exec,
  initDatabase,
  getDbInfo,
};
