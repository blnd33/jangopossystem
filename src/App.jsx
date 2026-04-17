import { useState } from 'react';
import { COLORS, PAGE_TITLES } from './data/store';
import { useLanguage } from './data/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useThemeColors } from './hooks/useThemeColors';
import { useWindowSize } from './hooks/useWindowSize';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StatCards from './components/StatCards';
import MobileNav from './components/MobileNav';
import PlaceholderPage from './pages/PlaceholderPage';
import Login from './pages/Login';
import HomeGrid from './components/HomeGrid';
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
import Debts from './pages/Debts';
import History from './pages/History';
import Warehouses from './pages/Warehouses';
import SalesReceipts from './pages/SalesReceipts';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showHomeGrid, setShowHomeGrid] = useState(true);
  const { isRTL } = useLanguage();
  const { currentUser, loading, hasPermission, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const C = useThemeColors();
  const { isMobile, isTablet } = useWindowSize();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? '#1a1d21' : COLORS.charcoal
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12,
            background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>J</span>
          </div>
          <div style={{ color: COLORS.steelDark, fontSize: 13 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  if (showHomeGrid) {
    return (
      <div style={{ height: '100vh', overflowY: 'auto' }}>
        <HomeGrid onNavigate={(page) => {
          setActivePage(page);
          setShowHomeGrid(false);
        }} />
      </div>
    );
  }

  function AccessDenied() {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 16, padding: 24
      }}>
        <div style={{ fontSize: 60 }}>🔒</div>
        <div style={{
          fontSize: 20, fontWeight: 700, color: C.charcoal,
          fontFamily: 'Georgia, serif', textAlign: 'center'
        }}>
          {isRTL ? 'ليس لديك صلاحية' : 'Access Denied'}
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 300 }}>
          {isRTL
            ? 'ليس لديك صلاحية لعرض هذه الصفحة.'
            : 'You do not have permission to view this page.'}
        </div>
        <button
          onClick={() => setActivePage('dashboard')}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
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
      case 'debts': return <Debts />;
      case 'history': return <History />;
      case 'warehouses': return <Warehouses />;
      case 'sales-receipts': return <SalesReceipts />;
      default: return <PlaceholderPage pageId={activePage} />;
    }
  }

  const fullPageModules = [
    'dashboard', 'suppliers', 'categories', 'inventory',
    'customers', 'pos', 'expenses', 'sales-report',
    'pl', 'cashflow', 'employees', 'delivery',
    'purchase-orders', 'returns', 'settings',
    'user-management', 'reports', 'gifts', 'debts', 'history',
    'warehouses', 'sales-receipts'
  ];

  const isFullPage = fullPageModules.includes(activePage);
  const isPOS = activePage === 'pos';
  const showSidebar = !isMobile;
  const effectiveCollapsed = isTablet ? true : sidebarCollapsed;

  function handlePageChange(page) {
    setActivePage(page);
    setMobileSidebarOpen(false);
  }

  return (
    <div key={isRTL ? 'rtl' : 'ltr'} style={{
      display: 'flex',
      height: '100vh',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: C.offWhite,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      overflow: 'hidden',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>

      {isMobile && mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 200
          }}
        />
      )}

      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0,
          left: isRTL ? 'auto' : (mobileSidebarOpen ? 0 : '-280px'),
          right: isRTL ? (mobileSidebarOpen ? 0 : '-280px') : 'auto',
          width: 260, zIndex: 300,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), right 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}>
          <Sidebar
            activePage={activePage}
            setActivePage={handlePageChange}
            collapsed={false}
            setCollapsed={() => {}}
            onClose={() => setMobileSidebarOpen(false)}
            isMobileDrawer={true}
          />
        </div>
      )}

      {showSidebar && (
        <Sidebar
          activePage={activePage}
          setActivePage={handlePageChange}
          collapsed={effectiveCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}

      <div style={{
        flex: 1, display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', minWidth: 0
      }}>

        <TopBar
          activePage={activePage}
          setActivePage={handlePageChange}
          onMenuClick={() => setMobileSidebarOpen(true)}
          isMobile={isMobile}
        />

        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isPOS ? 0 : (isMobile ? '16px 12px' : 28),
          direction: isRTL ? 'rtl' : 'ltr',
          background: C.offWhite,
          paddingBottom: isMobile ? (isPOS ? 0 : 80) : (isPOS ? 0 : 28),
        }}>

          {!isPOS && activePage !== 'dashboard' && (
            <>
              <div style={{
                height: 3,
                background: isRTL
                  ? `linear-gradient(270deg, ${C.red}, ${C.red}44, transparent)`
                  : `linear-gradient(90deg, ${C.red}, ${C.red}44, transparent)`,
                borderRadius: 2,
                marginBottom: isMobile ? 16 : 24
              }} />
              {!isMobile && <StatCards />}
            </>
          )}

          <div style={{
            background: C.white,
            borderRadius: isPOS ? 0 : (isMobile ? 10 : 12),
            border: isPOS ? 'none' : `1px solid ${C.border}`,
            minHeight: isPOS ? '100%' : (isMobile ? 'auto' : 400),
            boxShadow: isPOS ? 'none' : `0 1px 6px ${C.shadow}`,
            height: isPOS ? '100%' : 'auto',
            overflow: 'hidden'
          }}>
            {!isFullPage && (
              <div style={{
                padding: isMobile ? '12px 14px' : '14px 20px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <div style={{ width: 4, height: 18, background: C.red, borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>
                  {PAGE_TITLES[activePage]}
                </span>
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      </div>

      {isMobile && (
        <MobileNav
          activePage={activePage}
          setActivePage={handlePageChange}
        />
      )}
    </div>
  );
}