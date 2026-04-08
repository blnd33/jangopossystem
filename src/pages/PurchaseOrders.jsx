import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const STATUSES = ['Draft', 'Ordered', 'Received', 'Paid'];
const STATUS_COLORS = {
  Draft: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' },
  Ordered: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  Received: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  Paid: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
};

export default function PurchaseOrders() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    supplier_name: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '', status: 'Draft', notes: '',
    items: [{ product_id: '', product_name: '', qty: 1, unit_cost: 0 }]
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ords, prods] = await Promise.all([
        api.purchaseOrders.getAll(),
        api.products.getAll(),
      ]);
      setOrders(ords);
      setProducts(prods);
    } catch (err) {
      console.error('PO fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { product_id: '', product_name: '', qty: 1, unit_cost: 0 }] }));
  }

  function removeItem(index) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  function updateItem(index, field, value) {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'product_id') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          items[index].product_name = product.name;
          items[index].unit_cost = product.cost;
        }
      }
      return { ...f, items };
    });
  }

  const orderTotal = form.items.reduce((sum, item) => sum + (parseFloat(item.unit_cost) || 0) * (parseInt(item.qty) || 0), 0);

  async function handleSave() {
    if (!form.supplier_name.trim()) return alert(t('suppliers') + ' ' + t('required'));
    if (form.items.length === 0) return alert(t('items') + ' ' + t('required'));
    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId) {
        const updated = await api.purchaseOrders.update(editingId, payload);
        setOrders(os => os.map(o => o.id === editingId ? updated : o));
      } else {
        const created = await api.purchaseOrders.create(payload);
        setOrders(os => [created, ...os]);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.purchaseOrders.updateStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? updated : o));
      if (status === 'Received') {
        alert(t('stockUpdated'));
        // Refresh products to get updated stock
        const prods = await api.products.getAll();
        setProducts(prods);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEdit(order) {
    setForm({
      supplier_name: order.supplier_name || '',
      order_date: order.order_date || new Date().toISOString().split('T')[0],
      expected_date: order.expected_date || '',
      status: order.status || 'Draft',
      notes: order.notes || '',
      items: order.items?.length
        ? order.items.map(i => ({ product_id: i.product_id || '', product_name: i.product_name, qty: i.qty, unit_cost: i.unit_cost }))
        : [{ product_id: '', product_name: '', qty: 1, unit_cost: 0 }]
    });
    setEditingId(order.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.purchaseOrders.delete(id);
      setOrders(os => os.filter(o => o.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function resetForm() {
    setForm({ supplier_name: '', order_date: new Date().toISOString().split('T')[0], expected_date: '', status: 'Draft', notes: '', items: [{ product_id: '', product_name: '', qty: 1, unit_cost: 0 }] });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchSearch = (o.supplier_name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalOwed = orders.filter(o => o.status === 'Received').reduce((sum, o) => sum + o.total, 0);
  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box',
    background: C.white, textAlign: isRTL ? 'right' : 'left'
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('purchaseOrders')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {orders.length} {language === 'ar' ? 'طلب' : 'orders'} · {t('owedToSuppliers')}: <strong style={{ color: C.red }}>{fmt(totalOwed)}</strong>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {isMobile ? '+ ' + t('add') : t('newPO')}
        </button>
      </div>

      {/* Summary */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {STATUSES.map(status => {
            const sc = STATUS_COLORS[status];
            return (
              <div key={status} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${sc.text}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{status}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{orders.filter(o => o.status === status).length}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {['all', ...STATUSES].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${filterStatus === status ? C.red : C.border}`, background: filterStatus === status ? `${C.red}12` : C.white, color: filterStatus === status ? C.red : C.textMuted, fontSize: 12, fontWeight: filterStatus === status ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {status === 'all' ? t('all') : status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder={`${t('search')} ${t('suppliers')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>{editingId ? t('edit') : t('newPO')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('suppliers')} *</div>
                <input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} placeholder={language === 'ar' ? 'اسم المورد' : 'Supplier name'} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('orderDate')}</div>
                <input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('expectedDate')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('status')}</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{t('items')}</div>
                <button onClick={addItem} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.success}44`, background: `${C.success}12`, color: C.success, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ {t('add')}</button>
              </div>
              {form.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, padding: 10, background: C.offWhite, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                    <select value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)} style={{ ...inputStyle, fontSize: 12 }}>
                      <option value="">{language === 'ar' ? 'اختر منتجاً' : 'Select product'}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {!item.product_id && (
                      <input value={item.product_name} onChange={e => updateItem(index, 'product_name', e.target.value)} placeholder={language === 'ar' ? 'أو اكتب اسم المنتج' : 'Or type product name'} style={{ ...inputStyle, marginTop: 6, fontSize: 12 }} />
                    )}
                  </div>
                  <div>
                    <input type="number" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} placeholder={language === 'ar' ? 'الكمية' : 'Qty'} style={{ ...inputStyle, fontSize: 12 }} min="1" />
                  </div>
                  <div>
                    <input type="number" value={item.unit_cost} onChange={e => updateItem(index, 'unit_cost', e.target.value)} placeholder={language === 'ar' ? 'السعر' : 'Cost'} style={{ ...inputStyle, fontSize: 12 }} />
                  </div>
                  <button onClick={() => removeItem(index)} style={{ padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 14, cursor: 'pointer', alignSelf: 'center' }}>✕</button>
                </div>
              ))}
              <div style={{ textAlign: isRTL ? 'left' : 'right', fontSize: 14, fontWeight: 700, color: C.charcoal, marginTop: 8 }}>
                {t('total')}: {fmt(orderTotal)}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : t('newPO')}
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
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deletePO')}</div>
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
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{t('noPOs')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Draft;
            return (
              <div key={order.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 10, flexShrink: 0, background: `${C.info}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>📋</div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{order.supplier_name}</span>
                      <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{order.status}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                      #{String(order.id).slice(-6).toUpperCase()} · {t('orderDate')}: {order.order_date}
                      {order.expected_date && ` · ${t('expectedDate')}: ${order.expected_date}`}
                    </div>
                    <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 2 }}>
                      {order.items?.length || 0} {t('items')} · <strong style={{ color: C.charcoal }}>{fmt(order.total)}</strong>
                    </div>
                  </div>
                  {!isMobile && (
                    <div style={{ textAlign: 'center', padding: '6px 14px', background: `${C.info}12`, borderRadius: 8, minWidth: 100 }}>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('total')}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.info }}>{fmt(order.total)}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {STATUSES.filter(s => s !== order.status).map(status => (
                    <button key={status} onClick={() => handleStatusChange(order.id, status)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.offWhite, color: C.charcoalMid, fontSize: 11, cursor: 'pointer' }}>
                      → {status}
                    </button>
                  ))}
                  <div style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(order)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer' }}>{t('edit')}</button>
                    <button onClick={() => setDeleteConfirm(order.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
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