import { COLORS } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  DashIcon, PosIcon, BoxIcon, TruckIcon, TagIcon, ClipboardIcon,
  UsersIcon, DeliveryIcon, ReturnIcon, ChartIcon, WalletIcon,
  PLIcon, FlowIcon, TeamIcon, ReportIcon, SettingsIcon, MenuIcon, ChevronRight
} from './Icons';

const DebtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="6" y1="15" x2="10" y2="15"/>
  </svg>
);

const ICON_MAP = {
  dashboard: DashIcon, pos: PosIcon, inventory: BoxIcon,
  suppliers: TruckIcon, categories: TagIcon,
  'purchase-orders': ClipboardIcon, customers: UsersIcon,
  delivery: DeliveryIcon, returns: ReturnIcon,
  'sales-report': ChartIcon, expenses: WalletIcon,
  pl: PLIcon, cashflow: FlowIcon, employees: TeamIcon,
  reports: ReportIcon, settings: SettingsIcon,
  'user-management': UsersIcon,
  gifts: () => <span style={{ fontSize: 15 }}>🎁</span>,
  debts: DebtIcon,
  history: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

function JangoLogo({ collapsed, t, isRTL, language }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: collapsed ? 0 : 10,
      justifyContent: collapsed ? 'center' : 'flex-start',
      flexDirection: isRTL && !collapsed ? 'row-reverse' : 'row'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>J</span>
      </div>
      {!collapsed && (
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', lineHeight: 1, letterSpacing: 0.5 }}>
            {language === 'ar' ? 'جانغو' : 'Jango'}
          </div>
          <div style={{ fontSize: 9, color: COLORS.steelDark, letterSpacing: language === 'ar' ? 0 : 2, textTransform: 'uppercase', marginTop: 1 }}>
            {t('jangoPos')}
          </div>
          <div style={{ width: 36, height: 2.5, background: `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${COLORS.red}, transparent)`, borderRadius: 2, marginTop: 2 }} />
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed, onClose, isMobileDrawer }) {
  const { t, isRTL, language } = useLanguage();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const C = useThemeColors();

  const sidebarBg = isDark ? '#111316' : COLORS.charcoal;
  const sidebarBorder = isDark ? '#1e2227' : COLORS.charcoalLight;
  const sidebarText = isDark ? '#8899aa' : COLORS.steelDark;
  const sidebarTextMuted = isDark ? '#445566' : COLORS.charcoalMid;
  const sidebarActive = isDark ? `${COLORS.red}33` : `${COLORS.red}22`;

  const NAV_SECTIONS = [
    {
      label: t('main'),
      items: [
        { id: 'dashboard', label: t('dashboard') },
        { id: 'pos', label: t('pos') },
      ],
    },
    {
      label: t('inventorySection'),
      items: [
        { id: 'inventory', label: t('inventory') },
        { id: 'suppliers', label: t('suppliers') },
        { id: 'categories', label: t('categories') },
        { id: 'purchase-orders', label: t('purchaseOrders') },
      ],
    },
    {
      label: t('customersSection'),
      items: [
        { id: 'customers', label: t('customers') },
        { id: 'delivery', label: t('delivery') },
        { id: 'returns', label: t('returns') },
        { id: 'gifts', label: t('gifts') },
      ],
    },
    {
      label: t('financeSection'),
      items: [
        { id: 'sales-report', label: t('salesReport') },
        { id: 'expenses', label: t('expenses') },
        { id: 'pl', label: t('pl') },
        { id: 'cashflow', label: t('cashflow') },
        { id: 'debts', label: language === 'ar' ? 'الديون' : 'Debts' },
        { id: 'history', label: language === 'ar' ? 'سجل النشاط' : 'History' },
      ],
    },
    {
      label: t('team'),
      items: [
        { id: 'employees', label: t('employees') },
      ],
    },
    {
      label: t('system'),
      items: [
        { id: 'reports', label: t('reports') },
        { id: 'settings', label: t('settings') },
        ...(isSuperAdmin() ? [{ id: 'user-management', label: t('userManagement') }] : []),
      ],
    },
  ];

  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.id === 'user-management') return isSuperAdmin();
      if (item.id === 'debts') return true;
      return hasPermission(item.id);
    })
  })).filter(section => section.items.length > 0);

  const isCollapsed = !isMobileDrawer && collapsed;

  return (
    <div style={{
      width: isCollapsed ? 64 : 240,
      height: '100%',
      background: sidebarBg,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: isRTL ? '-2px 0 16px rgba(0,0,0,0.25)' : '2px 0 16px rgba(0,0,0,0.25)'
    }}>

      {/* Logo + Close/Collapse */}
      <div style={{
        padding: isCollapsed ? '18px 14px' : '18px 18px',
        borderBottom: `1px solid ${sidebarBorder}`,
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        flexDirection: isRTL && !isCollapsed ? 'row-reverse' : 'row',
        flexShrink: 0
      }}>
        <JangoLogo collapsed={isCollapsed} t={t} isRTL={isRTL} language={language} />
        {!isCollapsed && (
          <button
            onClick={isMobileDrawer ? onClose : () => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sidebarText, padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', fontSize: 18 }}
          >
            {isMobileDrawer ? '✕' : <MenuIcon />}
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {filteredSections.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {!isCollapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700,
                letterSpacing: language === 'ar' ? 0 : 1.5,
                textTransform: 'uppercase', color: sidebarTextMuted,
                padding: '10px 18px 4px',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {section.label}
              </div>
            )}
            {isCollapsed && <div style={{ height: 8 }} />}
            {section.items.map(item => {
              const isActive = activePage === item.id;
              const Icon = ICON_MAP[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: isCollapsed ? '10px 0' : '10px 18px',
                    justifyContent: isCollapsed ? 'center' : (isRTL ? 'flex-end' : 'flex-start'),
                    flexDirection: isRTL && !isCollapsed ? 'row-reverse' : 'row',
                    background: isActive ? sidebarActive : 'none',
                    border: 'none',
                    borderLeft: !isRTL ? (isActive ? `3px solid ${COLORS.red}` : '3px solid transparent') : 'none',
                    borderRight: isRTL ? (isActive ? `3px solid ${COLORS.red}` : '3px solid transparent') : 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                    color: isActive ? '#fff' : sidebarText,
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? '#ffffff11' : `${COLORS.charcoalLight}66`; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }}>
                    {Icon && <Icon />}
                  </span>
                  {!isCollapsed && (
                    <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'inherit' }}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, width: 6, height: 6, borderRadius: '50%', background: COLORS.red, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Expand button */}
      {isCollapsed && (
        <div style={{ padding: '12px 0', borderTop: `1px solid ${sidebarBorder}`, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <button onClick={() => setCollapsed(false)} style={{ background: isDark ? '#ffffff11' : `${COLORS.charcoalLight}88`, border: 'none', cursor: 'pointer', color: sidebarText, padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Version */}
      {!isCollapsed && (
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${sidebarBorder}`, textAlign: isRTL ? 'right' : 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: sidebarTextMuted, letterSpacing: 0.5 }}>{t('version')}</div>
        </div>
      )}
    </div>
  );
}