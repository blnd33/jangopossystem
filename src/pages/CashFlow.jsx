import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function CashFlow() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();
  const [cashFlowData, setCashFlowData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchData();
  }, [period, selectedMonth, selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      // Calculate days based on period
      let days = 30;
      if (period === 'yearly') days = 365;
      if (period === 'all') days = 3650;

      const [flow, dashStats] = await Promise.all([
        api.dashboard.getCashFlow({ days }),
        api.dashboard.getStats(),
      ]);

      // Filter by selected month/year if needed
      let filtered = flow;
      if (period === 'monthly') {
        filtered = flow.filter(d => d.date.startsWith(selectedMonth));
      } else if (period === 'yearly') {
        filtered = flow.filter(d => d.date.startsWith(selectedYear));
      }

      // Add running net to each row
      let running = 0;
      const withNet = filtered.map(d => {
        running += d.income - d.expense;
        return {
          label: d.date.slice(5),
          in: parseFloat(d.income.toFixed(2)),
          out: parseFloat(d.expense.toFixed(2)),
          net: parseFloat(running.toFixed(2)),
        };
      });

      setCashFlowData(withNet);
      setStats(dashStats);
    } catch (err) {
      console.error('CashFlow fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalIn = cashFlowData.reduce((sum, d) => sum + d.in, 0);
  const totalOut = cashFlowData.reduce((sum, d) => sum + d.out, 0);
  const netFlow = totalIn - totalOut;

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
          {t('cashflow')}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
          {language === 'ar' ? 'تتبع حركة الأموال' : 'Track money in and out'}
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[
            { id: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' },
            { id: 'yearly', label: language === 'ar' ? 'سنوي' : 'Yearly' },
            { id: 'all', label: language === 'ar' ? 'الكل' : 'All Time' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding: isMobile ? '7px 12px' : '8px 16px', border: 'none', cursor: 'pointer',
              background: period === p.id ? C.charcoal : C.white,
              color: period === p.id ? '#fff' : C.charcoalMid,
              fontSize: 12, fontWeight: period === p.id ? 600 : 400
            }}>
              {p.label}
            </button>
          ))}
        </div>
        {period === 'monthly' && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {period === 'yearly' && (
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.white, cursor: 'pointer', color: C.charcoal }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 20 }}>
            {[
              { label: t('moneyIn'), value: fmt(totalIn), color: C.success, icon: '⬇️' },
              { label: t('moneyOut'), value: fmt(totalOut), color: C.red, icon: '⬆️' },
              { label: language === 'ar' ? 'المصروفات الشهرية' : 'Month Expenses', value: fmt(stats?.month_expenses || 0), color: C.warning, icon: '💸' },
              { label: t('netFlow'), value: fmt(netFlow), color: netFlow >= 0 ? C.success : C.red, icon: netFlow >= 0 ? '📈' : '📉' },
            ].map(card => (
              <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 16px', borderTop: `3px solid ${card.color}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
                <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.icon} {card.label}</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Net Flow Banner */}
          <div style={{
            background: netFlow >= 0 ? `linear-gradient(135deg, ${C.success}20, ${C.success}08)` : `linear-gradient(135deg, ${C.red}20, ${C.red}08)`,
            border: `1px solid ${netFlow >= 0 ? C.success : C.red}44`,
            borderRadius: 12, padding: isMobile ? '14px 16px' : '18px 24px',
            marginBottom: isMobile ? 14 : 20, textAlign: 'center'
          }}>
            <div style={{ fontSize: isMobile ? 11 : 13, color: C.textMuted, marginBottom: 4 }}>
              {netFlow >= 0 ? (language === 'ar' ? '✅ تدفق نقدي إيجابي' : '✅ Positive Cash Flow') : (language === 'ar' ? '⚠️ تدفق نقدي سلبي' : '⚠️ Negative Cash Flow')}
            </div>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: netFlow >= 0 ? C.success : C.red }}>
              {fmt(netFlow)}
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: C.textMuted, marginTop: 4 }}>
              {language === 'ar' ? `الوارد ${fmt(totalIn)} − الصادر ${fmt(totalOut)}` : `In ${fmt(totalIn)} − Out ${fmt(totalOut)}`}
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', marginBottom: isMobile ? 14 : 20, boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('cashFlowTime')}</div>
            {cashFlowData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={isMobile ? 160 : 240}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.info} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.info} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: isMobile ? 9 : 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: isMobile ? 9 : 11, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={isMobile ? 40 : 60} />
                  <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }} />
                  <Area type="monotone" dataKey="in" stroke={C.success} fill="url(#colorIn)" strokeWidth={2} name={t('moneyIn')} />
                  <Area type="monotone" dataKey="net" stroke={C.info} fill="url(#colorNet)" strokeWidth={2} name={t('netFlow')} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 4, height: 18, background: C.red, borderRadius: 2 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{t('flowSummary')}</span>
            </div>
            {cashFlowData.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: C.textMuted }}>{t('noData')}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13 }}>
                  <thead>
                    <tr style={{ background: C.offWhite }}>
                      {[t('period'), t('moneyIn'), t('moneyOut'), t('netFlow'), t('runningTotal')].map(h => (
                        <th key={h} style={{ padding: isMobile ? '8px 10px' : '10px 14px', textAlign: isRTL ? 'right' : 'left', fontWeight: 600, color: C.textMuted, fontSize: isMobile ? 10 : 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlowData.slice(-10).map((row, i) => (
                      <tr key={row.label} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : `${C.offWhite}66` }}>
                        <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: C.charcoal, fontWeight: 500 }}>{row.label}</td>
                        <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: C.success, fontWeight: 600 }}>{fmt(row.in)}</td>
                        <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: C.red, fontWeight: 600 }}>{fmt(row.out)}</td>
                        <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: (row.in - row.out) >= 0 ? C.success : C.red, fontWeight: 600 }}>{fmt(row.in - row.out)}</td>
                        <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color: row.net >= 0 ? C.info : C.red, fontWeight: 700 }}>{fmt(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}