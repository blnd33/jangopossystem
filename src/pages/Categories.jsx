import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { getCategories, saveCategories, getSuppliers, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';

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
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [iconTab, setIconTab] = useState('emoji');
  const [customEmoji, setCustomEmoji] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', supplierId: '', color: CAT_COLORS[0],
    icon: '', photo: '', notes: ''
  });

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
  }, []);

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
    img.onload = () => {
      setForm(f => ({ ...f, photo: imageUrl.trim(), icon: '' }));
      setImageUrlError('');
    };
    img.onerror = () => {
      setImageUrlError(language === 'ar' ? 'لم يتم تحميل الصورة، تحقق من الرابط' : 'Could not load image, check the URL');
    };
    img.src = imageUrl.trim();
  }

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
      icon: category.icon || '',
      photo: category.photo || '',
      notes: category.notes || ''
    });
    setIconTab(category.photo ? 'photo' : 'emoji');
    setImageUrl('');
    setImageUrlError('');
    setCustomEmoji('');
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
    setForm({ name: '', supplierId: '', color: CAT_COLORS[0], icon: '', photo: '', notes: '' });
    setIconTab('emoji');
    setCustomEmoji('');
    setImageUrl('');
    setImageUrlError('');
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || (language === 'ar' ? 'بدون مورد' : 'No supplier');
  }

  // Fixed filter
  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    let matchSupplier = true;
    if (filterSupplier === 'all') {
      matchSupplier = true;
    } else if (filterSupplier === 'none') {
      matchSupplier = !c.supplierId || c.supplierId === '';
    } else {
      matchSupplier = c.supplierId === filterSupplier;
    }
    return matchSearch && matchSupplier;
  });

  // Fixed grouping
  const grouped = {};
  filtered.forEach(cat => {
    const key = (cat.supplierId && cat.supplierId !== '') ? cat.supplierId : 'none';
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

  function CatDisplay({ cat, size = 44 }) {
    if (cat.photo) {
      return (
        <div style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `2px solid ${cat.color || C.red}44` }}>
          <img src={cat.photo} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        </div>
      );
    }
    if (cat.icon) {
      return (
        <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, background: `${cat.color || C.red}20`, border: `2px solid ${cat.color || C.red}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>
          {cat.icon}
        </div>
      );
    }
    return (
      <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, background: `${cat.color || C.red}20`, border: `2px solid ${cat.color || C.red}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>
        🏷️
      </div>
    );
  }

  // Current display in form preview
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

                {/* Tabs */}
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
                    }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── EMOJI TAB ── */}
                {iconTab === 'emoji' && (
                  <div>
                    {/* Quick emoji grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px', background: C.offWhite, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                      {CAT_ICONS.map(icon => (
                        <button key={icon} onClick={() => setForm({ ...form, icon, photo: '' })} style={{
                          width: 40, height: 40, borderRadius: 8, border: 'none',
                          background: form.icon === icon && !form.photo ? `${form.color}30` : C.white,
                          fontSize: 20, cursor: 'pointer',
                          boxShadow: form.icon === icon && !form.photo ? `0 0 0 2px ${form.color}` : `0 1px 3px ${C.shadow}`,
                          transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {icon}
                        </button>
                      ))}
                    </div>

                    {/* Custom emoji input */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 5 }}>
                        {language === 'ar' ? '✏️ أو اكتب أي إيموجي يدوياً:' : '✏️ Or type any emoji manually:'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <input
                          value={customEmoji}
                          onChange={e => setCustomEmoji(e.target.value)}
                          placeholder={language === 'ar' ? 'مثال: 🛍️ أو 🏡' : 'e.g. 🛍️ or 🏡'}
                          style={{ ...inputStyle, flex: 1, fontSize: 16 }}
                          maxLength={4}
                        />
                        <button onClick={() => { if (customEmoji.trim()) { setForm({ ...form, icon: customEmoji.trim(), photo: '' }); setCustomEmoji(''); } }} style={{ padding: '9px 16px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {language === 'ar' ? 'استخدم' : 'Use'}
                        </button>
                      </div>
                    </div>

                    {/* Emoji hint */}
                    <div style={{ background: `${C.info}10`, border: `1px solid ${C.info}33`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.info }}>
                      💡 {language === 'ar'
                        ? 'يمكنك نسخ أي إيموجي من الإنترنت مثل emojipedia.org ولصقه هنا'
                        : 'You can copy any emoji from emojipedia.org or any website and paste it here'}
                    </div>
                  </div>
                )}

                {/* ── UPLOAD TAB ── */}
                {iconTab === 'photo' && (
                  <div>
                    <div onClick={() => fileRef.current.click()} style={{
                      width: '100%', height: 130, borderRadius: 10,
                      border: `2px dashed ${C.border}`, background: C.offWhite,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden'
                    }}>
                      {form.photo && !form.photo.startsWith('http') ? (
                        <img src={form.photo} alt="category" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                          <div style={{ fontSize: 13, color: C.textMuted }}>{t('uploadPhoto')}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>JPG, PNG, WEBP</div>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                    {form.photo && !form.photo.startsWith('http') && (
                      <button onClick={() => setForm(f => ({ ...f, photo: '', icon: '' }))} style={{ marginTop: 8, fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ {t('removePhoto')}
                      </button>
                    )}
                  </div>
                )}

                {/* ── URL TAB ── */}
                {iconTab === 'url' && (
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                      {language === 'ar'
                        ? '🌐 الصق رابط الصورة من الإنترنت (Google Images, Pinterest, إلخ)'
                        : '🌐 Paste an image URL from the web (Google Images, Pinterest, etc)'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 8 }}>
                      <input
                        value={imageUrl}
                        onChange={e => { setImageUrl(e.target.value); setImageUrlError(''); }}
                        placeholder="https://example.com/image.jpg"
                        style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                        onKeyDown={e => e.key === 'Enter' && handleImageUrl()}
                      />
                      <button onClick={handleImageUrl} style={{ padding: '9px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {language === 'ar' ? 'تحميل' : 'Load'}
                      </button>
                    </div>
                    {imageUrlError && <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>❌ {imageUrlError}</div>}

                    {/* Preview */}
                    {form.photo && form.photo.startsWith('http') && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, height: 120, position: 'relative' }}>
                        <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => { setImageUrlError(language === 'ar' ? 'لم يتم تحميل الصورة' : 'Could not load image'); setForm(f => ({ ...f, photo: '' })); }} />
                        <button onClick={() => { setForm(f => ({ ...f, photo: '' })); setImageUrl(''); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    )}

                    {/* Hint */}
                    <div style={{ background: `${C.info}10`, border: `1px solid ${C.info}33`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.info, marginTop: 8 }}>
                      💡 {language === 'ar'
                        ? 'في Google Images: انقر على الصورة ← انقر بزر الفأرة الأيمن ← نسخ عنوان الصورة'
                        : 'In Google Images: click image → right click → Copy image address'}
                    </div>
                  </div>
                )}

                {/* Live Preview */}
                <div style={{ marginTop: 12, padding: '10px 14px', background: C.offWhite, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {previewDisplay}
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{language === 'ar' ? '👁️ المعاينة' : '👁️ Preview'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{form.name || (language === 'ar' ? 'اسم الفئة' : 'Category name')}</div>
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
                  {language === 'ar' ? 'لون الفئة' : 'Category Color'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CAT_COLORS.map(color => (
                    <button key={color} onClick={() => setForm({ ...form, color })} style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: form.color === color ? `3px solid ${C.charcoal}` : '3px solid transparent',
                      background: color, cursor: 'pointer', outline: 'none',
                      boxShadow: form.color === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                      transition: 'all 0.15s'
                    }} />
                  ))}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>
                  {t('suppliers')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span>
                </div>
                <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{language === 'ar' ? 'بدون مورد' : 'No supplier'}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>
                  {t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span>
                </div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
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

      {/* Categories List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
          {search || filterSupplier !== 'all' ? t('noData') : t('noCategories')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {Object.entries(grouped).map(([supplierId, cats]) => (
            <div key={supplierId}>
              {/* Group Header */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span>🚚</span>
                <span>{supplierId === 'none' ? (language === 'ar' ? 'بدون مورد' : 'No Supplier') : getSupplierName(supplierId)}</span>
                <span style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 20, padding: '1px 8px', fontSize: 10 }}>{cats.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {cats.map(category => (
                  <div key={category.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: `0 1px 4px ${C.shadow}`, transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {/* Visual */}
                    <div style={{ height: isMobile ? 80 : 100, background: category.photo ? 'transparent' : `${category.color || C.red}15`, borderBottom: `3px solid ${category.color || C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {category.photo ? (
                        <img src={category.photo} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                      ) : (
                        <span style={{ fontSize: isMobile ? 36 : 44 }}>{category.icon || '🏷️'}</span>
                      )}
                      {/* Color dot */}
                      <div style={{ position: 'absolute', top: 8, right: isRTL ? 'auto' : 8, left: isRTL ? 8 : 'auto', width: 10, height: 10, borderRadius: '50%', background: category.color || C.red, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ padding: isMobile ? '10px 12px' : '12px 14px' }}>
                      <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 2, textAlign: isRTL ? 'right' : 'left' }}>{category.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                        {supplierId === 'none' ? (language === 'ar' ? 'بدون مورد' : 'No supplier') : getSupplierName(supplierId)}
                      </div>
                      {category.notes && <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{category.notes}</div>}
                      <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <button onClick={() => handleEdit(category)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{t('edit')}</button>
                        <button onClick={() => setDeleteConfirm(category.id)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{t('delete')}</button>
                      </div>
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