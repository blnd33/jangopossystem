import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const EXPENSE_CATEGORIES = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Transport', 'Supplies', 'Maintenance', 'Other'];

export default function Expenses() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [tab, setTab] = useState('expenses'); // 'expenses' | 'recurring'
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [monthlyStatus, setMonthlyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'Rent', amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '', notes: '', recurring: false
  });

  const L = (ar, en) => language === 'ar' ? ar : en;

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [data, rec, status] = await Promise.all([
        api.expenses.getAll(),
        api.expenses.getRecurring(),
        api.expenses.checkMonthly(),
      ]);
      setExpenses(data);
      setRecurring(rec);
      setMonthlyStatus(status);
    } catch (err) {
      console.error('Expenses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateMonthly() {
    setGenerating(true);
    try {
      const result = await api.expenses.generateMonthly();
      if (result.generated === 0) {
        showToast(L(`كل المصروفات المتكررة موجودة بالفعل لشهر ${result.month}`, `All recurring expenses already generated for ${result.month}`), 'info');
      } else {
        showToast(L(`تم توليد ${result.generated} مصروف لشهر ${result.month}`, `Generated ${result.generated} expenses for ${result.month}`));
      }
      fetchAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
    setGenerating(false);
  }

  async function handleSave() {
    if (!form.title.trim()) return alert(t('expenseTitle') + ' ' + t('required'));
    if (!form.amount) return alert(t('amount') + ' ' + t('required'));
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editingId) {
        const updated = await api.expenses.update(editingId, payload);
        setExpenses(es => es.map(e => e.id === editingId ? updated : e));
        setRecurring(es => es.map(e => e.id === editingId ? updated : e));
      } else {
        const created = await api.expenses.create(payload);
        if (created.recurring) {
          setRecurring(es => [created, ...es]);
        } else {
          setExpenses(es => [created, ...es]);
        }
      }
      showToast(L('تم الحفظ', 'Saved successfully'));
      resetForm();
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(expense) {
    setForm({
      title: expense.title,
      category: expense.category || 'Rent',
      amount: expense.amount,
      date: expense.date || new Date().toISOString().split('T')[0],
      vendor: expense.vendor || '',
      notes: expense.note || '',
      recurring: expense.recurring || false,
    });
    setEditingId(expense.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.expenses.delete(id);
      setExpenses(es => es.filter(e => e.id !== id));
      setRecurring(es => es.filter(e => e.id !== id));
      setDeleteConfirm(null);
      showToast(L('تم الحذف', 'Deleted'));
    } catch (err) {
      alert(err.message);
    }
  }

  function resetForm() {
    setForm({ title: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '', recurring: tab === 'recurring' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = expenses.filter(e => {
    if (e.recurring) return false; // hide templates from main list
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.vendor || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    const matchMonth = !filterMonth || (e.date || '').startsWith(filterMonth);
    return matchSearch && matchCat && matchMonth;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = filtered.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const totalRecurring = recurring.reduce((sum, e) => sum + e.amount, 0);
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';
  const opt = language === 'ar' ? 'اختياري' : 'Optional';

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box',
    background: C.white, textAlign: isRTL ? 'right' : 'left'
  };

  const btnPrimary = { padding: '9px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const btnGhost = { padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.charcoal, fontSize: 13, cursor: 'pointer' };

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, background: toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#e0f2fe' : '#dcfce7', color: toast.type === 'error' ? '#b91c1c' : toast.type === 'info' ? '#0369a1' : '#15803d', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('expenses')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {t('totalExpenses')}: <strong style={{ color: C.red }}>{fmt(totalFiltered)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {/* Generate Monthly Button */}
          {tab === 'expenses' && recurring.length > 0 && (
            <button onClick={handleGenerateMonthly} disabled={generating || monthlyStatus?.all_generated} style={{
              padding: '9px 16px', borderRadius: 8, border: 'none', cursor: generating || monthlyStatus?.all_generated ? 'not-allowed' : 'pointer',
              background: monthlyStatus?.all_generated ? `${C.success}22` : `linear-gradient(135deg, ${C.success}, #15803d)`,
              color: monthlyStatus?.all_generated ? C.success : '#fff', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {generating ? '...' : monthlyStatus?.all_generated ? `✓ ${L('تم التوليد', 'Generated')}` : `🔄 ${L('توليد هذا الشهر', 'Generate Month')}`}
            </button>
          )}
          <button onClick={() => { setForm(f => ({ ...f, recurring: tab === 'recurring' })); setEditingId(null); setShowForm(true); }} style={btnPrimary}>
            {isMobile ? '+' : `+ ${tab === 'recurring' ? L('إضافة قالب', 'Add Template') : t('addExpense')}`}
          </button>
        </div>
      </div>

      {/* Monthly Status Banner */}
      {tab === 'expenses' && monthlyStatus && recurring.length > 0 && !monthlyStatus.all_generated && (
        <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ fontSize: 13, color: C.charcoal }}>
            ⚠️ {L(`${monthlyStatus.total_templates - monthlyStatus.total_generated} مصروفات متكررة لم تُولَّد بعد لشهر ${monthlyStatus.month}`,
              `${monthlyStatus.total_templates - monthlyStatus.total_generated} recurring expenses not yet generated for ${monthlyStatus.month}`)}
          </div>
          <button onClick={handleGenerateMonthly} disabled={generating} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12, background: C.warning }}>
            {generating ? '...' : L('توليد الآن', 'Generate Now')}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, width: 'fit-content', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {[
          { id: 'expenses', label: L('المصروفات', 'Expenses'), count: filtered.length },
          { id: 'recurring', label: L('القوالب المتكررة', 'Recurring Templates'), count: recurring.length },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === tb.id ? C.white : 'transparent',
            color: tab === tb.id ? C.charcoal : C.textMuted,
            boxShadow: tab === tb.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tb.label}
            <span style={{ fontSize: 11, background: tab === tb.id ? C.red : C.border, color: tab === tb.id ? '#fff' : C.textMuted, padding: '1px 7px', borderRadius: 20 }}>{tb.count}</span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {!isMobile && tab === 'expenses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('totalExpenses'), value: fmt(totalFiltered), color: C.red },
            { label: L('عدد المصروفات', 'Total Entries'), value: filtered.length, color: C.info },
            { label: L('أعلى فئة', 'Top Category'), value: topCategory ? `${topCategory[0]} (${fmt(topCategory[1])})` : '—', color: C.warning },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {!isMobile && tab === 'recurring' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: L('عدد القوالب', 'Templates Count'), value: recurring.length, color: C.info },
            { label: L('إجمالي شهري', 'Monthly Total'), value: fmt(totalRecurring), color: C.red },
            { label: L('إجمالي سنوي', 'Annual Total'), value: fmt(totalRecurring * 12), color: C.warning },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters — only for expenses tab */}
      {tab === 'expenses' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 120, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }} />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
            <option value="all">{t('all')}</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
            <option value="">{t('all')}</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>
              {editingId ? t('edit') : form.recurring ? L('إضافة قالب متكرر', 'Add Recurring Template') : t('addExpense')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('expenseTitle')} *</div>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={t('expenseTitle')} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('category')} *</div>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('amount')} *</div>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle} />
              </div>
              {!form.recurring && (
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('date')} *</div>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('vendor')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={t('vendor')} style={inputStyle} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')} <span style={{ fontSize: 10, fontWeight: 400 }}>({opt})</span></div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <div onClick={() => setForm({ ...form, recurring: !form.recurring })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.recurring ? `${C.info}12` : C.offWhite, border: `1px solid ${form.recurring ? C.info + '44' : C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: form.recurring ? C.info : C.white, border: `2px solid ${form.recurring ? C.info : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0 }}>{form.recurring ? '✓' : ''}</div>
                  <div>
                    <span style={{ fontSize: 13, color: C.charcoal, fontWeight: 600 }}>{t('recurring')}</span>
                    <span style={{ fontSize: 11, color: C.textMuted, marginRight: 6, marginLeft: 6 }}>— {L('يتكرر تلقائياً كل شهر', 'Auto-generates every month')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={btnGhost}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : editingId ? t('save') : form.recurring ? L('حفظ القالب', 'Save Template') : t('addExpense')}
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
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteExpense')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={btnGhost}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrimary, background: C.red }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES LIST */}
      {tab === 'expenses' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{search ? t('noData') : t('noExpenses')}</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
              <div key={expense.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 18px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 10, flexShrink: 0, background: `${C.red}12`, border: `1px solid ${C.red}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>💸</div>
                <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal }}>{expense.title}</div>
                  <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                    {expense.category}
                    {expense.vendor && ` · ${expense.vendor}`}
                    {expense.date && ` · ${new Date(expense.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: C.red, flexShrink: 0 }}>{fmt(expense.amount)}</div>
                <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(expense)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(expense.id)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* RECURRING TEMPLATES LIST */}
      {tab === 'recurring' && (
        recurring.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
              {L('لا توجد قوالب متكررة', 'No recurring templates')}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>
              {L('أضف قوالب للمصروفات الثابتة مثل الإيجار والرواتب', 'Add templates for fixed expenses like rent and salaries')}
            </div>
            <button onClick={() => { setForm(f => ({ ...f, recurring: true })); setEditingId(null); setShowForm(true); }} style={btnPrimary}>
              + {L('إضافة قالب', 'Add Template')}
            </button>
          </div>
        ) : (
          <>
            {/* Monthly generate status */}
            {monthlyStatus && (
              <div style={{ background: monthlyStatus.all_generated ? `${C.success}10` : `${C.warning}10`, border: `1px solid ${monthlyStatus.all_generated ? C.success : C.warning}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, color: C.charcoal }}>
                  {monthlyStatus.all_generated
                    ? `✅ ${L(`تم توليد كل مصروفات شهر ${monthlyStatus.month}`, `All expenses generated for ${monthlyStatus.month}`)}`
                    : `⏳ ${L(`${monthlyStatus.total_generated} من ${monthlyStatus.total_templates} تم توليدهم لشهر ${monthlyStatus.month}`, `${monthlyStatus.total_generated}/${monthlyStatus.total_templates} generated for ${monthlyStatus.month}`)}`
                  }
                </div>
                {!monthlyStatus.all_generated && (
                  <button onClick={handleGenerateMonthly} disabled={generating} style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12, background: C.success }}>
                    {generating ? '...' : L('توليد الآن', 'Generate Now')}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              {recurring.map(expense => (
                <div key={expense.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.info}33`, padding: isMobile ? '12px 14px' : '14px 18px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row', boxShadow: `0 1px 4px ${C.shadow}` }}>
                  <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 10, flexShrink: 0, background: `${C.info}12`, border: `1px solid ${C.info}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>🔄</div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal }}>{expense.title}</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                      {expense.category}
                      {expense.vendor && ` · ${expense.vendor}`}
                      <span style={{ marginInlineStart: 6, background: `${C.info}15`, border: `1px solid ${C.info}33`, color: C.info, fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 20 }}>
                        {L('كل شهر', 'Every month')}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: C.red }}>{fmt(expense.amount)}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{L('شهرياً', '/month')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => handleEdit(expense)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 12, cursor: 'pointer' }}>{t('edit')}</button>
                    <button onClick={() => setDeleteConfirm(expense.id)} style={{ padding: isMobile ? '5px 8px' : '7px 14px', borderRadius: 7, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}