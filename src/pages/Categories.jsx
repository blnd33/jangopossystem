import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getCategories, saveCategories, getSuppliers, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';

const CAT_COLORS = [
  '#CC1B1B', '#2563EB', '#16A34A', '#D97706', '#8B5CF6',
  '#EC4899', '#0891B2', '#059669', '#DC2626', '#7C3AED'
];

export default function Categories() {
  const { t, isRTL, language } = useLanguage();
  const C = useThemeColors();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [form, setForm] = useState({
    name: '', supplierId: '', color: CAT_COLORS[0], notes: ''
  });

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
  }, []);

  function handleSave() {
    if (!form.name.trim()) return alert(t('categoryName') + ' ' + t('required'));

    let updated;
    if (editingId) {
      updated = categories.map(c => c.id === editingId ? { ...c, ...form } : c);
    } else {
      updated = [...categories, { id: generateId(), ...form, createdAt: new Date().toISOString() }];
    }
    saveCategories(updated);
    setCategories(updated);
    resetForm();
  }

  function handleEdit(category) {
    setForm({
      name: category.name,
      supplierId: category.supplierId || '',
      color: category.color || CAT_COLORS[0],
      notes: category.notes || ''
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
    setCategories(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ name: '', supplierId: '', color: CAT_COLORS[0], notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || (language === 'ar' ? 'بدون مورد' : 'No supplier');
  }

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchSupplier = filterSupplier === 'all' || c.supplierId === filterSupplier;
    return matchSearch && matchSupplier;
  });

  // Group by supplier
  const grouped = {};
  filtered.forEach(cat => {
    const key = cat.supplierId || 'none';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cat);
  });

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
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('categories')}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            {categories.length} {t('categories')}
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44`
        }}>
          {t('addCategory')}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={`${t('search')} ${t('categories')}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }}
        />
        <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
          <option value="all">{t('all')}</option>
          <option value="none">{language === 'ar' ? 'بدون مورد' : 'No supplier'}</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? `${t('edit')} ${t('categories')}` : t('addCategory')}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>

              {/* Category Name - REQUIRED */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('categoryName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('categoryName')} style={inputStyle} />
              </div>

              {/* Supplier - OPTIONAL */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>
                  {t('suppliers')} <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>({opt})</span>
                </div>
                <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{language === 'ar' ? 'بدون مورد' : 'No supplier'}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Color Picker */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
                  {language === 'ar' ? 'لون الفئة' : 'Category Color'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CAT_COLORS.map(color => (
                    <button key={color} onClick={() => setForm({ ...form, color })} style={{
                      width: 32, height: 32, borderRadius: '50%', border: form.color === color ? `3px solid ${C.charcoal}` : '3px solid transparent',
                      background: color, cursor: 'pointer', outline: 'none',
                      boxShadow: form.color === color ? '0 0 0 2px #fff, 0 0 0 4px ' + color : 'none',
                      transition: 'all 0.15s'
                    }} />
                  ))}
                </div>
              </div>

              {/* Notes - OPTIONAL */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>
                  {t('notes')} <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>({opt})</span>
                </div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{editingId ? t('save') : t('addCategory')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteCategory')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List — Grouped by Supplier */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
          {search ? t('noData') : t('noCategories')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {Object.entries(grouped).map(([supplierId, cats]) => (
            <div key={supplierId}>
              {/* Supplier Group Header */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.textMuted,
                textTransform: 'uppercase', letterSpacing: 1,
                marginBottom: 10, paddingBottom: 6,
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span>🚚</span>
                <span>{supplierId === 'none' ? (language === 'ar' ? 'بدون مورد' : 'No Supplier') : getSupplierName(supplierId)}</span>
                <span style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 20, padding: '1px 8px', fontSize: 10, color: C.textMuted }}>
                  {cats.length}
                </span>
              </div>

              {/* Category Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {cats.map(category => (
                  <div key={category.id} style={{
                    background: C.white, borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    padding: '14px 16px',
                    boxShadow: `0 1px 4px ${C.shadow}`,
                    borderLeft: !isRTL ? `4px solid ${category.color || C.red}` : 'none',
                    borderRight: isRTL ? `4px solid ${category.color || C.red}` : 'none',
                    transition: 'transform 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: `${category.color || C.red}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18
                      }}>
                        🏷️
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <button onClick={() => handleEdit(category)} style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer' }}>{t('edit')}</button>
                        <button onClick={() => setDeleteConfirm(category.id)} style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
                      </div>
                    </div>

                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{category.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: category.color || C.red, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>
                          {supplierId === 'none' ? (language === 'ar' ? 'بدون مورد' : 'No supplier') : getSupplierName(supplierId)}
                        </span>
                      </div>
                      {category.notes && (
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontStyle: 'italic' }}>{category.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}