import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getExpenses, saveExpenses, generateId } from '../data/store';

const CATEGORIES = [
  'Rent', 'Salaries', 'Utilities', 'Transport',
  'Supplier Payment', 'Marketing', 'Maintenance', 'Other'
];

const CAT_COLORS = {
  Rent: COLORS.red,
  Salaries: COLORS.info,
  Utilities: COLORS.warning,
  Transport: COLORS.success,
  'Supplier Payment': '#8B5CF6',
  Marketing: '#EC4899',
  Maintenance: COLORS.charcoalMid,
  Other: COLORS.steelDark,
};

export default function Expenses() {
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

  function handleSave() {
    if (!form.title.trim()) return alert('Title is required');
    if (!form.amount) return alert('Amount is required');
    if (!form.date) return alert('Date is required');

    const expense = {
      ...form,
      amount: parseFloat(form.amount),
    };

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
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      vendor: expense.vendor || '',
      notes: expense.notes || '',
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

  // This month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // By category totals
  const byCat = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Expenses
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {expenses.length} expenses · Total: ${totalAll.toFixed(2)}
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
          + Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Expenses', value: `$${totalAll.toFixed(2)}`, color: COLORS.red },
          { label: 'This Month', value: `$${thisMonthTotal.toFixed(2)}`, color: COLORS.warning },
          { label: 'Filtered Total', value: `$${totalFiltered.toFixed(2)}`, color: COLORS.info },
          { label: 'Categories Used', value: byCat.length, color: COLORS.success },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {byCat.length > 0 && (
        <div style={{
          background: COLORS.white, borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          padding: '16px 20px', marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
            Expenses by Category
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {byCat.map(({ cat, total }) => (
              <div key={cat} style={{
                background: `${CAT_COLORS[cat]}12`,
                border: `1px solid ${CAT_COLORS[cat]}33`,
                borderRadius: 8, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: CAT_COLORS[cat] }}>{cat}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search expenses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px',
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            fontSize: 13, color: COLORS.charcoal, outline: 'none',
            background: COLORS.white
          }}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Months</option>
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
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Expense' : 'Add New Expense'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Expense Title *
                </div>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Monthly Rent, Staff Salary..."
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Amount */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Amount ($) *
                </div>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Date *
                </div>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Category *
                </div>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Vendor / Paid To
                </div>
                <input
                  value={form.vendor}
                  onChange={e => setForm({ ...form, vendor: e.target.value })}
                  placeholder="e.g. Landlord, Staff name..."
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Recurring */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="recurring"
                  checked={form.recurring}
                  onChange={e => setForm({ ...form, recurring: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="recurring" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                  This is a recurring monthly expense
                </label>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Notes
                </div>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={resetForm} style={{
                padding: '9px 20px', borderRadius: 7,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Cancel
              </button>
              <button onClick={handleSave} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer',
                fontWeight: 600, boxShadow: `0 2px 8px ${COLORS.red}44`
              }}>
                {editingId ? 'Save Changes' : 'Add Expense'}
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
            width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>
              Delete Expense?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this expense record.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '9px 24px', borderRadius: 7,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '9px 24px', borderRadius: 7, border: 'none',
                background: COLORS.red, color: COLORS.white,
                fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search || filterCat !== 'all' || filterMonth !== 'all'
            ? 'No expenses match your filters.'
            : 'No expenses yet. Add your first expense!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => {
            const color = CAT_COLORS[expense.category] || COLORS.charcoalMid;
            return (
              <div key={expense.id} style={{
                background: COLORS.white, borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                {/* Category dot */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: `${color}15`,
                  border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: color, textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {expense.category.slice(0, 3).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal }}>
                      {expense.title}
                    </span>
                    {expense.recurring && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: COLORS.info,
                        background: `${COLORS.info}15`, border: `1px solid ${COLORS.info}33`,
                        padding: '1px 7px', borderRadius: 20
                      }}>
                        RECURRING
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {expense.category}
                    {expense.vendor && ` · ${expense.vendor}`}
                    {' · '}{new Date(expense.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                  {expense.notes && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' }}>
                      {expense.notes}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.red, fontFamily: 'Georgia, serif' }}>
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(expense)} style={{
                    padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(expense.id)} style={{
                    padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${COLORS.red}44`,
                    background: `${COLORS.red}11`, color: COLORS.red,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}