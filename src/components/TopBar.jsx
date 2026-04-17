import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { BellIcon, PosIcon } from './Icons';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

const BASE = 'http://127.0.0.1:5000';

async function fetchNotificationsFromAPI() {
  try {
    const res = await fetch(`${BASE}/api/notifications`);
    return await res.json();
  } catch {
    return [];
  }
}
function markAllReadAPI() {
  fetch(`${BASE}/api/notifications/mark-read`, { method: 'POST' }).catch(() => null);
}

export default function TopBar({ activePage, setActivePage, onMenuClick, isMobile }) {
  const { language, changeLanguage, t, isRTL } = useLanguage();
  const { currentUser, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const C = useThemeColors();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    // Fetch immediately
    fetchNotificationsFromAPI().then(setNotifications);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchNotificationsFromAPI().then(setNotifications);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleMarkAllRead() {
    await markAllReadAPI();
    fetchNotificationsFromAPI().then(setNotifications);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const today = new Date().toLocaleDateString(
    language === 'ar' ? 'ar-IQ' : 'en-GB',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  const PAGE_TITLES_T = {
    dashboard: t('dashboard'), pos: t('pos'),
    inventory: t('inventory'), suppliers: t('suppliers'),
    categories: t('categories'), 'purchase-orders': t('purchaseOrders'),
    customers: t('customers'), delivery: t('delivery'),
    returns: t('returns'), 'sales-report': t('salesReport'),
    expenses: t('expenses'), pl: t('pl'),
    cashflow: t('cashflow'), employees: t('employees'),
    reports: t('reports'), settings: t('settings'),
    'user-management': t('userManagement'),
    gifts: t('gifts'),
    'sales-receipts': language === 'ar' ? 'سجل الفواتير' : 'Sales Receipts',
    debts: language === 'ar' ? 'الديون' : 'Debts',
    history: language === 'ar' ? 'سجل النشاط' : 'History',
    warehouses: language === 'ar' ? 'المستودعات' : 'Warehouses',
  };

  function getRoleLabel(role) {
    if (role === 'superadmin') return language === 'ar' ? 'مدير النظام الرئيسي' : 'Super Admin';
    if (role === 'admin') return language === 'ar' ? 'مدير' : 'Admin';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
      padding: '0 28px', height: 60,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      boxShadow: `0 1px 4px ${C.border}`,
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily, zIndex: 50, position: 'relative'
    }}>

      {/* Left — Page title + mobile menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.charcoal, padding: 4, display: 'flex', alignItems: 'center' }}>
            ☰
          </button>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {PAGE_TITLES_T[activePage] || activePage}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{today}</div>
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Language Switcher */}
        {!isMobile && (
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[{ code: 'en', label: '🇬🇧 EN' }, { code: 'ar', label: '🇮🇶 AR' }].map(lang => (
              <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer',
                background: language === lang.code ? C.charcoal : C.white,
                color: language === lang.code ? '#fff' : C.charcoalMid,
                fontSize: 12, fontWeight: language === lang.code ? 600 : 400,
                transition: 'all 0.15s'
              }}>
                {lang.label}
              </button>
            ))}
          </div>
        )}

        {/* Dark Mode Toggle */}
        {!isMobile && (
          <button onClick={toggleTheme} style={{
            background: isDark ? '#FFD700' + '22' : C.offWhite,
            border: `1px solid ${isDark ? '#FFD700' + '44' : C.border}`,
            borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
            color: isDark ? '#FFD700' : C.charcoalMid,
            fontSize: 16, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s'
          }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        )}

        {/* New Sale Button */}
        {!isMobile && (
          <button onClick={() => setActivePage('pos')} style={{
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
            boxShadow: `0 2px 8px ${C.red}44`,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <PosIcon />
            {t('newSale')}
          </button>
        )}

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} style={{
            background: C.offWhite, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
            color: C.charcoalMid, display: 'flex', alignItems: 'center', position: 'relative'
          }}>
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4,
                right: isRTL ? 'auto' : -4, left: isRTL ? -4 : 'auto',
                background: C.red, color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, border: `2px solid ${C.white}`
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '110%',
              right: isRTL ? 'auto' : 0, left: isRTL ? 0 : 'auto',
              width: 340, background: C.white,
              borderRadius: 12, boxShadow: `0 8px 32px ${C.shadow}`,
              border: `1px solid ${C.border}`, zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>
                  {t('notifications')}
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0, background: C.red, color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.info, fontWeight: 600 }}>
                    {t('markAllRead')}
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>{t('noNotifications')}</div>
                ) : notifications.slice(0, 10).map((notif, i) => (
                  <div key={notif.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${C.offWhite}` : 'none',
                    background: notif.read ? C.white : `${C.red}06`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: notif.type === 'login' ? `${C.success}20` : `${C.warning}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {notif.type === 'login' ? '🔔' : notif.type === 'logout' ? '👋' : notif.type === 'sale' ? '💰' : '📢'}
                    </div>
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: notif.read ? 400 : 600, color: C.charcoal, lineHeight: 1.4 }}>{notif.message}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                        {new Date(notif.time).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!notif.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
              {currentUser?.role === 'superadmin' && (
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                  <button onClick={() => { setActivePage('user-management'); setShowNotifications(false); }} style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: `1px solid ${C.border}`, background: C.offWhite, color: C.charcoalMid, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    {language === 'ar' ? 'عرض كل السجلات' : 'View All in User Management'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar + Menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '4px 8px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.offWhite,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isMobile && (
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, lineHeight: 1.2 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{getRoleLabel(currentUser?.role)}</div>
              </div>
            )}
            <span style={{ fontSize: 10, color: C.textMuted }}>▾</span>
          </div>

          {/* User Dropdown */}
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '110%',
              right: isRTL ? 'auto' : 0, left: isRTL ? 0 : 'auto',
              width: 220, background: C.white,
              borderRadius: 12, boxShadow: `0 8px 32px ${C.shadow}`,
              border: `1px solid ${C.border}`, zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>@{currentUser?.username}</div>
                <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: currentUser?.role === 'superadmin' ? `${C.red}15` : `${C.info}15`, color: currentUser?.role === 'superadmin' ? C.red : C.info, border: `1px solid ${currentUser?.role === 'superadmin' ? C.red : C.info}44` }}>
                  {getRoleLabel(currentUser?.role)}
                </div>
              </div>

              <button onClick={toggleTheme} style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: C.charcoal, textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.offWhite}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>

              {currentUser?.role === 'superadmin' && (
                <button onClick={() => { setActivePage('user-management'); setShowUserMenu(false); }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: C.charcoal, textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.offWhite}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  👥 {t('userManagement')}
                </button>
              )}

              <button onClick={() => { setActivePage('settings'); setShowUserMenu(false); }} style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: C.charcoal, textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.offWhite}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ⚙️ {t('settings')}
              </button>

              <button onClick={logout} style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: C.red, textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.red}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🚪 {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}