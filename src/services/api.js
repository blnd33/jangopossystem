const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, opts)
  const data = await res.json()

  if (!res.ok) {
    const error = new Error(data.error || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }
  return data
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const put = (path, body) => request('PUT', path, body)
const del = (path) => request('DELETE', path)

const pos = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/pos/products${qs ? '?' + qs : ''}`)
  },
  getProductByBarcode: (barcode) => get(`/pos/products/barcode/${barcode}`),
  checkout: (payload) => post('/pos/checkout', payload),
  getSales: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/pos/sales${qs ? '?' + qs : ''}`)
  },
  getSale: (id) => get(`/pos/sales/${id}`),
  refundSale: (id) => post(`/pos/sales/${id}/refund`),
}

const dashboard = {
  getStats: () => get('/dashboard/stats'),
  getSalesChart: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/dashboard/sales-chart${qs ? '?' + qs : ''}`)
  },
  getTopProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/dashboard/top-products${qs ? '?' + qs : ''}`)
  },
  getPaymentMethods: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/dashboard/payment-methods${qs ? '?' + qs : ''}`)
  },
  getCashFlow: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/dashboard/cash-flow${qs ? '?' + qs : ''}`)
  },
}

const products = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/products/${qs ? '?' + qs : ''}`)
  },
  getOne: (id) => get(`/products/${id}`),
  create: (data) => post('/products/', data),
  update: (id, data) => put(`/products/${id}`, data),
  delete: (id) => del(`/products/${id}`),
  adjustStock: (id, adjustment) => post(`/products/${id}/adjust-stock`, { adjustment }),
}

const customers = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/customers/${qs ? '?' + qs : ''}`)
  },
  getOne: (id) => get(`/customers/${id}`),
  create: (data) => post('/customers/', data),
  update: (id, data) => put(`/customers/${id}`, data),
  delete: (id) => del(`/customers/${id}`),
}

const categories = {
  getAll: () => get('/categories/'),
  create: (data) => post('/categories/', data),
  update: (id, data) => put(`/categories/${id}`, data),
  delete: (id) => del(`/categories/${id}`),
}

const expenses = {
  getAll: () => get('/expenses/'),
  create: (data) => post('/expenses/', data),
  delete: (id) => del(`/expenses/${id}`),
}

// ─── DELIVERIES ──────────────────────────────────────────────────────────────
const deliveries = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return get(`/deliveries/${qs ? '?' + qs : ''}`)
  },
  create: (data) => post('/deliveries/', data),
  update: (id, data) => put(`/deliveries/${id}`, data),
  updateStatus: (id, status) => request('PATCH', `/deliveries/${id}/status`, { status }),
  delete: (id) => del(`/deliveries/${id}`),
}

const api = { pos, dashboard, products, customers, categories, expenses, deliveries }
export default api