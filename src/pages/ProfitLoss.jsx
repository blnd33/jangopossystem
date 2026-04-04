import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSales, getExpenses } from '../data/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ProfitLoss() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    setSales(getSales());
    setExpenses(getExpenses());
  }, []);

  function filterByPeriod(items, dateKey) {
    if (period === 'month') return items.filter(i => i[dateKey].startsWith(selectedMonth));
    if (period === 'year') return items.filter(i => i[dateKey].startsWith(selectedYear));
    return items;
  }

  const filteredSales = filterByPeriod(sales, 'date');
  const filteredExpenses = filterByPeriod(expenses, 'date');

  const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const cogs = filteredSales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) => ps + item.costPrice * item.qty, 0), 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  // Monthly trend for chart (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = d.toISOString().slice(0, 7);
    const mSales = sales.filter(s => s.date.startsWith(monthStr));
    const mExpenses = expenses.filter(e => e.date.startsWith(monthStr));
    const mRevenue = mSales.reduce((sum, s) => sum + s.total, 0);
    const mCogs = mSales.reduce((sum, s) =>
      sum + s.items.reduce((ps, item) => ps + item.costPrice * item.qty, 0), 0);
    const mGrossProfit = mRevenue - mCogs;
    const mExpTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mNetProfit = mGrossProfit - mExpTotal;
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      revenue: parseFloat(mRevenue.toFixed(2)),
      grossProfit: parseFloat(mGrossProfit.toFixed(2)),
      netProfit: parseFloat(mNetProfit.toFixed(2)),
      expenses: parseFloat(mExpTotal.toFixed(2)),
    };
  });

  // Expense breakdown for pie
  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [COLORS.red, COLORS.info, COLORS.warning, COLORS.success, '#8B5CF6', '#EC4899', COLORS.charcoalMid, COLORS.steelDark];

  const months = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  const plRows = [
    { label: 'Revenue', value: revenue, type: 'revenue', bold: false },
    { label: 'Cost of Goods Sold (COGS)', value: -cogs, type: 'expense', bold: false },
    { label: 'Gross Profit', value: grossProfit, type: grossProfit >= 0 ? 'profit' : 'loss', bold: true, highlight: true },
    { label: `Gross Margin`, value: null, note: `${grossMargin}%`, bold: false },
    { label: 'Operating Expenses', value: -totalExpenses, type: 'expense', bold: false },
    { label: 'Net Profit / Loss', value: netProfit, type: netProfit >= 0 ? 'profit' : 'loss', bold: true, highlight: true },
    { label: 'Net Margin', value: null, note: `${netMargin}%`, bold: false },
  ];

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Profit & Loss
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            Financial performance overview
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, overflow: 'hidden'
          }}>
            {['month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer',
                background: period === p ? COLORS.charcoal : COLORS.white,
                color: period === p ? COLORS.white : COLORS.charcoalMid,
                fontSize: 12, fontWeight: period === p ? 600 : 400,
                textTransform: 'capitalize'
              }}>
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {period === 'month' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 12px', border: `1px solid ${COLORS.border}`,
                borderRadius: 8, fontSize: 13, outline: 'none',
                background: COLORS.white, cursor: 'pointer'
              }}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}

          {period === 'year' && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{
                padding: '8px 12px', border: `1px solid ${COLORS.border}`,
                borderRadius: 8, fontSize: 13, outline: 'none',
                background: COLORS.white, cursor: 'pointer'
              }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* P&L Statement */}
      <div style={{
        background: COLORS.white, borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: COLORS.charcoal,
          marginBottom: 16, paddingBottom: 12,
          borderBottom: `2px solid ${COLORS.charcoal}`,
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>Income Statement</span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 400 }}>
            {period === 'month' ? selectedMonth : period === 'year' ? selectedYear : 'All Time'}
          </span>
        </div>

        {plRows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            padding: row.highlight ? '12px 14px' : '8px 4px',
            marginBottom: row.highlight ? 8 : 0,
            background: row.highlight
              ? row.type === 'profit' ? `${COLORS.success}12` : `${COLORS.red}12`
              : 'none',
            borderRadius: row.highlight ? 8 : 0,
            borderTop: row.highlight ? `1px solid ${row.type === 'profit' ? COLORS.success : COLORS.red}33` : 'none',
          }}>
            <span style={{
              fontSize: row.bold ? 14 : 13,
              fontWeight: row.bold ? 700 : 400,
              color: row.highlight
                ? row.type === 'profit' ? COLORS.success : COLORS.red
                : COLORS.charcoal
            }}>
              {row.label}
            </span>
            <span style={{
              fontSize: row.bold ? 16 : 14,
              fontWeight: row.bold ? 800 : 500,
              color: row.note ? COLORS.textMuted
                : row.type === 'revenue' ? COLORS.success
                : row.type === 'expense' ? COLORS.red
                : row.type === 'profit' ? COLORS.success
                : COLORS.red,
              fontFamily: row.bold ? 'Georgia, serif' : 'inherit'
            }}>
              {row.note ? row.note : row.value >= 0
                ? `$${row.value.toFixed(2)}`
                : `-$${Math.abs(row.value).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Revenue', value: `$${revenue.toFixed(2)}`, color: COLORS.success },
          { label: 'Gross Profit', value: `$${grossProfit.toFixed(2)}`, color: COLORS.info },
          { label: 'Net Profit', value: `$${netProfit.toFixed(2)}`, color: netProfit >= 0 ? COLORS.success : COLORS.red },
          { label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}`, color: COLORS.red },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Trend Chart */}
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>
            6-Month Trend
          </div>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(v, n) => [`$${v.toFixed(2)}`, n]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill={COLORS.charcoal} radius={[3, 3, 0, 0]} name="Revenue" />
                <Bar dataKey="grossProfit" fill={COLORS.info} radius={[3, 3, 0, 0]} name="Gross Profit" />
                <Bar dataKey="netProfit" fill={COLORS.red} radius={[3, 3, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense Pie */}
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>
            Expense Breakdown
          </div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
              No expense data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`$${v.toFixed(2)}`]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}