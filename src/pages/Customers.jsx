import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getCustomers, saveCustomers, generateId } from '../data/store';

const TAGS = ['Regular', 'VIP', 'Wholesale', 'New', 'Blocked'];

const TAG_COLORS = {
  Regular: { bg: `${COLORS.info}15`, border: `${COLORS.info}44`, text: COLORS.info },
  VIP: { bg: '#FFD70015', border: '#FFD70066', text: '#B8860B' },
  Wholesale: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
  New: { bg: `${COLORS.steel}33`, border: `${COLORS.steelDark}44`, text: COLORS.charcoalMid },
  Blocked: { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red },
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [viewCustomer, setViewCustomer] = useState(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '',
    tag: 'Regular', creditLimit: '', notes: '', balance: '0'
  });

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  function handleSave() {
    if (!form.name.trim()) return alert('Customer name is required');
    if (!form.phone.trim()) return alert('Phone number is required');

    const customer = {
      ...form,
      creditLimit: parseFloat(form.creditLimit) || 0,
      balance: parseFloat(form.balance) || 0,
    };

    let updated;
    if (editingId) {
      updated = customers.map(c => c.id === editingId ? { ...c, ...customer } : c);
    } else {
      updated = [...customers, {
        id: generateId(), ...customer,
        totalPurchases: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString()
      }];
    }
    saveCustomers(updated);
    setCustomers(updated);
    resetForm();
  }

  function handleEdit(customer) {
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      tag: customer.tag || 'Regular',
      creditLimit: customer.creditLimit || '',
      notes: customer.notes || '',
      balance: customer.balance || '0'
    });
    setEditingId(customer.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = customers.filter(c => c.id !== id);
    saveCustomers(updated);
    setCustomers(updated);
    setDeleteConfirm(null);
    setViewCustomer(null);
  }

  function resetForm() {
    setForm({
      name: '', phone: '', email: '', address: '',
      tag: 'Regular', creditLimit: '', notes: '', balance: '0'
    });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === 'all' || c.tag === filterTag;
    return matchSearch && matchTag;
  });

  const totalDebt = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const vipCount = customers.filter(c => c.tag === 'VIP').length;

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Customers
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {customers.length} customers · {vipCount} VIP
            {totalDebt > 0 && (
              <span style={{ color: COLORS.red, fontWeight: 600 }}>
                {' '}· ${totalDebt.toFixed(2)} total debt
              </span>
            )}
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
          + Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: COLORS.info },
          { label: 'VIP Customers', value: vipCount, color: '#B8860B' },
          { label: 'Total Debt Owed', value: `$${totalDebt.toFixed(2)}`, color: COLORS.red },
          { label: 'New This Month', value: customers.filter(c => {
            const d = new Date(c.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, color: COLORS.success },
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search by name, phone or email..."
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
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Tags</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
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
            padding: 28, width: 520, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Full Name *
                </div>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ahmed Al-Rashidi"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Phone *
                </div>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+964 750 000 0000"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Email
                </div>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="customer@email.com"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Address
                </div>
                <input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Sulaymaniyah, Iraq"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tag */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Customer Tag
                </div>
                <select
                  value={form.tag}
                  onChange={e => setForm({ ...form, tag: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Credit Limit */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Credit Limit ($)
                </div>
                <input
                  type="number"
                  value={form.creditLimit}
                  onChange={e => setForm({ ...form, creditLimit: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Balance */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Current Balance ($) — negative means they owe money
                </div>
                <input
                  type="number"
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Notes
                </div>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this customer..."
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
                {editingId ? 'Save Changes' : 'Add Customer'}
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
              Delete Customer?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this customer and all their data.
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

      {/* View Customer Modal */}
      {viewCustomer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14,
            padding: 28, width: 480,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            {/* Customer Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.red}22, ${COLORS.red}11)`,
                border: `2px solid ${COLORS.red}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: COLORS.red,
                fontFamily: 'Georgia, serif'
              }}>
                {viewCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
                  {viewCustomer.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {viewCustomer.tag && (() => {
                    const tc = TAG_COLORS[viewCustomer.tag] || TAG_COLORS.Regular;
                    return (
                      <span style={{
                        background: tc.bg, border: `1px solid ${tc.border}`,
                        color: tc.text, fontSize: 11, fontWeight: 600,
                        padding: '2px 10px', borderRadius: 20
                      }}>
                        {viewCustomer.tag}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <button onClick={() => setViewCustomer(null)} style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: COLORS.textMuted
              }}>✕</button>
            </div>

            {/* Details */}
            <div style={{
              background: COLORS.offWhite, borderRadius: 10,
              padding: 16, marginBottom: 16
            }}>
              {[
                { label: 'Phone', value: viewCustomer.phone },
                { label: 'Email', value: viewCustomer.email || '—' },
                { label: 'Address', value: viewCustomer.address || '—' },
                { label: 'Credit Limit', value: `$${(viewCustomer.creditLimit || 0).toFixed(2)}` },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: `1px solid ${COLORS.border}`
                }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Balance */}
            <div style={{
              background: viewCustomer.balance < 0 ? `${COLORS.red}12` : `${COLORS.success}12`,
              border: `1px solid ${viewCustomer.balance < 0 ? COLORS.red : COLORS.success}44`,
              borderRadius: 10, padding: '14px 18px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Account Balance</div>
                <div style={{
                  fontSize: 22, fontWeight: 800, fontFamily: 'Georgia, serif',
                  color: viewCustomer.balance < 0 ? COLORS.red : COLORS.success
                }}>
                  ${Math.abs(viewCustomer.balance || 0).toFixed(2)}
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: viewCustomer.balance < 0 ? COLORS.red : COLORS.success
              }}>
                {viewCustomer.balance < 0 ? 'OWES MONEY' : 'CREDIT'}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total Purchases', value: viewCustomer.totalPurchases || 0 },
                { label: 'Total Spent', value: `$${(viewCustomer.totalSpent || 0).toFixed(2)}` },
              ].map(s => (
                <div key={s.label} style={{
                  background: COLORS.offWhite, borderRadius: 8,
                  padding: '12px 14px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginTop: 4 }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {viewCustomer.notes && (
              <div style={{
                background: COLORS.offWhite, borderRadius: 8,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: COLORS.charcoalMid, fontStyle: 'italic'
              }}>
                {viewCustomer.notes}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setViewCustomer(null); handleEdit(viewCustomer); }} style={{
                flex: 1, padding: '9px 0', borderRadius: 7,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Edit
              </button>
              <button onClick={() => setDeleteConfirm(viewCustomer.id)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7,
                border: `1px solid ${COLORS.red}44`,
                background: `${COLORS.red}11`, color: COLORS.red,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search ? 'No customers match your search.' : 'No customers yet. Add your first customer!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(customer => {
            const tc = TAG_COLORS[customer.tag] || TAG_COLORS.Regular;
            const hasDebt = customer.balance < 0;
            return (
              <div
                key={customer.id}
                onClick={() => setViewCustomer(customer)}
                style={{
                  background: COLORS.white, borderRadius: 10,
                  border: `1px solid ${hasDebt ? COLORS.red + '44' : COLORS.border}`,
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = hasDebt ? COLORS.red + '44' : COLORS.border}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${COLORS.red}22, ${COLORS.red}11)`,
                  border: `2px solid ${COLORS.red}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: COLORS.red,
                  fontFamily: 'Georgia, serif', flexShrink: 0
                }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>
                      {customer.name}
                    </span>
                    <span style={{
                      background: tc.bg, border: `1px solid ${tc.border}`,
                      color: tc.text, fontSize: 10, fontWeight: 600,
                      padding: '1px 8px', borderRadius: 20
                    }}>
                      {customer.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {[customer.phone, customer.email, customer.address].filter(Boolean).join(' · ')}
                  </div>
                </div>

                {/* Balance */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Balance</div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: hasDebt ? COLORS.red : COLORS.success
                  }}>
                    {hasDebt ? '-' : '+'}${Math.abs(customer.balance || 0).toFixed(2)}
                  </div>
                  {hasDebt && (
                    <div style={{ fontSize: 10, color: COLORS.red, fontWeight: 600 }}>OWES</div>
                  )}
                </div>

                {/* Purchases */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Purchases</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal }}>
                    {customer.totalPurchases || 0}
                  </div>
                </div>

                {/* Edit/Delete */}
                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(customer)} style={{
                    padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(customer.id)} style={{
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