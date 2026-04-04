import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSuppliers, getCategories, saveCategories, generateId } from '../data/store';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', supplierId: '', description: '' });

  useEffect(() => {
    setCategories(getCategories());
    setSuppliers(getSuppliers());
  }, []);

  function handleSave() {
    if (!form.name.trim()) return alert('Category name is required');
    if (!form.supplierId) return alert('Please select a supplier');
    let updated;
    if (editingId) {
      updated = categories.map(c => c.id === editingId ? { ...c, ...form } : c);
    } else {
      updated = [...categories, {
        id: generateId(), ...form,
        createdAt: new Date().toISOString()
      }];
    }
    saveCategories(updated);
    setCategories(updated);
    resetForm();
  }

  function handleEdit(cat) {
    setForm({ name: cat.name, supplierId: cat.supplierId, description: cat.description || '' });
    setEditingId(cat.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
    setCategories(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({ name: '', supplierId: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || 'Unknown';
  }

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchSupplier = selectedSupplier === 'all' || c.supplierId === selectedSupplier;
    return matchSearch && matchSupplier;
  });

  const grouped = suppliers.map(s => ({
    supplier: s,
    cats: filtered.filter(c => c.supplierId === s.id)
  })).filter(g => selectedSupplier === 'all' ? g.cats.length > 0 : g.supplier.id === selectedSupplier);

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Categories
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} across {suppliers.length} suppliers
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
          + Add Category
        </button>
      </div>

      {/* No suppliers warning */}
      {suppliers.length === 0 && (
        <div style={{
          background: `${COLORS.warning}15`, border: `1px solid ${COLORS.warning}44`,
          borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          fontSize: 13, color: COLORS.warning, fontWeight: 500
        }}>
          ⚠️ No suppliers found. Please add suppliers first before creating categories.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search categories..."
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
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Suppliers</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 12,
            padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Category' : 'Add New Category'}
            </div>

            <div style={{ marginBottom: 14 }}>
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
                <option value="">Select a supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                Category Name *
              </div>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sofas, Beds, Dining Tables..."
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                Description
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description..."
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
                  padding: '9px 20px', borderRadius: 7,
                  border: `1px solid ${COLORS.border}`,
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
                {editingId ? 'Save Changes' : 'Add Category'}
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
              Delete Category?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this category. Products under it will be uncategorized.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '9px 24px', borderRadius: 7,
                  border: `1px solid ${COLORS.border}`,
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

      {/* Categories grouped by supplier */}
      {categories.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          No categories yet. Add your first category!
        </div>
      ) : grouped.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          No categories match your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {grouped.map(({ supplier, cats }) => (
            <div key={supplier.id} style={{
              background: COLORS.white, borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              {/* Supplier Header */}
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(90deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${COLORS.red}33`,
                  border: `2px solid ${COLORS.red}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: COLORS.red
                }}>
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.white }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.steelDark }}>
                    {cats.length} categor{cats.length !== 1 ? 'ies' : 'y'}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {cats.map(cat => (
                  <div key={cat.id} style={{
                    background: COLORS.offWhite,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    minWidth: 160
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: COLORS.red, flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                        {cat.name}
                      </div>
                      {cat.description && (
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                          {cat.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleEdit(cat)}
                        style={{
                          padding: '4px 10px', borderRadius: 5,
                          border: `1px solid ${COLORS.border}`,
                          background: COLORS.white, color: COLORS.charcoalMid,
                          fontSize: 11, cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 5,
                          border: `1px solid ${COLORS.red}44`,
                          background: `${COLORS.red}11`, color: COLORS.red,
                          fontSize: 11, cursor: 'pointer'
                        }}
                      >
                        Del
                      </button>
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