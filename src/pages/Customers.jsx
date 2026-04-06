import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getCustomers, saveCustomers, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';

const TAGS = ['Regular', 'VIP', 'Wholesale', 'Blocked'];

export default function Customers() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '',
    tag: 'Regular', creditLimit: '', balance: '', notes: ''
  });

  useEffect(() => { setCustomers(getCustomers()); }, []);

  function handleSave() {
    if (!form.name.trim()) return alert(t('fullName') + ' ' + t('required'));
    if (!form.phone.trim()) return alert(t('phone') + ' ' + t('required'));
    let updated;
    if (editingId) {
      updated = customers.map(c => c.id === editingId ? { ...c, ...form, creditLimit: parseFloat(form.creditLimit) || 0, balance: parseFloat(form.balance) || 0 } : c);
    } else {
      updated = [...customers, { id: generateId(), ...form, creditLimit: parseFloat(form.creditLimit) || 0, balance: parseFloat(form.balance) || 0, totalPurchases: 0, totalSpent: 0, createdAt: new Date().toISOString() }];
    }
    saveCustomers(updated);
    setCustomers(updated);
    resetForm();
  }

  function handleEdit(customer) {
    setForm({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '', tag: customer.tag || 'Regular', creditLimit: customer.creditLimit || '', balance: customer.balance || '', notes: customer.notes || '' });
    setEditingId(customer.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = customers.filter(c => c.id !== id);
    saveCustomers(updated);
    setCustomers(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ name: '', phone: '', email: '', address: '', tag: 'Regular', creditLimit: '', balance: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchTag = filterTag === 'all' || c.tag === filterTag;
    return matchSearch && matchTag;
  });

  const totalDebt = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const vipCount = customers.filter(c => c.tag === 'VIP').length;
  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none',
    boxSizing: 'border-box', background: C.white,
    textAlign: isRTL ? 'right' : 'left'
  };

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 24 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('customers')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {customers.length} {t('totalCustomers')} · {vipCount} VIP
            {totalDebt > 0 && <span style={{ color: C.red, fontWeight: 600 }}> · {fmt(totalDebt)} {t('totalDebt')}</span>}
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {isMobile ? '+ ' + t('add') : t('addCustomer')}
        </button>
      </div>

      {/* Summary Cards */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('totalCustomers'), value: customers.length, color: C.info },
            { label: 'VIP', value: vipCount, color: '#B8860B' },
            { label: t('totalDebt'), value: fmt(totalDebt), color: C.red },
            { label: language === 'ar' ? 'جديد هذا الشهر' : 'New This Month', value: customers.filter(c => c.createdAt?.startsWith(new Date().toISOString().slice(0, 7))).length, color: C.success },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }} />
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
          <option value="all">{t('all')}</option>
          {TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>{editingId ? t('edit') : t('addCustomer')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('fullName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('fullName')} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('phone')} *</div>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+964 750 000 0000" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('email')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('tag')}</div>
                <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('creditLimit')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('address')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={t('address')} style={inputStyle} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{editingId ? t('save') : t('addCustomer')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteCustomer')}</div>
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
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{search ? t('noData') : t('noCustomers')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(customer => {
            const isVIP = customer.tag === 'VIP';
            const hasDebt = customer.balance < 0;
            return (
              <div key={customer.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${isVIP ? '#B8860B44' : C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: '50%', flexShrink: 0, background: isVIP ? 'linear-gradient(135deg, #FFD700, #B8860B)' : `linear-gradient(135deg, ${C.info}22, ${C.info}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 15 : 18, fontWeight: 700, color: isVIP ? '#fff' : C.info, fontFamily: 'Georgia, serif' }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{customer.name}</span>
                    {isVIP && <span style={{ background: '#FFD70020', border: '1px solid #B8860B44', color: '#B8860B', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>⭐ VIP</span>}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 2 }}>
                    {customer.phone}
                    {!isMobile && customer.email && ` · ${customer.email}`}
                  </div>
                  {isMobile && (
                    <div style={{ fontSize: 11, color: hasDebt ? C.red : C.success, fontWeight: 600, marginTop: 2 }}>
                      {hasDebt ? `${t('owes')}: ${fmt(Math.abs(customer.balance))}` : customer.totalSpent > 0 ? `${t('totalSpent')}: ${fmt(customer.totalSpent)}` : ''}
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <>
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('totalPurchases')}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal }}>{customer.totalPurchases || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('totalSpent')}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>{fmt(customer.totalSpent || 0)}</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 90, padding: '6px 12px', borderRadius: 7, background: hasDebt ? `${C.red}12` : `${C.success}12` }}>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{hasDebt ? t('owes') : t('credit')}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: hasDebt ? C.red : C.success }}>{fmt(Math.abs(customer.balance || 0))}</div>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(customer)} style={{ padding: isMobile ? '6px 10px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(customer.id)} style={{ padding: isMobile ? '6px 10px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}