import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getProducts, saveProducts, getCustomers, saveCustomers,
  getSales, saveSales, generateId
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

function ThermalReceipt({ receipt, fmt, t, language, isRTL, onClose, onNewSale }) {
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const companyTagline = settings.companyTagline || 'Furniture';
  const companyAddress = settings.address || 'Sulaymaniyah, Iraq';
  const companyPhone = settings.phone || '';
  const receiptHeader = settings.receiptHeader || 'Thank you for shopping at Jango!';
  const receiptFooter = settings.receiptFooter || 'Sulaymaniyah, Iraq';
  const receiptMessage = settings.receiptMessage || 'Please keep your receipt for returns.';

  function handlePrint() {
    window.print();
  }

  const receiptStyle = `
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body * { visibility: hidden !important; }
      #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
      #thermal-receipt {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 80mm !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print { display: none !important; }
    }
  `;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr', fontFamily: 'Arial, sans-serif' }}>
      <style>{receiptStyle}</style>

      {/* Action Buttons */}
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <button onClick={handlePrint} style={{
          flex: 1, padding: '12px 0', borderRadius: 8, border: 'none',
          background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
          color: COLORS.white, fontSize: 14, cursor: 'pointer', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          🖨️ {t('printReceipt')}
        </button>
        <button onClick={onNewSale} style={{
          flex: 1, padding: '12px 0', borderRadius: 8, border: 'none',
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
          color: COLORS.white, fontSize: 14, cursor: 'pointer', fontWeight: 600
        }}>
          + {t('newSale')}
        </button>
      </div>

      {/* Thermal Receipt */}
      <div id="thermal-receipt" style={{
        background: COLORS.white,
        width: '100%',
        maxWidth: 320,
        margin: '0 auto',
        padding: '12px 14px',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 12,
        color: '#000',
        border: '1px dashed #ccc',
        boxSizing: 'border-box',
      }}>

        {/* Company Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>
            {language === 'ar' ? 'جانغو' : companyName}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
            {companyTagline}
          </div>
          <div style={{ fontSize: 10, marginTop: 3 }}>{companyAddress}</div>
          {companyPhone && <div style={{ fontSize: 10 }}>{companyPhone}</div>}
          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
          <div style={{ fontSize: 10 }}>{receiptHeader}</div>
        </div>

        {/* Receipt Info */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10 }}>{language === 'ar' ? 'رقم الفاتورة' : 'Receipt #'}:</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{receipt.id.slice(-8).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10 }}>{t('date')}:</span>
            <span style={{ fontSize: 10 }}>
              {new Date(receipt.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10 }}>{language === 'ar' ? 'الوقت' : 'Time'}:</span>
            <span style={{ fontSize: 10 }}>
              {new Date(receipt.date).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10 }}>{t('customer')}:</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{receipt.customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10 }}>{t('paymentMethod')}:</span>
            <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{t(receipt.paymentMethod) || receipt.paymentMethod}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: 6 }}>
          {/* Table Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, flex: 2 }}>{language === 'ar' ? 'المنتج' : 'ITEM'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', flex: 1 }}>{language === 'ar' ? 'كمية' : 'QTY'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', flex: 1 }}>{language === 'ar' ? 'سعر' : 'PRICE'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', flex: 1 }}>{language === 'ar' ? 'المجموع' : 'TOTAL'}</span>
          </div>

          {/* Items */}
          {receipt.items.map((item, i) => {
            const itemTotal = item.qty * item.sellPrice - (item.itemDiscount || 0);
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, wordBreak: 'break-word' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, flex: 2 }}></span>
                  <span style={{ fontSize: 10, textAlign: 'center', flex: 1 }}>{item.qty}</span>
                  <span style={{ fontSize: 10, textAlign: 'center', flex: 1 }}>{fmt(item.sellPrice)}</span>
                  <span style={{ fontSize: 10, textAlign: 'right', flex: 1, fontWeight: 600 }}>{fmt(itemTotal)}</span>
                </div>
                {item.itemDiscount > 0 && (
                  <div style={{ fontSize: 9, color: '#666', textAlign: 'right' }}>
                    {language === 'ar' ? 'خصم: ' : 'Disc: '}-{fmt(item.itemDiscount)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 10 }}>{t('subtotal')}:</span>
            <span style={{ fontSize: 10 }}>{fmt(receipt.subtotal)}</span>
          </div>
          {receipt.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10 }}>{t('discount')}:</span>
              <span style={{ fontSize: 10 }}>-{fmt(receipt.discountAmount)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid #000', marginTop: 4, paddingTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>{t('total')}:</span>
              <span style={{ fontSize: 13, fontWeight: 900 }}>{fmt(receipt.total)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10 }}>{t('amountPaid')}:</span>
            <span style={{ fontSize: 10 }}>{fmt(receipt.amountPaid)}</span>
          </div>
          {receipt.change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10 }}>{t('change')}:</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{fmt(receipt.change)}</span>
            </div>
          )}
          {receipt.remaining > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{t('remaining')}:</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{fmt(receipt.remaining)}</span>
            </div>
          )}
        </div>

        {/* Note */}
        {receipt.note && (
          <div style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' }}>
            {receipt.note}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{receiptMessage}</div>
          <div style={{ fontSize: 10 }}>{receiptFooter}</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>
            {'*'.repeat(10)} {language === 'ar' ? 'شكراً لزيارتكم' : 'THANK YOU'} {'*'.repeat(10)}
          </div>
        </div>

        {/* Item count */}
        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 6 }}>
          {language === 'ar' ? 'عدد المنتجات' : 'Items'}: {receipt.items.reduce((sum, i) => sum + i.qty, 0)}
        </div>

        {/* Agency watermark */}
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: 5, textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#999', letterSpacing: 1 }}>
            Powered by
          </div>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: 0.5 }}>
            CodaTechAgency
          </div>
        </div>
      </div>

      {/* Screen only preview label */}
      <div className="no-print" style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: COLORS.textMuted }}>
        {language === 'ar' ? '⬆️ معاينة الفاتورة — اضغط طباعة للطباعة على الطابعة الحرارية' : '⬆️ Receipt preview — Click print for thermal printer'}
      </div>
    </div>
  );
}

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
    ? discountType === '%' ? (subtotal * parseFloat(discount)) / 100 : parseFloat(discount)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;
  const remaining = amountPaid ? Math.max(0, total - parseFloat(amountPaid)) : total;

  function addToCart(product) {
    if (product.stock <= 0) return alert(t('outOfStock'));
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, itemDiscount: 0 }];
    });
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id);
    const product = products.find(p => p.id === id);
    if (qty > product.stock) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }
  function updateItemDiscount(id, val) { setCart(prev => prev.map(i => i.id === id ? { ...i, itemDiscount: parseFloat(val) || 0 } : i)); }

  function handleCheckout() {
    if (cart.length === 0) return alert(t('emptyCart'));

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
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory;
    return matchSearch && matchCat && p.stock > 0;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (receipt) {
    return (
      <ThermalReceipt
        receipt={receipt}
        fmt={fmt}
        t={t}
        language={language}
        isRTL={isRTL}
        onClose={() => setReceipt(null)}
        onNewSale={() => setReceipt(null)}
      />
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
          <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, textAlign: isRTL ? 'right' : 'left' }} />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
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
                <div style={{ height: 110, background: COLORS.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {product.photo
                    ? <img src={product.photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32, opacity: 0.3 }}>🛋️</span>
                  }
                  <div style={{ position: 'absolute', bottom: 4, right: isRTL ? 'auto' : 4, left: isRTL ? 4 : 'auto', background: product.stock <= 5 ? COLORS.warning : COLORS.success, color: COLORS.white, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                    {product.stock} {t('left')}
                  </div>
                </div>
                <div style={{ padding: '10px 10px 12px', textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, lineHeight: 1.3, marginBottom: 4 }}>{product.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.red, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{fmt(product.sellPrice)}</div>
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
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('customer')}</div>
          <input
            placeholder={t('searchCustomer')}
            value={selectedCustomer ? selectedCustomer.name : customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerList(true); }}
            onFocus={() => setShowCustomerList(true)}
            style={{ width: '100%', padding: '8px 12px', border: `1px solid ${selectedCustomer ? COLORS.red : COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: selectedCustomer ? `${COLORS.red}08` : COLORS.white, boxSizing: 'border-box', color: COLORS.charcoal, textAlign: isRTL ? 'right' : 'left' }}
          />
          {selectedCustomer && (
            <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} style={{ position: 'absolute', right: isRTL ? 'auto' : 24, left: isRTL ? 24 : 'auto', top: '50%', transform: 'translateY(4px)', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, fontSize: 16 }}>✕</button>
          )}
          {showCustomerList && !selectedCustomer && filteredCustomers.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: 180, overflowY: 'auto' }}>
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); setCustomerSearch(''); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${COLORS.offWhite}`, fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>{t('emptyCart')}</div>
          ) : cart.map(item => (
            <div key={item.id} style={{ background: COLORS.offWhite, borderRadius: 9, padding: '10px 12px', marginBottom: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, flex: 1, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0 }}>{item.name}</div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: COLORS.red, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{fmt(item.sellPrice)}</span>
                <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, fontSize: 14, fontWeight: 700, color: COLORS.charcoal }}>{fmt(item.sellPrice * item.qty)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{t('itemDiscount')}</span>
                <input type="number" value={item.itemDiscount || ''} onChange={e => updateItemDiscount(item.id, e.target.value)} placeholder="0" style={{ width: 60, padding: '3px 7px', border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 12, outline: 'none' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '14px 16px' }}>
          {/* Discount */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <input type="number" placeholder={t('discount')} value={discount} onChange={e => setDiscount(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', textAlign: isRTL ? 'right' : 'left' }} />
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
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
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 700 : 400, color: row.color || COLORS.charcoalMid }}>{row.label}</span>
                <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: row.bold ? 800 : 500, color: row.color || COLORS.charcoal }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('paymentMethod')}</div>
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
            <input type="number" placeholder={t('amountPaid')} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
            {amountPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {change > 0 && <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>{t('change')}: {fmt(change)}</span>}
                {remaining > 0 && <span style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>{t('remaining')}: {fmt(remaining)}</span>}
              </div>
            )}
          </div>

          {/* Note */}
          <input placeholder={t('notes')} value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 12, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />

          {/* Checkout Button */}
          <button onClick={handleCheckout} disabled={cart.length === 0} style={{
            width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
            background: cart.length === 0 ? COLORS.border : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
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