import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', labelEn: 'Home', labelAr: 'الرئيسية' },
  { id: 'pos', icon: '🛒', labelEn: 'POS', labelAr: 'البيع' },
  { id: 'inventory', icon: '📦', labelEn: 'Stock', labelAr: 'المخزون' },
  { id: 'customers', icon: '👥', labelEn: 'Customers', labelAr: 'العملاء' },
  { id: 'reports', icon: '📊', labelEn: 'Reports', labelAr: 'التقارير' },
];

export default function MobileNav({ activePage, setActivePage }) {
  const { isRTL, language } = useLanguage();
  const C = useThemeColors();
  const { hasPermission } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => hasPermission(item.id));

  return (
    <div className="mobile-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.1)'
    }}>
      {visibleItems.map(item => {
        const isActive = activePage === item.id;
        return (
          <button key={item.id} onClick={() => setActivePage(item.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 4px', border: 'none', background: 'none',
            cursor: 'pointer', minHeight: 56,
            color: isActive ? C.red : C.textMuted,
            borderTop: isActive ? `2px solid ${C.red}` : '2px solid transparent',
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 400,
              marginTop: 3, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'inherit'
            }}>
              {language === 'ar' ? item.labelAr : item.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}