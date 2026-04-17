import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

export default function Warehouses() {
  const { isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // modals
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailWarehouse, setDetailWarehouse] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddStock, setShowAddStock] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({ name: '', location: '', manager: '', notes: '' });
  const [stockForm, setStockForm] = useState({ product_id: '', quantity: '', low_stock_alert: 5 });
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: '', to_warehouse_id: '', product_id: '', quantity: ''
  });

  const L = (ar, en) => language === 'ar' ? ar : en;

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([api.warehouses.getAll(), api.products.getAll()]);
      setWarehouses(w);
      setProducts(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openDetail(warehouse) {
    setDetailWarehouse(warehouse);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await api.warehouses.getOne(warehouse.id);
      setDetailData(data);
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  }

  async function handleSaveWarehouse() {
    if (!form.name.trim()) return alert(L('الاسم مطلوب', 'Name required'));
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.warehouses.update(editingId, form);
        setWarehouses(ws => ws.map(w => w.id === editingId ? updated : w));
        showToast(L('تم التحديث', 'Updated'));
      } else {
        const created = await api.warehouses.create(form);
        setWarehouses(ws => [...ws, created]);
        showToast(L('تم الإنشاء', 'Created'));
      }
      resetForm();
    } catch (e) { showToast(e.message, 'error'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    try {
      await api.warehouses.delete(id);
      setWarehouses(ws => ws.filter(w => w.id !== id));
      setDeleteConfirm(null);
      showToast(L('تم الحذف', 'Deleted'));
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function handleAddStock() {
    if (!stockForm.product_id || !stockForm.quantity) return;
    setSaving(true);
    try {
      await api.warehouses.addStock(showAddStock.id, {
        product_id: parseInt(stockForm.product_id),
        quantity: parseInt(stockForm.quantity),
        low_stock_alert: parseInt(stockForm.low_stock_alert),
      });
      showToast(L('تم إضافة المخزون', 'Stock added'));
      setShowAddStock(null);
      setStockForm({ product_id: '', quantity: '', low_stock_alert: 5 });
      fetchAll();
      if (detailWarehouse?.id === showAddStock.id) openDetail(showAddStock);
    } catch (e) { showToast(e.message, 'error'); }
    setSaving(false);
  }

  async function handleTransfer() {
    const { from_warehouse_id, to_warehouse_id, product_id, quantity } = transferForm;
    if (!from_warehouse_id || !to_warehouse_id || !product_id || !quantity) return;
    setSaving(true);
    try {
      await api.warehouses.transfer({
        from_warehouse_id: parseInt(from_warehouse_id),
        to_warehouse_id: parseInt(to_warehouse_id),
        product_id: parseInt(product_id),
        quantity: parseInt(quantity),
      });
      showToast(L('تم نقل المخزون', 'Stock transferred'));
      setShowTransfer(false);
      setTransferForm({ from_warehouse_id: '', to_warehouse_id: '', product_id: '', quantity: '' });
      fetchAll();
    } catch (e) { showToast(e.message, 'error'); }
    setSaving(false);
  }

  async function handleRemoveStock(warehouseId, productId) {
    if (!confirm(L('حذف هذا المنتج من المستودع؟', 'Remove this product from warehouse?'))) return;
    try {
      await api.warehouses.removeStock(warehouseId, productId);
      showToast(L('تم الحذف', 'Removed'));
      openDetail(detailWarehouse);
      fetchAll();
    } catch (e) { showToast(e.message, 'error'); }
  }

  function resetForm() {
    setForm({ name: '', location: '', manager: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  // Computed summary values
  const totalLowStock = warehouses.reduce((s, w) => s + (w.low_stock_count || 0), 0);
  const totalUniqueProducts = warehouses.reduce((s, w) => s + w.product_count, 0);

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none',
    background: C.white, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left',
  };
  const btnPrimary = { padding: '9px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const btnGhost = { padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.charcoal, fontSize: 13, cursor: 'pointer' };

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'inherit' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, background: toast.type === 'error' ? '#fee2e2' : '#dcfce7', color: toast.type === 'error' ? '#b91c1c' : '#15803d', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial' : 'Georgia, serif' }}>
            {L('المستودعات', 'Warehouses')}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {warehouses.length} {L('مستودع', 'warehouses')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <button onClick={() => setShowTransfer(true)} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6 }}>
            🔄 {L('نقل مخزون', 'Transfer Stock')}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
            + {L('مستودع جديد', 'New Warehouse')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            {
              label: L('إجمالي المستودعات', 'Total Warehouses'),
              value: warehouses.length,
              sub: L('مستودع نشط', 'active warehouses'),
              color: C.info,
              icon: '🏭',
            },
            {
              label: L('منتجات موزعة', 'Distributed Products'),
              value: totalUniqueProducts,
              sub: L('إجمالي المنتجات في المستودعات', 'total products across warehouses'),
              color: C.success,
              icon: '📦',
            },
            {
              label: L('تنبيهات مخزون منخفض', 'Low Stock Alerts'),
              value: totalLowStock,
              sub: totalLowStock > 0
                ? L('منتج يحتاج إعادة تخزين', 'items need restocking')
                : L('كل المخزون بمستوى جيد', 'all stock levels are good'),
              color: totalLowStock > 0 ? C.red : C.success,
              icon: totalLowStock > 0 ? '⚠️' : '✅',
            },
          ].map(card => (
            <div key={card.label} style={{
              background: C.white, borderRadius: 10,
              border: `1px solid ${C.border}`, padding: '16px 18px',
              borderTop: `3px solid ${card.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{card.icon}</span>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Warehouses Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>Loading...</div>
      ) : warehouses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>{L('لا توجد مستودعات', 'No warehouses yet')}</div>
          <button onClick={() => setShowForm(true)} style={btnPrimary}>+ {L('أضف مستودع', 'Add Warehouse')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {warehouses.map(w => (
            <div key={w.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, boxShadow: `0 2px 8px ${C.shadow}` }}>
              {/* Warehouse Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.info}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏭</div>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>{w.name}</div>
                    {w.location && <div style={{ fontSize: 11, color: C.textMuted }}>📍 {w.location}</div>}
                    {w.manager && <div style={{ fontSize: 11, color: C.textMuted }}>👤 {w.manager}</div>}
                  </div>
                </div>
                {/* Low stock badge */}
                {(w.low_stock_count || 0) > 0 && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                    ⚠️ {w.low_stock_count}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: L('منتجات', 'Products'), value: w.product_count, color: C.info },
                  { label: L('إجمالي القطع', 'Total Items'), value: w.total_items, color: C.success },
                ].map(stat => (
                  <div key={stat.label} style={{ background: C.surface, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <button onClick={() => openDetail(w)} style={{ ...btnGhost, flex: 1, fontSize: 12, padding: '7px 10px' }}>
                  {L('عرض المخزون', 'View Stock')}
                </button>
                <button onClick={() => setShowAddStock(w)} style={{ ...btnPrimary, flex: 1, fontSize: 12, padding: '7px 10px', background: C.success }}>
                  + {L('إضافة مخزون', 'Add Stock')}
                </button>
                <button onClick={() => { setForm({ name: w.name, location: w.location || '', manager: w.manager || '', notes: w.notes || '' }); setEditingId(w.id); setShowForm(true); }} style={{ ...btnGhost, padding: '7px 10px', fontSize: 12 }}>✏️</button>
                <button onClick={() => setDeleteConfirm(w.id)} style={{ ...btnGhost, padding: '7px 10px', fontSize: 12, color: C.red, borderColor: C.red }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>
              {editingId ? L('تعديل المستودع', 'Edit Warehouse') : L('مستودع جديد', 'New Warehouse')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('اسم المستودع *', 'Warehouse Name *')}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={L('مثال: المستودع الرئيسي', 'e.g. Main Warehouse')} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('الموقع', 'Location')}</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder={L('العنوان', 'Address')} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('المسؤول', 'Manager')}</label>
                <input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} placeholder={L('اسم المسؤول', 'Manager name')} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('ملاحظات', 'Notes')}</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={handleSaveWarehouse} disabled={saving} style={btnPrimary}>{saving ? '...' : L('حفظ', 'Save')}</button>
              <button onClick={resetForm} style={btnGhost}>{L('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>{L('إضافة مخزون', 'Add Stock')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>🏭 {showAddStock.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('المنتج *', 'Product *')}</label>
                <select value={stockForm.product_id} onChange={e => setStockForm({ ...stockForm, product_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{L('اختر منتج', 'Select product')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('الكمية *', 'Quantity *')}</label>
                <input type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="0" min={1} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('تنبيه المخزون المنخفض', 'Low Stock Alert')}</label>
                <input type="number" value={stockForm.low_stock_alert} onChange={e => setStockForm({ ...stockForm, low_stock_alert: e.target.value })} placeholder="5" min={0} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={handleAddStock} disabled={saving} style={{ ...btnPrimary, background: C.success }}>{saving ? '...' : L('إضافة', 'Add')}</button>
              <button onClick={() => setShowAddStock(null)} style={btnGhost}>{L('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>🔄 {L('نقل مخزون', 'Transfer Stock')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('من مستودع *', 'From Warehouse *')}</label>
                <select value={transferForm.from_warehouse_id} onChange={e => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{L('اختر', 'Select')}</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('إلى مستودع *', 'To Warehouse *')}</label>
                <select value={transferForm.to_warehouse_id} onChange={e => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{L('اختر', 'Select')}</option>
                  {warehouses.filter(w => w.id !== parseInt(transferForm.from_warehouse_id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('المنتج *', 'Product *')}</label>
                <select value={transferForm.product_id} onChange={e => setTransferForm({ ...transferForm, product_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{L('اختر منتج', 'Select product')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 5 }}>{L('الكمية *', 'Quantity *')}</label>
                <input type="number" value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} placeholder="0" min={1} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={handleTransfer} disabled={saving} style={btnPrimary}>{saving ? '...' : L('نقل', 'Transfer')}</button>
              <button onClick={() => setShowTransfer(false)} style={btnGhost}>{L('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailWarehouse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', padding: 28, direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal }}>🏭 {detailWarehouse.name}</div>
                {detailWarehouse.location && <div style={{ fontSize: 12, color: C.textMuted }}>📍 {detailWarehouse.location}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <button onClick={() => setShowAddStock(detailWarehouse)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: 12, background: C.success }}>
                  + {L('إضافة', 'Add')}
                </button>
                <button onClick={() => { setDetailWarehouse(null); setDetailData(null); }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textMuted }}>✕</button>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>{L('جاري التحميل...', 'Loading...')}</div>
            ) : detailData?.stock?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
                {L('لا يوجد مخزون', 'No stock yet')}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    {[L('المنتج', 'Product'), L('الكمية', 'Qty'), L('السعر', 'Price'), L('الحالة', 'Status'), ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', fontWeight: 600, color: C.textMuted, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailData?.stock?.map(s => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: C.charcoal }}>{s.product_name}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: s.is_low ? C.red : C.success }}>{s.quantity}</td>
                      <td style={{ padding: '10px 12px', color: C.textMuted }}>{fmt(s.product_price)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {s.is_low && <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{L('منخفض', 'Low')}</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => handleRemoveStock(detailWarehouse.id, s.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{L('حذف المستودع؟', 'Delete Warehouse?')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{L('سيتم حذف كل المخزون المرتبط به', 'All associated stock will be removed')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrimary, background: C.red }}>{L('نعم، احذف', 'Yes, Delete')}</button>
              <button onClick={() => setDeleteConfirm(null)} style={btnGhost}>{L('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}