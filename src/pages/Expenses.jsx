import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getExpenses, saveExpenses, generateId } from '../data/store';
import { useLanguage } from '../data/LanguageContext';

const CATEGORIES = [
  'Rent', 'Salaries', 'Utilities', 'Transport',
  'Supplier Payment', 'Marketing', 'Maintenance', 'Other'
];

const CATEGORIES_AR = {
  Rent: 'إيجار', Salaries: 'رواتب', Utilities: 'خدمات',
  Transport: 'نقل', 'Supplier Payment': 'دفع للمورد',
  Marketing: 'تسويق', Maintenance: 'صيانة', Other: 'أخرى'
};

const CAT_COLORS = {
  Rent: COLORS.red, Salaries: COLORS.info, Utilities: COLORS.warning,
  Transport: COLORS.success, 'Supplier Payment': '#8B5CF6',
  Marketing: '#EC4899', Maintenance: COLORS.charcoalMid, Other: COLORS.steelDark,
};

export default function Expenses() {
  const { t, isRTL, language } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Rent',
    date: new Date().toISOString().split('T')[0],
    vendor: '', notes: '', recurring: false
  });

  useEffect(() => { setExpenses(getExpenses()); }, []);

  function getCatLabel(cat) {
    return language === 'ar' ? (CATEGORIES_AR[cat] || cat) : cat;
  }

  function handleSave() {
    if (!form.title.trim()) return alert(t('expenseTitle') + ' ' + t('required'));
    if (!form.amount) return alert(t('amount') + ' ' + t('required'));
    if (!form.date) return alert(t('date') + ' ' + t('required'));

    const expense = { ...form, amount: parseFloat(form.amount) };
    let updated;
    if (editingId) {
      updated = expenses.map(e => e.id === editingId ? { ...e, ...expense } : e);
    } else {
      updated = [...expenses, { id: generateId(), ...expense, createdAt: new Date().toISOString() }];
    }
    saveExpenses(updated);
    setExpenses(updated);
    resetForm();
  }

  function handleEdit(expense) {
    setForm({
      title: expense.title, amount: expense.amount,
      category: expense.category, date: expense.date,
      vendor: expense.vendor || '', notes: expense.notes || '',
      recurring: expense.recurring || false
    });
    setEditingId(expense.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = expenses.filter(e => e.id !== id);
    saveExpenses(updated);
    setExpenses(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({
      title: '', amount: '', category: 'Rent',
      date: new Date().toISOString().split('T')[0],
      vendor: '', notes: '', recurring: false
    });
    setEditingId(null);
    setShowForm(false);
  }

  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();

  const filtered = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || e.category === filterCat;
    const matchMonth = filterMonth === 'all' || e.date.startsWith(filterMonth);
    return matchSearch && matchCat && matchMonth;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);
  const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0);
  const byCat = CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('expenses')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {expenses.length} · {t('totalExpenses')}: ${totalAll.toFixed(2)}
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
          border: 'none', borderRadius: 8, padding: '10px 20px',
          color: COLORS.white, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44`
        }}>
          {t('addExpense')}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('totalExpenses'), value: `$${totalAll.toFixed(2)}`, color: COLORS.red },
          { label: t('thisMonth'), value: `$${thisMonthTotal.toFixed(2)}`, color: COLORS.warning },
          { label: t('filteredTotal'), value: `$${totalFiltered.toFixed(2)}`, color: COLORS.info },
          { label: t('categoriesUsed'), value: byCat.length, color: COLORS.success },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`, padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {byCat.length > 0 && (
        <div style={{
          background: COLORS.white, borderRadius: 10,
          border: `1px solid ${COLORS.border}`, padding: '16px 20px', marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
            {t('byCategory')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {byCat.map(({ cat, total }) => (
              <div key={cat} style={{
                background: `${CAT_COLORS[cat]}12`, border: `1px solid ${CAT_COLORS[cat]}33`,
                borderRadius: 8, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: CAT_COLORS[cat] }}>{getCatLabel(cat)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={`${t('search')} ${t('expenses')}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none',
            background: COLORS.white, textAlign: isRTL ? 'right' : 'left'
          }}
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
          padding: '10px 14px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
          outline: 'none', background: COLORS.white, cursor: 'pointer'
        }}>
          <option value="all">{t('all')} {t('categories')}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{getCatLabel(c)}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{
          padding: '10px 14px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
          outline: 'none', background: COLORS.white, cursor: 'pointer'
        }}>
          <option value="all">{t('all')}</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14,
            padding: 28, width: 500, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {editingId ? `${t('edit')} ${t('expenses')}` : t('addExpense')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('expenseTitle')} *</div>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={t('expenseTitle')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>

              {/* Amount */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('amount')} *</div>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00" style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>

              {/* Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('date')} *</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box'
                }} />
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('category')} *</div>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{
                  width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                  borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{getCatLabel(c)}</option>)}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('vendor')}</div>
                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
                  placeholder={t('vendor')} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>

              {/* Recurring */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <input type="checkbox" id="recurring" checked={form.recurring}
                  onChange={e => setForm({ ...form, recurring: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="recurring" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                  {t('recurring')}
                </label>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('notes')}</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder={t('notes')} rows={3} style={{
                    width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left'
                  }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{
                padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>{editingId ? t('save') : t('addExpense')}</button>
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
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t('deleteExpense')}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: COLORS.red, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>
          {search || filterCat !== 'all' || filterMonth !== 'all' ? t('noData') : t('noExpenses')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => {
            const color = CAT_COLORS[expense.category] || COLORS.charcoalMid;
            return (
              <div key={expense.id} style={{
                background: COLORS.white, borderRadius: 10,
                border: `1px solid ${COLORS.border}`, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: `${color}15`, border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color, textAlign: 'center', lineHeight: 1.2
                }}>
                  {getCatLabel(expense.category).slice(0, 3).toUpperCase()}
                </div>

                <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal }}>{expense.title}</span>
                    {expense.recurring && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: COLORS.info,
                        background: `${COLORS.info}15`, border: `1px solid ${COLORS.info}33`,
                        padding: '1px 7px', borderRadius: 20
                      }}>
                        {language === 'ar' ? 'متكرر' : 'RECURRING'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {getCatLabel(expense.category)}
                    {expense.vendor && ` · ${expense.vendor}`}
                    {' · '}{new Date(expense.date).toLocaleDateString(
                      language === 'ar' ? 'ar-IQ' : 'en-GB',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )}
                  </div>
                  {expense.notes && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' }}>{expense.notes}</div>
                  )}
                </div>

                <div style={{ textAlign: isRTL ? 'left' : 'right', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.red, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <button onClick={() => handleEdit(expense)} style={{
                    padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid, fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>{t('edit')}</button>
                  <button onClick={() => setDeleteConfirm(expense.id)} style={{
                    padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                    background: `${COLORS.red}11`, color: COLORS.red, fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>{t('delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}