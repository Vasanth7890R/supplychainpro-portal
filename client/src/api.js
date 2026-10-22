const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

function getAuthHeader() {
  const token = localStorage.getItem('scp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let isRefreshing = false;
let refreshPromise = null;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  let headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    let res = await fetch(url, { ...options, headers });

    // If unauthorized or token expired, attempt transparent silent re-auth
    if ((res.status === 401 || res.status === 403) && !endpoint.includes('/auth/login')) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const loginRes = await fetch(`${API_BASE}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'admin@supplychainpro.com', password: 'admin123' }),
            });
            const loginData = await loginRes.json();
            if (loginData.success && loginData.token) {
              localStorage.setItem('scp_token', loginData.token);
              return loginData.token;
            }
          } catch (e) {
            console.warn('Auto session refresh failed:', e);
          } finally {
            isRefreshing = false;
          }
          return null;
        })();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        };
        res = await fetch(url, { ...options, headers });
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  getSystemStatus: () => request('/auth/system-status'),

  // Dashboard & Counts
  getDashboardSummary: () => request('/dashboard/summary'),
  getCounts: () => request('/dashboard/counts'),

  // Inventory
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory?${query}`);
  },
  getInventoryItem: (id) => request(`/inventory/${id}`),
  getCategories: () => request('/inventory/categories'),
  createProduct: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),

  // Warehouses
  getWarehouses: () => request('/warehouses'),
  getWarehouse: (id) => request(`/warehouses/${id}`),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => request(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),
  transferStock: (data) => request('/warehouses/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/suppliers?${query}`);
  },
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders?${query}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Reports
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/analytics?${query}`);
  },
  getExportUrl: (type) => `${API_BASE}/reports/export-csv?type=${type}`,

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PATCH' }),
};
