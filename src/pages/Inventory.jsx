import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import api from '../services/api';

export default function Inventory() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const fileRef = useRef();
  const barcodeRef = useRef();

  const [form, setForm] = useState({
    name: '', category_id: '', cost: '', price: '',
    stock: '', low_stock_alert: '5', sku: '', barcode: '',
    description: '', image_url: ''
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image_url: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name.trim()) return alert(t('productName') + ' ' + t('required'));
    if (!form.cost) return alert(t('costPrice') + ' ' + t('required'));
    if (!form.price) return alert(t('sellPrice') + ' ' + t('required'));
    if (!form.stock) return alert(t('stockQty') + ' ' + t('required'));
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category_id: form.category_id || null,
        cost: parseFloat(form.cost),
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        low_stock_alert: parseInt(form.low_stock_alert) || 5,
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        description: form.description,
        image_url: form.image_url || null,
      };
      if (editingId) {
        const updated = await api.products.update(editingId, payload);
        setProducts(ps => ps.map(p => p.id === editingId ? updated : p));
      } else {
        const created = await api.products.create(payload);
        setProducts(ps => [...ps, created]);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product) {
    setForm({
      name: product.name,
      category_id: product.category_id || '',
      cost: product.cost,
      price: product.price,
      stock: product.stock,
      low_stock_alert: product.low_stock_alert || '5',
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      image_url: product.image_url || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.products.delete(id);
      setProducts(ps => ps.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function resetForm() {
    setForm({ name: '', category_id: '', cost: '', price: '', stock: '', low_stock_alert: '5', sku: '', barcode: '', description: '', image_url: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getCategoryName(id) { return categories.find(c => c.id === id)?.name || '—'; }
  function getMargin(cost, sell) {
    if (!cost || !sell) return 0;
    return (((sell - cost) / sell) * 100).toFixed(1);
  }

  const filtered = products.filter(p => {
    if (!p.is_active) return false;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || p.category_id === parseInt(filterCategory);
    return matchSearch && matchCategory;
  });

  const lowStockCount = products.filter(p => p.is_active && p.stock <= (p.low_stock_alert || 5)).length;
  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box',
    background: C.white, textAlign: isRTL ? 'right' : 'left'
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('inventory')}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            {products.filter(p => p.is_active).length} {t('totalProducts')}
            {lowStockCount > 0 && <span style={{ color: C.warning, fontWeight: 600 }}> · {lowStockCount} {t('lowStockAlert')}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {['grid', 'list'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', background: viewMode === mode ? C.charcoal : C.white, color: viewMode === mode ? '#fff' : C.charcoalMid, fontSize: 12, fontWeight: 500 }}>
                {mode === 'grid' ? `⊞ ${t('gridView')}` : `☰ ${t('listView')}`}
              </button>
            ))}
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
            {t('addProduct')}
          </button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStockCount > 0 && (
        <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}44`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: C.warning, fontWeight: 500 }}>
          ⚠️ {lowStockCount} {t('lowStockAlert')}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={`${t('search')} — ${language === 'ar' ? 'الاسم، الكود، الباركود' : 'name, code, barcode'}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
          <option value="all">{t('all')} {t('categories')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>
              {editingId ? `${t('edit')} ${t('inventory')}` : t('addProduct')}
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: 18, textAlign: 'center' }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 120, height: 120, borderRadius: 10, margin: '0 auto', border: `2px dashed ${C.border}`, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}><div style={{ fontSize: 28, marginBottom: 4 }}>📷</div><div style={{ fontSize: 11, color: C.textMuted }}>{t('uploadPhoto')}</div></div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              {form.image_url && <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ marginTop: 6, fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>{t('removePhoto')}</button>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('productName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('productName')} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('categories')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{language === 'ar' ? 'بدون فئة' : 'No category'}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('costPrice')} * (USD)</div>
                <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('sellPrice')} * (USD)</div>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" style={inputStyle} />
              </div>

              {/* Margin Preview */}
              {form.cost && form.price && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ background: parseFloat(form.price) > parseFloat(form.cost) ? `${C.success}15` : `${C.red}15`, border: `1px solid ${parseFloat(form.price) > parseFloat(form.cost) ? C.success : C.red}44`, borderRadius: 7, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: parseFloat(form.price) > parseFloat(form.cost) ? C.success : C.red }}>
                    {t('profitMargin')}: {getMargin(parseFloat(form.cost), parseFloat(form.price))}%
                    · {t('profitPerUnit')}: {fmt(parseFloat(form.price) - parseFloat(form.cost))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('stockQty')} *</div>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('lowStockAt')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input type="number" value={form.low_stock_alert} onChange={e => setForm({ ...form, low_stock_alert: e.target.value })} placeholder="5" style={inputStyle} />
              </div>

              {/* Barcode & SKU */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ background: `${C.info}08`, border: `1px solid ${C.info}22`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.info, marginBottom: 12 }}>🔲 {language === 'ar' ? 'الكود والباركود' : 'Code & Barcode'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('productCode')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                      <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SOF-001" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('barcode')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                      <input ref={barcodeRef} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder={language === 'ar' ? 'امسح أو اكتب الباركود' : 'Scan or type barcode'} style={inputStyle} />
                    </div>
                  </div>
                  {(form.sku || form.barcode) && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 20 }}>✅</div>
                      <div>
                        {form.sku && <div style={{ fontSize: 12, color: C.charcoal }}>📦 {form.sku}</div>}
                        {form.barcode && <div style={{ fontSize: 12, color: C.charcoal }}>🔲 {form.barcode}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('description')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('description')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : t('addProduct')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteProduct')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
          {search ? t('noData') : t('noProducts')}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(product => {
            const isLow = product.stock <= (product.low_stock_alert || 5);
            const margin = getMargin(product.cost, product.price);
            return (
              <div key={product.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${isLow ? C.warning + '66' : C.border}`, overflow: 'hidden', boxShadow: `0 1px 6px ${C.shadow}`, transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: 160, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ fontSize: 40, opacity: 0.3 }}>🛋️</div>
                  }
                  {isLow && <div style={{ position: 'absolute', top: 8, right: isRTL ? 'auto' : 8, left: isRTL ? 8 : 'auto', background: C.warning, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{t('lowStockAlert').toUpperCase()}</div>}
                  {(product.sku || product.barcode) && (
                    <div style={{ position: 'absolute', bottom: 8, left: isRTL ? 'auto' : 8, right: isRTL ? 8 : 'auto', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 4 }}>
                      {product.barcode ? '🔲' : '📦'} {product.barcode || product.sku}
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>{product.category || (language === 'ar' ? 'بدون فئة' : 'No category')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('costPrice')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoalMid }}>{fmt(product.cost)}</div>
                    </div>
                    <div style={{ fontSize: 16, color: C.border }}>→</div>
                    <div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('sellPrice')}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>{fmt(product.price)}</div>
                    </div>
                    <div style={{ background: `${C.success}15`, border: `1px solid ${C.success}33`, borderRadius: 5, padding: '3px 7px', fontSize: 11, fontWeight: 700, color: C.success }}>{margin}%</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '6px 10px', borderRadius: 6, background: isLow ? `${C.warning}12` : C.offWhite }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{t('inStock')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isLow ? C.warning : C.success }}>{product.stock} {t('units')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => handleEdit(product)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                    <button onClick={() => setDeleteConfirm(product.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(product => {
            const isLow = product.stock <= (product.low_stock_alert || 5);
            const margin = getMargin(product.cost, product.price);
            return (
              <div key={product.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${isLow ? C.warning + '66' : C.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: C.offWhite, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, opacity: 0.3 }}>🛋️</span>}
                </div>
                <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{product.category || '—'}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {product.sku && <span style={{ fontSize: 10, background: `${C.info}12`, border: `1px solid ${C.info}33`, color: C.info, padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>📦 {product.sku}</span>}
                    {product.barcode && <span style={{ fontSize: 10, background: `${C.success}12`, border: `1px solid ${C.success}33`, color: C.success, padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>🔲 {product.barcode}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{t('costPrice')} / {t('sellPrice')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{fmt(product.cost)} → {fmt(product.price)}</div>
                  <div style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>{margin}% {t('profitMargin')}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '6px 14px', background: isLow ? `${C.warning}12` : `${C.success}12`, borderRadius: 7, minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{t('inStock')}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isLow ? C.warning : C.success }}>{product.stock}</div>
                  {isLow && <div style={{ fontSize: 9, color: C.warning }}>{t('lowStockAlert')}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(product)} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(product.id)} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}