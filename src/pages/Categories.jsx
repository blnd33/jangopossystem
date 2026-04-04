import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSuppliers, getCategories, saveCategories, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';

export default function Categories() {
  const { t, isRTL, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', supplierId: '', description: '' });

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
  }, []);

  function handleSave() {
    if (!form.name.trim()) return alert(t('categoryName') + ' ' + t('required'));
    if (!form.supplierId) return alert(t('selectSupplier'));
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

  function handleEdit(cat) {
    setForm({ name: cat.name, supplierId: cat.supplierId, description: cat.description || '' });
    setEditingId(cat.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
    setCategories(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ name: '', supplierId: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || t('noData');
  }

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchSupplier = selectedSupplier === 'all' || c.supplierId === selectedSupplier;
    return matchSearch && matchSupplier;
  });

  const grouped = suppliers.map(s => ({
    supplier: s,
    cats: filtered.filter(c => c.supplierId === s.id)
  })).filter(g => selectedSupplier === 'all' ? g.cats.length > 0 : g.supplier.id === selectedSupplier);

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('categories')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {categories.length} {t('categories')} · {suppliers.length} {t('suppliers')}
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: COLORS.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44`
          }}
        >
          {t('addCategory')}
        </button>
      </div>

      {/* No suppliers warning */}
      {suppliers.length === 0 && (
        <div style={{
          background: `${COLORS.warning}15`, border: `1px solid ${COLORS.warning}44`,
          borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          fontSize: 13, color: COLORS.warning, fontWeight: 500
        }}>
          ⚠️ {t('noSuppliers')}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          placeholder={`${t('search')} ${t('categories')}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px',
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            fontSize: 13, color: COLORS.charcoal, outline: 'none',
            background: COLORS.white, textAlign: isRTL ? 'right' : 'left'
          }}
        />
        <select
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">{t('all')} {t('suppliers')}</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 12,
            padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? `${t('edit')} ${t('categories')}` : t('addCategory')}
            </div>

            {/* Supplier */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                {t('suppliers')} *
              </div>
              <select
                value={form.supplierId}
                onChange={e => setForm({ ...form, supplierId: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}
              >
                <option value="">{t('selectSupplier')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Category Name */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                {t('categoryName')} *
              </div>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('categoryName')}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                {t('description')}
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder={t('description')}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  textAlign: isRTL ? 'right' : 'left'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{
                padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                {t('cancel')}
              </button>
              <button onClick={handleSave} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>
                {editingId ? t('save') : t('addCategory')}
              </button>
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
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>
              {t('deleteCategory')}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              {t('permanentDelete')}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                {t('cancel')}
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: COLORS.red, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>
                {t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories grouped by supplier */}
      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
          {t('noCategories')}
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
          {t('noData')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {grouped.map(({ supplier, cats }) => (
            <div key={supplier.id} style={{
              background: COLORS.white, borderRadius: 12,
              border: `1px solid ${COLORS.border}`, overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              {/* Supplier Header */}
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(${isRTL ? '270deg' : '90deg'}, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
                display: 'flex', alignItems: 'center', gap: 10,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${COLORS.red}33`, border: `2px solid ${COLORS.red}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: COLORS.red
                }}>
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.white }}>{supplier.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.steelDark }}>
                    {cats.length} {t('categories')}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {cats.map(cat => (
                  <div key={cat.id} style={{
                    background: COLORS.offWhite, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10, minWidth: 160,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.red, flexShrink: 0 }} />
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{cat.description}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <button onClick={() => handleEdit(cat)} style={{
                        padding: '4px 10px', borderRadius: 5, border: `1px solid ${COLORS.border}`,
                        background: COLORS.white, color: COLORS.charcoalMid, fontSize: 11, cursor: 'pointer'
                      }}>
                        {t('edit')}
                      </button>
                      <button onClick={() => setDeleteConfirm(cat.id)} style={{
                        padding: '4px 10px', borderRadius: 5, border: `1px solid ${COLORS.red}44`,
                        background: `${COLORS.red}11`, color: COLORS.red, fontSize: 11, cursor: 'pointer'
                      }}>
                        {t('delete')}
                      </button>
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