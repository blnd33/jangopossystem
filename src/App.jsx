import { useState } from 'react';
import { COLORS, PAGE_TITLES } from './data/store';
import { useLanguage } from './data/LanguageContext';
import { useAuth } from './contexts/AuthContext';
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

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isRTL, t } = useLanguage();
  const { currentUser, loading, hasPermission, isSuperAdmin } = useAuth();

  // Show loading screen
  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: COLORS.charcoal
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>J</span>
          </div>
          <div style={{ color: COLORS.steelDark, fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Access denied page
  function AccessDenied() {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 16
      }}>
        <div style={{ fontSize: 60 }}>🔒</div>
        <div style={{
          fontSize: 20, fontWeight: 700, color: COLORS.charcoal,
          fontFamily: 'Georgia, serif'
        }}>
          {isRTL ? 'ليس لديك صلاحية' : 'Access Denied'}
        </div>
        <div style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', maxWidth: 300 }}>
          {isRTL
            ? 'ليس لديك صلاحية لعرض هذه الصفحة. تواصل مع مدير النظام.'
            : 'You do not have permission to view this page. Contact your Super Admin.'}
        </div>
        <button
          onClick={() => setActivePage('dashboard')}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            color: COLORS.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isRTL ? 'العودة للرئيسية' : 'Go to Dashboard'}
        </button>
      </div>
    );
  }

  function renderPage() {
    // User management — super admin only
    if (activePage === 'user-management') {
      if (!isSuperAdmin()) return <AccessDenied />;
      return <UserManagement />;
    }

    // Check permission for all other pages
    if (!hasPermission(activePage)) {
      return <AccessDenied />;
    }

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
      default: return <PlaceholderPage pageId={activePage} />;
    }
  }

  const fullPageModules = [
    'dashboard', 'suppliers', 'categories', 'inventory',
    'customers', 'pos', 'expenses', 'sales-report',
    'pl', 'cashflow', 'employees', 'delivery',
    'purchase-orders', 'returns', 'settings', 'user-management'
  ];
  const isFullPage = fullPageModules.includes(activePage);

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: COLORS.offWhite,
      flexDirection: isRTL ? 'row-reverse' : 'row'
    }}>

      {/* SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP BAR */}
        <TopBar
          activePage={activePage}
          setActivePage={setActivePage}
        />

        {/* CONTENT */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: activePage === 'pos' ? 0 : 28,
          direction: isRTL ? 'rtl' : 'ltr'
        }}>

          {activePage !== 'pos' && activePage !== 'dashboard' && (
            <>
              <div style={{
                height: 3,
                background: isRTL
                  ? `linear-gradient(270deg, ${COLORS.red}, ${COLORS.red}44, transparent)`
                  : `linear-gradient(90deg, ${COLORS.red}, ${COLORS.red}44, transparent)`,
                borderRadius: 2, marginBottom: 24
              }} />
              <StatCards />
            </>
          )}

          <div style={{
            background: COLORS.white,
            borderRadius: activePage === 'pos' ? 0 : 12,
            border: activePage === 'pos' ? 'none' : `1px solid ${COLORS.border}`,
            minHeight: activePage === 'pos' ? '100%' : 400,
            boxShadow: activePage === 'pos' ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
            height: activePage === 'pos' ? '100%' : 'auto'
          }}>
            {!isFullPage && (
              <div style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <div style={{ width: 4, height: 18, background: COLORS.red, borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                  {PAGE_TITLES[activePage]}
                </span>
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}