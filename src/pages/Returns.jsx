import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getReturns, saveReturns, getSales, getProducts, saveProducts, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';

const STATUS_COLORS = {
  Pending: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  Approved: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  Rejected: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
};

export default function Returns() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    saleId: '', customerName: '', returnType: 'Refund',
    reason: '', refundAmount: '', restock: true,
    status: 'Pending', notes: '',
    returnedItems: [], date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setReturns(getReturns());
    setSales(getSales());
    setProducts(getProducts());
  }, []);

  function handleSave() {
    if (!form.customerName.trim()) return alert(t('customers') + ' ' + t('required'));
    if (!form.reason.trim()) return alert(t('reason') + ' ' + t('required'));
    let updated;
    if (editingId) {
      updated = returns.map(r => r.id === editingId ? { ...r, ...form, refundAmount: parseFloat(form.refundAmount) || 0 } : r);
    } else {
      updated = [...returns, { id: generateId(), ...form, refundAmount: parseFloat(form.refundAmount) || 0, createdAt: new Date().toISOString() }];
    }
    saveReturns(updated);
    setReturns(updated);
    resetForm();
  }

  function handleStatusChange(id, status) {
    const returnItem = returns.find(r => r.id === id);
    if (status === 'Approved' && returnItem.restock && returnItem.returnedItems?.length > 0) {
      const updatedProducts = products.map(p => {
        const returnedItem = returnItem.returnedItems.find(i => i.id === p.id);
        if (returnedItem) return { ...p, stock: p.stock + returnedItem.qty };
        return p;
      });
      saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }
    const updated = returns.map(r => r.id === id ? { ...r, status } : r);
    saveReturns(updated);
    setReturns(updated);
  }

  function handleEdit(ret) {
    setForm({
      saleId: ret.saleId || '', customerName: ret.customerName || '',
      returnType: ret.returnType || 'Refund', reason: ret.reason || '',
      refundAmount: ret.refundAmount || '', restock: ret.restock !== false,
      status: ret.status || 'Pending', notes: ret.notes || '',
      returnedItems: ret.returnedItems || [],
      date: ret.date || new Date().toISOString().split('T')[0]
    });
    setEditingId(ret.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = returns.filter(r => r.id !== id);
    saveReturns(updated);
    setReturns(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ saleId: '', customerName: '', returnType: 'Refund', reason: '', refundAmount: '', restock: true, status: 'Pending', notes: '', returnedItems: [], date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = returns.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = r.customerName?.toLowerCase().includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRefunded = returns.filter(r => r.status === 'Approved' && r.returnType === 'Refund').reduce((sum, r) => sum + r.refundAmount, 0);
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
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('returns')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {returns.filter(r => r.status === 'Pending').length} {t('pending')} · {t('totalRefunded')}: <strong style={{ color: C.red }}>{fmt(totalRefunded)}</strong>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {isMobile ? '+ ' + t('add') : t('newReturn')}
        </button>
      </div>

      {/* Summary */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('pending'), value: returns.filter(r => r.status === 'Pending').length, color: C.warning },
            { label: t('approved'), value: returns.filter(r => r.status === 'Approved').length, color: C.success },
            { label: t('totalRefunded'), value: fmt(totalRefunded), color: C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
          <option value="all">{t('all')}</option>
          <option value="Pending">{t('pending')}</option>
          <option value="Approved">{t('approved')}</option>
          <option value="Rejected">{t('rejected')}</option>
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>{editingId ? t('edit') : t('newReturn')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('customers')} *</div>
                <select value={form.saleId} onChange={e => {
                  const sale = sales.find(s => s.id === e.target.value);
                  setForm({ ...form, saleId: e.target.value, customerName: sale?.customerName || '', refundAmount: sale?.total || '' });
                }} style={{ ...inputStyle, cursor: 'pointer', marginBottom: 6 }}>
                  <option value="">{language === 'ar' ? 'اختر فاتورة' : 'Select sale (optional)'}</option>
                  {sales.map(s => <option key={s.id} value={s.id}>#{s.id.slice(-6).toUpperCase()} — {s.customerName} — {fmt(s.total)}</option>)}
                </select>
                {!form.saleId && <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder={language === 'ar' ? 'اسم العميل يدوياً *' : 'Customer name manually *'} style={inputStyle} />}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('returnType')}</div>
                <select value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Refund">{t('refund')}</option>
                  <option value="Exchange">{t('exchange')}</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('date')}</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('reason')} *</div>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {form.returnType === 'Refund' && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('refundAmount')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                  <input type="number" value={form.refundAmount} onChange={e => setForm({ ...form, refundAmount: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('status')}</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Pending">{t('pending')}</option>
                  <option value="Approved">{t('approved')}</option>
                  <option value="Rejected">{t('rejected')}</option>
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div onClick={() => setForm({ ...form, restock: !form.restock })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.restock ? `${C.success}12` : C.offWhite, border: `1px solid ${form.restock ? C.success + '44' : C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: form.restock ? C.success : C.white, border: `2px solid ${form.restock ? C.success : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0 }}>{form.restock ? '✓' : ''}</div>
                  <span style={{ fontSize: 13, color: C.charcoal }}>📦 {t('restock')}</span>
                </div>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{editingId ? t('save') : t('newReturn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteReturn')}</div>
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
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{t('noReturns')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(ret => {
            const sc = STATUS_COLORS[ret.status] || STATUS_COLORS.Pending;
            return (
              <div key={ret.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 10, flexShrink: 0, background: `${C.warning}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>🔄</div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{ret.customerName}</span>
                      <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{ret.status}</span>
                      <span style={{ background: `${C.info}15`, border: `1px solid ${C.info}33`, color: C.info, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{ret.returnType}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 2 }}>{ret.reason}</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                      📅 {ret.date}
                      {ret.refundAmount > 0 && ` · 💰 ${fmt(ret.refundAmount)}`}
                      {ret.restock && ` · 📦 ${language === 'ar' ? 'إعادة للمخزون' : 'Restock'}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {ret.status === 'Pending' && (
                    <>
                      <button onClick={() => handleStatusChange(ret.id, 'Approved')} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.success}44`, background: `${C.success}12`, color: C.success, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✅ {t('approved')}</button>
                      <button onClick={() => handleStatusChange(ret.id, 'Rejected')} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}12`, color: C.red, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>❌ {t('rejected')}</button>
                    </>
                  )}
                  <div style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(ret)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer' }}>{t('edit')}</button>
                    <button onClick={() => setDeleteConfirm(ret.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
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