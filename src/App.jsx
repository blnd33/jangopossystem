import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { BellIcon, PosIcon } from './Icons';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { getUnreadNotifications, markAllRead } from '../data/store';

export default function TopBar({ activePage, setActivePage, onMenuClick, isMobile }) {
  const { language, changeLanguage, t, isRTL } = useLanguage();
  const { currentUser, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const C = useThemeColors();
  const { isTablet } = useWindowSize();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    setNotifications(getUnreadNotifications());
    const interval = setInterval(() => setNotifications(getUnreadNotifications()), 5000);
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

  function handleMarkAllRead() {
    markAllRead();
    setNotifications(getUnreadNotifications());
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const PAGE_TITLES_T = {
    dashboard: t('dashboard'), pos: t('pos'),
    inventory: t('inventory'), suppliers: t('suppliers'),
    categories: t('categories'), 'purchase-orders': t('purchaseOrders'),
    customers: t('customers'), delivery: t('delivery'),
    returns: t('returns'), 'sales-report': t('salesReport'),
    expenses: t('expenses'), pl: t('pl'),
    cashflow: t('cashflow'), employees: t('employees'),
    reports: t('reports'), settings: t('settings'),
    'user-management': t('userManagement'), gifts: t('gifts'),
  };

  function getRoleLabel(role) {
    if (role === 'superadmin') return language === 'ar' ? 'مدير النظام' : 'Super Admin';
    if (role === 'admin') return language === 'ar' ? 'مدير' : 'Admin';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{
      background: C.white, borderBottom: `1px solid ${C.border}`,
      padding: isMobile ? '0 14px' : '0 28px',
      height: isMobile ? 54 : 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, boxShadow: `0 1px 4px ${C.border}`,
      direction: isRTL ? 'rtl' : 'ltr', fontFamily,
      zIndex: 50, position: 'relative'
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Hamburger — mobile/tablet */}
        {(isMobile || isTablet) && (
          <button onClick={onMenuClick} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.charcoal, padding: 4, display: 'flex', alignItems: 'center',
            fontSize: 20
          }}>
            ☰
          </button>
        )}

        <div>
          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {PAGE_TITLES_T[activePage] || activePage}
          </div>
          {!isMobile && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{today}</div>}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Language — hide on mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[{ code: 'en', label: '🇬🇧 EN' }, { code: 'ar', label: '🇮🇶 AR' }].map(lang => (
              <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer',
                background: language === lang.code ? C.charcoal : C.white,
                color: language === lang.code ? '#fff' : C.charcoalMid,
                fontSize: 12, fontWeight: language === lang.code ? 600 : 400
              }}>
                {lang.label}
              </button>
            ))}
          </div>
        )}

        {/* Dark mode toggle */}
        <button onClick={toggleTheme} style={{
          background: isDark ? '#FFD70022' : C.offWhite,
          border: `1px solid ${isDark ? '#FFD70044' : C.border}`,
          borderRadius: 8, padding: isMobile ? '5px 8px' : '7px 12px',
          cursor: 'pointer', color: isDark ? '#FFD700' : C.charcoalMid,
          fontSize: isMobile ? 14 : 16, display: 'flex', alignItems: 'center'
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* New Sale — hide on mobile (use bottom nav) */}
        {!isMobile && (
          <button onClick={() => setActivePage('pos')} style={{
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600,
            boxShadow: `0 2px 8px ${C.red}44`,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <PosIcon /> {t('newSale')}
          </button>
        )}

        {/* Notifications Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} style={{
            background: C.offWhite, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: isMobile ? '5px 8px' : '7px 10px',
            cursor: 'pointer', color: C.charcoalMid,
            display: 'flex', alignItems: 'center', position: 'relative'
          }}>
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4,
                right: isRTL ? 'auto' : -4, left: isRTL ? -4 : 'auto',
                background: C.red, color: '#fff', borderRadius: '50%',
                width: 16, height: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 700,
                border: `2px solid ${C.white}`
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'fixed', top: isMobile ? 54 : 60,
              right: isRTL ? 'auto' : (isMobile ? 0 : 'auto'),
              left: isRTL ? 0 : 'auto',
              width: isMobile ? '100vw' : 340,
              background: C.white, borderRadius: isMobile ? 0 : 12,
              boxShadow: `0 8px 32px ${C.shadow}`,
              border: `1px solid ${C.border}`, zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>
                  {t('notifications')}
                  {unreadCount > 0 && <span style={{ marginLeft: 8, background: C.red, color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>}
                </div>
                {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.info, fontWeight: 600 }}>{t('markAllRead')}</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>{t('noNotifications')}</div>
                ) : notifications.slice(0, 10).map((notif, i) => (
                  <div key={notif.id} style={{ padding: '12px 16px', borderBottom: i < notifications.length - 1 ? `1px solid ${C.offWhite}` : 'none', background: notif.read ? C.white : `${C.red}06`, display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${C.success}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔔</div>
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: notif.read ? 400 : 600, color: C.charcoal }}>{notif.message}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                        {new Date(notif.time).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!notif.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 8,
            cursor: 'pointer', padding: isMobile ? '4px' : '4px 8px',
            borderRadius: 8, border: `1px solid ${C.border}`, background: C.offWhite,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isMobile && (
              <>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, lineHeight: 1.2 }}>{currentUser?.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{getRoleLabel(currentUser?.role)}</div>
                </div>
                <span style={{ fontSize: 10, color: C.textMuted }}>▾</span>
              </>
            )}
          </div>

          {showUserMenu && (
            <div style={{
              position: 'fixed', top: isMobile ? 54 : 60,
              right: isRTL ? 'auto' : (isMobile ? 0 : 0),
              left: isRTL ? 0 : 'auto',
              width: isMobile ? '100vw' : 220,
              background: C.white, borderRadius: isMobile ? 0 : 12,
              boxShadow: `0 8px 32px ${C.shadow}`,
              border: `1px solid ${C.border}`, zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>@{currentUser?.username}</div>
              </div>

              {/* Language switcher — mobile only */}
              {isMobile && (
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.offWhite}`, display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {[{ code: 'en', label: '🇬🇧 English' }, { code: 'ar', label: '🇮🇶 العربية' }].map(lang => (
                    <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
                      flex: 1, padding: '7px 0', border: `1px solid ${language === lang.code ? C.red : C.border}`, borderRadius: 7,
                      background: language === lang.code ? `${C.red}12` : C.white,
                      color: language === lang.code ? C.red : C.charcoalMid,
                      fontSize: 12, cursor: 'pointer', fontWeight: language === lang.code ? 600 : 400
                    }}>
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}

              {[
                { icon: isDark ? '☀️' : '🌙', label: isDark ? 'Light Mode' : 'Dark Mode', action: toggleTheme },
                { icon: '⚙️', label: t('settings'), action: () => { setActivePage('settings'); setShowUserMenu(false); } },
                ...(currentUser?.role === 'superadmin' ? [{ icon: '👥', label: t('userManagement'), action: () => { setActivePage('user-management'); setShowUserMenu(false); } }] : []),
                { icon: '🚪', label: t('logout'), action: logout, color: C.red },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'none', cursor: 'pointer', fontSize: 13,
                  color: item.color || C.charcoal,
                  textAlign: isRTL ? 'right' : 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: `1px solid ${C.offWhite}`,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  minHeight: 44
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}