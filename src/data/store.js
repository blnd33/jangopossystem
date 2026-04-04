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
};

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
// ── Suppliers helpers ──────────────────────────────
export function getSuppliers() {
  return JSON.parse(localStorage.getItem("jango_suppliers") || "[]");
}
export function saveSuppliers(data) {
  localStorage.setItem("jango_suppliers", JSON.stringify(data));
}

// ── Categories helpers ─────────────────────────────
export function getCategories() {
  return JSON.parse(localStorage.getItem("jango_categories") || "[]");
}
export function saveCategories(data) {
  localStorage.setItem("jango_categories", JSON.stringify(data));
}

// ── ID generator ───────────────────────────────────
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
// ── Products helpers ───────────────────────────────
export function getProducts() {
  return JSON.parse(localStorage.getItem("jango_products") || "[]");
}
export function saveProducts(data) {
  localStorage.setItem("jango_products", JSON.stringify(data));
}
// ── Customers helpers ──────────────────────────────
export function getCustomers() {
  return JSON.parse(localStorage.getItem("jango_customers") || "[]");
}
export function saveCustomers(data) {
  localStorage.setItem("jango_customers", JSON.stringify(data));
}
// ── Sales helpers ──────────────────────────────────
export function getSales() {
  return JSON.parse(localStorage.getItem("jango_sales") || "[]");
}
export function saveSales(data) {
  localStorage.setItem("jango_sales", JSON.stringify(data));
}
// ── Expenses helpers ───────────────────────────────
export function getExpenses() {
  return JSON.parse(localStorage.getItem("jango_expenses") || "[]");
}
export function saveExpenses(data) {
  localStorage.setItem("jango_expenses", JSON.stringify(data));
}
// ── Employees helpers ──────────────────────────────
export function getEmployees() {
  return JSON.parse(localStorage.getItem("jango_employees") || "[]");
}
export function saveEmployees(data) {
  localStorage.setItem("jango_employees", JSON.stringify(data));
}
// ── Delivery helpers ───────────────────────────────
export function getDeliveries() {
  return JSON.parse(localStorage.getItem("jango_deliveries") || "[]");
}
export function saveDeliveries(data) {
  localStorage.setItem("jango_deliveries", JSON.stringify(data));
}
// ── Purchase Orders helpers ────────────────────────
export function getPurchaseOrders() {
  return JSON.parse(localStorage.getItem("jango_purchase_orders") || "[]");
}
export function savePurchaseOrders(data) {
  localStorage.setItem("jango_purchase_orders", JSON.stringify(data));
}
// ── Returns helpers ────────────────────────────────
export function getReturns() {
  return JSON.parse(localStorage.getItem("jango_returns") || "[]");
}
export function saveReturns(data) {
  localStorage.setItem("jango_returns", JSON.stringify(data));
}