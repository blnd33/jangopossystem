import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getUsers, saveUsers, generateId, getAccessLog, getUnreadNotifications, markAllRead } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ALL_PAGES = [
  { id: 'dashboard', icon: '📊' },
  { id: 'pos', icon: '🛒' },
  { id: 'inventory', icon: '📦' },
  { id: 'suppliers', icon: '🚚' },
  { id: 'categories', icon: '🏷️' },
  { id: 'purchase-orders', icon: '📋' },
  { id: 'customers', icon: '👥' },
  { id: 'delivery', icon: '🚛' },
  { id: 'returns', icon: '🔄' },
  { id: 'sales-report', icon: '📈' },
  { id: 'expenses', icon: '💸' },
  { id: 'pl', icon: '💰' },
  { id: 'cashflow', icon: '📉' },
  { id: 'employees', icon: '👨‍💼' },
  { id: 'reports', icon: '📑' },
  { id: 'settings', icon: '⚙️' },
];

const DEFAULT_PERMISSIONS = {
  dashboard: true, pos: true, inventory: true,
  suppliers: false, categories: false, 'purchase-orders': false,
  customers: true, delivery: false, returns: false,
  'sales-report': false, expenses: false, pl: false,
  cashflow: false, employees: false, reports: false, settings: false
};

export default function UserManagement() {
  const { t, isRTL, language } = useLanguage();
  const { currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [accessLog, setAccessLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({
    name: '', username: '', password: '', confirmPassword: '',
    role: 'cashier', permissions: { ...DEFAULT_PERMISSIONS }
  });

  useEffect(() => {
    setUsers(getUsers());
    setAccessLog(getAccessLog());
    setNotifications(getUnreadNotifications());
  }, []);

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  function getRoleLabel(role) {
    if (role === 'superadmin') return language === 'ar' ? 'مدير النظام الرئيسي' : 'Super Admin';
    if (role === 'admin') return language === 'ar' ? 'مدير' : 'Admin';
    return language === 'ar' ? 'كاشير' : 'Cashier';
  }

  function getRoleColor(role) {
    if (role === 'superadmin') return { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red };
    if (role === 'admin') return { bg: `${COLORS.info}15`, border: `${COLORS.info}44`, text: COLORS.info };
    return { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success };
  }

  function handleSave() {
    if (!form.name.trim()) return alert(t('fullName') + ' ' + t('required'));
    if (!form.username.trim()) return alert(t('username') + ' ' + t('required'));
    if (!editingId && !form.password.trim()) return alert(t('password') + ' ' + t('required'));
    if (form.password && form.password !== form.confirmPassword) return alert(t('passwordMismatch'));

    const existingUser = users.find(u => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== editingId);
    if (existingUser) return alert(language === 'ar' ? 'اسم المستخدم موجود بالفعل' : 'Username already exists');

    let updated;
    if (editingId) {
      updated = users.map(u => {
        if (u.id === editingId) {
          const updatedUser = {
            ...u,
            name: form.name,
            username: form.username,
            role: form.role,
            permissions: form.role === 'superadmin'
              ? Object.fromEntries(ALL_PAGES.map(p => [p.id, true]))
              : form.permissions
          };
          if (form.password) updatedUser.password = form.password;
          return updatedUser;
        }
        return u;
      });
    } else {
      const newUser = {
        id: generateId(),
        name: form.name,
        username: form.username,
        password: form.password,
        role: form.role,
        permissions: form.role === 'superadmin'
          ? Object.fromEntries(ALL_PAGES.map(p => [p.id, true]))
          : form.permissions,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      updated = [...users, newUser];
    }

    saveUsers(updated);
    setUsers(updated);
    if (editingId === currentUser?.id) refreshUser();
    resetForm();
  }

  function handleEdit(user) {
    setForm({
      name: user.name,
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role,
      permissions: { ...DEFAULT_PERMISSIONS, ...user.permissions }
    });
    setEditingId(user.id);
    setShowForm(true);
    setViewUser(null);
  }

  function handleDelete(id) {
    if (id === currentUser?.id) return alert(language === 'ar' ? 'لا يمكنك حذف حسابك الخاص' : 'You cannot delete your own account');
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
    setDeleteConfirm(null);
    setViewUser(null);
  }

  function resetForm() {
    setForm({
      name: '', username: '', password: '', confirmPassword: '',
      role: 'cashier', permissions: { ...DEFAULT_PERMISSIONS }
    });
    setEditingId(null);
    setShowForm(false);
  }

  function togglePermission(pageId) {
    setForm(f => ({
      ...f,
      permissions: { ...f.permissions, [pageId]: !f.permissions[pageId] }
    }));
  }

  function setAllPermissions(val) {
    const perms = {};
    ALL_PAGES.forEach(p => { perms[p.id] = val; });
    setForm(f => ({ ...f, permissions: perms }));
  }

  function handleMarkAllRead() {
    markAllRead();
    setNotifications(getUnreadNotifications());
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const TABS = [
    { id: 'users', label: language === 'ar' ? 'المستخدمون' : 'Users' },
    { id: 'log', label: language === 'ar' ? 'سجل الدخول' : 'Access Log' },
    { id: 'notifications', label: language === 'ar' ? `الإشعارات ${unreadCount > 0 ? `(${unreadCount})` : ''}` : `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
  ];

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('userManagement')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {users.length} {language === 'ar' ? 'مستخدم' : 'users'}
          </div>
        </div>
        {activeTab === 'users' && (
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: COLORS.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44`
          }}>
            {t('addUser')}
          </button>
        )}
        {activeTab === 'notifications' && unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={{
            background: COLORS.offWhite, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            fontSize: 12, color: COLORS.charcoalMid, fontWeight: 500
          }}>
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        background: COLORS.offWhite, borderRadius: 10,
        padding: 4, border: `1px solid ${COLORS.border}`,
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
            background: activeTab === tab.id ? COLORS.white : 'none',
            color: activeTab === tab.id ? COLORS.charcoal : COLORS.textMuted,
            fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: 'pointer',
            boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users', value: users.length, color: COLORS.info },
              { label: language === 'ar' ? 'المديرون' : 'Admins', value: users.filter(u => u.role === 'admin').length, color: COLORS.warning },
              { label: language === 'ar' ? 'الكاشيرون' : 'Cashiers', value: users.filter(u => u.role === 'cashier').length, color: COLORS.success },
            ].map(card => (
              <div key={card.label} style={{
                background: COLORS.white, borderRadius: 10,
                border: `1px solid ${COLORS.border}`, padding: '14px 16px',
                borderTop: `3px solid ${card.color}`,
              }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Users List */}
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>{t('noUsers')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {users.map(user => {
                const rc = getRoleColor(user.role);
                const isCurrentUser = user.id === currentUser?.id;
                return (
                  <div key={user.id} onClick={() => setViewUser(user)} style={{
                    background: COLORS.white, borderRadius: 10,
                    border: `1px solid ${isCurrentUser ? COLORS.red + '44' : COLORS.border}`,
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isCurrentUser ? COLORS.red + '44' : COLORS.border}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: COLORS.white, fontFamily: 'Georgia, serif'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{user.name}</span>
                        <span style={{
                          background: rc.bg, border: `1px solid ${rc.border}`,
                          color: rc.text, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20
                        }}>{getRoleLabel(user.role)}</span>
                        {isCurrentUser && (
                          <span style={{
                            background: `${COLORS.red}15`, border: `1px solid ${COLORS.red}44`,
                            color: COLORS.red, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20
                          }}>
                            {language === 'ar' ? 'أنت' : 'You'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                        @{user.username} ·
                        {user.lastLogin
                          ? ` ${t('lastLogin')}: ${new Date(user.lastLogin).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB')}`
                          : ` ${t('neverLoggedIn')}`}
                      </div>
                    </div>

                    {/* Permissions count */}
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t('permissions')}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal }}>
                        {user.role === 'superadmin' ? '∞' : Object.values(user.permissions || {}).filter(Boolean).length}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(user)} style={{
                        padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                        background: COLORS.white, color: COLORS.charcoalMid, fontSize: 12, cursor: 'pointer', fontWeight: 500
                      }}>{t('edit')}</button>
                      {!isCurrentUser && user.role !== 'superadmin' && (
                        <button onClick={() => setDeleteConfirm(user.id)} style={{
                          padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                          background: `${COLORS.red}11`, color: COLORS.red, fontSize: 12, cursor: 'pointer', fontWeight: 500
                        }}>{t('delete')}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ACCESS LOG TAB ── */}
      {activeTab === 'log' && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 4, height: 18, background: COLORS.red, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{t('accessLog')}</span>
          </div>
          {accessLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
              {language === 'ar' ? 'لا يوجد سجل دخول بعد' : 'No access log yet'}
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {accessLog.map((entry, i) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 20px',
                  borderBottom: i < accessLog.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  background: i % 2 === 0 ? COLORS.white : `${COLORS.offWhite}66`
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: entry.action === 'login' ? `${COLORS.success}20` : `${COLORS.red}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                  }}>
                    {entry.action === 'login' ? '🟢' : '🔴'}
                  </div>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                      {entry.name} (@{entry.username})
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      {entry.action === 'login' ? t('userLoggedIn') : t('userLoggedOut')}
                    </div>
                  </div>
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal }}>
                      {new Date(entry.time).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {new Date(entry.time).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: entry.action === 'login' ? `${COLORS.success}15` : `${COLORS.red}15`,
                    color: entry.action === 'login' ? COLORS.success : COLORS.red,
                    border: `1px solid ${entry.action === 'login' ? COLORS.success : COLORS.red}33`
                  }}>
                    {getRoleLabel(entry.role)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 4, height: 18, background: COLORS.red, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{t('notifications')}</span>
            {unreadCount > 0 && (
              <span style={{
                background: COLORS.red, color: COLORS.white, borderRadius: '50%',
                width: 20, height: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700
              }}>{unreadCount}</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
              {t('noNotifications')}
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {notifications.map((notif, i) => (
                <div key={notif.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < notifications.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  background: notif.read ? COLORS.white : `${COLORS.red}06`
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: notif.type === 'login' ? `${COLORS.success}20` : `${COLORS.warning}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>
                    {notif.type === 'login' ? '🔔' : '👋'}
                  </div>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: notif.read ? 400 : 600, color: COLORS.charcoal }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      {new Date(notif.time).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.red, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14, padding: 28,
            width: 580, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? t('editUser') : t('addUser')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Full Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('fullName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={t('fullName')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>

              {/* Username */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('username')} *</div>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder={t('username')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>

              {/* Role */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('userRole')} *</div>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  <option value="cashier">{language === 'ar' ? 'كاشير' : 'Cashier'}</option>
                  <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  {editingId ? t('newPassword') : t('password') + ' *'}
                </div>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? language === 'ar' ? 'اتركه فارغاً للإبقاء عليه' : 'Leave blank to keep' : t('password')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>

              {/* Confirm Password */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('confirmPassword')}</div>
                <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder={t('confirmPassword')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>
            </div>

            {/* Permissions */}
            {form.role !== 'superadmin' && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 12, flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal }}>{t('permissions')}</div>
                  <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => setAllPermissions(true)} style={{
                      padding: '4px 12px', borderRadius: 6, border: `1px solid ${COLORS.success}44`,
                      background: `${COLORS.success}12`, color: COLORS.success,
                      fontSize: 11, cursor: 'pointer', fontWeight: 600
                    }}>{t('allPermissions')}</button>
                    <button onClick={() => setAllPermissions(false)} style={{
                      padding: '4px 12px', borderRadius: 6, border: `1px solid ${COLORS.red}44`,
                      background: `${COLORS.red}12`, color: COLORS.red,
                      fontSize: 11, cursor: 'pointer', fontWeight: 600
                    }}>{t('noPermissions')}</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {ALL_PAGES.map(page => (
                    <div key={page.id} onClick={() => togglePermission(page.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${form.permissions[page.id] ? COLORS.success + '66' : COLORS.border}`,
                      background: form.permissions[page.id] ? `${COLORS.success}10` : COLORS.offWhite,
                      transition: 'all 0.15s',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}>
                      <span style={{ fontSize: 16 }}>{page.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: form.permissions[page.id] ? COLORS.success : COLORS.charcoalMid, flex: 1 }}>
                        {t(page.id === 'purchase-orders' ? 'purchaseOrders' :
                          page.id === 'sales-report' ? 'salesReport' :
                          page.id === 'pl' ? 'pl' : page.id)}
                      </span>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: form.permissions[page.id] ? COLORS.success : COLORS.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: COLORS.white, fontWeight: 700
                      }}>
                        {form.permissions[page.id] ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{
                padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>{editingId ? t('save') : t('addUser')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 12, padding: 28,
            width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t('deleteUser')}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: COLORS.red, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14, padding: 28, width: 480,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: COLORS.white, fontFamily: 'Georgia, serif', flexShrink: 0
              }}>
                {viewUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                  {viewUser.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {(() => {
                    const rc = getRoleColor(viewUser.role);
                    return (
                      <span style={{
                        background: rc.bg, border: `1px solid ${rc.border}`,
                        color: rc.text, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20
                      }}>
                        {getRoleLabel(viewUser.role)}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <button onClick={() => setViewUser(null)} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted
              }}>✕</button>
            </div>

            {/* Details */}
            <div style={{ background: COLORS.offWhite, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              {[
                { label: t('username'), value: `@${viewUser.username}` },
                { label: t('lastLogin'), value: viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB') : t('neverLoggedIn') },
                { label: language === 'ar' ? 'تاريخ الإنشاء' : 'Created', value: new Date(viewUser.createdAt).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Permissions */}
            {viewUser.role !== 'superadmin' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 10 }}>{t('permissions')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_PAGES.map(page => {
                    const hasAccess = viewUser.permissions?.[page.id];
                    return (
                      <div key={page.id} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        background: hasAccess ? `${COLORS.success}12` : COLORS.offWhite,
                        border: `1px solid ${hasAccess ? COLORS.success + '44' : COLORS.border}`,
                        color: hasAccess ? COLORS.success : COLORS.textMuted,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <span>{page.icon}</span>
                        <span>{t(page.id === 'purchase-orders' ? 'purchaseOrders' :
                          page.id === 'sales-report' ? 'salesReport' : page.id)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewUser.role === 'superadmin' && (
              <div style={{
                background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}33`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, fontWeight: 600, color: COLORS.red, textAlign: 'center'
              }}>
                {language === 'ar' ? '👑 صلاحية كاملة — مدير النظام الرئيسي' : '👑 Full Access — Super Admin'}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => handleEdit(viewUser)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('edit')}</button>
              {viewUser.id !== currentUser?.id && viewUser.role !== 'superadmin' && (
                <button onClick={() => { setViewUser(null); setDeleteConfirm(viewUser.id); }} style={{
                  flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                  background: `${COLORS.red}11`, color: COLORS.red, fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}>{t('delete')}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}