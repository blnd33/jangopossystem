import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { getProducts, saveProducts, getSuppliers, getCategories, generateId } from '../data/store';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', supplierId: '', categoryId: '',
    costPrice: '', sellPrice: '', stock: '',
    lowStockAlert: '5', sku: '', description: '', photo: ''
  });

  useEffect(() => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
    setCategories(getCategories());
  }, []);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.name.trim()) return alert('Product name is required');
    if (!form.supplierId) return alert('Please select a supplier');
    if (!form.categoryId) return alert('Please select a category');
    if (!form.costPrice) return alert('Cost price is required');
    if (!form.sellPrice) return alert('Sell price is required');
    if (!form.stock) return alert('Stock quantity is required');

    const product = {
      ...form,
      costPrice: parseFloat(form.costPrice),
      sellPrice: parseFloat(form.sellPrice),
      stock: parseInt(form.stock),
      lowStockAlert: parseInt(form.lowStockAlert),
    };

    let updated;
    if (editingId) {
      updated = products.map(p => p.id === editingId ? { ...p, ...product } : p);
    } else {
      updated = [...products, { id: generateId(), ...product, createdAt: new Date().toISOString() }];
    }
    saveProducts(updated);
    setProducts(updated);
    resetForm();
  }

  function handleEdit(product) {
    setForm({
      name: product.name,
      supplierId: product.supplierId,
      categoryId: product.categoryId,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert || '5',
      sku: product.sku || '',
      description: product.description || '',
      photo: product.photo || ''
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
    setProducts(updated);
    setDeleteConfirm(null);
  }

  function resetForm() {
    setForm({
      name: '', supplierId: '', categoryId: '',
      costPrice: '', sellPrice: '', stock: '',
      lowStockAlert: '5', sku: '', description: '', photo: ''
    });
    setEditingId(null);
    setShowForm(false);
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || 'Unknown';
  }

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || 'Unknown';
  }

  function getMargin(cost, sell) {
    if (!cost || !sell) return 0;
    return (((sell - cost) / sell) * 100).toFixed(1);
  }

  const filteredCategories = categories.filter(c =>
    form.supplierId ? c.supplierId === form.supplierId : true
  );

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchSupplier = filterSupplier === 'all' || p.supplierId === filterSupplier;
    const matchCategory = filterCategory === 'all' || p.categoryId === filterCategory;
    return matchSearch && matchSupplier && matchCategory;
  });

  const lowStockCount = products.filter(p => p.stock <= p.lowStockAlert).length;

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Products & Inventory
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {products.length} products · {lowStockCount > 0 && (
              <span style={{ color: COLORS.warning, fontWeight: 600 }}>
                {lowStockCount} low stock
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, overflow: 'hidden'
          }}>
            {['grid', 'list'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer',
                background: viewMode === mode ? COLORS.charcoal : COLORS.white,
                color: viewMode === mode ? COLORS.white : COLORS.charcoalMid,
                fontSize: 12, fontWeight: 500
              }}>
                {mode === 'grid' ? '⊞ Grid' : '☰ List'}
              </button>
            ))}
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
            + Add Product
          </button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStockCount > 0 && (
        <div style={{
          background: `${COLORS.warning}15`, border: `1px solid ${COLORS.warning}44`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: COLORS.warning, fontWeight: 500
        }}>
          ⚠️ {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search by name or SKU..."
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
          onChange={e => { setFilterSupplier(e.target.value); setFilterCategory('all'); }}
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
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{
            padding: '10px 14px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 13, color: COLORS.charcoal,
            outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          {categories
            .filter(c => filterSupplier === 'all' || c.supplierId === filterSupplier)
            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14,
            padding: 28, width: 580, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: COLORS.charcoal,
              marginBottom: 20, fontFamily: 'Georgia, serif'
            }}>
              {editingId ? 'Edit Product' : 'Add New Product'}
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: 18, textAlign: 'center' }}>
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  width: 120, height: 120, borderRadius: 10, margin: '0 auto',
                  border: `2px dashed ${COLORS.border}`,
                  background: COLORS.offWhite,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', position: 'relative'
                }}
              >
                {form.photo ? (
                  <img src={form.photo} alt="product"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>Click to upload</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handlePhoto} style={{ display: 'none' }} />
              {form.photo && (
                <button onClick={() => setForm(f => ({ ...f, photo: '' }))}
                  style={{
                    marginTop: 6, fontSize: 11, color: COLORS.red,
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}>
                  Remove photo
                </button>
              )}
            </div>

            {/* 2 column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Product Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Product Name *
                </div>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Royal Leather Sofa 3-Seater"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Supplier */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Supplier *
                </div>
                <select
                  value={form.supplierId}
                  onChange={e => setForm({ ...form, supplierId: e.target.value, categoryId: '' })}
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

              {/* Category */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Category *
                </div>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    background: COLORS.white, boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select category...</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Cost Price */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Cost Price (bought for) *
                </div>
                <input
                  type="number" value={form.costPrice}
                  onChange={e => setForm({ ...form, costPrice: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sell Price */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Sell Price (selling for) *
                </div>
                <input
                  type="number" value={form.sellPrice}
                  onChange={e => setForm({ ...form, sellPrice: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Margin preview */}
              {form.costPrice && form.sellPrice && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{
                    background: parseFloat(form.sellPrice) > parseFloat(form.costPrice)
                      ? `${COLORS.success}15` : `${COLORS.red}15`,
                    border: `1px solid ${parseFloat(form.sellPrice) > parseFloat(form.costPrice)
                      ? COLORS.success : COLORS.red}44`,
                    borderRadius: 7, padding: '8px 14px',
                    fontSize: 12, fontWeight: 600,
                    color: parseFloat(form.sellPrice) > parseFloat(form.costPrice)
                      ? COLORS.success : COLORS.red
                  }}>
                    Profit Margin: {getMargin(parseFloat(form.costPrice), parseFloat(form.sellPrice))}%
                    · Profit per unit: ${(parseFloat(form.sellPrice) - parseFloat(form.costPrice)).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Stock Quantity *
                </div>
                <input
                  type="number" value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Low Stock Alert */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Low Stock Alert At
                </div>
                <input
                  type="number" value={form.lowStockAlert}
                  onChange={e => setForm({ ...form, lowStockAlert: e.target.value })}
                  placeholder="5"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* SKU */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  SKU / Product Code
                </div>
                <input
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. SOF-001"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  Description
                </div>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description..."
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

            {/* Buttons */}
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
                {editingId ? 'Save Changes' : 'Add Product'}
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
              Delete Product?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
              This will permanently delete this product from inventory.
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

      {/* Products — Grid View */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: COLORS.textMuted, fontSize: 14
        }}>
          {search ? 'No products match your search.' : 'No products yet. Add your first product!'}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16
        }}>
          {filtered.map(product => {
            const isLow = product.stock <= product.lowStockAlert;
            const margin = getMargin(product.costPrice, product.sellPrice);
            return (
              <div key={product.id} style={{
                background: COLORS.white, borderRadius: 12,
                border: `1px solid ${isLow ? COLORS.warning + '66' : COLORS.border}`,
                overflow: 'hidden',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Product Image */}
                <div style={{
                  height: 160, background: COLORS.offWhite,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden'
                }}>
                  {product.photo ? (
                    <img src={product.photo} alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 40, opacity: 0.3 }}>🛋️</div>
                  )}
                  {isLow && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: COLORS.warning, color: COLORS.white,
                      fontSize: 10, fontWeight: 700, padding: '3px 8px',
                      borderRadius: 4
                    }}>
                      LOW STOCK
                    </div>
                  )}
                  {product.sku && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(0,0,0,0.6)', color: COLORS.white,
                      fontSize: 10, padding: '2px 7px', borderRadius: 4
                    }}>
                      {product.sku}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: COLORS.charcoal,
                    marginBottom: 4, lineHeight: 1.3
                  }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                    {getSupplierName(product.supplierId)} · {getCategoryName(product.categoryId)}
                  </div>

                  {/* Prices */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>Cost</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid }}>
                        ${product.costPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, color: COLORS.border }}>→</div>
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>Sell</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal }}>
                        ${product.sellPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      background: `${COLORS.success}15`,
                      border: `1px solid ${COLORS.success}33`,
                      borderRadius: 5, padding: '3px 7px',
                      fontSize: 11, fontWeight: 700, color: COLORS.success
                    }}>
                      {margin}%
                    </div>
                  </div>

                  {/* Stock */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 12,
                    padding: '6px 10px', borderRadius: 6,
                    background: isLow ? `${COLORS.warning}12` : COLORS.offWhite
                  }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>In Stock</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isLow ? COLORS.warning : COLORS.success
                    }}>
                      {product.stock} units
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(product)} style={{
                      flex: 1, padding: '7px 0', borderRadius: 6,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white, color: COLORS.charcoalMid,
                      fontSize: 12, cursor: 'pointer', fontWeight: 500
                    }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(product.id)} style={{
                      flex: 1, padding: '7px 0', borderRadius: 6,
                      border: `1px solid ${COLORS.red}44`,
                      background: `${COLORS.red}11`, color: COLORS.red,
                      fontSize: 12, cursor: 'pointer', fontWeight: 500
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(product => {
            const isLow = product.stock <= product.lowStockAlert;
            const margin = getMargin(product.costPrice, product.sellPrice);
            return (
              <div key={product.id} style={{
                background: COLORS.white, borderRadius: 10,
                border: `1px solid ${isLow ? COLORS.warning + '66' : COLORS.border}`,
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                {/* Thumb */}
                <div style={{
                  width: 56, height: 56, borderRadius: 8,
                  background: COLORS.offWhite, flexShrink: 0,
                  overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {product.photo
                    ? <img src={product.photo} alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, opacity: 0.3 }}>🛋️</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal }}>
                    {product.name}
                    {product.sku && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, color: COLORS.textMuted,
                        background: COLORS.offWhite, padding: '2px 6px', borderRadius: 4
                      }}>
                        {product.sku}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                    {getSupplierName(product.supplierId)} · {getCategoryName(product.categoryId)}
                  </div>
                </div>

                {/* Prices */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Cost / Sell</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                    ${product.costPrice.toFixed(2)} → ${product.sellPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>
                    {margin}% margin
                  </div>
                </div>

                {/* Stock */}
                <div style={{
                  textAlign: 'center', padding: '6px 14px',
                  background: isLow ? `${COLORS.warning}12` : `${COLORS.success}12`,
                  borderRadius: 7, minWidth: 80
                }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Stock</div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: isLow ? COLORS.warning : COLORS.success
                  }}>
                    {product.stock}
                  </div>
                  {isLow && <div style={{ fontSize: 9, color: COLORS.warning }}>LOW</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(product)} style={{
                    padding: '7px 16px', borderRadius: 7,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, color: COLORS.charcoalMid,
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(product.id)} style={{
                    padding: '7px 16px', borderRadius: 7,
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