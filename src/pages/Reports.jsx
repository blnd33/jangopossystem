import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getSales, getExpenses, getProducts, getCustomers,
  getEmployees, getPurchaseOrders, getReturns, getSuppliers
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

const PERIODS = ['daily', 'monthly', 'yearly', 'custom'];

export default function Reports() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeReport, setActiveReport] = useState('full');

  useEffect(() => {
    setSales(getSales());
    setExpenses(getExpenses());
    setProducts(getProducts());
    setCustomers(getCustomers());
    setEmployees(getEmployees());
    setOrders(getPurchaseOrders());
    setReturns(getReturns());
    setSuppliers(getSuppliers());
  }, []);

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

  const filteredSales = filterByPeriod(sales, 'date');
  const filteredExpenses = filterByPeriod(expenses, 'date');
  const filteredOrders = filterByPeriod(orders, 'orderDate');
  const filteredReturns = filterByPeriod(returns, 'date');

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCogs = filteredSales.reduce((sum, s) => sum + s.items.reduce((ps, item) => ps + item.costPrice * item.qty, 0), 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const totalPaid = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalRemaining = filteredSales.reduce((sum, s) => sum + s.remaining, 0);
  const totalRefunds = filteredReturns.filter(r => r.status === 'Approved' && r.returnType === 'Refund').reduce((sum, r) => sum + r.refundAmount, 0);
  const totalOrdersValue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDebt = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
  const activeEmployees = employees.filter(e => e.status === 'Active');
  const totalSalaries = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const productSales = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0, profit: 0 };
      productSales[item.name].qty += item.qty;
      productSales[item.name].revenue += item.sellPrice * item.qty;
      productSales[item.name].profit += (item.sellPrice - item.costPrice) * item.qty;
    });
  });
  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const paymentBreakdown = filteredSales.reduce((acc, s) => {
    const method = s.paymentMethod || 'cash';
    if (!acc[method]) acc[method] = { count: 0, amount: 0 };
    acc[method].count += 1;
    acc[method].amount += s.total;
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
    { id: 'full', label: language === 'ar' ? 'تقرير شامل' : 'Full Report', icon: '📊' },
    { id: 'sales', label: t('salesReport'), icon: '💰' },
    { id: 'expenses', label: t('expenses'), icon: '💸' },
    { id: 'pl', label: t('pl'), icon: '📈' },
    { id: 'cashflow', label: t('cashflow'), icon: '💵' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'customers', label: t('customers'), icon: '👥' },
    { id: 'employees', label: t('employees'), icon: '👨‍💼' },
    { id: 'orders', label: t('purchaseOrders'), icon: '📋' },
  ];

  const printStyle = `
    @media print {
      @page { size: A4; margin: 15mm; }
      body * { visibility: hidden !important; }
      #print-report, #print-report * { visibility: visible !important; }
      #print-report {
        position: fixed !important;
        left: 0 !important; top: 0 !important;
        width: 100% !important; padding: 0 !important;
      }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  `;

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div style={{ padding: 24, direction: dir, fontFamily }}>
      <style>{printStyle}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {language === 'ar' ? 'اطبع أي تقرير تريده' : 'Print any report you need'}
          </div>
        </div>
        <button onClick={() => window.print()} style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
          border: 'none', borderRadius: 8, padding: '10px 24px',
          color: COLORS.white, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          🖨️ {language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
        </button>
      </div>

      {/* Controls */}
      <div className="no-print" style={{
        background: COLORS.white, borderRadius: 12,
        border: `1px solid ${COLORS.border}`, padding: '20px 24px', marginBottom: 20
      }}>
        {/* Report Type */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {language === 'ar' ? 'نوع التقرير' : 'Report Type'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {REPORTS.map(r => (
              <button key={r.id} onClick={() => setActiveReport(r.id)} style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${activeReport === r.id ? COLORS.red : COLORS.border}`,
                background: activeReport === r.id ? `${COLORS.red}12` : COLORS.white,
                color: activeReport === r.id ? COLORS.red : COLORS.charcoalMid,
                fontSize: 12, fontWeight: activeReport === r.id ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {language === 'ar' ? 'الفترة الزمنية' : 'Period'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {[
                { id: 'daily', label: language === 'ar' ? 'يومي' : 'Daily' },
                { id: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' },
                { id: 'yearly', label: language === 'ar' ? 'سنوي' : 'Yearly' },
                { id: 'custom', label: language === 'ar' ? 'مخصص' : 'Custom' },
              ].map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                  padding: '8px 16px', border: 'none', cursor: 'pointer',
                  background: period === p.id ? COLORS.charcoal : COLORS.white,
                  color: period === p.id ? COLORS.white : COLORS.charcoalMid,
                  fontSize: 12, fontWeight: period === p.id ? 600 : 400
                }}>
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'daily' && (
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
            )}
            {period === 'monthly' && (
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {period === 'yearly' && (
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {period === 'custom' && (
              <>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
                <span style={{ lineHeight: '36px', color: COLORS.textMuted }}>→</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── PRINTABLE REPORT ── */}
      <div id="print-report" style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '32px 36px', fontFamily }}>

        {/* Report Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${COLORS.charcoal}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.charcoal, letterSpacing: 1, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {language === 'ar' ? 'جانغو' : companyName.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{companyAddress} {companyPhone && `· ${companyPhone}`}</div>
          <div style={{ marginTop: 12, display: 'inline-block', background: COLORS.charcoal, color: COLORS.white, padding: '4px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            {REPORTS.find(r => r.id === activeReport)?.icon} {REPORTS.find(r => r.id === activeReport)?.label}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
            {language === 'ar' ? 'الفترة:' : 'Period:'} {getPeriodLabel()}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            {language === 'ar' ? 'تاريخ الطباعة:' : 'Printed:'} {new Date().toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB')}
          </div>
        </div>

        {/* ── FULL REPORT ── */}
        {(activeReport === 'full' || activeReport === 'pl') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '📊 ملخص الأرباح والخسائر' : '📊 Profit & Loss Summary'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'} value={fmt(totalRevenue)} color={COLORS.success} bold />
                <TR label={language === 'ar' ? 'تكلفة البضاعة' : 'Cost of Goods Sold'} value={`-${fmt(totalCogs)}`} color={COLORS.red} />
                <TR label={language === 'ar' ? 'إجمالي الربح' : 'Gross Profit'} value={fmt(grossProfit)} color={grossProfit >= 0 ? COLORS.success : COLORS.red} bold highlight />
                <TR label={language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'} value={`-${fmt(totalExpenses)}`} color={COLORS.red} />
                <TR label={language === 'ar' ? 'صافي الربح / الخسارة' : 'Net Profit / Loss'} value={fmt(netProfit)} color={netProfit >= 0 ? COLORS.success : COLORS.red} bold highlight />
                <TR label={language === 'ar' ? 'هامش الربح الصافي' : 'Net Margin'} value={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'} color={COLORS.info} />
              </tbody>
            </table>
          </div>
        )}

        {/* ── SALES ── */}
        {(activeReport === 'full' || activeReport === 'sales') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '💰 تقرير المبيعات' : '💰 Sales Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'عدد الفواتير' : 'Total Transactions'} value={filteredSales.length} />
                <TR label={language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'} value={fmt(totalRevenue)} color={COLORS.success} bold />
                <TR label={language === 'ar' ? 'المبلغ المحصل' : 'Amount Collected'} value={fmt(totalPaid)} color={COLORS.success} />
                <TR label={language === 'ar' ? 'المبلغ المتبقي' : 'Remaining Balance'} value={fmt(totalRemaining)} color={COLORS.red} />
                <TR label={language === 'ar' ? 'متوسط قيمة الفاتورة' : 'Avg Transaction Value'} value={filteredSales.length > 0 ? fmt(totalRevenue / filteredSales.length) : fmt(0)} />
              </tbody>
            </table>

            {/* Payment Breakdown */}
            {Object.keys(paymentBreakdown).length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'تفصيل طرق الدفع' : 'Payment Methods Breakdown'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'عدد المعاملات' : 'Count'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(paymentBreakdown).map(([method, data]) => (
                      <tr key={method} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={tdStyle(isRTL)}>{t(method) || method}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{data.count}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(data.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Top Products */}
            {topProducts.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'أفضل المنتجات مبيعاً' : 'Top Selling Products'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{t('productName')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'الربح' : 'Profit'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.name} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{p.name}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{p.qty}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(p.revenue)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: COLORS.success, fontWeight: 600 }}>{fmt(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* All Sales */}
            {filteredSales.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'تفاصيل المبيعات' : 'Sales Details'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                      <th style={thStyle(isRTL)}>{t('customers')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('date')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('total')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('amountPaid')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('remaining')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale, i) => (
                      <tr key={sale.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>#{sale.id.slice(-6).toUpperCase()}</td>
                        <td style={tdStyle(isRTL)}>{sale.customerName}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{new Date(sale.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB')}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(sale.total)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: COLORS.success }}>{fmt(sale.amountPaid)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: sale.remaining > 0 ? COLORS.red : COLORS.success }}>{fmt(sale.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── EXPENSES ── */}
        {(activeReport === 'full' || activeReport === 'expenses') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '💸 تقرير المصروفات' : '💸 Expenses Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'عدد المصروفات' : 'Total Entries'} value={filteredExpenses.length} />
                <TR label={language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'} value={fmt(totalExpenses)} color={COLORS.red} bold />
              </tbody>
            </table>

            {Object.keys(expenseByCategory).length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'المصروفات حسب الفئة' : 'By Category'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'النسبة' : '%'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount], i) => (
                      <tr key={cat} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{cat}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(amount)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: COLORS.textMuted }}>{totalExpenses > 0 ? `${((amount / totalExpenses) * 100).toFixed(1)}%` : '0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {filteredExpenses.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'تفاصيل المصروفات' : 'Expenses Details'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'العنوان' : 'Title'}</th>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'المورد' : 'Vendor'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('date')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((exp, i) => (
                      <tr key={exp.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{exp.title}</td>
                        <td style={tdStyle(isRTL)}>{exp.category}</td>
                        <td style={tdStyle(isRTL)}>{exp.vendor || '—'}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{new Date(exp.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB')}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600, color: COLORS.red }}>{fmt(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── CASH FLOW ── */}
        {(activeReport === 'full' || activeReport === 'cashflow') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '💵 التدفق النقدي' : '💵 Cash Flow'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'الأموال الواردة (مبيعات)' : 'Money In (Sales)'} value={fmt(totalPaid)} color={COLORS.success} bold />
                <TR label={language === 'ar' ? 'الأموال الصادرة (مصروفات)' : 'Money Out (Expenses)'} value={`-${fmt(totalExpenses)}`} color={COLORS.red} bold />
                <TR label={language === 'ar' ? 'المبالغ المستردة (مرتجعات)' : 'Refunds Paid'} value={`-${fmt(totalRefunds)}`} color={COLORS.red} />
                <TR label={language === 'ar' ? 'صافي التدفق النقدي' : 'Net Cash Flow'} value={fmt(totalPaid - totalExpenses - totalRefunds)} color={(totalPaid - totalExpenses - totalRefunds) >= 0 ? COLORS.success : COLORS.red} bold highlight />
              </tbody>
            </table>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {(activeReport === 'full' || activeReport === 'inventory') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '📦 تقرير المخزون' : '📦 Inventory Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'} value={products.length} />
                <TR label={language === 'ar' ? 'قيمة المخزون (تكلفة)' : 'Inventory Value (Cost)'} value={fmt(inventoryValue)} color={COLORS.info} bold />
                <TR label={language === 'ar' ? 'قيمة المخزون (بيع)' : 'Inventory Value (Retail)'} value={fmt(inventoryRetailValue)} color={COLORS.success} bold />
                <TR label={language === 'ar' ? 'الربح المتوقع' : 'Potential Profit'} value={fmt(inventoryRetailValue - inventoryValue)} color={COLORS.success} />
                <TR label={language === 'ar' ? 'منتجات نفد مخزونها' : 'Out of Stock'} value={products.filter(p => p.stock === 0).length} color={COLORS.red} />
                <TR label={language === 'ar' ? 'منتجات مخزونها منخفض' : 'Low Stock'} value={products.filter(p => p.stock > 0 && p.stock <= (p.lowStockAlert || 5)).length} color={COLORS.warning} />
              </tbody>
            </table>

            {products.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'تفاصيل المنتجات' : 'Product Details'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{t('productName')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('costPrice')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('sellPrice')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'قيمة المخزون' : 'Stock Value'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: p.stock === 0 ? `${COLORS.red}08` : i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{p.name}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: p.stock === 0 ? COLORS.red : p.stock <= (p.lowStockAlert || 5) ? COLORS.warning : COLORS.success, fontWeight: 600 }}>{p.stock}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{fmt(p.costPrice)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{fmt(p.sellPrice)}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(p.costPrice * p.stock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {(activeReport === 'full' || activeReport === 'customers') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '👥 تقرير العملاء' : '👥 Customer Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'} value={customers.length} />
                <TR label={language === 'ar' ? 'عملاء VIP' : 'VIP Customers'} value={customers.filter(c => c.tag === 'VIP').length} />
                <TR label={language === 'ar' ? 'إجمالي الديون' : 'Total Customer Debt'} value={fmt(totalDebt)} color={COLORS.red} bold />
              </tbody>
            </table>

            {customers.filter(c => c.balance < 0).length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'العملاء المدينون' : 'Customers with Debt'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th style={thStyle(isRTL)}>{t('phone')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'المديونية' : 'Debt'}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.filter(c => c.balance < 0).sort((a, b) => a.balance - b.balance).map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{c.name}</td>
                        <td style={tdStyle(isRTL)}>{c.phone}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', color: COLORS.red, fontWeight: 700 }}>{fmt(Math.abs(c.balance))}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{fmt(c.totalSpent || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── EMPLOYEES ── */}
        {(activeReport === 'full' || activeReport === 'employees') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '👨‍💼 تقرير الموظفين' : '👨‍💼 Employee Report'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'الموظفون النشطون' : 'Active Employees'} value={activeEmployees.length} />
                <TR label={language === 'ar' ? 'إجمالي الرواتب الشهرية' : 'Total Monthly Salaries'} value={fmt(totalSalaries)} color={COLORS.red} bold />
                <TR label={language === 'ar' ? 'إجمالي الرواتب السنوية' : 'Total Annual Salaries'} value={fmt(totalSalaries * 12)} color={COLORS.red} />
              </tbody>
            </table>

            {activeEmployees.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'قائمة الموظفين' : 'Employee List'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'الوظيفة' : 'Role'}</th>
                      <th style={thStyle(isRTL)}>{t('phone')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{language === 'ar' ? 'الراتب الشهري' : 'Monthly Salary'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEmployees.map((emp, i) => (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>{emp.name}</td>
                        <td style={tdStyle(isRTL)}>{emp.role}</td>
                        <td style={tdStyle(isRTL)}>{emp.phone}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(emp.salary)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${COLORS.charcoal}`, background: COLORS.offWhite }}>
                      <td colSpan={3} style={{ ...tdStyle(isRTL), fontWeight: 700 }}>{language === 'ar' ? 'الإجمالي' : 'Total'}</td>
                      <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 800, color: COLORS.red }}>{fmt(totalSalaries)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── PURCHASE ORDERS ── */}
        {(activeReport === 'full' || activeReport === 'orders') && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={language === 'ar' ? '📋 أوامر الشراء' : '📋 Purchase Orders'} />
            <table style={tableStyle}>
              <tbody>
                <TR label={language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'} value={filteredOrders.length} />
                <TR label={language === 'ar' ? 'قيمة الطلبات' : 'Total Value'} value={fmt(totalOrdersValue)} color={COLORS.info} bold />
                <TR label={language === 'ar' ? 'طلبات مستلمة وغير مدفوعة' : 'Received & Unpaid'} value={fmt(filteredOrders.filter(o => o.status === 'Received').reduce((sum, o) => sum + o.total, 0))} color={COLORS.red} />
              </tbody>
            </table>

            {filteredOrders.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoalMid, margin: '16px 0 8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'تفاصيل الطلبات' : 'Order Details'}
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: COLORS.offWhite }}>
                      <th style={thStyle(isRTL)}>{language === 'ar' ? 'رقم الطلب' : 'PO #'}</th>
                      <th style={thStyle(isRTL)}>{t('suppliers')}</th>
                      <th style={thStyle(isRTL)}>{t('status')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('date')}</th>
                      <th style={{ ...thStyle(isRTL), textAlign: 'right' }}>{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                        <td style={tdStyle(isRTL)}>#{order.id.slice(-6).toUpperCase()}</td>
                        <td style={tdStyle(isRTL)}>{suppliers.find(s => s.id === order.supplierId)?.name || '—'}</td>
                        <td style={tdStyle(isRTL)}>{order.status}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right' }}>{new Date(order.orderDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB')}</td>
                        <td style={{ ...tdStyle(isRTL), textAlign: 'right', fontWeight: 600 }}>{fmt(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Report Footer */}
        <div style={{ borderTop: `1px dashed ${COLORS.border}`, paddingTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {language === 'ar' ? 'تم إنشاء هذا التقرير بواسطة' : 'Report generated by'} {companyName} POS
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            {new Date().toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-GB')}
          </div>
          <div style={{ marginTop: 8, fontSize: 9, color: '#aaa', letterSpacing: 0.5 }}>
            Powered by CodaTechAgency
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──
function SectionTitle({ title }) {
  return (
    <div style={{
      fontSize: 15, fontWeight: 700, color: COLORS.charcoal,
      marginBottom: 10, paddingBottom: 6,
      borderBottom: `2px solid ${COLORS.charcoal}`
    }}>
      {title}
    </div>
  );
}

function TR({ label, value, color, bold, highlight }) {
  return (
    <tr style={{
      borderBottom: `1px solid ${COLORS.border}`,
      background: highlight ? `${color}08` : 'none'
    }}>
      <td style={{ padding: '8px 12px', fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 400, color: COLORS.charcoal, width: '60%' }}>
        {label}
      </td>
      <td style={{ padding: '8px 12px', fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 500, color: color || COLORS.charcoal, textAlign: 'right' }}>
        {value}
      </td>
    </tr>
  );
}

const tableStyle = {
  width: '100%', borderCollapse: 'collapse',
  border: `1px solid ${COLORS.border}`, borderRadius: 8,
  overflow: 'hidden', marginBottom: 8
};

function thStyle(isRTL) {
  return {
    padding: '8px 12px', fontSize: 11, fontWeight: 700,
    color: COLORS.textMuted, textAlign: isRTL ? 'right' : 'left',
    textTransform: 'uppercase', letterSpacing: 0.5
  };
}

function tdStyle(isRTL) {
  return {
    padding: '8px 12px', fontSize: 12,
    color: COLORS.charcoal, textAlign: isRTL ? 'right' : 'left'
  };
}