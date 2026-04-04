import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import { getSales } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesReport() {
  const { t, isRTL, language } = useLanguage();
  const [sales, setSales] = useState([]);
  const [view, setView] = useState('daily');

  useEffect(() => { setSales(getSales()); }, []);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date.split('T')[0] === dateStr);
    return {
      label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'short', day: 'numeric' }),
      revenue: daySales.reduce((sum, s) => sum + s.total, 0),
      transactions: daySales.length,
      profit: daySales.reduce((sum, s) => sum + s.items.reduce((ps, item) =>
        ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0)
    };
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const monthStr = d.toISOString().slice(0, 7);
    const monthSales = sales.filter(s => s.date.startsWith(monthStr));
    return {
      label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { month: 'short', year: '2-digit' }),
      revenue: monthSales.reduce((sum, s) => sum + s.total, 0),
      transactions: monthSales.length,
      profit: monthSales.reduce((sum, s) => sum + s.items.reduce((ps, item) =>
        ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0)
    };
  });

  const yearlyData = Array.from({ length: 5 }, (_, i) => {
    const year = (new Date().getFullYear() - (4 - i)).toString();
    const yearSales = sales.filter(s => s.date.startsWith(year));
    return {
      label: year,
      revenue: yearSales.reduce((sum, s) => sum + s.total, 0),
      transactions: yearSales.length,
      profit: yearSales.reduce((sum, s) => sum + s.items.reduce((ps, item) =>
        ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0)
    };
  });

  const chartData = view === 'daily' ? dailyData : view === 'monthly' ? monthlyData : yearlyData;

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTransactions = chartData.reduce((sum, d) => sum + d.transactions, 0);
  const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0);
  const avgOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const todaySales = sales.filter(s => s.date.split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 };
      productSales[item.name].qty += item.qty;
      productSales[item.name].revenue += item.sellPrice * item.qty;
    });
  });
  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('salesReport')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {sales.length} {t('transactions')}
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {['daily', 'monthly', 'yearly'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer',
              background: view === v ? COLORS.charcoal : COLORS.white,
              color: view === v ? COLORS.white : COLORS.charcoalMid,
              fontSize: 12, fontWeight: view === v ? 600 : 400
            }}>
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      {/* Today Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
        borderRadius: 12, padding: '18px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }}>
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 12, color: COLORS.steelDark, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('todayRevenue')}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.white, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', marginTop: 4 }}>
            ${todayRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: COLORS.steelDark, marginTop: 4 }}>
            {todaySales.length} {t('transactions')}
          </div>
        </div>
        <div style={{ width: 4, height: 60, background: `linear-gradient(180deg, ${COLORS.red}, transparent)`, borderRadius: 2 }} />
        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
          <div style={{ fontSize: 12, color: COLORS.steelDark, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('revenue')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', marginTop: 4 }}>
            ${totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: COLORS.steelDark, marginTop: 4 }}>
            {t(view)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('revenue'), value: `$${totalRevenue.toFixed(2)}`, color: COLORS.success },
          { label: t('grossProfit'), value: `$${totalProfit.toFixed(2)}`, color: COLORS.info },
          { label: t('transactions'), value: totalTransactions, color: COLORS.warning },
          { label: language === 'ar' ? 'متوسط الطلب' : 'Avg Order Value', value: `$${avgOrder.toFixed(2)}`, color: COLORS.red },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`, padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: COLORS.white, borderRadius: 12,
        border: `1px solid ${COLORS.border}`, padding: '20px 24px', marginBottom: 20
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>
          {t('revenue')} & {t('grossProfit')} — {t(view)}
        </div>
        {sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
            {t('noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(value, name) => [`$${value.toFixed(2)}`, name === 'revenue' ? t('revenue') : t('grossProfit')]}
                contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill={COLORS.charcoal} radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="profit" fill={COLORS.red} radius={[4, 4, 0, 0]} name="profit" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top Products */}
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>
            {t('topProducts')}
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : topProducts.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < topProducts.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: i === 0 ? `${COLORS.red}20` : COLORS.offWhite,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? COLORS.red : COLORS.charcoalMid
              }}>{i + 1}</div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{p.qty} {t('unitsSold')}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${p.revenue.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Recent Sales */}
        <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>
            {t('recentSales')}
          </div>
          {sales.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : [...sales].reverse().slice(0, 6).map((sale, i) => (
            <div key={sale.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < 5 ? `1px solid ${COLORS.offWhite}` : 'none',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: `${COLORS.red}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: COLORS.red
              }}>
                #{sale.id.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{sale.customerName}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {new Date(sale.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.charcoal }}>${sale.total.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'capitalize' }}>{t(sale.paymentMethod) || sale.paymentMethod}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}