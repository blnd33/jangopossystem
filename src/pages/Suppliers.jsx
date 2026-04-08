import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';
import api from '../services/api';

export default function Suppliers() {
  const { t, isRTL, language } = useLanguage();
  const C = useThemeColors();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  useEffect(() => { fetchSuppliers(); }, []);

  async function fetchSuppliers() {
    setLoading(true);
    try { setSuppliers(await api.suppliers.getAll()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.name.trim()) return alert(t('supplierName') + ' ' + t('required'));
    if (!form.phone.trim()) return alert(t('phone') + ' ' + t('required'));
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.suppliers.update(editingId, form);
        setSuppliers(ss => ss.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.suppliers.create(form);
        setSuppliers(ss => [...ss, created]);
      }
      resetForm();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  function handleEdit(supplier) {
    setForm({ name: supplier.name, phone: supplier.phone, email: supplier.email || '', address: supplier.address || '', notes: supplier.notes || '' });
    setEditingId(supplier.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.suppliers.delete(id);
      setSuppliers(ss => ss.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) { alert(err.message); }
  }

  function resetForm() {
    setForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const opt = language === 'ar' ? 'اختياري' : 'Optional';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';
  const inputStyle = { width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box', background: C.white, textAlign: isRTL ? 'right' : 'left' };

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('suppliers')}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{suppliers.length} {t('suppliers')}</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
          {t('addSupplier')}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input placeholder={`${t('search')} ${t('suppliers')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left', boxSizing: 'border-box' }} />
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 20 }}>{editingId ? `${t('edit')} ${t('suppliers')}` : t('addSupplier')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('supplierName')} *</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('supplierName')} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('phone')} *</div>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+964 750 000 0000" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('email')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="supplier@email.com" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('address')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={t('address')} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : t('addSupplier')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteSupplier')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>{search ? t('noData') : t('noSuppliers')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}` }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${C.red}22, ${C.red}11)`, border: `2px solid ${C.red}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C.red, fontFamily: 'Georgia, serif' }}>
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal }}>{supplier.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  📞 {supplier.phone}
                  {supplier.email && ` · ✉️ ${supplier.email}`}
                  {supplier.address && ` · 📍 ${supplier.address}`}
                </div>
                {supplier.notes && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontStyle: 'italic' }}>{supplier.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <button onClick={() => handleEdit(supplier)} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                <button onClick={() => setDeleteConfirm(supplier.id)} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}