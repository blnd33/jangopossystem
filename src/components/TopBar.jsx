import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { BellIcon, PosIcon } from './Icons';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadNotifications, markAllRead } from '../data/store';

export default function TopBar({ activePage, setActivePage }) {
  const { language, changeLanguage, t, isRTL } = useLanguage();
  const { currentUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    setNotifications(getUnreadNotifications());
    const interval = setInterval(() => {
      setNotifications(getUnreadNotifications());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleMarkAllRead() {
    markAllRead();
    setNotifications(getUnreadNotifications());
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
  };

  function getRoleLabel(role) {
    if (role === 'superadmin') return language === 'ar' ? 'مدير النظام الرئيسي' : 'Super Admin';
    if (role === 'admin') return language === 'ar' ? 'مدير' : 'Admin';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{
      background: COLORS.white,
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '0 28px', height: 60,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily, zIndex: 50, position: 'relative'
    }}>

      {/* Left — Page title */}
      <div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
          fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif'
        }}>
          {PAGE_TITLES_T[activePage] || activePage}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{today}</div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Language Switcher */}
        <div style={{
          display: 'flex', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, overflow: 'hidden'
        }}>
          {[
            { code: 'en', label: '🇬🇧 EN' },
            { code: 'ar', label: '🇮🇶 AR' },
          ].map(lang => (
            <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
              padding: '6px 12px', border: 'none', cursor: 'pointer',
              background: language === lang.code ? COLORS.charcoal : COLORS.white,
              color: language === lang.code ? COLORS.white : COLORS.charcoalMid,
              fontSize: 12, fontWeight: language === lang.code ? 600 : 400,
              transition: 'all 0.15s'
            }}>
              {lang.label}
            </button>
          ))}
        </div>

        {/* New Sale Button */}
        <button onClick={() => setActivePage('pos')} style={{
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
          border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
          color: COLORS.white, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
          boxShadow: `0 2px 8px ${COLORS.red}44`,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <PosIcon />
          {t('newSale')}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            style={{
              background: COLORS.offWhite, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              color: COLORS.charcoalMid, display: 'flex', alignItems: 'center',
              position: 'relative'
            }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4,
                right: isRTL ? 'auto' : -4, left: isRTL ? -4 : 'auto',
                background: COLORS.red, color: COLORS.white,
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, border: `2px solid ${COLORS.white}`
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
              width: 340, background: COLORS.white,
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: `1px solid ${COLORS.border}`, zIndex: 200,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                  {t('notifications')}
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0,
                      background: COLORS.red, color: COLORS.white,
                      borderRadius: '50%', width: 18, height: 18,
                      display: 'inline-flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, fontWeight: 700
                    }}>{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: COLORS.info, fontWeight: 600
                  }}>
                    {t('markAllRead')}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
                    {t('noNotifications')}
                  </div>
                ) : notifications.slice(0, 10).map((notif, i) => (
                  <div key={notif.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
                    background: notif.read ? COLORS.white : `${COLORS.red}06`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: notif.type === 'login' ? `${COLORS.success}20` : `${COLORS.warning}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                    }}>
                      {notif.type === 'login' ? '🔔' : '👋'}
                    </div>
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: notif.read ? 400 : 600, color: COLORS.charcoal, lineHeight: 1.4 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>
                        {new Date(notif.time).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.red, flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              {currentUser?.role === 'superadmin' && (
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${COLORS.border}` }}>
                  <button
                    onClick={() => { setActivePage('user-management'); setShowNotifications(false); }}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 7,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.offWhite, color: COLORS.charcoalMid,
                      fontSize: 12, cursor: 'pointer', fontWeight: 500
                    }}
                  >
                    {language === 'ar' ? 'عرض كل السجلات' : 'View All in User Management'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar + Menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.offWhite,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: COLORS.white,
            }}>
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, lineHeight: 1.2 }}>
                {currentUser?.name}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                {getRoleLabel(currentUser?.role)}
              </div>
            </div>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>▾</span>
          </div>

          {/* User Dropdown */}
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '110%',
              right: isRTL ? 'auto' : 0, left: isRTL ? 0 : 'auto',
              width: 220, background: COLORS.white,
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: `1px solid ${COLORS.border}`, zIndex: 200,
              overflow: 'hidden'
            }}>
              {/* User info */}
              <div style={{
                padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}`,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  @{currentUser?.username}
                </div>
                <div style={{
                  marginTop: 6, display: 'inline-block',
                  padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                  background: currentUser?.role === 'superadmin' ? `${COLORS.red}15` : `${COLORS.info}15`,
                  color: currentUser?.role === 'superadmin' ? COLORS.red : COLORS.info,
                  border: `1px solid ${currentUser?.role === 'superadmin' ? COLORS.red : COLORS.info}44`
                }}>
                  {getRoleLabel(currentUser?.role)}
                </div>
              </div>

              {/* Menu items */}
              {currentUser?.role === 'superadmin' && (
                <button
                  onClick={() => { setActivePage('user-management'); setShowUserMenu(false); }}
                  style={{
                    width: '100%', padding: '11px 16px', border: 'none',
                    background: 'none', cursor: 'pointer', fontSize: 13,
                    color: COLORS.charcoal, textAlign: isRTL ? 'right' : 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: `1px solid ${COLORS.offWhite}`,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.offWhite}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  👥 {t('userManagement')}
                </button>
              )}

              <button
                onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                style={{
                  width: '100%', padding: '11px 16px', border: 'none',
                  background: 'none', cursor: 'pointer', fontSize: 13,
                  color: COLORS.charcoal, textAlign: isRTL ? 'right' : 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: `1px solid ${COLORS.offWhite}`,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ⚙️ {t('settings')}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                style={{
                  width: '100%', padding: '11px 16px', border: 'none',
                  background: 'none', cursor: 'pointer', fontSize: 13,
                  color: COLORS.red, textAlign: isRTL ? 'right' : 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${COLORS.red}08`}
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