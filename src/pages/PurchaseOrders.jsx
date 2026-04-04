import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getPurchaseOrders, savePurchaseOrders,
  getSuppliers, getProducts, saveProducts,
  generateId
} from '../data/store';

const STATUSES = ['Draft', 'Ordered', 'Received', 'Paid'];

const STATUS_COLORS = {
  Draft: { bg: `${COLORS.steel}33`, border: `${COLORS.steelDark}44`, text: COLORS.charcoalMid },
  Ordered: { bg: `${COLORS.info}15`, border: `${COLORS.info}44`, text: COLORS.info },
  Received: { bg: `${COLORS.warning}15`, border: `${COLORS.warning}44`, text: COLORS.warning },
  Paid: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');

  const [form, setForm] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    status: 'Draft',
    notes: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    productId: '', productName: '', qty: '', costPrice: ''
  });

  useEffect(() => {
    setOrders(getPurchaseOrders());
    setSuppliers(getSuppliers());
    setProducts(getProducts());
  }, []);

  function addItem() {
    if (!newItem.productName.trim()) return alert('Product name is required');
    if (!newItem.qty || newItem.qty <= 0) return alert('Quantity must be greater than 0');
    if (!newItem.costPrice) return alert('Cost price is required');

    setForm(f => ({
      ...f,
      items: [...f.items, {
        id: generateId(),
        productId: newItem.productId,
        productName: newItem.productName,
        qty: parseInt(newItem.qty),
        costPrice: parseFloat(newItem.costPrice),
      }]
    }));
    setNewItem({ productId: '', productName: '', qty: '', costPrice: '' });
  }

  function removeItem(id) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  }

  function handleSave() {
    if (!form.supplierId) return alert('Please select a supplier');
    if (form.items.length === 0) return alert('Please add at least one item');

    const total = form.items.reduce((sum, i) => sum + i.qty * i.costPrice, 0);
    const order = { ...form, total };

    let updated;
    if (editingId) {
      updated = orders.map(o => o.id === editingId ? { ...o, ...order } : o);
    } else {
      updated = [...orders, {
        id: generateId(), ...order,
        createdAt: new Date().toISOString()
      }];
    }
    savePurchaseOrders(updated);
    setOrders(updated);
    resetForm();
  }

  function handleEdit(order) {
    setForm({
      supplierId: order.supplierId,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate || '',
      status: order.status,
      notes: order.notes || '',
      items: order.items || []
    });
    setEditingId(order.id);
    setShowForm(true);
    setViewOrder(null);
  }

  function handleDelete(id) {
    const updated = orders.filter(o => o.id !== id);
    savePurchaseOrders(updated);
    setOrders(updated);
    setDeleteConfirm(null);
    setViewOrder(null);
  }

  function handleStatusChange(id, newStatus) {
    const order = orders.find(o => o.id === id);

    // Auto update stock when marked as Received
    if (newStatus === 'Received' && order.status !== 'Received') {
      const updatedProducts = products.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) return { ...p, stock: p.stock + item.qty };
        return p;
      });
      saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }

    const updated = orders.map(o =>
      o.id === id ? { ...o, status: newStatus, receivedDate: newStatus === 'Received' ? new Date().toISOString().split('T')[0] : o.receivedDate } : o
    );
    savePurchaseOrders(updated);
    setOrders(updated);
    if (viewOrder?.id === id) setViewOrder(updated.find(o => o.id === id));
  }

  function resetForm() {
    setForm({
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      status: 'Draft',
      notes: '',
      items: []
    });
    setNewItem({ productId: '', productName: '', qty: '', costPrice: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || '—';
  }

  const supplierProducts = products.filter(p =>
    form.supplierId ? p.supplierId === form.supplierId : true
  );

  const filtered = orders.filter(o => {
    const matchSearch = getSupplierName(o.supplierId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchSupplier = filterSupplier === 'all' || o.supplierId === filterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const totalOwed = orders
    .filter(o => o.status === 'Received')
    .reduce((sum, o) => sum + o.total, 0);

  const draftCount = orders.filter(o => o.status === 'Draft').length;
  const orderedCount = orders.filter(o => o.status === 'Ordered').length;
  const receivedCount = orders.filter(o => o.status === 'Received').length;
  const paidCount = orders.filter(o => o.status === 'Paid').length;

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Purchase Orders
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {orders.length} orders ·
            <span style={{ color: COLORS.red, fontWeight: 600 }}> ${totalOwed.toFixed(2)} owed to suppliers</span>
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
          + New Purchase Order
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Draft', value: draftCount, color: COLORS.charcoalMid },
          { label: 'Ordered', value: orderedCount, color: COLORS.info },
          { label: 'Received', value: receivedCount, color: COLORS.warning },
          { label: 'Paid', value: paidCount, color: COLORS.success },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => setFilterStatus(card.label)}
            style={{
              background: COLORS.white, borderRadius: 10,
              border: `1px solid ${filterStatus === card.label ? card.color : COLORS.border}`,
              padding: '14px 16px', cursor: 'pointer',
              borderTop: `3px solid ${card.color}`,
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
          placeholder="Search by supplier..."
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
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
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
            padding: 28, width: 620, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Purchase Order' : 'New Purchase Order'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

              {/* Supplier */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Supplier *
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
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Order Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Order Date
                </div>
                <input
                  type="date"
                  value={form.orderDate}
                  onChange={e => setForm({ ...form, orderDate: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Expected Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Expected Delivery Date
                </div>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={e => setForm({ ...form, expectedDate: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
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

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Notes
                </div>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes for this order..."
                  rows={2}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Items Section */}
            <div style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: 16, marginBottom: 16
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
                Order Items
              </div>

              {/* Add Item Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 12 }}>
                <select
                  value={newItem.productId}
                  onChange={e => {
                    const product = products.find(p => p.id === e.target.value);
                    setNewItem({
                      ...newItem,
                      productId: e.target.value,
                      productName: product?.name || '',
                      costPrice: product?.costPrice || ''
                    });
                  }}
                  style={{
                    padding: '8px 10px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 12, color: COLORS.charcoal,
                    outline: 'none', background: COLORS.white
                  }}
                >
                  <option value="">Select product...</option>
                  {supplierProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={newItem.qty}
                  onChange={e => setNewItem({ ...newItem, qty: e.target.value })}
                  style={{
                    padding: '8px 10px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 12, outline: 'none'
                  }}
                />
                <input
                  type="number"
                  placeholder="Cost $"
                  value={newItem.costPrice}
                  onChange={e => setNewItem({ ...newItem, costPrice: e.target.value })}
                  style={{
                    padding: '8px 10px', border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, fontSize: 12, outline: 'none'
                  }}
                />
                <button
                  onClick={addItem}
                  style={{
                    padding: '8px 14px', borderRadius: 7, border: 'none',
                    background: COLORS.charcoal, color: COLORS.white,
                    fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  + Add
                </button>
              </div>

              {/* Manual product name if not in list */}
              <input
                placeholder="Or type product name manually..."
                value={newItem.productName}
                onChange={e => setNewItem({ ...newItem, productName: e.target.value, productId: '' })}
                style={{
                  width: '100%', padding: '8px 12px', marginBottom: 12,
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 12, color: COLORS.charcoal, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Items List */}
              {form.items.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '20px 0',
                  color: COLORS.textMuted, fontSize: 13,
                  border: `1px dashed ${COLORS.border}`, borderRadius: 8
                }}>
                  No items added yet
                </div>
              ) : (
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: COLORS.offWhite }}>
                        {['Product', 'Qty', 'Cost', 'Total', ''].map(h => (
                          <th key={h} style={{
                            padding: '8px 12px', textAlign: h === 'Product' ? 'left' : 'right',
                            color: COLORS.textMuted, fontWeight: 600, fontSize: 11
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={item.id} style={{
                          borderTop: `1px solid ${COLORS.border}`,
                          background: i % 2 === 0 ? COLORS.white : `${COLORS.offWhite}66`
                        }}>
                          <td style={{ padding: '8px 12px', color: COLORS.charcoal }}>{item.productName}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.charcoal }}>{item.qty}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.charcoal }}>${item.costPrice.toFixed(2)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: COLORS.charcoal }}>
                            ${(item.qty * item.costPrice).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button onClick={() => removeItem(item.id)} style={{
                              background: 'none', border: 'none',
                              color: COLORS.red, cursor: 'pointer', fontSize: 14
                            }}>✕</button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: `2px solid ${COLORS.border}`, background: COLORS.offWhite }}>
                        <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: COLORS.charcoal }}>
                          Total
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: COLORS.charcoal, fontSize: 15 }}>
                          ${form.items.reduce((sum, i) => sum + i.qty * i.costPrice, 0).toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
                {editingId ? 'Save Changes' : 'Create Order'}
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
              Delete Purchase Order?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this purchase order.
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

      {/* View Order Modal */}
      {viewOrder && (
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
                  PO #{viewOrder.id.slice(-6).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {new Date(viewOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setViewOrder(null)} style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: COLORS.textMuted
              }}>✕</button>
            </div>

            {/* Status Buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>
                Update Status
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUSES.map(s => {
                  const sc = STATUS_COLORS[s];
                  const isActive = viewOrder.status === s;
                  return (
                    <button key={s} onClick={() => handleStatusChange(viewOrder.id, s)} style={{
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${isActive ? sc.text : COLORS.border}`,
                      background: isActive ? sc.bg : COLORS.white,
                      color: isActive ? sc.text : COLORS.charcoalMid,
                      fontSize: 12, fontWeight: isActive ? 600 : 400
                    }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {viewOrder.status === 'Received' && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: COLORS.success,
                  fontWeight: 600, background: `${COLORS.success}12`,
                  padding: '6px 12px', borderRadius: 6,
                  border: `1px solid ${COLORS.success}33`
                }}>
                  ✅ Stock has been automatically updated for linked products
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{
              background: COLORS.offWhite, borderRadius: 10,
              padding: 16, marginBottom: 16
            }}>
              {[
                { label: 'Supplier', value: getSupplierName(viewOrder.supplierId) },
                { label: 'Order Date', value: new Date(viewOrder.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                viewOrder.expectedDate && { label: 'Expected', value: new Date(viewOrder.expectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                viewOrder.receivedDate && { label: 'Received On', value: new Date(viewOrder.receivedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`
                }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 10 }}>
                Items
              </div>
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      {['Product', 'Qty', 'Cost', 'Total'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: h === 'Product' ? 'left' : 'right',
                          color: COLORS.textMuted, fontWeight: 600, fontSize: 11
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items?.map((item, i) => (
                      <tr key={item.id} style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        background: i % 2 === 0 ? COLORS.white : `${COLORS.offWhite}66`
                      }}>
                        <td style={{ padding: '8px 12px', color: COLORS.charcoal }}>{item.productName}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>${item.costPrice.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                          ${(item.qty * item.costPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${COLORS.border}`, background: COLORS.offWhite }}>
                      <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: COLORS.charcoal }}>
                        Total
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: COLORS.charcoal, fontSize: 16 }}>
                        ${viewOrder.total?.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {viewOrder.notes && (
              <div style={{
                background: COLORS.offWhite, borderRadius: 8,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: COLORS.charcoalMid, fontStyle: 'italic'
              }}>
                {viewOrder.notes}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleEdit(viewOrder)} style={{
                flex: 1, padding: '9px 0', borderRadius: 7,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Edit
              </button>
              <button onClick={() => setDeleteConfirm(viewOrder.id)} style={{
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

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search || filterStatus !== 'all' || filterSupplier !== 'all'
            ? 'No orders match your filters.'
            : 'No purchase orders yet. Create your first order!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Draft;
            return (
              <div
                key={order.id}
                onClick={() => setViewOrder(order)}
                style={{
                  background: COLORS.white, borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.red + '66'}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                {/* PO Number */}
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: `${COLORS.charcoal}12`,
                  border: `1px solid ${COLORS.charcoal}22`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 600 }}>PO</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.charcoal }}>
                    {order.id.slice(-4).toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>
                      {getSupplierName(order.supplierId)}
                    </span>
                    <span style={{
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      color: sc.text, fontSize: 10, fontWeight: 600,
                      padding: '1px 8px', borderRadius: 20
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {order.items?.length || 0} items ·
                    Ordered: {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {order.expectedDate && ` · Expected: ${new Date(order.expectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>

                {/* Total */}
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
                    ${order.total?.toFixed(2)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(order)} style={{
                    padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(order.id)} style={{
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