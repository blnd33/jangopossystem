import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function SalesReport() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [salesRes, top, pm, chart] = await Promise.all([
        api.pos.getSales({ per_page: 1000 }),
        api.dashboard.getTopProducts({ limit: 5 }),
        api.dashboard.getPaymentMethods(),
        api.dashboard.getSalesChart({ days: 7 }),
      ]);
      setSales(salesRes.sales || []);
      setTopProducts(top);
      setPaymentMethods(pm);

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const match = chart.find(r => r.date === dateStr);
        return {
          label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'short', day: 'numeric' }),
          revenue: match ? parseFloat(match.revenue.toFixed(2)) : 0,
          profit: match ? parseFloat((match.revenue * 0.4).toFixed(2)) : 0,
        };
      });
      setChartData(last7);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function filterByPeriod(items) {
    if (period === 'daily') return items.filter(i => (i.created_at || '').split('T')[0] === selectedDate);
    if (period === 'monthly') return items.filter(i => (i.created_at || '').startsWith(selectedMonth));
    if (period === 'yearly') return items.filter(i => (i.created_at || '').startsWith(selectedYear));
    return items;
  }

  const filtered = filterByPeriod(sales);
  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = filtered.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
  const grossProfit = totalRevenue * 0.4;

  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7); });
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      <div style={{ marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('salesReport')}</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{filtered.length} {language === 'ar' ? 'معاملة' : 'transactions'}</div>
      </div>

      {/* Period Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[
            { id: 'daily', label: language === 'ar' ? 'يومي' : 'Daily' },
            { id: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' },
            { id: 'yearly', label: language === 'ar' ? 'سنوي' : 'Yearly' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', background: period === p.id ? C.charcoal : C.white, color: period === p.id ? '#fff' : C.charcoalMid, fontSize: 12, fontWeight: period === p.id ? 600 : 400 }}>
              {p.label}
            </button>
          ))}
        </div>
        {period === 'daily' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal }} />}
        {period === 'monthly' && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {period === 'yearly' && (
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 20 }}>
        {[
          { label: t('revenue'), value: fmt(totalRevenue), color: C.success },
          { label: t('grossProfit'), value: fmt(grossProfit), color: C.info },
          { label: t('amountPaid'), value: fmt(totalPaid), color: C.success },
          { label: language === 'ar' ? 'عدد المعاملات' : 'Transactions', value: filtered.length, color: C.warning },
        ].map(card => (
          <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 16px', borderTop: `3px solid ${card.color}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {period === 'monthly' && (
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', marginBottom: isMobile ? 14 : 20, boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('last7Days')}</div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={isMobile ? 40 : 60} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }} />
              <Bar dataKey="revenue" fill={C.info} radius={[3, 3, 0, 0]} name={t('revenue')} />
              <Bar dataKey="profit" fill={C.success} radius={[3, 3, 0, 0]} name={t('grossProfit')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Methods + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '18px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('paymentMethods')}</div>
          {paymentMethods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : paymentMethods.map(pm => (
            <div key={pm.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.charcoal, textTransform: 'capitalize' }}>{pm.method}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{pm.count} {language === 'ar' ? 'معاملة' : 'transactions'}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{fmt(pm.total)}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '18px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('topProducts')}</div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : topProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? `${C.red}20` : C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? C.red : C.charcoalMid, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{p.qty_sold} {t('unitsSold')}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales List */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: `0 1px 4px ${C.shadow}` }}>
        <div style={{ padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ width: 4, height: 18, background: C.red, borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{language === 'ar' ? 'تفاصيل المبيعات' : 'Sales Details'}</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted }}>{t('noData')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {isMobile ? (
              <div style={{ padding: '8px 0' }}>
                {filtered.map((sale, i) => (
                  <div key={sale.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : `${C.offWhite}66` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{sale.customer || 'Walk-in'}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          {new Date(sale.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short' })}
                          {' · '}{sale.payment_method}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{fmt(sale.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.offWhite }}>
                    {[language === 'ar' ? 'رقم الفاتورة' : 'Invoice #', t('customers'), t('date'), t('paymentMethod'), t('total'), t('amountPaid')].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: isRTL ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale, i) => (
                    <tr key={sale.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : `${C.offWhite}66` }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: C.charcoal, fontWeight: 600 }}>#{sale.invoice_number}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: C.charcoal }}>{sale.customer || 'Walk-in'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>{new Date(sale.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: C.charcoal, textTransform: 'capitalize' }}>{sale.payment_method}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: C.charcoal }}>{fmt(sale.total)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: C.success, fontWeight: 600 }}>{fmt(sale.amount_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}