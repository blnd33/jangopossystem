import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSales, getExpenses } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CashFlow() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    setSales(getSales());
    setExpenses(getExpenses());
  }, []);

  function buildDailyFlow() {
    let days = [];
    if (period === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      days = Array.from({ length: daysInMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return `${selectedMonth}-${day}`;
      });
    } else if (period === 'year') {
      days = Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return `${selectedYear}-${month}`;
      });
    } else {
      const allDates = [
        ...sales.map(s => s.date.slice(0, 7)),
        ...expenses.map(e => e.date.slice(0, 7))
      ];
      days = [...new Set(allDates)].sort();
    }

    let runningBalance = 0;
    return days.map(dateStr => {
      const isMonth = period !== 'month';
      const daySales = sales.filter(s => isMonth ? s.date.startsWith(dateStr) : s.date.split('T')[0] === dateStr);
      const dayExpenses = expenses.filter(e => isMonth ? e.date.startsWith(dateStr) : e.date === dateStr);
      const inflow = daySales.reduce((sum, s) => sum + s.amountPaid, 0);
      const outflow = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const net = inflow - outflow;
      runningBalance += net;

      const label = period === 'month'
        ? dateStr.split('-')[2]
        : period === 'year'
          ? new Date(dateStr + '-01').toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { month: 'short' })
          : dateStr;

      return {
        label,
        inflow: parseFloat(inflow.toFixed(2)),
        outflow: parseFloat(outflow.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        balance: parseFloat(runningBalance.toFixed(2)),
      };
    });
  }

  const flowData = buildDailyFlow();
  const totalInflow = flowData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = flowData.reduce((sum, d) => sum + d.outflow, 0);
  const netFlow = totalInflow - totalOutflow;
  const endingBalance = flowData.length > 0 ? flowData[flowData.length - 1].balance : 0;

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const paymentBreakdown = sales.reduce((acc, s) => {
    const method = s.paymentMethod || 'cash';
    if (!acc[method]) acc[method] = { count: 0, amount: 0 };
    acc[method].count += 1;
    acc[method].amount += s.total;
    return acc;
  }, {});

  const METHOD_COLORS = {
    cash: COLORS.success, card: COLORS.info,
    transfer: COLORS.warning, installment: '#8B5CF6',
  };

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('cashflow')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {t('moneyIn')} vs {t('moneyOut')}
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {['month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer',
                background: period === p ? COLORS.charcoal : COLORS.white,
                color: period === p ? COLORS.white : COLORS.charcoalMid,
                fontSize: 12, fontWeight: period === p ? 600 : 400
              }}>
                {p === 'all' ? t('allTime') : t(p)}
              </button>
            ))}
          </div>
          {period === 'month' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {period === 'year' && (
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('moneyIn'), value: fmt(totalInflow), color: COLORS.success, sub: t('totalInflow') },
          { label: t('moneyOut'), value: fmt(totalOutflow), color: COLORS.red, sub: t('totalOutflow') },
          { label: t('netFlow'), value: fmt(netFlow), color: netFlow >= 0 ? COLORS.success : COLORS.red, sub: netFlow >= 0 ? t('positive') : t('negative') },
          { label: t('endingBalance'), value: fmt(endingBalance), color: COLORS.info, sub: t('runningTotal') },
        ].map(card => (
          <div key={card.label} style={{ background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 4 }}>{t('cashFlowTime')}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
          {t('moneyIn')} · {t('moneyOut')} · {t('endingBalance')}
        </div>
        {flowData.every(d => d.inflow === 0 && d.outflow === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>{t('noDataPeriod')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={flowData}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.info} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip
                formatter={(v, n) => [fmt(v), n]}
                contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="inflow" stroke={COLORS.success} strokeWidth={2} fill="url(#inflowGrad)" name={t('moneyIn')} />
              <Area type="monotone" dataKey="outflow" stroke={COLORS.red} strokeWidth={2} fill="url(#outflowGrad)" name={t('moneyOut')} />
              <Area type="monotone" dataKey="balance" stroke={COLORS.info} strokeWidth={2} fill="url(#balanceGrad)" name={t('endingBalance')} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Payment Method Breakdown */}
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>{t('paymentMethods')}</div>
          {Object.keys(paymentBreakdown).length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : Object.entries(paymentBreakdown).map(([method, data]) => {
            const color = METHOD_COLORS[method] || COLORS.charcoalMid;
            const pct = totalInflow > 0 ? ((data.amount / totalInflow) * 100).toFixed(1) : 0;
            return (
              <div key={method} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal, textTransform: 'capitalize' }}>
                    {t(method) || method}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>
                    {fmt(data.amount)} ({pct}%)
                  </span>
                </div>
                <div style={{ height: 6, background: COLORS.offWhite, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  {data.count} {t('transactions')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Flow Table */}
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>{t('flowSummary')}</div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            {flowData.filter(d => d.inflow > 0 || d.outflow > 0).length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{t('noDataPeriod')}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, direction: isRTL ? 'rtl' : 'ltr' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {[t('period'), t('in'), t('out'), t('net')].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === t('period') ? (isRTL ? 'right' : 'left') : 'right', color: COLORS.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flowData.filter(d => d.inflow > 0 || d.outflow > 0).map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.offWhite}`, background: i % 2 === 0 ? 'none' : `${COLORS.offWhite}66` }}>
                      <td style={{ padding: '7px 8px', color: COLORS.charcoal, fontWeight: 500, textAlign: isRTL ? 'right' : 'left' }}>{row.label}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: COLORS.success, fontWeight: 500 }}>{fmt(row.inflow)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: COLORS.red, fontWeight: 500 }}>{fmt(row.outflow)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: row.net >= 0 ? COLORS.success : COLORS.red }}>
                        {row.net >= 0 ? '+' : '-'}{fmt(Math.abs(row.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}