import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

export default function ProfitLoss() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { fetchAll(); }, [period, selectedMonth, selectedYear]);

  async function fetchAll() {
    setLoading(true);
    try {
      let days = 30;
      if (period === 'year') days = 365;
      if (period === 'all') days = 3650;

      const [dashStats, chart, expenses, paymentMethods] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getSalesChart({ days: 180 }), // 6 months for trend
        api.expenses.getAll(),
        api.dashboard.getPaymentMethods(),
      ]);

      setStats(dashStats);

      // Build 6-month trend
      const trend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthStr = d.toISOString().slice(0, 7);
        const monthData = chart.filter(r => r.date.startsWith(monthStr));
        const revenue = monthData.reduce((sum, r) => sum + r.revenue, 0);
        return {
          label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { month: 'short' }),
          revenue: parseFloat(revenue.toFixed(2)),
          grossProfit: parseFloat((revenue * 0.4).toFixed(2)), // estimate
          netProfit: parseFloat((revenue * 0.25).toFixed(2)),  // estimate
          expenses: 0,
        };
      });
      setSalesChart(trend);

      // Filter expenses by period
      let filteredExpenses = expenses;
      if (period === 'month') filteredExpenses = expenses.filter(e => (e.date || '').startsWith(selectedMonth));
      else if (period === 'year') filteredExpenses = expenses.filter(e => (e.date || '').startsWith(selectedYear));
      setExpenseData(filteredExpenses);

    } catch (err) {
      console.error('ProfitLoss fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const revenue = period === 'month' ? (stats?.month?.revenue || 0)
    : period === 'year' ? (stats?.month?.revenue || 0) * 12
    : (stats?.month?.revenue || 0) * 12;

  const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = revenue * 0.4; // estimate without cost tracking per sale
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  const expenseByCategory = expenseData.reduce((acc, e) => {
    acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [C.red, C.info, C.warning, C.success, '#8B5CF6', '#EC4899', C.charcoalMid];

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const plRows = [
    { label: t('revenue'), value: revenue, type: 'revenue', bold: false },
    { label: t('grossProfit'), value: grossProfit, type: grossProfit >= 0 ? 'profit' : 'loss', bold: true, highlight: true },
    { label: t('grossMargin'), value: null, note: `${grossMargin}%`, bold: false },
    { label: t('operatingExpenses'), value: -totalExpenses, type: 'expense', bold: false },
    { label: t('netProfitLoss'), value: netProfit, type: netProfit >= 0 ? 'profit' : 'loss', bold: true, highlight: true },
    { label: t('netMargin'), value: null, note: `${netMargin}%`, bold: false },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{t('pl')}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{language === 'ar' ? 'نظرة عامة على الأداء المالي' : 'Financial performance overview'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {['month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: period === p ? C.charcoal : C.white, color: period === p ? '#fff' : C.charcoalMid, fontSize: 12, fontWeight: period === p ? 600 : 400 }}>
                {p === 'all' ? t('allTime') : t(p)}
              </button>
            ))}
          </div>
          {period === 'month' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {period === 'year' && (
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* P&L Statement */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${C.charcoal}`, display: 'flex', justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span>{t('incomeStatement')}</span>
          <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
            {period === 'month' ? selectedMonth : period === 'year' ? selectedYear : t('allTime')}
          </span>
        </div>
        {plRows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: row.highlight ? '12px 14px' : '8px 4px',
            marginBottom: row.highlight ? 8 : 0,
            background: row.highlight ? (row.type === 'profit' ? `${C.success}12` : `${C.red}12`) : 'none',
            borderRadius: row.highlight ? 8 : 0,
            borderTop: row.highlight ? `1px solid ${row.type === 'profit' ? C.success : C.red}33` : 'none',
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }}>
            <span style={{ fontSize: row.bold ? 14 : 13, fontWeight: row.bold ? 700 : 400, color: row.highlight ? (row.type === 'profit' ? C.success : C.red) : C.charcoal }}>
              {row.label}
            </span>
            <span style={{ fontSize: row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 500, color: row.note ? C.textMuted : row.type === 'revenue' ? C.success : row.type === 'expense' ? C.red : row.type === 'profit' ? C.success : C.red }}>
              {row.note ? row.note : row.value >= 0 ? fmt(row.value) : `-${fmt(Math.abs(row.value))}`}
            </span>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('revenue'), value: fmt(revenue), color: C.success },
          { label: t('grossProfit'), value: fmt(grossProfit), color: C.info },
          { label: t('netProfitLoss'), value: fmt(netProfit), color: netProfit >= 0 ? C.success : C.red },
          { label: t('totalExpenses'), value: fmt(totalExpenses), color: C.red },
        ].map(card => (
          <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 16 }}>{t('trendChart')}</div>
          {salesChart.every(d => d.revenue === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesChart} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }} />
                <Bar dataKey="revenue" fill={C.charcoal} radius={[3, 3, 0, 0]} name={t('revenue')} />
                <Bar dataKey="grossProfit" fill={C.info} radius={[3, 3, 0, 0]} name={t('grossProfit')} />
                <Bar dataKey="netProfit" fill={C.red} radius={[3, 3, 0, 0]} name={t('netProfitLoss')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 16 }}>{t('expenseBreakdown')}</div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Note about COGS */}
      <div style={{ marginTop: 16, padding: '10px 16px', background: `${C.info}10`, border: `1px solid ${C.info}33`, borderRadius: 8, fontSize: 12, color: C.info }}>
        💡 {language === 'ar'
          ? 'ملاحظة: يتم حساب الربح الإجمالي تقديرياً بنسبة 40% من الإيرادات. لحساب دقيق، تأكد من إدخال تكلفة المنتجات في المخزون.'
          : 'Note: Gross profit is estimated at 40% of revenue. For exact figures, ensure product costs are set in Inventory.'}
      </div>
    </div>
  );
}