import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';

const BASE = 'http://127.0.0.1:5000';

function ReceiptModal({ sale, onClose, fmt, language, isRTL, C }) {
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const companyTagline = settings.companyTagline || 'Furniture';
  const companyAddress = settings.address || 'Sulaymaniyah, Iraq';
  const companyPhone = settings.phone || '';
  const companyEmail = settings.email || '';
  const isAr = language === 'ar';
  const invoiceDate = new Date(sale.created_at);
  const items = sale.items || [];

  const printStyle = `
    @media print {
      @page { size: A4; margin: 15mm; }
      body * { visibility: hidden !important; }
      #receipt-print, #receipt-print * { visibility: visible !important; }
      #receipt-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; }
      .no-print { display: none !important; }
    }
  `;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{printStyle}</style>
      <div style={{ background: C.white, borderRadius: 12, width: '100%', maxWidth: 860, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>

        {/* Modal Actions */}
        <div className="no-print" style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>🧾 {isAr ? 'فاتورة' : 'Invoice'} #{sale.invoice_number}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1e293b', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              🖨️ {isAr ? 'طباعة' : 'Print'}
            </button>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoal, fontSize: 13, cursor: 'pointer' }}>
              ✕ {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

        {/* A4 Invoice */}
        <div id="receipt-print" style={{ padding: 20, direction: isAr ? 'rtl' : 'ltr', fontFamily: isAr ? 'Arial, sans-serif' : 'Georgia, serif' }}>
          <div style={{ maxWidth: 794, margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: '#1e293b', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{isAr ? 'جانغو' : companyName}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{companyTagline}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{companyAddress}</div>
                {companyPhone && <div style={{ fontSize: 12, color: '#64748b' }}>📞 {companyPhone}</div>}
                {companyEmail && <div style={{ fontSize: 12, color: '#64748b' }}>✉️ {companyEmail}</div>}
              </div>
              <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{isAr ? 'فاتورة مبيعات' : 'Sales Invoice'}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.red || '#ef4444' }}>#{sale.invoice_number}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{isAr ? 'التاريخ:' : 'Date:'} {invoiceDate.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'الوقت:' : 'Time:'} {invoiceDate.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.red || '#ef4444'}, #f97316)` }} />

            {/* Bill To + Payment */}
            <div style={{ padding: '24px 36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'بيانات المشتري' : 'Bill To'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{sale.buyer_name || sale.customer || (isAr ? 'زبون عادي' : 'Walk-in Customer')}</div>
                {sale.buyer_name && sale.customer && sale.buyer_name !== sale.customer && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{isAr ? 'الحساب:' : 'Account:'} {sale.customer}</div>
                )}
              </div>
              <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'تفاصيل الدفع' : 'Payment Details'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isAr ? 'flex-start' : 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'طريقة الدفع:' : 'Method:'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{sale.payment_method}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'الحالة:' : 'Status:'}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sale.status === 'refunded' ? '#b45309' : sale.payment_method === 'debt' ? '#b45309' : '#15803d', background: sale.status === 'refunded' ? '#fffbeb' : sale.payment_method === 'debt' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${sale.status === 'refunded' ? '#fde68a' : sale.payment_method === 'debt' ? '#fde68a' : '#bbf7d0'}`, padding: '2px 10px', borderRadius: 20 }}>
                      {sale.status === 'refunded' ? (isAr ? 'مسترجع' : 'REFUNDED') : sale.payment_method === 'debt' ? (isAr ? 'دين' : 'DEBT') : (isAr ? 'مدفوعة' : 'PAID')}
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
                    {[
                      { label: isAr ? 'المنتج' : 'Item', align: isAr ? 'right' : 'left' },
                      { label: isAr ? 'الكمية' : 'Qty', align: 'center' },
                      { label: isAr ? 'سعر الوحدة' : 'Unit Price', align: 'center' },
                      { label: isAr ? 'المجموع' : 'Total', align: isAr ? 'left' : 'right' },
                    ].map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: col.align, textTransform: 'uppercase', letterSpacing: 0.8 }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.product_name}</div>
                        {item.discount > 0 && <div style={{ fontSize: 11, color: '#ef4444' }}>{isAr ? 'خصم:' : 'Disc:'} -{fmt(item.discount)}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: '#475569' }}>{fmt(item.unit_price)}</td>
                      <td style={{ padding: '14px 16px', textAlign: isAr ? 'left' : 'right', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{fmt(item.total)}</td>
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
                  <span style={{ fontSize: 13, color: '#1e293b' }}>{fmt(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{isAr ? 'الخصم' : 'Discount'}</span>
                    <span style={{ fontSize: 13, color: '#ef4444' }}>-{fmt(sale.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1e293b', borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isAr ? 'الإجمالي' : 'TOTAL'}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: C.red || '#ef4444' }}>{fmt(sale.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{fmt(sale.amount_paid)}</span>
                </div>
                {sale.change_given > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'الباقي' : 'Change'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fmt(sale.change_given)}</span>
                  </div>
                )}
              </div>
            </div>

            {sale.note && (
              <div style={{ margin: '0 36px 20px', padding: '12px 16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: '#92400e' }}>📝 {sale.note}</span>
              </div>
            )}

            <div style={{ margin: '0 36px 36px', padding: '20px 24px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{isAr ? 'شكراً لتسوقكم معنا!' : 'Thank you for your business!'}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'يرجى الاحتفاظ بهذه الفاتورة للمراجعة' : 'Please keep this invoice for your records'}</div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0', fontSize: 10, color: '#94a3b8' }}>
                {companyName} · {companyAddress} {companyPhone && `· ${companyPhone}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesReceipts() {
  const { language, isRTL } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const isAr = language === 'ar';

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PER_PAGE = 20;

  useEffect(() => { fetchSales(); }, [page, filterMethod, filterStatus]);

  async function fetchSales() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: PER_PAGE });
      if (filterMethod !== 'all') params.append('payment_method', filterMethod);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`${BASE}/api/pos/sales?${params}`);
      const data = await res.json();
      setSales(data.sales || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('fetchSales error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function openReceipt(sale) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${BASE}/api/pos/sales/${sale.id}`);
      const data = await res.json();
      setSelectedSale(data);
    } catch (err) {
      console.error('openReceipt error:', err);
    } finally {
      setLoadingDetail(false);
    }
  }

  const filtered = sales.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.invoice_number?.toLowerCase().includes(q) ||
      s.customer?.toLowerCase().includes(q) ||
      s.buyer_name?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = filtered.reduce((sum, s) => s.status !== 'refunded' ? sum + s.total : sum, 0);

  return (
    <div style={{ padding: 24, fontFamily: isAr ? 'Arial, sans-serif' : 'inherit', direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal }}>🧾 {isAr ? 'سجل الفواتير' : 'Sales Receipts'}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{isAr ? `${totalCount} فاتورة` : `${totalCount} receipts total`}</div>
        </div>
        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.red }}>{fmt(totalRevenue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <input
          placeholder={isAr ? 'بحث برقم الفاتورة أو اسم العميل...' : 'Search by invoice # or customer...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' }}
        />
        <select value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(1); }} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, cursor: 'pointer' }}>
          <option value="all">{isAr ? 'كل طرق الدفع' : 'All Methods'}</option>
          <option value="cash">{isAr ? 'نقد' : 'Cash'}</option>
          <option value="debt">{isAr ? 'دين' : 'Debt'}</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal, cursor: 'pointer' }}>
          <option value="all">{isAr ? 'كل الحالات' : 'All Status'}</option>
          <option value="completed">{isAr ? 'مكتملة' : 'Completed'}</option>
          <option value="refunded">{isAr ? 'مسترجعة' : 'Refunded'}</option>
        </select>
        <button onClick={fetchSales} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          🔄 {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
          {isAr ? 'لا توجد فواتير' : 'No receipts found'}
        </div>
      ) : (
        <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr 80px', padding: '10px 16px', background: C.offWhite, borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: isRTL ? 'right' : 'left' }}>
            <div>{isAr ? 'رقم الفاتورة' : 'Invoice #'}</div>
            <div>{isAr ? 'المشتري' : 'Customer'}</div>
            <div>{isAr ? 'التاريخ' : 'Date'}</div>
            <div>{isAr ? 'الإجمالي' : 'Total'}</div>
            <div>{isAr ? 'الدفع' : 'Payment'}</div>
            <div style={{ textAlign: 'center' }}>{isAr ? 'عرض' : 'View'}</div>
          </div>
          {filtered.map((sale, i) => {
            const date = new Date(sale.created_at);
            const isRefunded = sale.status === 'refunded';
            const isDebt = sale.payment_method === 'debt';
            return (
              <div key={sale.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr 80px', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.white : C.offWhite, alignItems: 'center', textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>#{sale.invoice_number}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{sale.buyer_name || sale.customer || (isAr ? 'زبون عادي' : 'Walk-in')}</div>
                  {sale.buyer_name && sale.customer && sale.buyer_name !== sale.customer && (
                    <div style={{ fontSize: 11, color: C.textMuted }}>{sale.customer}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  <div>{date.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB')}</div>
                  <div>{date.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: isRefunded ? C.textMuted : C.red, textDecoration: isRefunded ? 'line-through' : 'none' }}>{fmt(sale.total)}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isRefunded ? '#f1f5f9' : isDebt ? '#fffbeb' : '#f0fdf4', color: isRefunded ? '#64748b' : isDebt ? '#b45309' : '#15803d', border: `1px solid ${isRefunded ? '#e2e8f0' : isDebt ? '#fde68a' : '#bbf7d0'}` }}>
                    {isRefunded ? (isAr ? 'مسترجع' : 'Refunded') : isDebt ? (isAr ? 'دين' : 'Debt') : (isAr ? 'مدفوع' : 'Paid')}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => openReceipt(sale)} disabled={loadingDetail} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: loadingDetail ? 0.6 : 1 }}>
                    {isAr ? 'عرض' : 'View'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoal, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
            {isAr ? '→' : '←'}
          </button>
          <span style={{ padding: '7px 16px', fontSize: 13, color: C.textMuted }}>{isAr ? `${page} من ${totalPages}` : `${page} of ${totalPages}`}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoal, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
            {isAr ? '←' : '→'}
          </button>
        </div>
      )}

      {selectedSale && (
        <ReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} fmt={fmt} language={language} isRTL={isRTL} C={C} />
      )}
    </div>
  );
}