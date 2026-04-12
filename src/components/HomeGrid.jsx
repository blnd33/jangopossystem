import { useState } from 'react';
import { COLORS } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashIcon, PosIcon, BoxIcon, TruckIcon, TagIcon, ClipboardIcon,
  UsersIcon, DeliveryIcon, ReturnIcon, ChartIcon, WalletIcon,
  PLIcon, FlowIcon, TeamIcon, ReportIcon, SettingsIcon,
} from './Icons';

const GiftIcon = () => <span style={{ fontSize: 20 }}>🎁</span>;

const ALL_MODULES = [
  { id: 'dashboard',       icon: DashIcon,      color: '#c0392b', labelAr: 'لوحة التحكم',       labelEn: 'Dashboard' },
  { id: 'pos',             icon: PosIcon,        color: '#27ae60', labelAr: 'نقطة البيع',         labelEn: 'Point of Sale' },
  { id: 'inventory',       icon: BoxIcon,        color: '#2980b9', labelAr: 'المنتجات والمخزون',  labelEn: 'Inventory' },
  { id: 'suppliers',       icon: TruckIcon,      color: '#8e44ad', labelAr: 'الموردون',           labelEn: 'Suppliers' },
  { id: 'categories',      icon: TagIcon,        color: '#e67e22', labelAr: 'الفئات',             labelEn: 'Categories' },
  { id: 'purchase-orders', icon: ClipboardIcon,  color: '#16a085', labelAr: 'أوامر الشراء',       labelEn: 'Purchase Orders' },
  { id: 'customers',       icon: UsersIcon,      color: '#2c3e50', labelAr: 'العملاء',            labelEn: 'Customers' },
  { id: 'delivery',        icon: DeliveryIcon,   color: '#d35400', labelAr: 'التوصيل والتركيب',   labelEn: 'Delivery' },
  { id: 'returns',         icon: ReturnIcon,     color: '#7f8c8d', labelAr: 'المرتجعات والتبديل', labelEn: 'Returns' },
  { id: 'gifts',           icon: GiftIcon,       color: '#e91e63', labelAr: 'الهدايا والمكافآت', labelEn: 'Gifts' },
  { id: 'sales-report',    icon: ChartIcon,      color: '#1abc9c', labelAr: 'تقارير المبيعات',    labelEn: 'Sales Report' },
  { id: 'expenses',        icon: WalletIcon,     color: '#f39c12', labelAr: 'المصروفات',          labelEn: 'Expenses' },
  { id: 'pl',              icon: PLIcon,         color: '#3498db', labelAr: 'الأرباح والخسائر',   labelEn: 'Profit & Loss' },
  { id: 'cashflow',        icon: FlowIcon,       color: '#9b59b6', labelAr: 'التدفق النقدي',      labelEn: 'Cash Flow' },
  { id: 'employees',       icon: TeamIcon,       color: '#e74c3c', labelAr: 'الموظفون',           labelEn: 'Employees' },
  { id: 'reports',         icon: ReportIcon,     color: '#2ecc71', labelAr: 'التقارير',           labelEn: 'Reports' },
  { id: 'settings',        icon: SettingsIcon,   color: '#95a5a6', labelAr: 'الإعدادات',          labelEn: 'Settings' },
];

export default function HomeGrid({ onNavigate }) {
  const { isRTL, language } = useLanguage();
  const { hasPermission, isSuperAdmin, currentUser } = useAuth();
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(null);

  const bg = isDark ? '#111316' : '#f5f6f8';
  const cardBg = isDark ? '#1a1d21' : '#ffffff';
  const cardBorder = isDark ? '#2a2d33' : '#e8eaed';
  const textPrimary = isDark ? '#e8edf2' : '#1a1d21';
  const textMuted = isDark ? '#6b7a8d' : '#8896a0';

  const visibleModules = ALL_MODULES.filter(m => {
    if (m.id === 'user-management') return isSuperAdmin();
    return hasPermission(m.id);
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (language === 'ar') {
      if (h < 12) return 'صباح الخير';
      if (h < 17) return 'مساء الخير';
      return 'مساء النور';
    }
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      direction: isRTL ? 'rtl' : 'ltr',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 24px 40px',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>J</span>
        </div>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 6, letterSpacing: 0.3 }}>
          {greeting()}{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
        </div>
        <div style={{
          fontSize: 26, fontWeight: 700, color: textPrimary,
          fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif',
          letterSpacing: -0.5
        }}>
          {language === 'ar' ? 'نظام جانغو' : 'Jango POS'}
        </div>
        <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
          {language === 'ar' ? 'اختر القسم للبدء' : 'Select a module to get started'}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 14,
        width: '100%',
        maxWidth: 760,
      }}>
        {visibleModules.map(mod => {
          const Icon = mod.icon;
          const isHov = hovered === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              onMouseEnter={() => setHovered(mod.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: cardBg,
                border: `1px solid ${isHov ? mod.color + '88' : cardBorder}`,
                borderRadius: 14,
                padding: '22px 12px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.18s ease',
                transform: isHov ? 'translateY(-3px)' : 'none',
                boxShadow: isHov
                  ? `0 8px 24px ${mod.color}28`
                  : isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                outline: 'none',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: mod.color + (isDark ? '28' : '18'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.18s',
                color: mod.color,
              }}>
                <span style={{ color: mod.color, display: 'flex', fontSize: 20 }}>
                  <Icon />
                </span>
              </div>

              {/* Label */}
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: isHov ? mod.color : textPrimary,
                textAlign: 'center',
                lineHeight: 1.4,
                fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'inherit',
                transition: 'color 0.18s',
              }}>
                {language === 'ar' ? mod.labelAr : mod.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, fontSize: 11, color: textMuted, opacity: 0.6 }}>
        {language === 'ar' ? 'جانغو v1.0' : 'Jango v1.0'}
      </div>
    </div>
  );
}