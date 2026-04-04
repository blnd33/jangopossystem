import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getReturns, saveReturns, getCustomers, getSales,
  getProducts, saveProducts, generateId
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';

const REASONS = ['Damaged', 'Wrong Item', 'Changed Mind', 'Defective', 'Other'];
const REASONS_AR = {
  Damaged: 'تالف', 'Wrong Item': 'منتج خاطئ',
  'Changed Mind': 'تغيير الرأي', Defective: 'معيب', Other: 'أخرى'
};
const RETURN_TYPES = ['Refund', 'Exchange'];
const STATUSES = ['Pending', 'Approved', 'Rejected'];

const STATUS_COLORS = {
  Pending: { bg: `${COLORS.warning}15`, border: `${COLORS.warning}44`, text: COLORS.warning },
  Approved: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
  Rejected: { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red },
};

export default function Returns() {
  const { t, isRTL, language } = useLanguage();
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewReturn, setViewReturn] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    customerId: '', customerName: '', saleId: '',
    returnType: 'Refund', reason: 'Damaged', status: 'Pending',
    items: '', refundAmount: '', notes: '',
    date: new Date().toISOString().split('T')[0], restockItems: true
  });

  useEffect(() => {
    setReturns(getReturns());
    setCustomers(getCustomers());
    setSales(getSales());
    setProducts(getProducts());
  }, []);

  function getStatusLabel(status) {
    const labels = { Pending: t('pending'), Approved: t('approved'), Rejected: t('rejected') };
    return labels[status] || status;
  }

  function getReasonLabel(reason) {
    return language === 'ar' ? (REASONS_AR[reason] || reason) : reason;
  }

  function getTypeLabel(type) {
    return language === 'ar'
      ? (type === 'Refund' ? t('refund') : t('exchange'))
      : type;
  }

  function handleSave() {
    if (!form.customerName.trim()) return alert(t('customers') + ' ' + t('required'));
    if (!form.items.trim()) return alert(t('returnedItems') + ' ' + t('required'));
    if (form.returnType === 'Refund' && !form.refundAmount) return alert(t('refundAmount') + ' ' + t('required'));

    const returnRecord = { ...form, refundAmount: parseFloat(form.refundAmount) || 0 };
    let updated;
    if (editingId) {
      updated = returns.map(r => r.id === editingId ? { ...r, ...returnRecord } : r);
    } else {
      updated = [...returns, { id: generateId(), ...returnRecord, createdAt: new Date().toISOString() }];
    }
    saveReturns(updated);
    setReturns(updated);
    resetForm();
  }

  function handleEdit(ret) {
    setForm({
      customerId: ret.customerId || '', customerName: ret.customerName,
      saleId: ret.saleId || '', returnType: ret.returnType,
      reason: ret.reason, status: ret.status, items: ret.items,
      refundAmount: ret.refundAmount || '', notes: ret.notes || '',
      date: ret.date, restockItems: ret.restockItems !== false
    });
    setEditingId(ret.id);
    setShowForm(true);
    setViewReturn(null);
  }

  function handleDelete(id) {
    const updated = returns.filter(r => r.id !== id);
    saveReturns(updated);
    setReturns(updated);
    setDeleteConfirm(null);
    setViewReturn(null);
  }

  function handleStatusChange(id, newStatus) {
    const ret = returns.find(r => r.id === id);
    if (newStatus === 'Approved' && ret.status !== 'Approved' && ret.restockItems) {
      const updatedProducts = products.map(p => {
        if (ret.items.toLowerCase().includes(p.name.toLowerCase())) {
          return { ...p, stock: p.stock + 1 };
        }
        return p;
      });
      saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }
    const updated = returns.map(r => r.id === id ? { ...r, status: newStatus } : r);
    saveReturns(updated);
    setReturns(updated);
    if (viewReturn?.id === id) setViewReturn(updated.find(r => r.id === id));
  }

  function resetForm() {
    setForm({
      customerId: '', customerName: '', saleId: '',
      returnType: 'Refund', reason: 'Damaged', status: 'Pending',
      items: '', refundAmount: '', notes: '',
      date: new Date().toISOString().split('T')[0], restockItems: true
    });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = returns.filter(r => {
    const matchSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.items.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchType = filterType === 'all' || r.returnType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const pendingCount = returns.filter(r => r.status === 'Pending').length;
  const approvedCount = returns.filter(r => r.status === 'Approved').length;
  const rejectedCount = returns.filter(r => r.status === 'Rejected').length;
  const totalRefunded = returns
    .filter(r => r.status === 'Approved' && r.returnType === 'Refund')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const customerSales = sales.filter(s =>
    form.customerId ? s.customerId === form.customerId : true
  );

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('returns')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {returns.length} · {pendingCount} {t('pending')} ·
            <span style={{ color: COLORS.red, fontWeight: 600 }}> ${totalRefunded.toFixed(2)} {t('totalRefunded')}</span>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
          border: 'none', borderRadius: 8, padding: '10px 20px',
          color: COLORS.white, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44`
        }}>
          {t('newReturn')}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('pending'), value: pendingCount, color: COLORS.warning },
          { label: t('approved'), value: approvedCount, color: COLORS.success },
          { label: t('rejected'), value: rejectedCount, color: COLORS.red },
          { label: t('totalRefunded'), value: `$${totalRefunded.toFixed(2)}`, color: COLORS.info },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`, padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={`${t('search')}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none',
            background: COLORS.white, textAlign: isRTL ? 'right' : 'left'
          }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
          padding: '10px 14px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
          outline: 'none', background: COLORS.white, cursor: 'pointer'
        }}>
          <option value="all">{t('all')}</option>
          {RETURN_TYPES.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
          padding: '10px 14px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
          outline: 'none', background: COLORS.white, cursor: 'pointer'
        }}>
          <option value="all">{t('all')}</option>
          {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14,
            padding: 28, width: 540, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? `${t('edit')} ${t('returns')}` : t('newReturn')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Customer */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('customers')} *</div>
                <select value={form.customerId} onChange={e => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setForm({ ...form, customerId: e.target.value, customerName: customer?.name || '' });
                }} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  <option value="">{t('selectSupplier')}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
                <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                  placeholder={t('manualName')} style={{
                    width: '100%', padding: '9px 12px', marginTop: 6,
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>

              {/* Linked Sale */}
              {customerSales.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('linkedSale')}</div>
                  <select value={form.saleId} onChange={e => setForm({ ...form, saleId: e.target.value })} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}>
                    <option value="">{t('noLinkedSale')}</option>
                    {customerSales.map(s => (
                      <option key={s.id} value={s.id}>
                        #{s.id.slice(-6).toUpperCase()} — ${s.total.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Return Type */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('returnType')} *</div>
                <select value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  {RETURN_TYPES.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
                </select>
              </div>

              {/* Reason */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('reason')} *</div>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  {REASONS.map(r => <option key={r} value={r}>{getReasonLabel(r)}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('date')} *</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                }} />
              </div>

              {/* Status */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('status')}</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                </select>
              </div>

              {/* Items */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('returnedItems')} *</div>
                <input value={form.items} onChange={e => setForm({ ...form, items: e.target.value })}
                  placeholder={t('returnedItems')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>

              {/* Refund Amount */}
              {form.returnType === 'Refund' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('refundAmount')} *</div>
                  <input type="number" value={form.refundAmount} onChange={e => setForm({ ...form, refundAmount: e.target.value })}
                    placeholder="0.00" style={{
                      width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                      borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                    }} />
                </div>
              )}

              {/* Restock */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <input type="checkbox" id="restock" checked={form.restockItems}
                  onChange={e => setForm({ ...form, restockItems: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="restock" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                  {t('restock')}
                </label>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('notes')}</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder={t('notes')} rows={3} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{
                padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>{editingId ? t('save') : t('newReturn')}</button>
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
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t('deleteReturn')}</div>
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

      {/* View Return Modal */}
      {viewReturn && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14,
            padding: 28, width: 460,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                  {t('returns')} #{viewReturn.id.slice(-6).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {new Date(viewReturn.createdAt).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setViewReturn(null)} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted
              }}>✕</button>
            </div>

            {/* Status Buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>{t('updateStatus')}</div>
              <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {STATUSES.map(s => {
                  const sc = STATUS_COLORS[s];
                  const isActive = viewReturn.status === s;
                  return (
                    <button key={s} onClick={() => handleStatusChange(viewReturn.id, s)} style={{
                      padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${isActive ? sc.text : COLORS.border}`,
                      background: isActive ? sc.bg : COLORS.white,
                      color: isActive ? sc.text : COLORS.charcoalMid,
                      fontSize: 12, fontWeight: isActive ? 600 : 400
                    }}>
                      {getStatusLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div style={{ background: COLORS.offWhite, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              {[
                { label: t('customers'), value: viewReturn.customerName },
                { label: t('returnType'), value: getTypeLabel(viewReturn.returnType) },
                { label: t('reason'), value: getReasonLabel(viewReturn.reason) },
                { label: t('returnedItems'), value: viewReturn.items },
                { label: t('date'), value: new Date(viewReturn.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                viewReturn.returnType === 'Refund' && { label: t('refundAmount'), value: `$${viewReturn.refundAmount.toFixed(2)}` },
                { label: language === 'ar' ? 'إعادة للمخزون' : 'Restock', value: viewReturn.restockItems ? t('yes') : t('no') },
              ].filter(Boolean).map(row => (
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

            {viewReturn.notes && (
              <div style={{
                background: COLORS.offWhite, borderRadius: 8,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: COLORS.charcoalMid, fontStyle: 'italic',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {viewReturn.notes}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => handleEdit(viewReturn)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('edit')}</button>
              <button onClick={() => setDeleteConfirm(viewReturn.id)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                background: `${COLORS.red}11`, color: COLORS.red, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Returns List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
          {search || filterStatus !== 'all' || filterType !== 'all' ? t('noData') : t('noReturns')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(ret => {
            const sc = STATUS_COLORS[ret.status] || STATUS_COLORS.Pending;
            return (
              <div key={ret.id} onClick={() => setViewReturn(ret)} style={{
                background: COLORS.white, borderRadius: 10,
                border: `1px solid ${COLORS.border}`, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>
                  {ret.returnType === 'Refund' ? '💰' : '🔄'}
                </div>

                <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{ret.customerName}</span>
                    <span style={{
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      color: sc.text, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20
                    }}>{getStatusLabel(ret.status)}</span>
                    <span style={{
                      background: ret.returnType === 'Refund' ? `${COLORS.red}12` : `${COLORS.info}12`,
                      border: `1px solid ${ret.returnType === 'Refund' ? COLORS.red : COLORS.info}33`,
                      color: ret.returnType === 'Refund' ? COLORS.red : COLORS.info,
                      fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20
                    }}>{getTypeLabel(ret.returnType)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {getReasonLabel(ret.reason)} · {ret.items}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                    {new Date(ret.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {ret.returnType === 'Refund' && (
                  <div style={{ textAlign: isRTL ? 'left' : 'right', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t('refundAmount')}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.red, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                      ${ret.refundAmount.toFixed(2)}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(ret)} style={{
                    padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid, fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(ret.id)} style={{
                    padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                    background: `${COLORS.red}11`, color: COLORS.red, fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}