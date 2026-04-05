import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getProducts, saveProducts, getCustomers, saveCustomers,
  getSales, saveSales, generateId
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

export default function POS() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('%');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setProducts(getProducts());
    setCustomers(getCustomers());
    setCategories(JSON.parse(localStorage.getItem('jango_categories') || '[]'));
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const discountAmount = discount
    ? discountType === '%'
      ? (subtotal * parseFloat(discount)) / 100
      : parseFloat(discount)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;
  const remaining = amountPaid ? Math.max(0, total - parseFloat(amountPaid)) : total;

  function addToCart(product) {
    if (product.stock <= 0) return alert(t('outOfStock'));
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return alert(t('lowStockAlert')) || prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, itemDiscount: 0 }];
    });
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id);
    const product = products.find(p => p.id === id);
    if (qty > product.stock) return alert(t('lowStockAlert'));
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function updateItemDiscount(id, val) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, itemDiscount: parseFloat(val) || 0 } : i));
  }

  function handleCheckout() {
    if (cart.length === 0) return alert(t('emptyCart'));
    if (!amountPaid && paymentMethod !== 'installment') return alert(t('amountPaid'));

    const sale = {
      id: generateId(), date: new Date().toISOString(),
      items: cart.map(i => ({
        id: i.id, name: i.name, qty: i.qty,
        costPrice: i.costPrice, sellPrice: i.sellPrice,
        itemDiscount: i.itemDiscount || 0
      })),
      subtotal, discountAmount, total,
      amountPaid: parseFloat(amountPaid) || 0,
      change, remaining, paymentMethod,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || t('walkIn'),
      note,
    };

    const updatedProducts = products.map(p => {
      const cartItem = cart.find(i => i.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });
    saveProducts(updatedProducts);
    setProducts(updatedProducts);

    if (selectedCustomer) {
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + 1,
            totalSpent: (c.totalSpent || 0) + total,
            balance: remaining > 0 ? (c.balance || 0) - remaining : c.balance || 0
          };
        }
        return c;
      });
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    }

    const sales = getSales();
    saveSales([...sales, sale]);
    setReceipt(sale);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount('');
    setAmountPaid('');
    setNote('');
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory;
    return matchSearch && matchCat && p.stock > 0;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (receipt) {
    return (
      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
        <div style={{
          background: COLORS.white, borderRadius: 14,
          border: `1px solid ${COLORS.border}`, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          {/* Receipt Header */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
            padding: '24px 28px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', letterSpacing: 1 }}>
              {language === 'ar' ? 'جانغو' : 'JANGO'}
            </div>
            <div style={{ fontSize: 11, color: COLORS.steelDark, letterSpacing: 2, marginTop: 2 }}>
              {t('jangoPos').toUpperCase()}
            </div>
            <div style={{ width: 60, height: 3, background: `linear-gradient(90deg, transparent, ${COLORS.red}, transparent)`, margin: '8px auto 0' }} />
            <div style={{ fontSize: 12, color: COLORS.steelDark, marginTop: 10 }}>
              {t('receipt')} #{receipt.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: COLORS.charcoalMid, marginTop: 2 }}>
              {new Date(receipt.date).toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB')}
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Customer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 16, paddingBottom: 12,
              borderBottom: `1px dashed ${COLORS.border}`,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>{t('customer')}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{receipt.customerName}</span>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 16 }}>
              {receipt.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: `1px solid ${COLORS.offWhite}`,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {item.qty} x {fmt(item.sellPrice)}
                      {item.itemDiscount > 0 && ` (-${fmt(item.itemDiscount)})`}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                    {fmt(item.qty * item.sellPrice - (item.itemDiscount || 0))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ background: COLORS.offWhite, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              {[
                { label: t('subtotal'), value: fmt(receipt.subtotal) },
                receipt.discountAmount > 0 && { label: t('discount'), value: `-${fmt(receipt.discountAmount)}`, color: COLORS.success },
                { label: t('total'), value: fmt(receipt.total), bold: true },
                { label: t('amountPaid'), value: fmt(receipt.amountPaid) },
                receipt.change > 0 && { label: t('change'), value: fmt(receipt.change), color: COLORS.success },
                receipt.remaining > 0 && { label: t('remaining'), value: fmt(receipt.remaining), color: COLORS.red },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                  <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 700 : 400, color: row.color || COLORS.charcoalMid }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 800 : 500, color: row.color || COLORS.charcoal }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment */}
            <div style={{ textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>
              {t('paymentMethod')}: <strong>{t(receipt.paymentMethod) || receipt.paymentMethod}</strong>
              {receipt.note && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{receipt.note}</div>}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: 12, borderTop: `1px dashed ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{t('thankYou')}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Sulaymaniyah, Iraq</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <button onClick={() => window.print()} style={{
            flex: 1, padding: '11px 0', borderRadius: 8, border: `1px solid ${COLORS.border}`,
            background: COLORS.white, color: COLORS.charcoal, fontSize: 14, cursor: 'pointer', fontWeight: 600
          }}>
            🖨️ {t('printReceipt')}
          </button>
          <button onClick={() => setReceipt(null)} style={{
            flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            color: COLORS.white, fontSize: 14, cursor: 'pointer', fontWeight: 600
          }}>
            + {t('newSale')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* LEFT — Products */}
      <div style={{
        flex: 1, padding: 20, overflowY: 'auto',
        borderRight: !isRTL ? `1px solid ${COLORS.border}` : 'none',
        borderLeft: isRTL ? `1px solid ${COLORS.border}` : 'none',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', marginBottom: 14 }}>
          {t('selectProducts')}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input
            placeholder={`${t('search')}...`}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '9px 12px', border: `1px solid ${COLORS.border}`,
              borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white,
              textAlign: isRTL ? 'right' : 'left'
            }}
          />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{
            padding: '9px 12px', border: `1px solid ${COLORS.border}`,
            borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer'
          }}>
            <option value="all">{t('all')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>{t('noProducts')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => addToCart(product)} style={{
                background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`,
                overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.red; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  height: 110, background: COLORS.offWhite,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative'
                }}>
                  {product.photo
                    ? <img src={product.photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32, opacity: 0.3 }}>🛋️</span>
                  }
                  <div style={{
                    position: 'absolute', bottom: 4,
                    right: isRTL ? 'auto' : 4, left: isRTL ? 4 : 'auto',
                    background: product.stock <= 5 ? COLORS.warning : COLORS.success,
                    color: COLORS.white, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4
                  }}>
                    {product.stock} {t('left')}
                  </div>
                </div>
                <div style={{ padding: '10px 10px 12px', textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, lineHeight: 1.3, marginBottom: 4 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.red, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
                    {fmt(product.sellPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Cart */}
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', background: COLORS.white, flexShrink: 0 }}>

        {/* Customer */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}`, position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('customer')}
          </div>
          <input
            placeholder={t('searchCustomer')}
            value={selectedCustomer ? selectedCustomer.name : customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerList(true); }}
            onFocus={() => setShowCustomerList(true)}
            style={{
              width: '100%', padding: '8px 12px',
              border: `1px solid ${selectedCustomer ? COLORS.red : COLORS.border}`,
              borderRadius: 7, fontSize: 13, outline: 'none',
              background: selectedCustomer ? `${COLORS.red}08` : COLORS.white,
              boxSizing: 'border-box', color: COLORS.charcoal,
              textAlign: isRTL ? 'right' : 'left'
            }}
          />
          {selectedCustomer && (
            <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} style={{
              position: 'absolute',
              right: isRTL ? 'auto' : 24, left: isRTL ? 24 : 'auto',
              top: '50%', transform: 'translateY(4px)',
              background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, fontSize: 16
            }}>✕</button>
          )}
          {showCustomerList && !selectedCustomer && filteredCustomers.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: COLORS.white, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, maxHeight: 180, overflowY: 'auto'
            }}>
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); setCustomerSearch(''); }} style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: `1px solid ${COLORS.offWhite}`, fontSize: 13,
                  textAlign: isRTL ? 'right' : 'left'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.offWhite}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ fontWeight: 600, color: COLORS.charcoal }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{c.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
              {t('emptyCart')}
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{
              background: COLORS.offWhite, borderRadius: 9,
              padding: '10px 12px', marginBottom: 8, border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, flex: 1, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0 }}>
                  {item.name}
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateQty(item.id, item.qty - 1)} style={{
                    width: 26, height: 26, borderRadius: 5, border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} style={{
                    width: 26, height: 26, borderRadius: 5, border: `1px solid ${COLORS.border}`,
                    background: COLORS.white, cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
                </div>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{fmt(item.sellPrice)}</span>
                <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, fontSize: 14, fontWeight: 700, color: COLORS.charcoal }}>
                  {fmt(item.sellPrice * item.qty)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{t('itemDiscount')}</span>
                <input type="number" value={item.itemDiscount || ''} onChange={e => updateItemDiscount(item.id, e.target.value)}
                  placeholder="0" style={{ width: 60, padding: '3px 7px', border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 12, outline: 'none' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '14px 16px' }}>

          {/* Discount */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <input type="number" placeholder={t('discount')} value={discount} onChange={e => setDiscount(e.target.value)} style={{
              flex: 1, padding: '8px 10px', border: `1px solid ${COLORS.border}`,
              borderRadius: 7, fontSize: 13, outline: 'none', textAlign: isRTL ? 'right' : 'left'
            }} />
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{
              padding: '8px 10px', border: `1px solid ${COLORS.border}`,
              borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer'
            }}>
              <option value="%">%</option>
              <option value="$">$</option>
            </select>
          </div>

          {/* Totals */}
          <div style={{ marginBottom: 12 }}>
            {[
              { label: t('subtotal'), value: fmt(subtotal) },
              discountAmount > 0 && { label: t('discount'), value: `-${fmt(discountAmount)}`, color: COLORS.success },
              { label: t('total'), value: fmt(total), bold: true },
            ].filter(Boolean).map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '3px 0',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 700 : 400, color: row.color || COLORS.charcoalMid }}>
                  {row.label}
                </span>
                <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: row.bold ? 800 : 500, color: row.color || COLORS.charcoal }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {t('paymentMethod')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['cash', 'card', 'transfer', 'installment'].map(method => (
                <button key={method} onClick={() => setPaymentMethod(method)} style={{
                  padding: '7px 0', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${paymentMethod === method ? COLORS.red : COLORS.border}`,
                  background: paymentMethod === method ? `${COLORS.red}12` : COLORS.white,
                  color: paymentMethod === method ? COLORS.red : COLORS.charcoalMid,
                  fontSize: 12, fontWeight: paymentMethod === method ? 600 : 400
                }}>
                  {t(method)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div style={{ marginBottom: 10 }}>
            <input type="number" placeholder={t('amountPaid')} value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)} style={{
                width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`,
                borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                textAlign: isRTL ? 'right' : 'left'
              }} />
            {amountPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {change > 0 && <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>{t('change')}: {fmt(change)}</span>}
                {remaining > 0 && <span style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{t('remaining')}: {fmt(remaining)}</span>}
              </div>
            )}
          </div>

          {/* Note */}
          <input placeholder={t('notes')} value={note} onChange={e => setNote(e.target.value)} style={{
            width: '100%', padding: '8px 12px', marginBottom: 12,
            border: `1px solid ${COLORS.border}`, borderRadius: 7,
            fontSize: 12, outline: 'none', boxSizing: 'border-box',
            textAlign: isRTL ? 'right' : 'left'
          }} />

          {/* Checkout Button */}
          <button onClick={handleCheckout} disabled={cart.length === 0} style={{
            width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
            background: cart.length === 0
              ? COLORS.border
              : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            color: cart.length === 0 ? COLORS.textMuted : COLORS.white,
            fontSize: 15, fontWeight: 700,
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: cart.length > 0 ? `0 3px 12px ${COLORS.red}44` : 'none',
            letterSpacing: 0.5
          }}>
            {t('completeSale')} — {fmt(total)}
          </button>
        </div>
      </div>
    </div>
  );
}