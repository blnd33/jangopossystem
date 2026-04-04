import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getDeliveries, saveDeliveries, getCustomers, getEmployees, getSales, generateId } from '../data/store';

const STATUSES = ['Pending', 'Out for Delivery', 'Delivered', 'Failed'];

const STATUS_COLORS = {
  Pending: { bg: `${COLORS.warning}15`, border: `${COLORS.warning}44`, text: COLORS.warning },
  'Out for Delivery': { bg: `${COLORS.info}15`, border: `${COLORS.info}44`, text: COLORS.info },
  Delivered: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
  Failed: { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red },
};

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sales, setSales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewDelivery, setViewDelivery] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    address: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    driverId: '',
    status: 'Pending',
    installationRequired: false,
    installationStatus: 'Not Required',
    saleId: '',
    items: '',
    notes: '',
    deliveredDate: ''
  });

  useEffect(() => {
    setDeliveries(getDeliveries());
    setCustomers(getCustomers());
    setEmployees(getEmployees().filter(e => e.status === 'Active'));
    setSales(getSales());
  }, []);

  function handleSave() {
    if (!form.customerName.trim()) return alert('Customer name is required');
    if (!form.address.trim()) return alert('Delivery address is required');
    if (!form.scheduledDate) return alert('Scheduled date is required');

    let updated;
    if (editingId) {
      updated = deliveries.map(d => d.id === editingId ? { ...d, ...form } : d);
    } else {
      updated = [...deliveries, {
        id: generateId(), ...form,
        createdAt: new Date().toISOString()
      }];
    }
    saveDeliveries(updated);
    setDeliveries(updated);
    resetForm();
  }

  function handleEdit(delivery) {
    setForm({
      customerId: delivery.customerId || '',
      customerName: delivery.customerName,
      address: delivery.address,
      scheduledDate: delivery.scheduledDate,
      driverId: delivery.driverId || '',
      status: delivery.status,
      installationRequired: delivery.installationRequired || false,
      installationStatus: delivery.installationStatus || 'Not Required',
      saleId: delivery.saleId || '',
      items: delivery.items || '',
      notes: delivery.notes || '',
      deliveredDate: delivery.deliveredDate || ''
    });
    setEditingId(delivery.id);
    setShowForm(true);
    setViewDelivery(null);
  }

  function handleDelete(id) {
    const updated = deliveries.filter(d => d.id !== id);
    saveDeliveries(updated);
    setDeliveries(updated);
    setDeleteConfirm(null);
    setViewDelivery(null);
  }

  function handleStatusChange(id, newStatus) {
    const updated = deliveries.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: newStatus,
          deliveredDate: newStatus === 'Delivered' ? new Date().toISOString().split('T')[0] : d.deliveredDate
        };
      }
      return d;
    });
    saveDeliveries(updated);
    setDeliveries(updated);
    if (viewDelivery?.id === id) {
      setViewDelivery(updated.find(d => d.id === id));
    }
  }

  function resetForm() {
    setForm({
      customerId: '', customerName: '', address: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      driverId: '', status: 'Pending',
      installationRequired: false, installationStatus: 'Not Required',
      saleId: '', items: '', notes: '', deliveredDate: ''
    });
    setEditingId(null);
    setShowForm(false);
  }

  function getDriverName(id) {
    return employees.find(e => e.id === id)?.name || '—';
  }

  const filtered = deliveries.filter(d => {
    const matchSearch =
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = deliveries.filter(d => d.status === 'Pending').length;
  const outCount = deliveries.filter(d => d.status === 'Out for Delivery').length;
  const deliveredCount = deliveries.filter(d => d.status === 'Delivered').length;
  const failedCount = deliveries.filter(d => d.status === 'Failed').length;

  const drivers = employees.filter(e => e.role === 'Driver' || e.role === 'Other' || e.role === 'Manager');

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Delivery & Installation
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {deliveries.length} total deliveries · {pendingCount} pending
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
          + New Delivery
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending', value: pendingCount, color: COLORS.warning },
          { label: 'Out for Delivery', value: outCount, color: COLORS.info },
          { label: 'Delivered', value: deliveredCount, color: COLORS.success },
          { label: 'Failed', value: failedCount, color: COLORS.red },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => setFilterStatus(card.label)}
            style={{
              background: COLORS.white, borderRadius: 10,
              border: `1px solid ${filterStatus === card.label ? card.color : COLORS.border}`,
              padding: '14px 16px', cursor: 'pointer',
              borderTop: `3px solid ${card.color}`,
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search by customer or address..."
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
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
            padding: 28, width: 540, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Delivery' : 'New Delivery Order'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Customer */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Customer Name *
                </div>
                <select
                  value={form.customerId}
                  onChange={e => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setForm({
                      ...form,
                      customerId: e.target.value,
                      customerName: customer?.name || '',
                      address: customer?.address || form.address
                    });
                  }}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select customer or type below...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
                <input
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Or type customer name manually..."
                  style={{
                    width: '100%', padding: '9px 12px', marginTop: 6,
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Delivery Address *
                </div>
                <input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Full delivery address..."
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Scheduled Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Scheduled Date *
                </div>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Driver */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Assign Driver
                </div>
                <select
                  value={form.driverId}
                  onChange={e => setForm({ ...form, driverId: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  <option value="">No driver assigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Status
                </div>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Items */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Items to Deliver
                </div>
                <input
                  value={form.items}
                  onChange={e => setForm({ ...form, items: e.target.value })}
                  placeholder="e.g. 1x Royal Sofa, 2x Dining Chair..."
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Installation */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    id="installation"
                    checked={form.installationRequired}
                    onChange={e => setForm({
                      ...form,
                      installationRequired: e.target.checked,
                      installationStatus: e.target.checked ? 'Pending' : 'Not Required'
                    })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="installation" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                    Installation Required
                  </label>
                </div>
                {form.installationRequired && (
                  <select
                    value={form.installationStatus}
                    onChange={e => setForm({ ...form, installationStatus: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: `1px solid ${COLORS.border}`, borderRadius: 7,
                      fontSize: 13, color: COLORS.charcoal, outline: 'none',
                      background: COLORS.white, boxSizing: 'border-box'
                    }}
                  >
                    <option value="Pending">Installation Pending</option>
                    <option value="Scheduled">Installation Scheduled</option>
                    <option value="Completed">Installation Completed</option>
                  </select>
                )}
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Notes
                </div>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any delivery notes or special instructions..."
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
                {editingId ? 'Save Changes' : 'Create Delivery'}
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
              Delete Delivery?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this delivery record.
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

      {/* View Delivery Modal */}
      {viewDelivery && (
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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
                  Delivery #{viewDelivery.id.slice(-6).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {new Date(viewDelivery.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setViewDelivery(null)} style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: COLORS.textMuted
              }}>✕</button>
            </div>

            {/* Status buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>
                Update Status
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => {
                  const sc = STATUS_COLORS[s];
                  const isActive = viewDelivery.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(viewDelivery.id, s)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${isActive ? sc.text : COLORS.border}`,
                        background: isActive ? sc.bg : COLORS.white,
                        color: isActive ? sc.text : COLORS.charcoalMid,
                        fontSize: 12, fontWeight: isActive ? 600 : 400
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div style={{
              background: COLORS.offWhite, borderRadius: 10,
              padding: 16, marginBottom: 16
            }}>
              {[
                { label: 'Customer', value: viewDelivery.customerName },
                { label: 'Address', value: viewDelivery.address },
                { label: 'Scheduled', value: new Date(viewDelivery.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Driver', value: viewDelivery.driverId ? getDriverName(viewDelivery.driverId) : '—' },
                { label: 'Items', value: viewDelivery.items || '—' },
                viewDelivery.deliveredDate && { label: 'Delivered On', value: new Date(viewDelivery.deliveredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`
                }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal, maxWidth: '60%', textAlign: 'right' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Installation */}
            {viewDelivery.installationRequired && (
              <div style={{
                background: `${COLORS.info}12`,
                border: `1px solid ${COLORS.info}33`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.info }}>
                  Installation Required
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: viewDelivery.installationStatus === 'Completed' ? COLORS.success : COLORS.warning
                }}>
                  {viewDelivery.installationStatus}
                </span>
              </div>
            )}

            {viewDelivery.notes && (
              <div style={{
                background: COLORS.offWhite, borderRadius: 8,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: COLORS.charcoalMid, fontStyle: 'italic'
              }}>
                {viewDelivery.notes}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleEdit(viewDelivery)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Edit
              </button>
              <button onClick={() => setDeleteConfirm(viewDelivery.id)} style={{
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

      {/* Delivery List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search || filterStatus !== 'all'
            ? 'No deliveries match your filters.'
            : 'No deliveries yet. Create your first delivery order!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map(delivery => {
            const sc = STATUS_COLORS[delivery.status] || STATUS_COLORS.Pending;
            const isOverdue = delivery.status === 'Pending' &&
              new Date(delivery.scheduledDate) < new Date();
            return (
              <div
                key={delivery.id}
                onClick={() => setViewDelivery(delivery)}
                style={{
                  background: COLORS.white, borderRadius: 10,
                  border: `1px solid ${isOverdue ? COLORS.red + '66' : COLORS.border}`,
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue ? COLORS.red + '66' : COLORS.border}
              >
                {/* Status indicator */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>
                  {delivery.status === 'Delivered' ? '✅' :
                    delivery.status === 'Out for Delivery' ? '🚚' :
                      delivery.status === 'Failed' ? '❌' : '📦'}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>
                      {delivery.customerName}
                    </span>
                    <span style={{
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      color: sc.text, fontSize: 10, fontWeight: 600,
                      padding: '1px 8px', borderRadius: 20
                    }}>
                      {delivery.status}
                    </span>
                    {isOverdue && (
                      <span style={{
                        background: `${COLORS.red}15`, border: `1px solid ${COLORS.red}44`,
                        color: COLORS.red, fontSize: 10, fontWeight: 600,
                        padding: '1px 8px', borderRadius: 20
                      }}>
                        OVERDUE
                      </span>
                    )}
                    {delivery.installationRequired && (
                      <span style={{
                        background: `${COLORS.info}15`, border: `1px solid ${COLORS.info}44`,
                        color: COLORS.info, fontSize: 10, fontWeight: 600,
                        padding: '1px 8px', borderRadius: 20
                      }}>
                        INSTALLATION
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {delivery.address}
                    {delivery.driverId && ` · Driver: ${getDriverName(delivery.driverId)}`}
                  </div>
                  {delivery.items && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      {delivery.items}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Scheduled</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? COLORS.red : COLORS.charcoal }}>
                    {new Date(delivery.scheduledDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short'
                    })}
                  </div>
                </div>

                {/* Quick status change */}
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(delivery)} style={{
                    padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(delivery.id)} style={{
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