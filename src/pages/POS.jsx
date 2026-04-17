import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

function A4Invoice({ receipt, fmt, t, language, isRTL, onNewSale, C }) {
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const companyTagline = settings.companyTagline || 'Furniture';
  const companyAddress = settings.address || 'Sulaymaniyah, Iraq';
  const companyPhone = settings.phone || '';
  const companyEmail = settings.email || '';

  const printStyle = `
    @media print {
      @page { size: A4; margin: 15mm; }
      body * { visibility: hidden !important; }
      #a4-invoice, #a4-invoice * { visibility: visible !important; }
      #a4-invoice { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; }
      .no-print { display: none !important; }
    }
  `;

  const invoiceDate = new Date(receipt.created_at);
  const items = receipt.items || [];
  const isAr = language === 'ar';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px', fontFamily: isAr ? 'Arial, sans-serif' : 'Georgia, serif' }}>
      <style>{printStyle}</style>

      {/* Action Buttons */}
      <div className="no-print" style={{ maxWidth: 794, margin: '0 auto 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => window.print()} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#1e293b', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          🖨️ {isAr ? 'طباعة الفاتورة' : 'Print Invoice'}
        </button>
        <button onClick={onNewSale} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          + {isAr ? 'بيعة جديدة' : 'New Sale'}
        </button>
      </div>

      {/* A4 Invoice */}
      <div id="a4-invoice" style={{
        maxWidth: 794, margin: '0 auto', background: '#fff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        borderRadius: 4, overflow: 'hidden',
        direction: isAr ? 'rtl' : 'ltr',
        fontFamily: isAr ? 'Arial, sans-serif' : 'Georgia, serif',
      }}>

        {/* Header */}
        <div style={{ background: '#1e293b', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isAr ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: isAr ? 'right' : 'left' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>
              {isAr ? 'جانغو' : companyName}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, letterSpacing: 1 }}>{companyTagline}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{companyAddress}</div>
            {companyPhone && <div style={{ fontSize: 12, color: '#64748b' }}>📞 {companyPhone}</div>}
            {companyEmail && <div style={{ fontSize: 12, color: '#64748b' }}>✉️ {companyEmail}</div>}
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {isAr ? 'فاتورة مبيعات' : 'Sales Invoice'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.red || '#ef4444' }}>
              #{receipt.invoice_number}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              {isAr ? 'التاريخ:' : 'Date:'} {invoiceDate.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {isAr ? 'الوقت:' : 'Time:'} {invoiceDate.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Red accent line */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.red || '#ef4444'}, #f97316)` }} />

        {/* Customer & Payment Info */}
        <div style={{ padding: '24px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: isAr ? 'right' : 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {isAr ? 'بيانات المشتري' : 'Bill To'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
              {receipt.buyer_name || receipt.customer || (isAr ? 'زبون عادي' : 'Walk-in Customer')}
            </div>
            {receipt.buyer_name && receipt.customer && receipt.buyer_name !== receipt.customer && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {isAr ? 'الحساب:' : 'Account:'} {receipt.customer}
              </div>
            )}
          </div>
          <div style={{ textAlign: isAr ? 'left' : 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {isAr ? 'تفاصيل الدفع' : 'Payment Details'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isAr ? 'flex-start' : 'flex-end' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'طريقة الدفع:' : 'Method:'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{receipt.payment_method}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'الحالة:' : 'Status:'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: receipt.payment_method === 'debt' ? '#b45309' : '#15803d', background: receipt.payment_method === 'debt' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${receipt.payment_method === 'debt' ? '#fde68a' : '#bbf7d0'}`, padding: '2px 10px', borderRadius: 20 }}>
                  {receipt.payment_method === 'debt' ? (isAr ? 'دين' : 'DEBT') : (isAr ? 'مدفوعة' : 'PAID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: '0 36px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: isAr ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {isAr ? 'المنتج' : 'Item'}
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {isAr ? 'الكمية' : 'Qty'}
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {isAr ? 'سعر الوحدة' : 'Unit Price'}
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: isAr ? 'left' : 'right', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {isAr ? 'المجموع' : 'Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.product_name}</div>
                    {item.discount > 0 && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                        {isAr ? 'خصم:' : 'Disc:'} -{fmt(item.discount)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: '#475569' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: '#475569' }}>
                    {fmt(item.unit_price)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: isAr ? 'left' : 'right', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                    {fmt(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ padding: '20px 36px 28px', display: 'flex', justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span style={{ fontSize: 13, color: '#1e293b' }}>{fmt(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{isAr ? 'الخصم' : 'Discount'}</span>
                <span style={{ fontSize: 13, color: '#ef4444' }}>-{fmt(receipt.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1e293b', borderRadius: 8, marginTop: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isAr ? 'الإجمالي' : 'TOTAL'}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.red || '#ef4444' }}>{fmt(receipt.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{fmt(receipt.amount_paid)}</span>
            </div>
            {receipt.change_given > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'الباقي' : 'Change'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fmt(receipt.change_given)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {receipt.note && (
          <div style={{ margin: '0 36px', padding: '12px 16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: '#92400e' }}>📝 {receipt.note}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ margin: '0 36px 36px', padding: '20px 24px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            {isAr ? 'شكراً لتسوقكم معنا!' : 'Thank you for your business!'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {isAr ? 'يرجى الاحتفاظ بهذه الفاتورة للمراجعة' : 'Please keep this invoice for your records'}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0', fontSize: 10, color: '#94a3b8' }}>
            {companyName} · {companyAddress} {companyPhone && `· ${companyPhone}`}
          </div>
        </div>

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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [buyerName, setBuyerName] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const barcodeRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prods, custs, cats] = await Promise.all([
        api.pos.getProducts(),
        api.customers.getAll(),
        api.categories.getAll(),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setCategories(cats);
    } catch (err) {
      console.error('POS fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
  const discountAmount = discount
    ? discountType === '%'
      ? (subtotal * parseFloat(discount)) / 100
      : parseFloat(discount)
    : 0;
  const total = Math.max(0, subtotal - itemDiscounts - discountAmount);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;
  const remaining = amountPaid ? Math.max(0, total - parseFloat(amountPaid)) : total;
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  function findProductByCode(code) {
    const trimmed = code.trim().toLowerCase();
    return products.find(p =>
      p.barcode?.toLowerCase() === trimmed ||
      p.sku?.toLowerCase() === trimmed
    );
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

  async function handleCheckout() {
    if (cart.length === 0) return alert(t('emptyCart'));
    setCheckingOut(true);
    try {
      const payload = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          discount: item.itemDiscount || 0,
        })),
        customer_id: selectedCustomer?.id || null,
        buyer_name: buyerName.trim() || null,
        discount: discountAmount,
        tax: 0,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid) || total,
        note,
      };

      const result = await api.pos.checkout(payload);
      const sale = result.sale;

      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(i => i.id === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.qty } : p;
      }));

      setReceipt(sale);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount('');
      setAmountPaid('');
      setBuyerName('');
      setNote('');
      setBarcodeInput('');
      setBarcodeResult(null);
      setCartOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category_id === parseInt(filterCategory);
    return matchSearch && matchCat && p.stock > 0;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textMuted }}>Loading...</div>;

  if (receipt) {
    return <A4Invoice receipt={receipt} fmt={fmt} t={t} language={language} isRTL={isRTL} onNewSale={() => setReceipt(null)} C={C} />;
  }

  const CartPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.white }}>
      {isMobile && (
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>🛒 {t('cart')} ({cartCount})</div>
          <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
        </div>
      )}

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
              <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); setCustomerSearch(''); }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.offWhite}`, fontSize: 13 }}
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
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>🛋️</span>}
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
              <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(item.price)}</span>
              <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, fontSize: 13, fontWeight: 700, color: C.charcoal }}>{fmt(item.price * item.qty)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{t('itemDiscount')}</span>
              <input type="number" value={item.itemDiscount || ''} onChange={e => updateItemDiscount(item.id, e.target.value)} placeholder="0" style={{ width: 60, padding: '3px 7px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, outline: 'none', background: C.white, color: C.charcoal }} />
            </div>
          </div>
        ))}
      </div>

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
            itemDiscounts > 0 && { label: t('itemDiscounts'), value: `-${fmt(itemDiscounts)}`, color: C.success },
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
          {/* Payment Methods: cash and debt only */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            {['cash', 'debt'].map(method => (
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

          {/* Buyer Name */}
          <input
            placeholder={language === 'ar' ? 'اسم المشتري (اختياري)' : 'Buyer Name (optional)'}
            value={buyerName}
            onChange={e => setBuyerName(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', marginBottom: 8,
              border: `1px solid ${buyerName ? C.red : C.border}`,
              borderRadius: 7, fontSize: 13, outline: 'none',
              boxSizing: 'border-box', background: buyerName ? `${C.red}06` : C.white,
              color: C.charcoal, textAlign: isRTL ? 'right' : 'left',
            }}
          />

          <input type="number" placeholder={t('amountPaid')} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
          {amountPaid && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {change > 0 && <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>{t('change')}: {fmt(change)}</span>}
              {remaining > 0 && <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>{t('remaining')}: {fmt(remaining)}</span>}
            </div>
          )}
        </div>
        <input placeholder={t('notes')} value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
        <button onClick={handleCheckout} disabled={cart.length === 0 || checkingOut} style={{
          width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
          background: cart.length === 0 ? C.border : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          color: cart.length === 0 ? C.textMuted : '#fff',
          fontSize: 15, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
          boxShadow: cart.length > 0 ? `0 3px 12px ${C.red}44` : 'none', minHeight: 48,
          opacity: checkingOut ? 0.7 : 1,
        }}>
          {checkingOut ? '...' : `${t('completeSale')} — ${fmt(total)}`}
        </button>
      </div>
    </div>
  );

  const ProductsPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: !isRTL && !isMobile ? `1px solid ${C.border}` : 'none', borderLeft: isRTL && !isMobile ? `1px solid ${C.border}` : 'none' }}>
      <div style={{ padding: '10px 14px', background: C.offWhite, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>🔲 {t('quickScan')}</div>
        <div style={{ position: 'relative' }}>
          <input ref={barcodeRef} value={barcodeInput} onChange={handleBarcodeInput} onKeyDown={handleBarcodeKeyDown} placeholder={t('scanBarcode')} style={{ width: '100%', padding: '9px 14px', paddingLeft: isRTL ? 14 : 38, paddingRight: isRTL ? 38 : 14, border: `2px solid ${barcodeError ? C.red : barcodeResult ? C.success : C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
          <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isRTL ? 'auto' : 11, right: isRTL ? 11 : 'auto', fontSize: 16 }}>
            {barcodeResult ? '✅' : barcodeError ? '❌' : '🔲'}
          </span>
        </div>
        {barcodeResult && (
          <div style={{ marginTop: 7, background: `${C.success}10`, border: `1px solid ${C.success}44`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 44, height: 44, borderRadius: 7, background: C.offWhite, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
              {barcodeResult.image_url ? <img src={barcodeResult.image_url} alt={barcodeResult.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🛋️</span>}
            </div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{barcodeResult.name}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{fmt(barcodeResult.price)} · {t('inStock')}: {barcodeResult.stock}</div>
            </div>
            <button onClick={() => { addToCart(barcodeResult); setBarcodeInput(''); setBarcodeResult(null); }} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.success}, #15803d)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + {t('add')}
            </button>
          </div>
        )}
        {barcodeError && <div style={{ marginTop: 5, fontSize: 11, color: C.red, fontWeight: 500 }}>❌ {barcodeError}</div>}
        {!barcodeResult && !barcodeError && <div style={{ marginTop: 3, fontSize: 10, color: C.textMuted }}>{language === 'ar' ? '💡 اضغط Enter لإضافة المنتج' : '💡 Press Enter to auto-add to cart'}</div>}
      </div>

      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
          <option value="all">{t('all')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted }}>{t('noProducts')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => addToCart(product)}
                style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', boxShadow: `0 1px 4px ${C.shadow}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: isMobile ? 90 : 110, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, opacity: 0.3 }}>🛋️</span>}
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
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: C.red }}>{fmt(product.price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily, direction: isRTL ? 'rtl' : 'ltr', position: 'relative', background: C.offWhite }}>
        {ProductsPanel}
        <div style={{ padding: '10px 14px', background: C.white, borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => setCartOpen(true)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            🛒 {t('cart')}
            {cartCount > 0 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 800 }}>{cartCount} — {fmt(total)}</span>}
          </button>
        </div>
        {cartOpen && (
          <>
            <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85vh', background: C.white, borderRadius: '16px 16px 0 0', zIndex: 160, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 32px rgba(0,0,0,0.2)' }}>
              {CartPanel}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      {ProductsPanel}
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {CartPanel}
      </div>
    </div>
  );
}