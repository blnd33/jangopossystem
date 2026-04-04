import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSuppliers, saveSuppliers, generateId } from '../data/store';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', notes: ''
  });
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    setSuppliers(getSuppliers());
  }, []);

  function handleSave() {
    if (!form.name.trim()) return alert('Supplier name is required');
    let updated;
    if (editingId) {
      updated = suppliers.map(s => s.id === editingId ? { ...s, ...form } : s);
    } else {
      updated = [...suppliers, { id: generateId(), ...form, createdAt: new Date().toISOString() }];
    }
    saveSuppliers(updated);
    setSuppliers(updated);
    resetForm();
  }

  function handleEdit(supplier) {
    setForm({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes
    });
    setEditingId(supplier.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = suppliers.filter(s => s.id !== id);
    saveSuppliers(updated);
    setSuppliers(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Suppliers
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} registered
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
          + Add Supplier
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search suppliers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 20,
          border: `1px solid ${COLORS.border}`, borderRadius: 8,
          fontSize: 13, color: COLORS.charcoal, outline: 'none',
          background: COLORS.white
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 12,
            padding: 28, width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: 'Georgia, serif' }}>
              {editingId ? 'Edit Supplier' : 'Add New Supplier'}
            </div>

            {[
              { label: 'Supplier Name *', key: 'name', placeholder: 'e.g. Al-Rashid Furniture Co.' },
              { label: 'Phone Number', key: 'phone', placeholder: 'e.g. +964 750 000 0000' },
              { label: 'Email', key: 'email', placeholder: 'e.g. contact@supplier.com' },
              { label: 'Address', key: 'address', placeholder: 'e.g. Baghdad, Iraq' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  {field.label}
                </div>
                <input
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                Notes
              </div>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                  background: COLORS.white, color: COLORS.charcoalMid,
                  fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '9px 24px', borderRadius: 7, border: 'none',
                  background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                  color: COLORS.white, fontSize: 13, cursor: 'pointer',
                  fontWeight: 600, boxShadow: `0 2px 8px ${COLORS.red}44`
                }}
              >
                {editingId ? 'Save Changes' : 'Add Supplier'}
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
              Delete Supplier?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this supplier. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`,
                  background: COLORS.white, color: COLORS.charcoalMid,
                  fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: '9px 24px', borderRadius: 7, border: 'none',
                  background: COLORS.red, color: COLORS.white,
                  fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search ? 'No suppliers match your search.' : 'No suppliers yet. Add your first supplier!'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={{
              background: COLORS.white, borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${COLORS.red}22, ${COLORS.red}11)`,
                  border: `2px solid ${COLORS.red}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: COLORS.red,
                  fontFamily: 'Georgia, serif'
                }}>
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {[supplier.phone, supplier.email, supplier.address].filter(Boolean).join(' · ')}
                  </div>
                  {supplier.notes && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' }}>
                      {supplier.notes}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEdit(supplier)}
                  style={{
                    padding: '7px 16px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(supplier.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 7,
                    border: `1px solid ${COLORS.red}44`,
                    background: `${COLORS.red}11`, color: COLORS.red,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}