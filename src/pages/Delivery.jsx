import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getDeliveries, saveDeliveries, getCustomers, getEmployees, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';

const STATUSES = ['Pending', 'Out for Delivery', 'Delivered', 'Failed'];

const STATUS_COLORS = {
  'Pending': { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  'Out for Delivery': { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  'Delivered': { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  'Failed': { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
};

export default function Delivery() {
  const { t, isRTL, language } = useLanguage();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    customerId: '', customerName: '', deliveryAddress: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    driverId: '', status: 'Pending',
    installationRequired: false, notes: ''
  });

  useEffect(() => {
    setDeliveries(getDeliveries());
    setCustomers(getCustomers());
    setEmployees(getEmployees().filter(e => e.role === 'Driver' || e.status === 'Active'));
  }, []);

  function handleSave() {
    if (!form.customerName.trim()) return alert(t('customers') + ' ' + t('required'));
    if (!form.deliveryAddress.trim()) return alert(t('deliveryAddress') + ' ' + t('required'));
    let updated;
    if (editingId) {
      updated = deliveries.map(d => d.id === editingId ? { ...d, ...form } : d);
    } else {
      updated = [...deliveries, { id: generateId(), ...form, createdAt: new Date().toISOString() }];
    }
    saveDeliveries(updated);
    setDeliveries(updated);
    resetForm();
  }

  function handleStatusChange(id, status) {
    const updated = deliveries.map(d => d.id === id ? { ...d, status } : d);
    saveDeliveries(updated);
    setDeliveries(updated);
  }

  function handleEdit(delivery) {
    setForm({
      customerId: delivery.customerId || '',
      customerName: delivery.customerName || '',
      deliveryAddress: delivery.deliveryAddress || '',
      scheduledDate: delivery.scheduledDate || new Date().toISOString().split('T')[0],
      driverId: delivery.driverId || '',
      status: delivery.status || 'Pending',
      installationRequired: delivery.installationRequired || false,
      notes: delivery.notes || ''
    });
    setEditingId(delivery.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = deliveries.filter(d => d.id !== id);
    saveDeliveries(updated);
    setDeliveries(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ customerId: '', customerName: '', deliveryAddress: '', scheduledDate: new Date().toISOString().split('T')[0], driverId: '', status: 'Pending', installationRequired: false, notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getDriverName(id) { return employees.find(e => e.id === id)?.name || t('noDriverAssigned'); }

  const filtered = deliveries.filter(d => {
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchSearch = d.customerName?.toLowerCase().includes(search.toLowerCase()) || d.deliveryAddress?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = deliveries.filter(d => d.status === 'Pending').length;
  const outCount = deliveries.filter(d => d.status === 'Out for Delivery').length;
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
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('delivery')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {pendingCount} {t('pending')} · {outCount} {t('outForDelivery')}
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {isMobile ? '+ ' + t('add') : t('newDelivery')}
        </button>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {['all', ...STATUSES].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{
            padding: '7px 14px', borderRadius: 20, border: `1px solid ${filterStatus === status ? C.red : C.border}`,
            background: filterStatus === status ? `${C.red}12` : C.white,
            color: filterStatus === status ? C.red : C.textMuted,
            fontSize: 12, fontWeight: filterStatus === status ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {status === 'all' ? t('all') : status}
            {status !== 'all' && (
              <span style={{ marginLeft: 5, background: filterStatus === status ? C.red : C.border, color: filterStatus === status ? '#fff' : C.textMuted, borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                {deliveries.filter(d => d.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>{editingId ? t('edit') : t('newDelivery')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('customers')} *</div>
                <select value={form.customerId} onChange={e => {
                  const c = customers.find(c => c.id === e.target.value);
                  setForm({ ...form, customerId: e.target.value, customerName: c?.name || '' });
                }} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{language === 'ar' ? 'اختر عميلاً' : 'Select customer'}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
                {!form.customerId && (
                  <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder={language === 'ar' ? 'أو اكتب الاسم يدوياً' : 'Or type name manually'} style={{ ...inputStyle, marginTop: 6 }} />
                )}
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('deliveryAddress')} *</div>
                <textarea value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('scheduledDate')}</div>
                <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('assignDriver')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <select value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{t('noDriverAssigned')}</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('status')}</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div onClick={() => setForm({ ...form, installationRequired: !form.installationRequired })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.installationRequired ? `${C.info}12` : C.offWhite, border: `1px solid ${form.installationRequired ? C.info + '44' : C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: form.installationRequired ? C.info : C.white, border: `2px solid ${form.installationRequired ? C.info : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0 }}>{form.installationRequired ? '✓' : ''}</div>
                  <span style={{ fontSize: 13, color: C.charcoal }}>🔧 {t('installationRequired')}</span>
                </div>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{editingId ? t('save') : t('newDelivery')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteDelivery')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{t('noDeliveries')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(delivery => {
            const sc = STATUS_COLORS[delivery.status] || STATUS_COLORS['Pending'];
            const isOverdue = delivery.status === 'Pending' && delivery.scheduledDate < new Date().toISOString().split('T')[0];
            return (
              <div key={delivery.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${isOverdue ? C.red + '44' : C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 10, flexShrink: 0, background: `${C.info}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>🚚</div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{delivery.customerName}</span>
                      <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{delivery.status}</span>
                      {isOverdue && <span style={{ background: `${C.red}15`, border: `1px solid ${C.red}33`, color: C.red, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>⚠️ {t('overdue')}</span>}
                      {delivery.installationRequired && <span style={{ background: `${C.info}15`, border: `1px solid ${C.info}33`, color: C.info, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>🔧 {t('installation')}</span>}
                    </div>
                    <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 2 }}>
                      📍 {delivery.deliveryAddress}
                    </div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                      📅 {delivery.scheduledDate} · 🚗 {getDriverName(delivery.driverId)}
                    </div>
                  </div>
                </div>

                {/* Status Update + Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {STATUSES.filter(s => s !== delivery.status).map(status => (
                    <button key={status} onClick={() => handleStatusChange(delivery.id, status)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.offWhite, color: C.charcoalMid, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                      → {status}
                    </button>
                  ))}
                  <div style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => handleEdit(delivery)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer' }}>{t('edit')}</button>
                    <button onClick={() => setDeleteConfirm(delivery.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}