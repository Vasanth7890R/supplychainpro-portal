const bcrypt = require('bcryptjs');
const db = require('./connection');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('[Seed] Starting database migration and seeding process...');
  await db.initDatabase();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Create schema
  try {
    await db.exec(schemaSql);
    console.log('[Seed] Schema applied successfully.');
  } catch (err) {
    console.error('[Seed] Error applying schema:', err.message);
  }

  // 1. Seed Users (admin and warehouse staff)
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);

  await db.query(`
    INSERT INTO users (name, email, password, role, department) VALUES
    ('Sabarivasan M', 'admin@supplychainpro.com', ?, 'admin', 'Global Operations & Supply Chain'),
    ('Nirajana', 'staff@supplychainpro.com', ?, 'staff', 'Inventory Logistics Hub')
  `, [hashedAdminPassword, hashedStaffPassword]);
  console.log('[Seed] Users seeded (Admin: admin@supplychainpro.com / admin123, Staff: staff@supplychainpro.com / staff123)');

  // 2. Seed Categories
  const categories = [
    { name: 'Industrial Electronics', desc: 'Circuit boards, micro-controllers, power modules and relays', icon: 'Cpu' },
    { name: 'Robotics & Automation', desc: 'Precision servo motors, robotic arm joints, PLC units and actuators', icon: 'Bot' },
    { name: 'Precision Sensors', desc: 'LIDAR, thermal, optical, pressure, and vibration sensors', icon: 'Activity' },
    { name: 'Power & Battery Systems', desc: 'High-capacity lithium cells, power distribution units and converters', icon: 'Zap' },
    { name: 'Optical & Display Modules', desc: 'Industrial touchscreen HMIs, laser diodes, and optical fiber transceivers', icon: 'Eye' },
    { name: 'Mechanical & Structural', desc: 'Bearings, titanium fittings, high-tensile couplings and chassis', icon: 'Box' }
  ];

  for (const cat of categories) {
    await db.query('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)', [cat.name, cat.desc, cat.icon]);
  }
  console.log('[Seed] Categories seeded.');

  // 3. Seed Warehouses (5 Warehouses)
  const warehouses = [
    {
      code: 'WH-NYC-01',
      name: 'New York Hub',
      location: 'New York, USA',
      country: 'United States',
      latitude: 40.7128,
      longitude: -74.0060,
      manager: 'Vasanth',
      email: 'vasanth@supplychainpro.com',
      phone: '+1 (212) 555-0192',
      storage_capacity: 150000,
      status: 'Active'
    },
    {
      code: 'WH-LDN-02',
      name: 'London Gateway',
      location: 'London, UK',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      manager: 'Nirajana',
      email: 'nirajana@supplychainpro.com',
      phone: '+44 20 7946 0912',
      storage_capacity: 120000,
      status: 'Active'
    },
    {
      code: 'WH-BER-03',
      name: 'Berlin Logistics Center',
      location: 'Berlin, Germany',
      country: 'Germany',
      latitude: 52.5200,
      longitude: 13.4050,
      manager: 'Raj',
      email: 'raj@supplychainpro.com',
      phone: '+49 30 2234 5678',
      storage_capacity: 95000,
      status: 'Active'
    },
    {
      code: 'WH-SIN-04',
      name: 'Singapore Distribution Hub',
      location: 'Singapore, SG',
      country: 'Singapore',
      latitude: 1.3521,
      longitude: 103.8198,
      manager: 'Deepak',
      email: 'deepak@supplychainpro.com',
      phone: '+65 6789 0123',
      storage_capacity: 180000,
      status: 'Active'
    },
    {
      code: 'WH-SYD-05',
      name: 'Sydney Pacific Depository',
      location: 'Sydney, Australia',
      country: 'Australia',
      latitude: -33.8688,
      longitude: 151.2093,
      manager: 'Santhosh',
      email: 'santhosh@supplychainpro.com',
      phone: '+61 2 9876 5432',
      storage_capacity: 85000,
      status: 'Active'
    }
  ];

  for (const wh of warehouses) {
    await db.query(`
      INSERT INTO warehouses (code, name, location, country, latitude, longitude, manager, email, phone, storage_capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [wh.code, wh.name, wh.location, wh.country, wh.latitude, wh.longitude, wh.manager, wh.email, wh.phone, wh.storage_capacity, wh.status]);
  }
  console.log('[Seed] 5 Warehouses seeded.');

  // 4. Seed Suppliers (12 Suppliers)
  const suppliers = [
    { code: 'SUP-101', name: 'Apex Global Semiconductors', contact: 'Chen Wei', email: 'sales@apexsemis.com', phone: '+886 2 2345 6789', address: 'Hsinchu Science Park, Taiwan', products: 'Microprocessors, FPGA chips, memory modules', rating: 4.9 },
    { code: 'SUP-102', name: 'Nordic Precision Bearings', contact: 'Astrid Lindgren', email: 'orders@nordicbearings.se', phone: '+46 31 123 4567', address: 'Gothenburg Industrial Zone, Sweden', products: 'Ceramic ball bearings, linear guides, ball screws', rating: 4.8 },
    { code: 'SUP-103', name: 'Pacific Cargo Dynamics', contact: 'David Miller', email: 'dmiller@pacificdynamics.com', phone: '+1 (415) 555-8821', address: 'Embarcadero Way, San Francisco, CA', products: 'Heavy duty chassis, composite panels, brackets', rating: 4.6 },
    { code: 'SUP-104', name: 'Rheinland Automation AG', contact: 'Klaus Wagner', email: 'klaus.wagner@rheinland-auto.de', phone: '+49 211 9876 00', address: 'Dusseldorf Tech Hub, Germany', products: 'Servo motors, harmonic drives, pneumatic valves', rating: 4.9 },
    { code: 'SUP-105', name: 'Tokyo Sensor Matrix Ltd', contact: 'Kenji Takahashi', email: 'ktakahashi@tokyosensors.jp', phone: '+81 3 3456 7890', address: 'Minato-ku, Tokyo, Japan', products: '3D LIDAR, ultrasonic rangers, infrared arrays', rating: 4.8 },
    { code: 'SUP-106', name: 'Shenzhen Micro Components', contact: 'Lin Zhang', email: 'zhang.l@szmicrocomp.cn', phone: '+86 755 8321 4567', address: 'Futian District, Shenzhen, China', products: 'Multilayer capacitors, power inductors, RF switches', rating: 4.5 },
    { code: 'SUP-107', name: 'Milan Optics & Photonics', contact: 'Matteo Rossi', email: 'contact@milanoptics.it', phone: '+39 02 8765 4321', address: 'Corso Sempione 88, Milan, Italy', products: 'Industrial camera lenses, laser collimators', rating: 4.7 },
    { code: 'SUP-108', name: 'Seoul Display Technologies', contact: 'Ji-Hoon Park', email: 'jh.park@seouldisplays.kr', phone: '+82 2 7890 1234', address: 'Gangnam-gu, Seoul, South Korea', products: 'AMOLED control panels, ruggedized touch screens', rating: 4.8 },
    { code: 'SUP-109', name: 'Bangalore Embedded Systems', contact: 'Pooja Iyer', email: 'sales@bengaluru-embedded.in', phone: '+91 80 4123 7890', address: 'Electronic City Phase 1, Bangalore, India', products: 'CAN-bus controllers, IoT gateway gateways, telemetry', rating: 4.7 },
    { code: 'SUP-110', name: 'Zurich Industrial Hydraulics', contact: 'Beat Meier', email: 'b.meier@zurichhydraulics.ch', phone: '+41 44 210 9876', address: 'Technoparkstrasse 1, Zurich, Switzerland', products: 'Micro-hydraulic pumps, proportional valves', rating: 4.9 },
    { code: 'SUP-111', name: 'Austin Smart Energy Inc', contact: 'Rachel Adams', email: 'radams@austinsmartenergy.io', phone: '+1 (512) 555-3419', address: 'Braker Lane, Austin, TX, USA', products: 'Solid-state battery cells, BMS controller boards', rating: 4.8 },
    { code: 'SUP-112', name: 'Montreal Advanced Composites', contact: 'Jean-Luc Tremblay', email: 'orders@montrealcomposites.ca', phone: '+1 (514) 555-9087', address: 'Rue Saint-Jacques, Montreal, Canada', products: 'Carbon fiber structural tubes, heat shielding foils', rating: 4.6 }
  ];

  for (const sup of suppliers) {
    await db.query(`
      INSERT INTO suppliers (code, name, contact_person, email, phone, address, supplied_products, status, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `, [sup.code, sup.name, sup.contact, sup.email, sup.phone, sup.address, sup.products, sup.rating]);
  }
  console.log('[Seed] 12 Suppliers seeded.');

  // 5. Seed Exactly 248 Products
  // Total Products target: 248
  console.log('[Seed] Generating exactly 248 realistic products...');

  const productBases = [
    // Industrial Electronics
    { base: 'QuantumCore Microprocessor 64-Bit', catId: 1, catName: 'Industrial Electronics', supId: 1, supName: 'Apex Global Semiconductors', priceRange: [180, 420], minStock: 30 },
    { base: 'High-Current Solid-State Relay 50A', catId: 1, catName: 'Industrial Electronics', supId: 6, supName: 'Shenzhen Micro Components', priceRange: [35, 95], minStock: 40 },
    { base: 'Optoisolated Digital I/O Module 16-Ch', catId: 1, catName: 'Industrial Electronics', supId: 9, supName: 'Bangalore Embedded Systems', priceRange: [85, 210], minStock: 25 },
    { base: 'Synchronous Buck-Boost Power Converter', catId: 1, catName: 'Industrial Electronics', supId: 6, supName: 'Shenzhen Micro Components', priceRange: [24, 68], minStock: 50 },
    { base: 'Industrial CAN-Bus Telemetry Transceiver', catId: 1, catName: 'Industrial Electronics', supId: 9, supName: 'Bangalore Embedded Systems', priceRange: [42, 115], minStock: 35 },
    { base: 'FPGA Hardware Acceleration Accelerator Board', catId: 1, catName: 'Industrial Electronics', supId: 1, supName: 'Apex Global Semiconductors', priceRange: [320, 890], minStock: 20 },

    // Robotics & Automation
    { base: 'Brushless High-Torque Servo Motor 750W', catId: 2, catName: 'Robotics & Automation', supId: 4, supName: 'Rheinland Automation AG', priceRange: [290, 750], minStock: 15 },
    { base: 'Harmonic Drive Gearbox Reduction 100:1', catId: 2, catName: 'Robotics & Automation', supId: 4, supName: 'Rheinland Automation AG', priceRange: [450, 1200], minStock: 12 },
    { base: 'Modular 6-Axis Robotic Arm Wrist Joint', catId: 2, catName: 'Robotics & Automation', supId: 4, supName: 'Rheinland Automation AG', priceRange: [650, 1600], minStock: 10 },
    { base: 'Pneumatic Gripper Parallel Dual-Jaw', catId: 2, catName: 'Robotics & Automation', supId: 10, supName: 'Zurich Industrial Hydraulics', priceRange: [120, 310], minStock: 25 },
    { base: 'Autonomous AGV Magnetic Navigation Sensor', catId: 2, catName: 'Robotics & Automation', supId: 5, supName: 'Tokyo Sensor Matrix Ltd', priceRange: [180, 480], minStock: 18 },
    { base: 'Real-time EtherCAT Motion Controller PLC', catId: 2, catName: 'Robotics & Automation', supId: 9, supName: 'Bangalore Embedded Systems', priceRange: [380, 920], minStock: 15 },

    // Precision Sensors
    { base: '3D Solid-State LIDAR Scanner 120m', catId: 3, catName: 'Precision Sensors', supId: 5, supName: 'Tokyo Sensor Matrix Ltd', priceRange: [620, 1450], minStock: 15 },
    { base: 'MEMS High-G Tri-Axial Vibration Sensor', catId: 3, catName: 'Precision Sensors', supId: 5, supName: 'Tokyo Sensor Matrix Ltd', priceRange: [75, 190], minStock: 30 },
    { base: 'Infrared Thermal Imaging Core 640x512', catId: 3, catName: 'Precision Sensors', supId: 7, supName: 'Milan Optics & Photonics', priceRange: [480, 1100], minStock: 12 },
    { base: 'Ultrasonic Liquid Level Sensor IP68', catId: 3, catName: 'Precision Sensors', supId: 5, supName: 'Tokyo Sensor Matrix Ltd', priceRange: [65, 145], minStock: 40 },
    { base: 'Optical Linear Glass Scale Encoder 5um', catId: 3, catName: 'Precision Sensors', supId: 7, supName: 'Milan Optics & Photonics', priceRange: [110, 290], minStock: 22 },

    // Power & Battery Systems
    { base: 'Lithium-Iron Phosphate Prismatic Cell 3.2V 100Ah', catId: 4, catName: 'Power & Battery Systems', supId: 11, supName: 'Austin Smart Energy Inc', priceRange: [95, 230], minStock: 45 },
    { base: 'Smart Battery Management System BMS 48V', catId: 4, catName: 'Power & Battery Systems', supId: 11, supName: 'Austin Smart Energy Inc', priceRange: [130, 340], minStock: 25 },
    { base: 'Bidirectional DC-AC Inverter Module 5kW', catId: 4, catName: 'Power & Battery Systems', supId: 11, supName: 'Austin Smart Energy Inc', priceRange: [420, 980], minStock: 15 },
    { base: 'Ultra-Capacitor Bank Module 48V 165F', catId: 4, catName: 'Power & Battery Systems', supId: 11, supName: 'Austin Smart Energy Inc', priceRange: [210, 520], minStock: 20 },

    // Optical & Display Modules
    { base: 'Industrial Touchscreen HMI Panel 15.6 Inch', catId: 5, catName: 'Optical & Display Modules', supId: 8, supName: 'Seoul Display Technologies', priceRange: [280, 690], minStock: 18 },
    { base: 'Ruggedized AMOLED Multi-touch Console 10.1 Inch', catId: 5, catName: 'Optical & Display Modules', supId: 8, supName: 'Seoul Display Technologies', priceRange: [210, 480], minStock: 20 },
    { base: 'Telecentric Machine Vision Lens 50mm', catId: 5, catName: 'Optical & Display Modules', supId: 7, supName: 'Milan Optics & Photonics', priceRange: [310, 720], minStock: 15 },
    { base: '100G QSFP28 Optical Fiber Transceiver', catId: 5, catName: 'Optical & Display Modules', supId: 7, supName: 'Milan Optics & Photonics', priceRange: [95, 260], minStock: 35 },

    // Mechanical & Structural
    { base: 'High-Precision Angular Contact Bearing Set', catId: 6, catName: 'Mechanical & Structural', supId: 2, supName: 'Nordic Precision Bearings', priceRange: [140, 380], minStock: 25 },
    { base: 'Carbon Fiber Aerospace Structural Truss Tube', catId: 6, catName: 'Mechanical & Structural', supId: 12, supName: 'Montreal Advanced Composites', priceRange: [85, 220], minStock: 30 },
    { base: 'Titanium Grade 5 Heavy Duty Clamp Mount', catId: 6, catName: 'Mechanical & Structural', supId: 3, supName: 'Pacific Cargo Dynamics', priceRange: [55, 160], minStock: 40 },
    { base: 'Ceramic Hybrid Deep-Groove Ball Bearing', catId: 6, catName: 'Mechanical & Structural', supId: 2, supName: 'Nordic Precision Bearings', priceRange: [90, 240], minStock: 30 }
  ];

  const suffixes = ['Pro', 'Ultra', 'Max', 'Prime', 'Gen-2', 'Gen-3', 'SE', 'Industrial', 'Enterprise', 'Titan', 'Apex', 'Core'];
  const variants = ['v1.0', 'v2.2', 'v3.5', 'X-Series', 'Z-Series', 'Spec-A', 'Spec-B', 'High-Temp', 'Hermetic', 'Marine-Grade'];

  let productCount = 0;
  const targetProductCount = 248;

  // Track inventory rows to insert
  const inventoryRows = [];

  for (let i = 0; i < targetProductCount; i++) {
    const template = productBases[i % productBases.length];
    const sfx = suffixes[Math.floor(i / productBases.length) % suffixes.length];
    const vrt = variants[i % variants.length];
    const skuNum = 1001 + i;
    const sku = `SKU-${skuNum}`;
    const name = `${template.base} ${sfx} (${vrt})`;
    const price = +(template.priceRange[0] + ((i * 17) % (template.priceRange[1] - template.priceRange[0]))).toFixed(2);
    const minStock = template.minStock;

    // Distribute quantity across warehouses (1 to 5)
    // Create realistic stock levels: 85% In Stock, 10% Low Stock, 5% Out of Stock
    let primaryWhQuantity = 0;
    const assignedWarehouseId = (i % 5) + 1; // 1 to 5

    if (i % 18 === 0) {
      // Out of stock
      primaryWhQuantity = 0;
    } else if (i % 7 === 0) {
      // Low stock
      primaryWhQuantity = Math.floor(minStock * 0.45);
    } else {
      // In stock
      primaryWhQuantity = minStock + 20 + ((i * 23) % 250);
    }

    let status = 'In Stock';
    if (primaryWhQuantity === 0) {
      status = 'Out of Stock';
    } else if (primaryWhQuantity <= minStock) {
      status = 'Low Stock';
    }

    const desc = `High-reliability ${template.catName.toLowerCase()} unit engineered for industrial automation, high-stress endurance, and distributed logistics operations.`;

    const [prodRes] = await db.query(`
      INSERT INTO products (sku, name, category_id, category_name, unit_price, min_stock_level, supplier_id, supplier_name, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [sku, name, template.catId, template.catName, price, minStock, template.supId, template.supName, desc]);

    const productId = prodRes.insertId || (i + 1);

    // Insert primary inventory row for this product in its assigned warehouse
    const aisle = `A-${((i % 12) + 1).toString().padStart(2, '0')}`;
    const shelf = `S-${((i % 8) + 1).toString().padStart(2, '0')}`;

    await db.query(`
      INSERT INTO inventory (product_id, warehouse_id, quantity, aisle, shelf)
      VALUES (?, ?, ?, ?, ?)
    `, [productId, assignedWarehouseId, primaryWhQuantity, aisle, shelf]);

    // Also distribute smaller secondary stock in other warehouses for some products (realistic multi-warehouse tracking)
    if (i % 3 === 0) {
      const secondaryWhId = (assignedWarehouseId % 5) + 1;
      const secQty = Math.floor(primaryWhQuantity * 0.35);
      await db.query(`
        INSERT INTO inventory (product_id, warehouse_id, quantity, aisle, shelf)
        VALUES (?, ?, ?, ?, ?)
      `, [productId, secondaryWhId, secQty, `B-${((i % 9) + 1).toString().padStart(2, '0')}`, `S-02`]);
    }

    productCount++;
  }

  console.log(`[Seed] Seeded exactly ${productCount} products with warehouse inventory.`);

  // 6. Seed Exactly 36 Orders
  console.log('[Seed] Generating exactly 36 orders with real-time status and line items...');
  const customerList = [
    { name: 'Siemens Energy Global GmbH', email: 'procurement@siemens-energy.com' },
    { name: 'Bosch Automotive Electronics', email: 'supply@bosch-auto.de' },
    { name: 'ABB Robotics International', email: 'orders@ch.abb.com' },
    { name: 'Tesla Gigafactory Supply', email: 'inventory-ops@tesla.com' },
    { name: 'General Dynamics Land Systems', email: 'contracting@gdls.com' },
    { name: 'Dyson Research & Logistics', email: 'supplychain@dyson.co.uk' },
    { name: 'Fanuc Automation Systems', email: 'parts-orders@fanuc.co.jp' },
    { name: 'Schneider Electric Solutions', email: 'logistics@se.com' },
    { name: 'Honeywell Aerospace Division', email: 'order-desk@honeywell.com' },
    { name: 'Rockwell Automation Global', email: 'purchasing@ra.rockwell.com' },
    { name: 'KUKA Robotics Europe', email: 'hub.order@kuka.com' },
    { name: 'Lockheed Martin Systems', email: 'scm.procure@lockheedmartin.com' }
  ];

  const statuses = ['Processing', 'Dispatched', 'In Transit', 'Delivered'];
  const carriers = ['DHL Global Forwarding', 'FedEx International Priority', 'Kuehne + Nagel Supply', 'Maersk Air Cargo', 'UPS Worldwide Express'];

  for (let ordIndex = 1; ordIndex <= 36; ordIndex++) {
    const cust = customerList[(ordIndex - 1) % customerList.length];
    const orderNum = `ORD-2026-${(1000 + ordIndex)}`;
    const whId = ((ordIndex - 1) % 5) + 1;
    const status = statuses[ordIndex % statuses.length];
    const carrier = carriers[ordIndex % carriers.length];
    const trackingNum = `TRK-${(88200000 + ordIndex * 137).toString()}`;

    // Order date in past 30 days
    const daysAgo = 30 - Math.floor((ordIndex / 36) * 28);
    const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const deliveryDate = new Date(Date.now() + (7 - daysAgo) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Pick 1-3 products for this order
    const pId1 = ((ordIndex * 3) % targetProductCount) + 1;
    const pId2 = ((ordIndex * 5 + 7) % targetProductCount) + 1;

    // Fetch product prices
    const [p1Rows] = await db.query('SELECT id, name, unit_price FROM products WHERE id = ?', [pId1]);
    const [p2Rows] = await db.query('SELECT id, name, unit_price FROM products WHERE id = ?', [pId2]);

    const p1 = (p1Rows && p1Rows[0]) || { id: 1, name: 'QuantumCore Microprocessor 64-Bit', unit_price: 240 };
    const p2 = (p2Rows && p2Rows[0]) || { id: 2, name: 'Brushless High-Torque Servo Motor', unit_price: 450 };

    const q1 = ((ordIndex % 4) + 1) * 5;
    const q2 = ((ordIndex % 3) + 1) * 3;
    const total1 = +(q1 * p1.unit_price).toFixed(2);
    const total2 = +(q2 * p2.unit_price).toFixed(2);
    const totalOrderAmount = +(total1 + total2).toFixed(2);

    const [orderRes] = await db.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, warehouse_id, total_amount, status, order_date, expected_delivery, tracking_number, shipping_carrier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNum, cust.name, cust.email, whId, totalOrderAmount, status, orderDate, deliveryDate, trackingNum, carrier, `Priority commercial shipment for ${cust.name}. Handled via ${carrier}.`]);

    const orderId = orderRes.insertId || ordIndex;

    // Insert order items
    await db.query(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
    `, [orderId, p1.id, p1.name, q1, p1.unit_price, total1, orderId, p2.id, p2.name, q2, p2.unit_price, total2]);
  }

  console.log('[Seed] 36 Orders and items seeded successfully.');

  // 7. Seed Stock Movements
  const movements = [
    { type: 'TRANSFER', pId: 1, pName: 'QuantumCore Microprocessor 64-Bit Pro (v1.0)', fromWh: 1, toWh: 2, qty: 50, ref: 'XFR-9012', reason: 'Rebalancing London Hub stock for European clients', user: 'Nirajana' },
    { type: 'TRANSFER', pId: 7, pName: 'Brushless High-Torque Servo Motor 750W Pro', fromWh: 3, toWh: 4, qty: 25, ref: 'XFR-9013', reason: 'High demand fulfillment in Singapore APAC region', user: 'Vasanth' },
    { type: 'PURCHASE_RECEIPT', pId: 13, pName: '3D Solid-State LIDAR Scanner 120m', fromWh: null, toWh: 1, qty: 100, ref: 'PO-7741', reason: 'Incoming quarterly batch from Tokyo Sensor Matrix', user: 'Raj' },
    { type: 'PURCHASE_RECEIPT', pId: 18, pName: 'Lithium-Iron Phosphate Prismatic Cell 100Ah', fromWh: null, toWh: 4, qty: 200, ref: 'PO-7742', reason: 'Austin Smart Energy bulk container arrival', user: 'Deepak' },
    { type: 'TRANSFER', pId: 22, pName: 'Industrial Touchscreen HMI Panel 15.6 Inch', fromWh: 4, toWh: 5, qty: 30, ref: 'XFR-9014', reason: 'Sydney mining automation client staging', user: 'Santhosh' },
    { type: 'ORDER_FULFILLMENT', pId: 2, pName: 'High-Current Solid-State Relay 50A', fromWh: 2, toWh: null, qty: 45, ref: 'ORD-2026-1002', reason: 'Dispatched to Bosch Automotive Electronics', user: 'Nirajana' },
    { type: 'ADJUSTMENT', pId: 27, pName: 'Carbon Fiber Aerospace Structural Truss Tube', fromWh: 1, toWh: 1, qty: -5, ref: 'AUD-3310', reason: 'Damaged in transit during cross-dock unboxing', user: 'Raj' }
  ];

  for (const mov of movements) {
    await db.query(`
      INSERT INTO stock_movements (movement_type, product_id, product_name, from_warehouse_id, to_warehouse_id, quantity, reference_id, reason, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [mov.type, mov.pId, mov.pName, mov.fromWh, mov.toWh, mov.qty, mov.ref, mov.reason, mov.user]);
  }
  console.log('[Seed] Stock movements seeded.');

  // 8. Seed Notifications
  const notifications = [
    { title: 'Critical Low Stock Alert', message: 'Item SKU-1014 (3D Solid-State LIDAR Scanner) is below minimum threshold at New York Hub (7 units remaining, threshold 15).', type: 'low_stock' },
    { title: 'Out of Stock Alert', message: 'Item SKU-1018 (Prismatic Cell 100Ah) has reached 0 units in London Gateway.', type: 'low_stock' },
    { title: 'Inter-Warehouse Transfer Completed', message: '50 units of QuantumCore Microprocessor successfully received at London Gateway from New York Hub.', type: 'transfer' },
    { title: 'Order Dispatched', message: 'Order ORD-2026-1011 (Siemens Energy Global) has been dispatched via DHL Global Forwarding.', type: 'order_status' },
    { title: 'System Health Check', message: 'All 5 distributed regional warehouse nodes are synchronized and reporting real-time metrics.', type: 'system' }
  ];

  for (const n of notifications) {
    await db.query(`
      INSERT INTO notifications (title, message, type, read_status)
      VALUES (?, ?, ?, 0)
    `, [n.title, n.message, n.type]);
  }
  console.log('[Seed] Notifications seeded.');

  console.log('[Seed] ✅ Database seeding finished successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = seed;
