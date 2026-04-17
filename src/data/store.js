// ── Colors ─────────────────────────────────────────
export function getColors() {
  return {
    steel: "#C8CDD2",
    steelDark: "#9BA3AA",
    charcoal: "#2A2D30",
    charcoalLight: "#3D4145",
    charcoalMid: "#4E5358",
    red: "#CC1B1B",
    redDark: "#A01515",
    redLight: "#E53030",
    white: "#FFFFFF",
    offWhite: "#F4F5F6",
    surface: "#EAECEE",
    textMuted: "#7A8490",
    border: "#D1D5D9",
    success: "#16A34A",
    warning: "#D97706",
    info: "#2563EB",
  };
}

export function getDarkColors() {
  return {
    steel: "#4a5568",
    steelDark: "#718096",
    charcoal: "#e8eaed",
    charcoalLight: "#b0b8c1",
    charcoalMid: "#9aa3ad",
    red: "#e53030",
    redDark: "#CC1B1B",
    redLight: "#f87171",
    white: "#2a2f36",
    offWhite: "#22262b",
    surface: "#1a1d21",
    textMuted: "#7a8490",
    border: "#3a4149",
    success: "#22c55e",
    warning: "#f59e0b",
    info: "#3b82f6",
  };
}

export const COLORS = {
  steel: "#C8CDD2",
  steelDark: "#9BA3AA",
  charcoal: "#2A2D30",
  charcoalLight: "#3D4145",
  charcoalMid: "#4E5358",
  red: "#CC1B1B",
  redDark: "#A01515",
  redLight: "#E53030",
  white: "#FFFFFF",
  offWhite: "#F4F5F6",
  surface: "#EAECEE",
  textMuted: "#7A8490",
  border: "#D1D5D9",
  success: "#16A34A",
  warning: "#D97706",
  info: "#2563EB",
};

// ── Page Titles ────────────────────────────────────
export const PAGE_TITLES = {
  dashboard: "Dashboard",
  pos: "Point of Sale",
  inventory: "Products & Inventory",
  suppliers: "Suppliers",
  categories: "Categories",
  "purchase-orders": "Purchase Orders",
  customers: "Customers",
  delivery: "Delivery & Installation",
  returns: "Returns & Exchanges",
  "sales-report": "Sales Reports",
  expenses: "Expenses",
  pl: "Profit & Loss",
  cashflow: "Cash Flow",
  employees: "Employees",
  reports: "Reports & Analytics",
  settings: "Settings",
  "user-management": "User Management",
};

// ── Module Descriptions ────────────────────────────
export const MODULE_DESCRIPTIONS = {
  dashboard: "Overview of daily sales, alerts, and key performance indicators.",
  pos: "Sell products, manage cart, apply discounts, and process payments.",
  inventory: "Manage all furniture products with photos, cost price, and sell price.",
  suppliers: "Add and manage suppliers that Jango buys furniture from.",
  categories: "Organize furniture types per supplier.",
  "purchase-orders": "Create and track restocking orders sent to suppliers.",
  customers: "Customer profiles, purchase history, and credit/debt tracking.",
  delivery: "Schedule and track furniture deliveries and installations.",
  returns: "Handle customer returns, refunds, and exchanges.",
  "sales-report": "Daily, weekly, monthly, and yearly sales breakdown.",
  expenses: "Log and categorize all business expenses.",
  pl: "Profit & Loss statement — revenue minus costs and expenses.",
  cashflow: "Track money flowing in and out of the business.",
  employees: "Staff profiles, roles, permissions, and salary tracking.",
  reports: "Advanced analytics — best sellers, supplier performance, and more.",
  settings: "Company info, currency, tax, receipt customization, and data backup.",
};

// ── Nav Sections ───────────────────────────────────
export const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "pos", label: "Point of Sale" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { id: "inventory", label: "Products" },
      { id: "suppliers", label: "Suppliers" },
      { id: "categories", label: "Categories" },
      { id: "purchase-orders", label: "Purchase Orders" },
    ],
  },
  {
    label: "Customers",
    items: [
      { id: "customers", label: "Customers" },
      { id: "delivery", label: "Delivery" },
      { id: "returns", label: "Returns" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "sales-report", label: "Sales Reports" },
      { id: "expenses", label: "Expenses" },
      { id: "pl", label: "Profit & Loss" },
      { id: "cashflow", label: "Cash Flow" },
    ],
  },
  {
    label: "Team",
    items: [
      { id: "employees", label: "Employees" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ],
  },
];

// ── ID Generator ───────────────────────────────────
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Suppliers ──────────────────────────────────────
export function getSuppliers() {
  return JSON.parse(localStorage.getItem("jango_suppliers") || "[]");
}
export function saveSuppliers(data) {
  localStorage.setItem("jango_suppliers", JSON.stringify(data));
}

// ── Categories ─────────────────────────────────────
export function getCategories() {
  return JSON.parse(localStorage.getItem("jango_categories") || "[]");
}
export function saveCategories(data) {
  localStorage.setItem("jango_categories", JSON.stringify(data));
}

// ── Products ───────────────────────────────────────
export function getProducts() {
  return JSON.parse(localStorage.getItem("jango_products") || "[]");
}
export function saveProducts(data) {
  localStorage.setItem("jango_products", JSON.stringify(data));
}

// ── Customers ──────────────────────────────────────
export function getCustomers() {
  return JSON.parse(localStorage.getItem("jango_customers") || "[]");
}
export function saveCustomers(data) {
  localStorage.setItem("jango_customers", JSON.stringify(data));
}

// ── Sales ──────────────────────────────────────────
export function getSales() {
  return JSON.parse(localStorage.getItem("jango_sales") || "[]");
}
export function saveSales(data) {
  localStorage.setItem("jango_sales", JSON.stringify(data));
}

// ── Expenses ───────────────────────────────────────
export function getExpenses() {
  return JSON.parse(localStorage.getItem("jango_expenses") || "[]");
}
export function saveExpenses(data) {
  localStorage.setItem("jango_expenses", JSON.stringify(data));
}

// ── Employees ──────────────────────────────────────
export function getEmployees() {
  return JSON.parse(localStorage.getItem("jango_employees") || "[]");
}
export function saveEmployees(data) {
  localStorage.setItem("jango_employees", JSON.stringify(data));
}

// ── Deliveries ─────────────────────────────────────
export function getDeliveries() {
  return JSON.parse(localStorage.getItem("jango_deliveries") || "[]");
}
export function saveDeliveries(data) {
  localStorage.setItem("jango_deliveries", JSON.stringify(data));
}

// ── Purchase Orders ────────────────────────────────
export function getPurchaseOrders() {
  return JSON.parse(localStorage.getItem("jango_purchase_orders") || "[]");
}
export function savePurchaseOrders(data) {
  localStorage.setItem("jango_purchase_orders", JSON.stringify(data));
}

// ── Returns ────────────────────────────────────────
export function getReturns() {
  return JSON.parse(localStorage.getItem("jango_returns") || "[]");
}
export function saveReturns(data) {
  localStorage.setItem("jango_returns", JSON.stringify(data));
}

// ── Users ──────────────────────────────────────────
export function getUsers() {
  const users = JSON.parse(localStorage.getItem("jango_users") || "[]");
  if (users.length === 0) {
    const defaultAdmin = {
      id: "superadmin-001",
      username: "admin",
      password: "admin123",
      name: "Super Admin",
      role: "superadmin",
      permissions: {
        dashboard: true, pos: true, inventory: true,
        suppliers: true, categories: true, "purchase-orders": true,
        customers: true, delivery: true, returns: true,
        "sales-report": true, expenses: true, pl: true,
        cashflow: true, employees: true, reports: true, settings: true
      },
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    localStorage.setItem("jango_users", JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  }
  return users;
}
export function saveUsers(data) {
  localStorage.setItem("jango_users", JSON.stringify(data));
}

// ── Current User Session ───────────────────────────
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("jango_current_user") || "null");
}
export function setCurrentUser(user) {
  localStorage.setItem("jango_current_user", JSON.stringify(user));
}
export function logout() {
  localStorage.removeItem("jango_current_user");
}

// ── Access Log ─────────────────────────────────────
export function getAccessLog() {
  return JSON.parse(localStorage.getItem("jango_access_log") || "[]");
}
export function saveAccessLog(data) {
  localStorage.setItem("jango_access_log", JSON.stringify(data));
}
export function logAccess(user, action) {
  const log = getAccessLog();
  const entry = {
    id: generateId(),
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    action,
    time: new Date().toISOString(),
  };
  saveAccessLog([entry, ...log].slice(0, 500));
  return entry;
}

// ── Notifications — now backed by Flask API ────────
const BASE = 'http://127.0.0.1:5000';

export async function getUnreadNotificationsAsync() {
  try {
    const res = await fetch(`${BASE}/api/notifications`);
    return await res.json();
  } catch {
    return [];
  }
}

// Keep sync version for legacy calls — returns localStorage fallback
export function getUnreadNotifications() {
  return JSON.parse(localStorage.getItem("jango_notifications") || "[]");
}

export function saveNotifications(data) {
  localStorage.setItem("jango_notifications", JSON.stringify(data));
}

export async function addNotification(message, type = "info") {
  try {
    await fetch(`${BASE}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type }),
    });
  } catch {
    // fallback to localStorage if backend unreachable
    const notifications = getUnreadNotifications();
    const notification = {
      id: generateId(),
      message,
      type,
      time: new Date().toISOString(),
      read: false,
    };
    saveNotifications([notification, ...notifications].slice(0, 100));
  }
}

export async function markAllRead() {
  try {
    await fetch(`${BASE}/api/notifications/mark-read`, { method: 'POST' });
  } catch {
    const notifications = getUnreadNotifications();
    saveNotifications(notifications.map(n => ({ ...n, read: true })));
  }
}

// ── Currency ───────────────────────────────────────
export function getCurrencySettings() {
  const defaults = { currency: 'USD', symbol: '$', exchangeRate: 1480 };
  return JSON.parse(localStorage.getItem('jango_currency') || JSON.stringify(defaults));
}
export function saveCurrencySettings(data) {
  localStorage.setItem('jango_currency', JSON.stringify(data));
}
export function formatMoney(amount, currencySettings) {
  if (!currencySettings) currencySettings = getCurrencySettings();
  if (currencySettings.currency === 'IQD') {
    const iqd = amount * currencySettings.exchangeRate;
    return `${Math.round(iqd).toLocaleString()} IQD`;
  }
  return `$${parseFloat(amount).toFixed(2)}`;
}

// ── Gifts ──────────────────────────────────────────
export function getGifts() {
  return JSON.parse(localStorage.getItem('jango_gifts') || '[]');
}
export function saveGifts(data) {
  localStorage.setItem('jango_gifts', JSON.stringify(data));
}
export function getGiftMilestones() {
  const defaults = [
    { id: 'ms1', threshold: 500, giftType: 'discount', giftValue: 10, description: '10% discount voucher', active: true },
    { id: 'ms2', threshold: 1000, giftType: 'service', giftValue: 0, description: 'Free delivery on next order', active: true },
    { id: 'ms3', threshold: 2500, giftType: 'product', giftValue: 0, description: 'Free small furniture item', active: true },
    { id: 'ms4', threshold: 5000, giftType: 'credit', giftValue: 100, description: 'VIP upgrade + $100 credit', active: true },
  ];
  return JSON.parse(localStorage.getItem('jango_gift_milestones') || JSON.stringify(defaults));
}
export function saveGiftMilestones(data) {
  localStorage.setItem('jango_gift_milestones', JSON.stringify(data));
}

// ── Theme ──────────────────────────────────────────
export function getTheme() {
  return localStorage.getItem('jango_theme') || 'light';
}
export function saveTheme(theme) {
  localStorage.setItem('jango_theme', theme);
}