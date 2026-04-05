import { useState } from 'react';
import { COLORS, PAGE_TITLES } from './data/store';
import { useLanguage } from './data/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useThemeColors } from './hooks/useThemeColors';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StatCards from './components/StatCards';
import PlaceholderPage from './pages/PlaceholderPage';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import POS from './pages/POS';
import Expenses from './pages/Expenses';
import SalesReport from './pages/SalesReport';
import ProfitLoss from './pages/ProfitLoss';
import CashFlow from './pages/CashFlow';
import Employees from './pages/Employees';
import Delivery from './pages/Delivery';
import PurchaseOrders from './pages/PurchaseOrders';
import Returns from './pages/Returns';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Gifts from './pages/Gifts';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isRTL } = useLanguage();
  const { currentUser, loading, hasPermission, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const C = useThemeColors();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1d21' : COLORS.charcoal }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>J</span>
          </div>
          <div style={{ color: COLORS.steelDark, fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  function AccessDenied() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ fontSize: 60 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, fontFamily: 'Georgia, serif' }}>
          {isRTL ? 'ليس لديك صلاحية' : 'Access Denied'}
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 300 }}>
          {isRTL ? 'ليس لديك صلاحية لعرض هذه الصفحة. تواصل مع مدير النظام.' : 'You do not have permission to view this page. Contact your Super Admin.'}
        </div>
        <button onClick={() => setActivePage('dashboard')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {isRTL ? 'العودة للرئيسية' : 'Go to Dashboard'}
        </button>
      </div>
    );
  }

  function renderPage() {
    if (activePage === 'user-management') {
      if (!isSuperAdmin()) return <AccessDenied />;
      return <UserManagement />;
    }
    if (!hasPermission(activePage)) return <AccessDenied />;
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'suppliers': return <Suppliers />;
      case 'categories': return <Categories />;
      case 'inventory': return <Inventory />;
      case 'customers': return <Customers />;
      case 'pos': return <POS />;
      case 'expenses': return <Expenses />;
      case 'sales-report': return <SalesReport />;
      case 'pl': return <ProfitLoss />;
      case 'cashflow': return <CashFlow />;
      case 'employees': return <Employees />;
      case 'delivery': return <Delivery />;
      case 'purchase-orders': return <PurchaseOrders />;
      case 'returns': return <Returns />;
      case 'settings': return <Settings />;
      case 'reports': return <Reports />;
      case 'gifts': return <Gifts />;
      default: return <PlaceholderPage pageId={activePage} />;
    }
  }

  const fullPageModules = [
    'dashboard', 'suppliers', 'categories', 'inventory',
    'customers', 'pos', 'expenses', 'sales-report',
    'pl', 'cashflow', 'employees', 'delivery',
    'purchase-orders', 'returns', 'settings',
    'user-management', 'reports', 'gifts'
  ];
  const isFullPage = fullPageModules.includes(activePage);

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: C.offWhite,
      flexDirection: isRTL ? 'row-reverse' : 'row'
    }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar activePage={activePage} setActivePage={setActivePage} />
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: activePage === 'pos' ? 0 : 28,
          direction: isRTL ? 'rtl' : 'ltr',
          background: C.offWhite
        }}>
          {activePage !== 'pos' && activePage !== 'dashboard' && (
            <>
              <div style={{
                height: 3,
                background: isRTL
                  ? `linear-gradient(270deg, ${C.red}, ${C.red}44, transparent)`
                  : `linear-gradient(90deg, ${C.red}, ${C.red}44, transparent)`,
                borderRadius: 2, marginBottom: 24
              }} />
              <StatCards />
            </>
          )}
          <div style={{
            background: C.white,
            borderRadius: activePage === 'pos' ? 0 : 12,
            border: activePage === 'pos' ? 'none' : `1px solid ${C.border}`,
            minHeight: activePage === 'pos' ? '100%' : 400,
            boxShadow: activePage === 'pos' ? 'none' : `0 1px 6px ${C.shadow}`,
            height: activePage === 'pos' ? '100%' : 'auto'
          }}>
            {!isFullPage && (
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ width: 4, height: 18, background: C.red, borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{PAGE_TITLES[activePage]}</span>
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}