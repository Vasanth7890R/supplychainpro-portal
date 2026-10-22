# SupplyChainPro – Distributed Supply Chain & Inventory Tracking Portal

**SupplyChainPro** is a modern, responsive, enterprise-grade full-stack web application designed for distributed logistics hubs, automated inventory management, real-time order fulfillment, and multi-warehouse operations.

---

## 🌟 Key Features

1. **Executive Operations Dashboard**:
   - Four real-time KPI statistic cards:
     - **Total Products**: `248` cataloged SKUs
     - **Total Warehouses**: `5` multi-continental hubs
     - **Total Suppliers**: `12` certified tier-1 vendors
     - **Total Orders**: `36` active commercial orders
   - **Monthly Stock-Level Dynamics**: Interactive Line Chart (Net Stock Units, Inbound Goods, Outbound Deliveries) built with Recharts.
   - **Inventory Distribution**: Doughnut Chart displaying inventory volume concentration across 6 categories.
   - **Low-Stock Alerts Table**: Live safety minimums tracking with stock depletion badges.
   - **Recent Orders & Inventory Movements**: Real-time audit trail of inter-hub transfers, receipts, and allocations.
   - **Warehouse Stock Summary**: Capacity progress indicators across all hubs.

2. **Inventory Management**:
   - Complete inventory catalog tracking: SKU, Product Name, Category, Warehouse Location, Available Quantity, Minimum Stock Level, Unit Price, and Stock Status (`In Stock`, `Low Stock`, `Out of Stock`).
   - Real-time search by SKU and product title.
   - Filter by Category, Warehouse Hub, and Stock Health.
   - Add, Edit, and Delete product operations with input validation.
   - Automatic low-stock alert banners and notifications.
   - Fast pagination for large datasets.

3. **Warehouse Hubs & Global Map**:
   - Interactive SVG global map visualization displaying the 5 hubs: **New York Hub**, **London Gateway**, **Berlin Logistics Center**, **Singapore Distribution Hub**, and **Sydney Pacific Depository**.
   - Flight corridors, telemetry popups, manager details, and capacity gauges.
   - **Inter-Warehouse Stock Transfer**: Live modal allowing stock transfers between warehouses, verifying available stock, adjusting inventory in real time, and writing audit movement logs.

4. **Supplier Management**:
   - Comprehensive supplier directory tracking: Supplier ID, Company Name, Contact Person, Email, Telephone, Rating (1-5 stars), Supplied Products, and Vendor Status.
   - Search and status filtering.
   - Add, Edit, and Delete supplier profiles.

5. **Order Management & Consignment Tracking**:
   - Order fulfillment pipeline tracking: Order ID, Customer Name, Warehouse Origin, Units, Total Amount, Order Date, Expected Delivery, Carrier, and Status (`Processing`, `Dispatched`, `In Transit`, `Delivered`).
   - Interactive status dropdown updating database state in real time.
   - **Consignment Tracking Modal**: Step-by-step visual milestone progress bar from dispatch to delivery with carrier info.
   - Order creation form with automatic warehouse stock deduction.

6. **Reports & Analytics**:
   - Category distribution matrix and top products by stock volume.
   - Monthly B2B sales and revenue projections.
   - Date range selector (7 days, 30 days, Quarter, Year).
   - **Instant CSV Export**: Generates and downloads real CSV files for Inventory, Orders, Stock Movements, and Suppliers.

7. **Authentication & Role-Based Access Control**:
   - Pre-configured JWT authentication with roles:
     - **System Admin**: Full access to create, edit, transfer, and delete records.
     - **Warehouse Staff**: Access to view, transfer stock, and update fulfillment states.
   - One-click demo account switcher in sidebar and login page.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, CORS |
| **Database** | MySQL (with zero-config SQLite auto-failover engine) |
| **Styling** | Dark navy vertical sidebar (`#0B1528`), clean slate cards, modern typography (Inter & Outfit) |

---

## 🗄️ Database Architecture & Schema

The database schema is defined in [`server/db/schema.sql`](file:///c:/Users/vasan/OneDrive/Documents/Inventory%20tracking%20portal/server/db/schema.sql):

- **`users`**: User credentials, roles (`admin`, `staff`), departments.
- **`categories`**: Product classifications and metadata.
- **`warehouses`**: Code, name, location, coordinates (`latitude`, `longitude`), manager, capacity, status.
- **`suppliers`**: Vendor codes, contact info, rating, supplied components.
- **`products`**: SKU, name, category, unit price, min stock level, vendor.
- **`inventory`**: Per-warehouse quantity, aisle, and shelf locations.
- **`orders`**: Order number, customer, warehouse, amount, status, tracking number, carrier.
- **`order_items`**: Line items, quantities, and prices per order.
- **`stock_movements`**: Immutable audit logs of inter-warehouse transfers, receipts, adjustments, and dispatches.
- **`notifications`**: Low-stock warnings and activity alerts.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or newer)
- **npm** (v9 or newer)
- *(Optional)* **MySQL Server** (If MySQL is not installed, the application automatically uses the high-performance local SQLite database without requiring any setup).

---

### Step 1: Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### Step 2: Database Configuration & Seeding

Check or configure [`server/.env`](file:///c:/Users/vasan/OneDrive/Documents/Inventory%20tracking%20portal/server/.env):

```env
PORT=5000
NODE_ENV=development

# Set to 'mysql' to connect to your local/remote MySQL instance,
# or 'sqlite' for zero-config embedded database:
DB_TYPE=mysql

# MySQL Settings (used when DB_TYPE=mysql)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=supplychainpro

# JWT Secret
JWT_SECRET=supplychainpro_jwt_secret_key_super_secure_2026
```

> **Note on MySQL vs SQLite**: If you have a MySQL server running, SupplyChainPro creates the database `supplychainpro` and tables automatically. If MySQL is not running on port 3306, it gracefully falls back to the embedded SQLite database (`server/data/supplychainpro.sqlite`) so you can test immediately!

To manually re-seed the demo data at any time:
```bash
cd server
npm run seed
```

---

### Step 3: Run the Application

Run the backend and frontend servers:

#### Terminal 1 (Backend API):
```bash
cd server
npm start
# Runs on http://localhost:5000
```

#### Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Runs on http://127.0.0.1:5173
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **System Admin** | `admin@supplychainpro.com` | `admin123` | Full CRUD, Stock Transfers, User Roles |
| **Warehouse Staff** | `staff@supplychainpro.com` | `staff123` | View Inventory, Orders, Stock Transfers |

*(You can also use the one-click demo buttons on the login page or in the sidebar to switch between roles instantly).*

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | `POST` | Authenticate and obtain JWT token |
| `/api/auth/me` | `GET` | Get current user session profile |
| `/api/dashboard/summary` | `GET` | Retrieve KPIs, charts data, and summaries |
| `/api/inventory` | `GET` | List inventory items (supports `search`, `category`, `warehouse_id`, `status`, pagination) |
| `/api/inventory` | `POST` | Add a new product to catalog and warehouse |
| `/api/inventory/:id` | `PUT` | Update product details and stock level |
| `/api/inventory/:id` | `DELETE` | Remove product (Admin only) |
| `/api/warehouses` | `GET` | List all 5 warehouses with capacity metrics |
| `/api/warehouses/transfer`| `POST`| Transfer stock between two warehouses |
| `/api/suppliers` | `GET` | List suppliers with search and status filters |
| `/api/orders` | `GET` | List orders with pagination and filters |
| `/api/orders/:id/status` | `PATCH` | Update fulfillment state (`Processing` -> `Dispatched` -> `In Transit` -> `Delivered`) |
| `/api/reports/analytics` | `GET` | Aggregated metrics and charts data |
| `/api/reports/export-csv` | `GET` | Download CSV for inventory, orders, movements, or suppliers |
| `/api/notifications` | `GET` | Real-time system notifications and low-stock alerts |
