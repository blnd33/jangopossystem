import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const CAT_COLORS = [
  '#CC1B1B', '#2563EB', '#16A34A', '#D97706', '#8B5CF6',
  '#EC4899', '#0891B2', '#059669', '#DC2626', '#7C3AED'
];

const CAT_ICONS = [
  '🛋️', '🪑', '🛏️', '🚪', '🪞', '🖼️', '💡', '🛁',
  '🪴', '📦', '🏺', '🧸', '🪟', '🚿', '🛒', '🎨',
  '🪵', '🔨', '🪣', '🧴', '🏠', '🌿', '⭐', '💎'
];

export default function Categories() {
  const { t, isRTL, language } = useLanguage();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [iconTab, setIconTab] = useState('emoji');
  const [customEmoji, setCustomEmoji] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', color: CAT_COLORS[0], icon: '', photo: '', notes: ''
  });

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Categories fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, photo: reader.result, icon: '' }));
      setIconTab('photo');
    };
    reader.readAsDataURL(file);
  }

  function handleImageUrl() {
    if (!imageUrl.trim()) return;
    setImageUrlError('');
    const img = new Image();
    img.onload = () => { setForm(f => ({ ...f, photo: imageUrl.trim(), icon: '' })); };
    img.onerror = () => setImageUrlError(language === 'ar' ? 'لم يتم تحميل الصورة' : 'Could not load image, check the URL');
    img.src = imageUrl.trim();
  }

  async function handleSave() {
    if (!form.name.trim()) return alert(t('categoryName') + ' ' + t('required'));
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.categories.update(editingId, { name: form.name });
        setCategories(cats => cats.map(c => c.id === editingId ? updated : c));
      } else {
        const created = await api.categories.create({ name: form.name });
        setCategories(cats => [...cats, { ...created, color: form.color, icon: form.icon, photo: form.photo, notes: form.notes }]);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category) {
    setForm({
      name: category.name,
      color: category.color || CAT_COLORS[0],
      icon: category.icon || '',
      photo: category.photo || '',
      notes: category.notes || ''
    });
    setIconTab(category.photo ? 'photo' : 'emoji');
    setImageUrl(''); setImageUrlError(''); setCustomEmoji('');
    setEditingId(category.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.categories.delete(id);
      setCategories(cats => cats.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function resetForm() {
    setForm({ name: '', color: CAT_COLORS[0], icon: '', photo: '', notes: '' });
    setIconTab('emoji'); setCustomEmoji(''); setImageUrl(''); setImageUrlError('');
    setEditingId(null); setShowForm(false);
  }

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none',
    boxSizing: 'border-box', background: C.white,
    textAlign: isRTL ? 'right' : 'left'
  };

  const previewDisplay = form.photo
    ? <img src={form.photo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: `2px solid ${form.color}44` }} onError={e => e.target.style.display = 'none'} />
    : <div style={{ width: 40, height: 40, borderRadius: 8, background: `${form.color}20`, border: `2px solid ${form.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{form.icon || '🏷️'}</div>;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 24 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('categories')}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {categories.length} {t('categories')}
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          border: 'none', borderRadius: 8,
          padding: isMobile ? '9px 14px' : '10px 20px',
          color: '#fff', fontSize: isMobile ? 12 : 13,
          fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44`
        }}>
          {isMobile ? '+ ' + t('add') : t('addCategory')}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder={`${t('search')} ${t('categories')}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left', boxSizing: 'border-box' }}
        />
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>
              {editingId ? `${t('edit')} ${t('categories')}` : t('addCategory')}
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('categoryName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('categoryName')} style={inputStyle} />
              </div>

              {/* Icon / Photo Section */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
                  {language === 'ar' ? 'أيقونة أو صورة' : 'Icon or Image'} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span>
                </div>
                <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  {[
                    { id: 'emoji', label: language === 'ar' ? '😀 أيقونة' : '😀 Emoji' },
                    { id: 'photo', label: language === 'ar' ? '📷 رفع صورة' : '📷 Upload' },
                    { id: 'url', label: language === 'ar' ? '🌐 رابط' : '🌐 URL' },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setIconTab(tab.id)} style={{
                      flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                      background: iconTab === tab.id ? C.charcoal : C.white,
                      color: iconTab === tab.id ? '#fff' : C.charcoalMid,
                      fontSize: isMobile ? 11 : 12, fontWeight: iconTab === tab.id ? 600 : 400
                    }}>{tab.label}</button>
                  ))}
                </div>

                {iconTab === 'emoji' && (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 12, background: C.offWhite, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                      {CAT_ICONS.map(icon => (
                        <button key={icon} onClick={() => setForm({ ...form, icon, photo: '' })} style={{
                          width: 40, height: 40, borderRadius: 8, border: 'none',
                          background: form.icon === icon && !form.photo ? `${form.color}30` : C.white,
                          fontSize: 20, cursor: 'pointer',
                          boxShadow: form.icon === icon && !form.photo ? `0 0 0 2px ${form.color}` : `0 1px 3px ${C.shadow}`,
                          transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{icon}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <input value={customEmoji} onChange={e => setCustomEmoji(e.target.value)} placeholder={language === 'ar' ? 'مثال: 🛍️' : 'e.g. 🛍️'} style={{ ...inputStyle, flex: 1, fontSize: 16 }} maxLength={4} />
                      <button onClick={() => { if (customEmoji.trim()) { setForm({ ...form, icon: customEmoji.trim(), photo: '' }); setCustomEmoji(''); } }} style={{ padding: '9px 16px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {language === 'ar' ? 'استخدم' : 'Use'}
                      </button>
                    </div>
                  </div>
                )}

                {iconTab === 'photo' && (
                  <div>
                    <div onClick={() => fileRef.current.click()} style={{ width: '100%', height: 130, borderRadius: 10, border: `2px dashed ${C.border}`, background: C.offWhite, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                      {form.photo && !form.photo.startsWith('http') ? (
                        <img src={form.photo} alt="category" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <><div style={{ fontSize: 32, marginBottom: 8 }}>📷</div><div style={{ fontSize: 13, color: C.textMuted }}>{t('uploadPhoto')}</div></>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </div>
                )}

                {iconTab === 'url' && (
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 8 }}>
                      <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImageUrlError(''); }} placeholder="https://example.com/image.jpg" style={{ ...inputStyle, flex: 1, fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && handleImageUrl()} />
                      <button onClick={handleImageUrl} style={{ padding: '9px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {language === 'ar' ? 'تحميل' : 'Load'}
                      </button>
                    </div>
                    {imageUrlError && <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>❌ {imageUrlError}</div>}
                    {form.photo && form.photo.startsWith('http') && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, height: 120 }}>
                        <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 12, padding: '10px 14px', background: C.offWhite, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {previewDisplay}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{language === 'ar' ? '👁️ المعاينة' : '👁️ Preview'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{form.name || (language === 'ar' ? 'اسم الفئة' : 'Category name')}</div>
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>{language === 'ar' ? 'لون الفئة' : 'Category Color'}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CAT_COLORS.map(color => (
                    <button key={color} onClick={() => setForm({ ...form, color })} style={{ width: 32, height: 32, borderRadius: '50%', border: form.color === color ? `3px solid ${C.charcoal}` : '3px solid transparent', background: color, cursor: 'pointer', outline: 'none', boxShadow: form.color === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none', transition: 'all 0.15s' }} />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : t('addCategory')}
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
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteCategory')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
          {search ? t('noData') : t('noCategories')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {filtered.map(category => (
            <div key={category.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: `0 1px 4px ${C.shadow}`, transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: isMobile ? 80 : 100, background: category.photo ? 'transparent' : `${category.color || C.red}15`, borderBottom: `3px solid ${category.color || C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {category.photo ? (
                  <img src={category.photo} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: isMobile ? 36 : 44 }}>{category.icon || '🏷️'}</span>
                )}
                <div style={{ position: 'absolute', top: 8, right: isRTL ? 'auto' : 8, left: isRTL ? 8 : 'auto', width: 10, height: 10, borderRadius: '50%', background: category.color || C.red, border: '2px solid rgba(255,255,255,0.8)' }} />
              </div>
              <div style={{ padding: isMobile ? '10px 12px' : '12px 14px' }}>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{category.name}</div>
                <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(category)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(category.id)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}