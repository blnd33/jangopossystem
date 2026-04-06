import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import {
  getProducts, saveProducts, getCustomers, saveCustomers,
  getSales, saveSales, generateId
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';

function ThermalReceipt({ receipt, fmt, t, language, isRTL, onNewSale, C }) {
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const companyTagline = settings.companyTagline || 'Furniture';
  const companyAddress = settings.address || 'Sulaymaniyah, Iraq';
  const companyPhone = settings.phone || '';
  const receiptHeader = settings.receiptHeader || 'Thank you for shopping at Jango!';
  const receiptFooter = settings.receiptFooter || 'Sulaymaniyah, Iraq';
  const receiptMessage = settings.receiptMessage || 'Please keep your receipt for returns.';

  const receiptStyle = `
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body * { visibility: hidden !important; }
      #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
      #thermal-receipt { position: fixed !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 0 !important; margin: 0 !important; }
      .no-print { display: none !important; }
    }
  `;

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr', fontFamily: 'Arial, sans-serif' }}>
      <style>{receiptStyle}</style>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <button onClick={() => window.print()} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.charcoal}, #1e293b)`, color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          🖨️ {t('printReceipt')}
        </button>
        <button onClick={onNewSale} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          + {t('newSale')}
        </button>
      </div>
      <div id="thermal-receipt" style={{ background: '#fff', width: '100%', maxWidth: 320, margin: '0 auto', padding: '12px 14px', fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: '#000', border: '1px dashed #ccc', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>{language === 'ar' ? 'جانغو' : companyName}</div>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{companyTagline}</div>
          <div style={{ fontSize: 10, marginTop: 3 }}>{companyAddress}</div>
          {companyPhone && <div style={{ fontSize: 10 }}>{companyPhone}</div>}
          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
          <div style={{ fontSize: 10 }}>{receiptHeader}</div>
        </div>
        <div style={{ marginBottom: 6 }}>
          {[
            { label: language === 'ar' ? 'رقم الفاتورة' : 'Receipt #', value: receipt.id.slice(-8).toUpperCase() },
            { label: t('date'), value: new Date(receipt.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
            { label: language === 'ar' ? 'الوقت' : 'Time', value: new Date(receipt.date).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) },
            { label: t('customer'), value: receipt.customerName },
            { label: t('paymentMethod'), value: t(receipt.paymentMethod) || receipt.paymentMethod },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10 }}>{row.label}:</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, flex: 2 }}>{language === 'ar' ? 'المنتج' : 'ITEM'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', flex: 1 }}>{language === 'ar' ? 'كمية' : 'QTY'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', flex: 1 }}>{language === 'ar' ? 'سعر' : 'PRICE'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', flex: 1 }}>{language === 'ar' ? 'المجموع' : 'TOTAL'}</span>
          </div>
          {receipt.items.map((item, i) => {
            const itemTotal = item.qty * item.sellPrice - (item.itemDiscount || 0);
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{item.name}</div>
                {(item.sku || item.barcode) && <div style={{ fontSize: 9, color: '#666' }}>{item.sku || item.barcode}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, flex: 2 }}></span>
                  <span style={{ fontSize: 10, textAlign: 'center', flex: 1 }}>{item.qty}</span>
                  <span style={{ fontSize: 10, textAlign: 'center', flex: 1 }}>{fmt(item.sellPrice)}</span>
                  <span style={{ fontSize: 10, textAlign: 'right', flex: 1, fontWeight: 600 }}>{fmt(itemTotal)}</span>
                </div>
                {item.itemDiscount > 0 && <div style={{ fontSize: 9, color: '#666', textAlign: 'right' }}>{language === 'ar' ? 'خصم: ' : 'Disc: '}-{fmt(item.itemDiscount)}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 10 }}>{t('subtotal')}:</span><span style={{ fontSize: 10 }}>{fmt(receipt.subtotal)}</span></div>
          {receipt.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 10 }}>{t('discount')}:</span><span style={{ fontSize: 10 }}>-{fmt(receipt.discountAmount)}</span></div>}
          <div style={{ borderTop: '1px solid #000', marginTop: 4, paddingTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>{t('total')}:</span>
              <span style={{ fontSize: 13, fontWeight: 900 }}>{fmt(receipt.total)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span style={{ fontSize: 10 }}>{t('amountPaid')}:</span><span style={{ fontSize: 10 }}>{fmt(receipt.amountPaid)}</span></div>
          {receipt.change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10 }}>{t('change')}:</span><span style={{ fontSize: 10, fontWeight: 700 }}>{fmt(receipt.change)}</span></div>}
          {receipt.remaining > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 10, fontWeight: 700 }}>{t('remaining')}:</span><span style={{ fontSize: 10, fontWeight: 700 }}>{fmt(receipt.remaining)}</span></div>}
        </div>
        {receipt.note && <div style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' }}>{receipt.note}</div>}
        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{receiptMessage}</div>
          <div style={{ fontSize: 10 }}>{receiptFooter}</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>{'*'.repeat(10)} {language === 'ar' ? 'شكراً لزيارتكم' : 'THANK YOU'} {'*'.repeat(10)}</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 6 }}>{language === 'ar' ? 'عدد المنتجات' : 'Items'}: {receipt.items.reduce((sum, i) => sum + i.qty, 0)}</div>
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: 5, textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#999', letterSpacing: 1 }}>Powered by</div>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 700 }}>CodaTechAgency</div>
        </div>
      </div>
      <div className="no-print" style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: C.textMuted }}>
        {language === 'ar' ? '⬆️ معاينة الفاتورة' : '⬆️ Receipt preview — Click print for thermal printer'}
      </div>
    </div>
  );
}

export default function POS() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [barcodeError, setBarcodeError] = useState('');
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
  const [cartOpen, setCartOpen] = useState(false); // mobile cart drawer
  const barcodeRef = useRef();

  useEffect(() => {
    setProducts(getProducts());
    setCustomers(getCustomers());
    setCategories(JSON.parse(localStorage.getItem('jango_categories') || '[]'));
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const discountAmount = discount ? discountType === '%' ? (subtotal * parseFloat(discount)) / 100 : parseFloat(discount) : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;
  const remaining = amountPaid ? Math.max(0, total - parseFloat(amountPaid)) : total;
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  function findProductByCode(code) {
    const trimmed = code.trim().toLowerCase();
    return products.find(p => p.barcode?.toLowerCase() === trimmed || p.sku?.toLowerCase() === trimmed);
  }

  function handleBarcodeInput(e) {
    const value = e.target.value;
    setBarcodeInput(value);
    setBarcodeError('');
    setBarcodeResult(null);
    if (value.trim()) {
      const found = findProductByCode(value);
      if (found) setBarcodeResult(found);
    }
  }

  function handleBarcodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const found = findProductByCode(barcodeInput);
      if (found) {
        addToCart(found);
        setBarcodeInput('');
        setBarcodeResult(null);
        setBarcodeError('');
      } else if (barcodeInput.trim()) {
        setBarcodeError(t('barcodeNotFound'));
      }
    }
  }

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
    if (isMobile) setCartOpen(true);
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
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, costPrice: i.costPrice, sellPrice: i.sellPrice, itemDiscount: i.itemDiscount || 0, sku: i.sku || '', barcode: i.barcode || '' })),
      subtotal, discountAmount, total,
      amountPaid: parseFloat(amountPaid) || 0,
      change, remaining, paymentMethod,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || t('walkIn'),
      note,
    };
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(i => i.id === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.qty } : p;
    });
    saveProducts(updatedProducts);
    setProducts(updatedProducts);
    if (selectedCustomer) {
      const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? { ...c, totalPurchases: (c.totalPurchases || 0) + 1, totalSpent: (c.totalSpent || 0) + total, balance: remaining > 0 ? (c.balance || 0) - remaining : c.balance || 0 } : c);
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    }
    saveSales([...getSales(), sale]);
    setReceipt(sale);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount('');
    setAmountPaid('');
    setNote('');
    setBarcodeInput('');
    setBarcodeResult(null);
    setCartOpen(false);
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory;
    return matchSearch && matchCat && p.stock > 0;
  });

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (receipt) {
    return <ThermalReceipt receipt={receipt} fmt={fmt} t={t} language={language} isRTL={isRTL} onNewSale={() => setReceipt(null)} C={C} />;
  }

  // ── CART PANEL (shared between mobile/desktop) ──
  const CartPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.white }}>

      {/* Mobile cart header */}
      {isMobile && (
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>🛒 {t('cart')} ({cartCount})</div>
          <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
        </div>
      )}

      {/* Customer */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        {!isMobile && <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('customer')}</div>}
        <input
          placeholder={t('searchCustomer')}
          value={selectedCustomer ? selectedCustomer.name : customerSearch}
          onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerList(true); }}
          onFocus={() => setShowCustomerList(true)}
          style={{ width: '100%', padding: '8px 12px', border: `1px solid ${selectedCustomer ? C.red : C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: selectedCustomer ? `${C.red}08` : C.white, boxSizing: 'border-box', color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }}
        />
        {selectedCustomer && <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} style={{ position: 'absolute', right: isRTL ? 'auto' : 24, left: isRTL ? 24 : 'auto', top: '50%', transform: 'translateY(4px)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 16 }}>✕</button>}
        {showCustomerList && !selectedCustomer && filteredCustomers.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: `0 4px 16px ${C.shadow}`, zIndex: 100, maxHeight: 180, overflowY: 'auto' }}>
            {filteredCustomers.map(c => (
              <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); setCustomerSearch(''); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.offWhite}`, fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ fontWeight: 600, color: C.charcoal }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{c.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: C.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
            {t('emptyCart')}
          </div>
        ) : cart.map(item => (
          <div key={item.id} style={{ background: C.offWhite, borderRadius: 9, padding: '10px 12px', marginBottom: 8, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 38, height: 38, borderRadius: 6, background: C.white, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
                {item.photo ? <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>🛋️</span>}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{item.name}</div>
                {(item.sku || item.barcode) && <div style={{ fontSize: 10, color: C.textMuted }}>{item.barcode ? `🔲 ${item.barcode}` : `📦 ${item.sku}`}</div>}
              </div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, color: C.charcoal }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, color: C.charcoal }}>+</button>
              </div>
              <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(item.sellPrice)}</span>
              <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, fontSize: 13, fontWeight: 700, color: C.charcoal }}>{fmt(item.sellPrice * item.qty)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{t('itemDiscount')}</span>
              <input type="number" value={item.itemDiscount || ''} onChange={e => updateItemDiscount(item.id, e.target.value)} placeholder="0" style={{ width: 60, padding: '3px 7px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, outline: 'none', background: C.white, color: C.charcoal }} />
            </div>
          </div>
        ))}
      </div>

      {/* Checkout */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px', background: C.white }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input type="number" placeholder={t('discount')} value={discount} onChange={e => setDiscount(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
          <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
            <option value="%">%</option>
            <option value="$">$</option>
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          {[
            { label: t('subtotal'), value: fmt(subtotal) },
            discountAmount > 0 && { label: t('discount'), value: `-${fmt(discountAmount)}`, color: C.success },
            { label: t('total'), value: fmt(total), bold: true },
          ].filter(Boolean).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span style={{ fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 700 : 400, color: row.color || C.textMuted }}>{row.label}</span>
              <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: row.bold ? 800 : 500, color: row.color || C.charcoal }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            {['cash', 'card', 'transfer', 'installment'].map(method => (
              <button key={method} onClick={() => setPaymentMethod(method)} style={{
                padding: '7px 0', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${paymentMethod === method ? C.red : C.border}`,
                background: paymentMethod === method ? `${C.red}12` : C.white,
                color: paymentMethod === method ? C.red : C.charcoalMid,
                fontSize: 12, fontWeight: paymentMethod === method ? 600 : 400, minHeight: 36
              }}>
                {t(method)}
              </button>
            ))}
          </div>
          <input type="number" placeholder={t('amountPaid')} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
          {amountPaid && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {change > 0 && <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>{t('change')}: {fmt(change)}</span>}
              {remaining > 0 && <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>{t('remaining')}: {fmt(remaining)}</span>}
            </div>
          )}
        </div>
        <input placeholder={t('notes')} value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
        <button onClick={handleCheckout} disabled={cart.length === 0} style={{
          width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
          background: cart.length === 0 ? C.border : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          color: cart.length === 0 ? C.textMuted : '#fff',
          fontSize: 15, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
          boxShadow: cart.length > 0 ? `0 3px 12px ${C.red}44` : 'none',
          minHeight: 48
        }}>
          {t('completeSale')} — {fmt(total)}
        </button>
      </div>
    </div>
  );

  // ── PRODUCTS PANEL ──
  const ProductsPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: !isRTL && !isMobile ? `1px solid ${C.border}` : 'none', borderLeft: isRTL && !isMobile ? `1px solid ${C.border}` : 'none' }}>

      {/* Barcode Scanner */}
      <div style={{ padding: '10px 14px', background: C.offWhite, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>🔲 {t('quickScan')}</div>
        <div style={{ position: 'relative' }}>
          <input
            ref={barcodeRef}
            value={barcodeInput}
            onChange={handleBarcodeInput}
            onKeyDown={handleBarcodeKeyDown}
            placeholder={t('scanBarcode')}
            style={{ width: '100%', padding: '9px 14px', paddingLeft: isRTL ? 14 : 38, paddingRight: isRTL ? 38 : 14, border: `2px solid ${barcodeError ? C.red : barcodeResult ? C.success : C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }}
          />
          <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isRTL ? 'auto' : 11, right: isRTL ? 11 : 'auto', fontSize: 16 }}>
            {barcodeResult ? '✅' : barcodeError ? '❌' : '🔲'}
          </span>
        </div>
        {barcodeResult && (
          <div style={{ marginTop: 7, background: `${C.success}10`, border: `1px solid ${C.success}44`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 44, height: 44, borderRadius: 7, background: C.offWhite, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
              {barcodeResult.photo ? <img src={barcodeResult.photo} alt={barcodeResult.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🛋️</span>}
            </div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{barcodeResult.name}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{fmt(barcodeResult.sellPrice)} · {t('inStock')}: {barcodeResult.stock}</div>
            </div>
            <button onClick={() => { addToCart(barcodeResult); setBarcodeInput(''); setBarcodeResult(null); }} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.success}, #15803d)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + {t('add')}
            </button>
          </div>
        )}
        {barcodeError && <div style={{ marginTop: 5, fontSize: 11, color: C.red, fontWeight: 500 }}>❌ {barcodeError}</div>}
        {!barcodeResult && !barcodeError && <div style={{ marginTop: 3, fontSize: 10, color: C.textMuted }}>{language === 'ar' ? '💡 اضغط Enter لإضافة المنتج' : '💡 Press Enter to auto-add to cart'}</div>}
      </div>

      {/* Search & Filter */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={`${t('search')}...`}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
          <option value="all">{t('all')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted }}>{t('noProducts')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => addToCart(product)} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', boxShadow: `0 1px 4px ${C.shadow}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: isMobile ? 90 : 110, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {product.photo ? <img src={product.photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, opacity: 0.3 }}>🛋️</span>}
                  <div style={{ position: 'absolute', bottom: 4, right: isRTL ? 'auto' : 4, left: isRTL ? 4 : 'auto', background: product.stock <= 5 ? C.warning : C.success, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>
                    {product.stock} {t('left')}
                  </div>
                  {(product.sku || product.barcode) && (
                    <div style={{ position: 'absolute', top: 4, left: isRTL ? 'auto' : 4, right: isRTL ? 4 : 'auto', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, padding: '1px 5px', borderRadius: 3 }}>
                      {product.barcode ? '🔲' : '📦'} {product.barcode || product.sku}
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 10px', textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: C.charcoal, lineHeight: 1.3, marginBottom: 3 }}>{product.name}</div>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: C.red }}>{fmt(product.sellPrice)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── MOBILE LAYOUT ──
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily, direction: isRTL ? 'rtl' : 'ltr', position: 'relative', background: C.offWhite }}>

        {ProductsPanel}

        {/* Cart Button */}
        <div style={{ padding: '10px 14px', background: C.white, borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => setCartOpen(true)} style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            🛒 {t('cart')}
            {cartCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 800 }}>
                {cartCount} — {fmt(total)}
              </span>
            )}
          </button>
        </div>

        {/* Cart Drawer */}
        {cartOpen && (
          <>
            <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
            <div className="cart-drawer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85vh', background: C.white, borderRadius: '16px 16px 0 0', zIndex: 160, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 32px rgba(0,0,0,0.2)' }}>
              {CartPanel}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ──
  return (
    <div style={{ display: 'flex', height: '100%', direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      {ProductsPanel}
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {CartPanel}
      </div>
    </div>
  );
}