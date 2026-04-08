import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const ROLES = ['Manager', 'Cashier', 'Driver', 'Warehouse', 'Sales', 'Accountant', 'Other'];

export default function Employees() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', role: 'Cashier', phone: '', email: '',
    salary: '', start_date: new Date().toISOString().split('T')[0],
    national_id: '', status: 'Active', notes: ''
  });

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const data = await api.employees.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return alert(t('fullName') + ' ' + t('required'));
    if (!form.phone.trim()) return alert(t('phone') + ' ' + t('required'));
    if (!form.salary) return alert(t('salary') + ' ' + t('required'));
    setSaving(true);
    try {
      const payload = { ...form, salary: parseFloat(form.salary) };
      if (editingId) {
        const updated = await api.employees.update(editingId, payload);
        setEmployees(es => es.map(e => e.id === editingId ? updated : e));
      } else {
        const created = await api.employees.create(payload);
        setEmployees(es => [...es, created]);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(emp) {
    setForm({
      name: emp.name, role: emp.role, phone: emp.phone,
      email: emp.email || '', salary: emp.salary,
      start_date: emp.start_date || new Date().toISOString().split('T')[0],
      national_id: emp.national_id || '',
      status: emp.status || 'Active', notes: emp.notes || ''
    });
    setEditingId(emp.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.employees.delete(id);
      setEmployees(es => es.filter(e => e.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function resetForm() {
    setForm({ name: '', role: 'Cashier', phone: '', email: '', salary: '', start_date: new Date().toISOString().split('T')[0], national_id: '', status: 'Active', notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || '').includes(search)
  );

  const activeEmployees = employees.filter(e => e.status === 'Active');
  const totalSalaries = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box',
    background: C.white, textAlign: isRTL ? 'right' : 'left'
  };

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('employees')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {activeEmployees.length} {t('active')} · {t('monthlySalaries')}: <strong style={{ color: C.red }}>{fmt(totalSalaries)}</strong>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {isMobile ? '+ ' + t('add') : t('addEmployee')}
        </button>
      </div>

      {/* Summary */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('totalEmployees'), value: employees.length, color: C.info },
            { label: t('active'), value: activeEmployees.length, color: C.success },
            { label: t('monthlySalaries'), value: fmt(totalSalaries), color: C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>{editingId ? t('edit') : t('addEmployee')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('fullName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('role')} *</div>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('phone')} *</div>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+964 750 000 0000" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('salary')} * (USD)</div>
                <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('startDate')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('email')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('nationalId')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('status')}</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Active">{t('active')}</option>
                  <option value="Inactive">{t('inactive')}</option>
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : t('addEmployee')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteEmployee')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{t('noEmployees')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(emp => {
            const isActive = emp.status === 'Active';
            return (
              <div key={emp.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}`, opacity: isActive ? 1 : 0.7 }}>
                <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${C.charcoal}, ${C.charcoalLight || '#3D4145'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{emp.name}</span>
                    <span style={{ background: isActive ? `${C.success}15` : `${C.red}15`, border: `1px solid ${isActive ? C.success : C.red}44`, color: isActive ? C.success : C.red, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                      {isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 2 }}>
                    {emp.role} · {emp.phone}
                    {!isMobile && emp.start_date && ` · ${t('startDate')}: ${emp.start_date}`}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ textAlign: 'center', padding: '6px 14px', background: `${C.success}12`, borderRadius: 8, minWidth: 100 }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{t('monthly')}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>{fmt(emp.salary)}</div>
                  </div>
                )}
                {isMobile && <div style={{ fontSize: 14, fontWeight: 700, color: C.success, flexShrink: 0 }}>{fmt(emp.salary)}</div>}
                <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(emp)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(emp.id)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}