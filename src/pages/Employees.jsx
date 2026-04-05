import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getEmployees, saveEmployees, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

const ROLES = ['Admin', 'Manager', 'Cashier', 'Warehouse', 'Driver', 'Other'];
const ROLES_AR = { Admin: 'مدير النظام', Manager: 'مدير', Cashier: 'كاشير', Warehouse: 'مستودع', Driver: 'سائق', Other: 'أخرى' };
const ROLE_COLORS = {
  Admin: { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red },
  Manager: { bg: `${COLORS.info}15`, border: `${COLORS.info}44`, text: COLORS.info },
  Cashier: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
  Warehouse: { bg: `${COLORS.warning}15`, border: `${COLORS.warning}44`, text: COLORS.warning },
  Driver: { bg: '#8B5CF615', border: '#8B5CF644', text: '#8B5CF6' },
  Other: { bg: `${COLORS.steel}33`, border: `${COLORS.steelDark}44`, text: COLORS.charcoalMid },
};

export default function Employees() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    name: '', role: 'Cashier', phone: '', email: '',
    salary: '', startDate: new Date().toISOString().split('T')[0],
    status: 'Active', address: '', notes: '', nationalId: ''
  });

  useEffect(() => { setEmployees(getEmployees()); }, []);

  function getRoleLabel(role) { return language === 'ar' ? (ROLES_AR[role] || role) : role; }
  function getStatusLabel(status) { return language === 'ar' ? (status === 'Active' ? t('active') : t('inactive')) : status; }

  function handleSave() {
    if (!form.name.trim()) return alert(t('fullName') + ' ' + t('required'));
    if (!form.phone.trim()) return alert(t('phone') + ' ' + t('required'));
    if (!form.salary) return alert(t('salary') + ' ' + t('required'));
    const employee = { ...form, salary: parseFloat(form.salary) };
    let updated;
    if (editingId) {
      updated = employees.map(e => e.id === editingId ? { ...e, ...employee } : e);
    } else {
      updated = [...employees, { id: generateId(), ...employee, createdAt: new Date().toISOString() }];
    }
    saveEmployees(updated);
    setEmployees(updated);
    resetForm();
  }

  function handleEdit(emp) {
    setForm({ name: emp.name, role: emp.role, phone: emp.phone, email: emp.email || '', salary: emp.salary, startDate: emp.startDate, status: emp.status, address: emp.address || '', notes: emp.notes || '', nationalId: emp.nationalId || '' });
    setEditingId(emp.id);
    setShowForm(true);
    setViewEmployee(null);
  }

  function handleDelete(id) {
    const updated = employees.filter(e => e.id !== id);
    saveEmployees(updated);
    setEmployees(updated);
    setDeleteConfirm(null);
    setViewEmployee(null);
  }

  function resetForm() {
    setForm({ name: '', role: 'Cashier', phone: '', email: '', salary: '', startDate: new Date().toISOString().split('T')[0], status: 'Active', address: '', notes: '', nationalId: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || e.role === filterRole;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalSalaries = employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.salary, 0);
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('employees')}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{employees.length} {t('employees')} · {activeCount} {t('active')}</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, border: 'none', borderRadius: 8, padding: '10px 20px', color: COLORS.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44` }}>
          {t('addEmployee')}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('totalEmployees'), value: employees.length, color: COLORS.info },
          { label: t('active'), value: activeCount, color: COLORS.success },
          { label: t('inactive'), value: employees.length - activeCount, color: COLORS.warning },
          { label: t('monthlySalaries'), value: fmt(totalSalaries), color: COLORS.red },
        ].map(card => (
          <div key={card.label} style={{ background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      {employees.length > 0 && (
        <div style={{ background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{t('byRole')}</span>
          {ROLES.map(role => {
            const count = employees.filter(e => e.role === role).length;
            if (count === 0) return null;
            const rc = ROLE_COLORS[role];
            return (
              <div key={role} style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: rc.text }}>{getRoleLabel(role)}</span>
                <span style={{ background: rc.text, color: COLORS.white, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input placeholder={`${t('search')} ${t('employees')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, textAlign: isRTL ? 'right' : 'left' }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
          <option value="all">{t('all')}</option>
          {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
          <option value="all">{t('all')}</option>
          <option value="Active">{t('active')}</option>
          <option value="Inactive">{t('inactive')}</option>
        </select>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? `${t('edit')} ${t('employees')}` : t('addEmployee')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('fullName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('fullName')} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('role')} *</div>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('status')} *</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  <option value="Active">{t('active')}</option>
                  <option value="Inactive">{t('inactive')}</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('phone')} *</div>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+964 750 000 0000" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('email')}</div>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="employee@jango.com" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('salary')} * (USD)</div>
                <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('startDate')}</div>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('nationalId')}</div>
                <input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} placeholder={t('nationalId')} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('address')}</div>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={t('address')} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('notes')}</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} rows={3} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', resize: 'vertical', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{editingId ? t('save') : t('addEmployee')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: COLORS.white, borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t('deleteEmployee')}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: COLORS.red, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {viewEmployee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, width: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: COLORS.white, fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                {viewEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{viewEmployee.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {(() => { const rc = ROLE_COLORS[viewEmployee.role] || ROLE_COLORS.Other; return <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{getRoleLabel(viewEmployee.role)}</span>; })()}
                  <span style={{ background: viewEmployee.status === 'Active' ? `${COLORS.success}15` : `${COLORS.warning}15`, border: `1px solid ${viewEmployee.status === 'Active' ? COLORS.success : COLORS.warning}44`, color: viewEmployee.status === 'Active' ? COLORS.success : COLORS.warning, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{getStatusLabel(viewEmployee.status)}</span>
                </div>
              </div>
              <button onClick={() => setViewEmployee(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>
            </div>

            <div style={{ background: COLORS.offWhite, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              {[
                { label: t('phone'), value: viewEmployee.phone },
                { label: t('email'), value: viewEmployee.email || '—' },
                { label: t('address'), value: viewEmployee.address || '—' },
                { label: t('nationalId'), value: viewEmployee.nationalId || '—' },
                { label: t('startDate'), value: new Date(viewEmployee.startDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Salary Card */}
            <div style={{ background: `${COLORS.success}12`, border: `1px solid ${COLORS.success}44`, borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{t('salary')} / {t('monthly')}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.success, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                  {fmt(viewEmployee.salary)}
                </div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{t('annual')}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.charcoal }}>
                  {fmt(viewEmployee.salary * 12)}
                </div>
              </div>
            </div>

            {viewEmployee.notes && (
              <div style={{ background: COLORS.offWhite, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: COLORS.charcoalMid, fontStyle: 'italic', textAlign: isRTL ? 'right' : 'left' }}>
                {viewEmployee.notes}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => handleEdit(viewEmployee)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('edit')}</button>
              <button onClick={() => setDeleteConfirm(viewEmployee.id)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.red}44`, background: `${COLORS.red}11`, color: COLORS.red, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
          {search || filterRole !== 'all' || filterStatus !== 'all' ? t('noData') : t('noEmployees')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(emp => {
            const rc = ROLE_COLORS[emp.role] || ROLE_COLORS.Other;
            const isActive = emp.status === 'Active';
            return (
              <div key={emp.id} onClick={() => setViewEmployee(emp)} style={{ background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: isActive ? 1 : 0.7 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: COLORS.white, fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{emp.name}</span>
                    <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>{getRoleLabel(emp.role)}</span>
                    <span style={{ background: isActive ? `${COLORS.success}15` : `${COLORS.warning}15`, border: `1px solid ${isActive ? COLORS.success : COLORS.warning}44`, color: isActive ? COLORS.success : COLORS.warning, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>{getStatusLabel(emp.status)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {[emp.phone, emp.email].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ textAlign: isRTL ? 'left' : 'right', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t('monthly')}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                    {fmt(emp.salary)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(emp)} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(emp.id)} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.red}44`, background: `${COLORS.red}11`, color: COLORS.red, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}