import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

export default function Reports() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeReport, setActiveReport] = useState('full');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [salesRes, expsRes, prodsRes, custsRes, empsRes, ordersRes, pmRes, topRes] = await Promise.all([
        api.pos.getSales({ per_page: 1000 }),
        api.expenses.getAll(),
        api.products.getAll(),
        api.customers.getAll(),
        api.employees.getAll(),
        api.purchaseOrders.getAll(),
        api.dashboard.getPaymentMethods(),
        api.dashboard.getTopProducts({ limit: 20 }),
      ]);
      setSales(salesRes.sales || []);
      setExpenses(expsRes);
      setProducts(prodsRes);
      setCustomers(custsRes);
      setEmployees(empsRes);
      setOrders(ordersRes);
      setPaymentMethods(pmRes);
      setTopProducts(topRes);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const companyAddress = settings.address || 'Sulaymaniyah, Iraq';
  const companyPhone = settings.phone || '';

  function filterByPeriod(items, dateKey) {
    if (period === 'daily') return items.filter(i => (i[dateKey] || '').split('T')[0] === selectedDate);
    if (period === 'monthly') return items.filter(i => (i[dateKey] || '').startsWith(selectedMonth));
    if (period === 'yearly') return items.filter(i => (i[dateKey] || '').startsWith(selectedYear));
    if (period === 'custom' && customStart && customEnd) {
      return items.filter(i => {
        const d = (i[dateKey] || '').split('T')[0];
        return d >= customStart && d <= customEnd;
      });
    }
    return items;
  }

  const filteredSales = filterByPeriod(sales, 'created_at');
  const filteredExpenses = filterByPeriod(expenses, 'date');
  const filteredOrders = filterByPeriod(orders, 'order_date');

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalExpensesAmt = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue * 0.4;
  const netProfit = grossProfit - totalExpensesAmt;
  const totalPaid = filteredSales.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
  const totalOrdersValue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const inventoryValue = products.filter(p => p.is_active).reduce((sum, p) => sum + (p.cost || 0) * p.stock, 0);
  const inventoryRetailValue = products.filter(p => p.is_active).reduce((sum, p) => sum + p.price * p.stock, 0);
  const activeEmployees = employees.filter(e => e.status === 'Active');
  const totalSalaries = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {});

  function getPeriodLabel() {
    if (period === 'daily') return selectedDate;
    if (period === 'monthly') return selectedMonth;
    if (period === 'yearly') return selectedYear;
    if (period === 'custom') return `${customStart} → ${customEnd}`;
    return '';
  }

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const REPORTS = [
    { id: 'full', label: language === 'ar' ? 'شامل' : 'Full', icon: '📊' },
    { id: 'sales', label: isMobile ? (language === 'ar' ? 'مبيعات' : 'Sales') : t('salesReport'), icon: '💰' },
    { id: 'expenses', label: isMobile ? (language === 'ar' ? 'مصروفات' : 'Expenses') : t('expenses'), icon: '💸' },
    { id: 'pl', label: 'P&L', icon: '📈' },
    { id: 'cashflow', label: isMobile ? (language === 'ar' ? 'نقدي' : 'Cash') : t('cashflow'), icon: '💵' },
    { id: 'inventory', label: isMobile ? (language === 'ar' ? 'مخزون' : 'Stock') : t('inventory'), icon: '📦' },
    { id: 'customers', label: isMobile ? (language === 'ar' ? 'عملاء' : 'Customers') : t('customers'), icon: '👥' },
    { id: 'employees', label: isMobile ? (language === 'ar' ? 'موظفون' : 'Staff') : t('employees'), icon: '👨‍💼' },
    { id: 'orders', label: isMobile ? (language === 'ar' ? 'طلبات' : 'Orders') : t('purchaseOrders'), icon: '📋' },
  ];

  const printStyle = `@media print { @page { size: A4; margin: 15mm; } body * { visibility: hidden !important; } #print-report, #print-report * { visibility: visible !important; } #print-report { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; } .no-print { display: none !important; } }`;
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  function TR({ label, value, color, bold, highlight }) {
    return (
      <tr style={{ borderBottom: `1px solid ${C.border}`, background: highlight ? `${color}08` : 'none' }}>
        <td style={{ padding: isMobile ? '7px 10px' : '8px 12px', fontSize: bold ? (isMobile ? 13 : 14) : (isMobile ? 11 : 13), fontWeight: bold ? 700 : 400, color: C.charcoal, width: '60%' }}>{label}</td>
        <td style={{ padding: isMobile ? '7px 10px' : '8px 12px', fontSize: bold ? (isMobile ? 14 : 15) : (isMobile ? 12 : 13), fontWeight: bold ? 800 : 500, color: color || C.charcoal, textAlign: 'right' }}>{value}</td>
      </tr>
    );
  }

  function SectionTitle({ title }) {
    return <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: C.charcoal, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${C.charcoal}` }}>{title}</div>;
  }

  const tableStyle = { width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 };
  const thS = () => ({ padding: isMobile ? '7px 10px' : '8px 12px', fontSize: isMobile ? 9 : 11, fontWeight: 700, color: C.textMuted, textAlign: isRTL ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: 0.5 });
  const tdS = () => ({ padding: isMobile ? '7px 10px' : '8px 12px', fontSize: isMobile ? 11 : 12, color: C.charcoal, textAlign: isRTL ? 'right' : 'left' });

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      <style>{printStyle}</style>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {language === 'ar' ? 'اطبع أي تقرير تريده' : 'Print any report you need'}
          </div>
        </div>
        <button onClick={() => window.print()} style={{ background: `linear-gradient(135deg, ${C.charcoal}, #1e293b)`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 24px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          🖨️ {isMobile ? '' : (language === 'ar' ? 'طباعة' : 'Print')}
        </button>
      </div>

      {/* Controls */}
      <div className="no-print" style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{language === 'ar' ? 'نوع التقرير' : 'Report Type'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {REPORTS.map(r => (
              <button key={r.id} onClick={() => setActiveReport(r.id)} style={{ padding: isMobile ? '6px 10px' : '7px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${activeReport === r.id ? C.red : C.border}`, background: activeReport === r.id ? `${C.red}12` : C.white, color: activeReport === r.id ? C.red : C.charcoalMid, fontSize: isMobile ? 11 : 12, fontWeight: activeReport === r.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{language === 'ar' ? 'الفترة' : 'Period'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {[
                { id: 'daily', label: language === 'ar' ? 'يومي' : 'Daily' },
                { id: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' },
                { id: 'yearly', label: language === 'ar' ? 'سنوي' : 'Yearly' },
                { id: 'custom', label: language === 'ar' ? 'مخصص' : 'Custom' },
              ].map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: isMobile ? '7px 10px' : '8px 14px', border: 'none', cursor: 'pointer', background: period === p.id ? C.charcoal : C.white, color: period === p.id ? '#fff' : C.charcoalMid, fontSize: isMobile ? 11 : 12, fontWeight: period === p.id ? 600 : 400 }}>
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'daily' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal }} />}
            {period === 'monthly' && (
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {period === 'yearly' && (
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {period === 'custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.white, color: C.charcoal }} />
                <span style={{ color: C.textMuted }}>→</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.white, color: C.charcoal }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT */}
      <div id="print-report" style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 16 : '28px 32px' }}>

        {/* Report Header */}
        <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: `2px solid ${C.charcoal}` }}>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: C.charcoal, letterSpacing: 1, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{language === 'ar' ? 'جانغو' : companyName.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{companyAddress} {companyPhone && `· ${companyPhone}`}</div>
          <div style={{ marginTop: 10, display: 'inline-block', background: C.charcoal, color: '#fff', padding: '4px 18px', borderRadius: 20, fontSize: isMobile ? 11 : 13, fontWeight: 700 }}>
            {REPORTS.find(r => r.id === activeReport)?.icon} {REPORTS.find(r => r.id === activeReport)?.label}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{language === 'ar' ? 'الفترة:' : 'Period:'} {getPeriodLabel()}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{language === 'ar' ? 'تاريخ الطباعة:' : 'Printed:'} {new Date().toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB')}</div>
        </div>

        {/* P&L */}
        {(activeReport === 'full' || activeReport === 'pl') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '📊 ملخص الأرباح والخسائر' : '📊 Profit & Loss Summary'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'} value={fmt(totalRevenue)} color={C.success} bold />
                <TR label={language === 'ar' ? 'إجمالي الربح (تقديري 40%)' : 'Gross Profit (est. 40%)'} value={fmt(grossProfit)} color={grossProfit >= 0 ? C.success : C.red} bold highlight />
                <TR label={language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'} value={`-${fmt(totalExpensesAmt)}`} color={C.red} />
                <TR label={language === 'ar' ? 'صافي الربح' : 'Net Profit'} value={fmt(netProfit)} color={netProfit >= 0 ? C.success : C.red} bold highlight />
                <TR label={language === 'ar' ? 'هامش الربح' : 'Net Margin'} value={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'} color={C.info} />
              </tbody>
            </table>
          </div>
        )}

        {/* Sales */}
        {(activeReport === 'full' || activeReport === 'sales') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '💰 تقرير المبيعات' : '💰 Sales Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'عدد الفواتير' : 'Transactions'} value={filteredSales.length} />
                <TR label={language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'} value={fmt(totalRevenue)} color={C.success} bold />
                <TR label={language === 'ar' ? 'المبلغ المحصل' : 'Collected'} value={fmt(totalPaid)} color={C.success} />
                <TR label={language === 'ar' ? 'متوسط الفاتورة' : 'Avg Transaction'} value={filteredSales.length > 0 ? fmt(totalRevenue / filteredSales.length) : fmt(0)} />
              </tbody>
            </table>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoalMid, margin: '14px 0 8px' }}>{language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}</div>
                <table style={tableStyle}>
                  <thead><tr style={{ background: C.offWhite }}>
                    <th style={thS()}>{language === 'ar' ? 'الطريقة' : 'Method'}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'العدد' : 'Count'}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  </tr></thead>
                  <tbody>
                    {paymentMethods.map(pm => (
                      <tr key={pm.method} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={tdS()}>{pm.method}</td>
                        <td style={{ ...tdS(), textAlign: 'right' }}>{pm.count}</td>
                        <td style={{ ...tdS(), textAlign: 'right', fontWeight: 600 }}>{fmt(pm.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Top Products */}
            {topProducts.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoalMid, margin: '14px 0 8px' }}>{language === 'ar' ? 'أفضل المنتجات' : 'Top Products'}</div>
                <table style={tableStyle}>
                  <thead><tr style={{ background: C.offWhite }}>
                    <th style={thS()}>{t('productName')}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'كمية' : 'Qty'}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'إيراد' : 'Revenue'}</th>
                  </tr></thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.offWhite }}>
                        <td style={tdS()}>{p.name}</td>
                        <td style={{ ...tdS(), textAlign: 'right' }}>{p.qty_sold}</td>
                        <td style={{ ...tdS(), textAlign: 'right', fontWeight: 600 }}>{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Expenses */}
        {(activeReport === 'full' || activeReport === 'expenses') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '💸 تقرير المصروفات' : '💸 Expenses Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'عدد المصروفات' : 'Total Entries'} value={filteredExpenses.length} />
                <TR label={language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'} value={fmt(totalExpensesAmt)} color={C.red} bold />
              </tbody>
            </table>
            {Object.keys(expenseByCategory).length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoalMid, margin: '14px 0 8px' }}>{language === 'ar' ? 'حسب الفئة' : 'By Category'}</div>
                <table style={tableStyle}>
                  <thead><tr style={{ background: C.offWhite }}>
                    <th style={thS()}>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th style={{ ...thS(), textAlign: 'right' }}>%</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount], i) => (
                      <tr key={cat} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.offWhite }}>
                        <td style={tdS()}>{cat}</td>
                        <td style={{ ...tdS(), textAlign: 'right', fontWeight: 600 }}>{fmt(amount)}</td>
                        <td style={{ ...tdS(), textAlign: 'right', color: C.textMuted }}>{totalExpensesAmt > 0 ? `${((amount / totalExpensesAmt) * 100).toFixed(1)}%` : '0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Cash Flow */}
        {(activeReport === 'full' || activeReport === 'cashflow') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '💵 التدفق النقدي' : '💵 Cash Flow'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'الأموال الواردة' : 'Money In'} value={fmt(totalPaid)} color={C.success} bold />
                <TR label={language === 'ar' ? 'الأموال الصادرة' : 'Money Out'} value={`-${fmt(totalExpensesAmt)}`} color={C.red} bold />
                <TR label={language === 'ar' ? 'صافي التدفق' : 'Net Cash Flow'} value={fmt(totalPaid - totalExpensesAmt)} color={(totalPaid - totalExpensesAmt) >= 0 ? C.success : C.red} bold highlight />
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory */}
        {(activeReport === 'full' || activeReport === 'inventory') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '📦 تقرير المخزون' : '📦 Inventory Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'} value={products.filter(p => p.is_active).length} />
                <TR label={language === 'ar' ? 'قيمة المخزون (تكلفة)' : 'Stock Value (Cost)'} value={fmt(inventoryValue)} color={C.info} bold />
                <TR label={language === 'ar' ? 'قيمة المخزون (بيع)' : 'Stock Value (Retail)'} value={fmt(inventoryRetailValue)} color={C.success} bold />
                <TR label={language === 'ar' ? 'الربح المتوقع' : 'Potential Profit'} value={fmt(inventoryRetailValue - inventoryValue)} color={C.success} />
                <TR label={language === 'ar' ? 'نفد المخزون' : 'Out of Stock'} value={products.filter(p => p.stock === 0 && p.is_active).length} color={C.red} />
                <TR label={language === 'ar' ? 'مخزون منخفض' : 'Low Stock'} value={products.filter(p => p.stock > 0 && p.stock <= (p.low_stock_alert || 5) && p.is_active).length} color={C.warning} />
              </tbody>
            </table>
          </div>
        )}

        {/* Customers */}
        {(activeReport === 'full' || activeReport === 'customers') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '👥 تقرير العملاء' : '👥 Customer Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'} value={customers.length} />
                <TR label={language === 'ar' ? 'إجمالي المشتريات' : 'Total Spent'} value={fmt(customers.reduce((s, c) => s + (c.total_spent || 0), 0))} color={C.success} bold />
              </tbody>
            </table>
          </div>
        )}

        {/* Employees */}
        {(activeReport === 'full' || activeReport === 'employees') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '👨‍💼 تقرير الموظفين' : '👨‍💼 Employee Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'موظفون نشطون' : 'Active Employees'} value={activeEmployees.length} />
                <TR label={language === 'ar' ? 'إجمالي الرواتب الشهرية' : 'Monthly Salaries'} value={fmt(totalSalaries)} color={C.red} bold />
                <TR label={language === 'ar' ? 'إجمالي الرواتب السنوية' : 'Annual Salaries'} value={fmt(totalSalaries * 12)} color={C.red} />
              </tbody>
            </table>
            {activeEmployees.length > 0 && (
              <table style={tableStyle}>
                <thead><tr style={{ background: C.offWhite }}>
                  <th style={thS()}>{t('name')}</th>
                  <th style={thS()}>{t('role')}</th>
                  <th style={{ ...thS(), textAlign: 'right' }}>{language === 'ar' ? 'الراتب' : 'Salary'}</th>
                </tr></thead>
                <tbody>
                  {activeEmployees.map((emp, i) => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.offWhite }}>
                      <td style={tdS()}>{emp.name}</td>
                      <td style={tdS()}>{emp.role}</td>
                      <td style={{ ...tdS(), textAlign: 'right', fontWeight: 600 }}>{fmt(emp.salary)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `2px solid ${C.charcoal}`, background: C.offWhite }}>
                    <td colSpan={2} style={{ ...tdS(), fontWeight: 700 }}>{language === 'ar' ? 'الإجمالي' : 'Total'}</td>
                    <td style={{ ...tdS(), textAlign: 'right', fontWeight: 800, color: C.red }}>{fmt(totalSalaries)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Purchase Orders */}
        {(activeReport === 'full' || activeReport === 'orders') && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle title={language === 'ar' ? '📋 أوامر الشراء' : '📋 Purchase Orders'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'} value={filteredOrders.length} />
                <TR label={language === 'ar' ? 'قيمة الطلبات' : 'Total Value'} value={fmt(totalOrdersValue)} color={C.info} bold />
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>{language === 'ar' ? 'تم إنشاء هذا التقرير بواسطة' : 'Generated by'} {companyName} POS</div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6, letterSpacing: 0.5 }}>Powered by CodaTechAgency</div>
        </div>
      </div>
    </div>
  );
}