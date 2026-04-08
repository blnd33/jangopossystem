import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile, isTablet } = useWindowSize();

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [dashStats, chart, top, sales, products] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getSalesChart({ days: 7 }),
        api.dashboard.getTopProducts({ limit: 5 }),
        api.pos.getSales({ per_page: 5 }),
        api.products.getAll({ low_stock: 'true' }),
      ]);

      setStats(dashStats);
      setTopProducts(top);
      setRecentSales(sales.sales || []);
      setLowStockProducts(products);

      // Format chart for last 7 days
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const match = chart.find(r => r.date === dateStr);
        return {
          label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'short', day: 'numeric' }),
          revenue: match ? parseFloat(match.revenue.toFixed(2)) : 0,
          expenses: 0,
        };
      });
      setChartData(last7);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: C.textMuted, fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  const todayRevenue = stats?.today?.revenue || 0;
  const todayCount = stats?.today?.count || 0;
  const monthRevenue = stats?.month?.revenue || 0;
  const monthProfit = stats?.month_profit || 0;
  const monthExpenses = stats?.month_expenses || 0;
  const totalCustomers = stats?.total_customers || 0;
  const lowStockCount = stats?.low_stock_count || 0;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily, background: C.offWhite, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 14 : 24 }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
          {t('dashboard')}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
          {new Date().toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Today Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.charcoal}, ${C.charcoalLight || '#3a3a3a'})`,
        borderRadius: 12, padding: isMobile ? '14px 16px' : '20px 28px', marginBottom: isMobile ? 14 : 20,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? 12 : 20
      }}>
        {[
          { label: t('todayRevenue'), value: fmt(todayRevenue), sub: `${todayCount} ${t('transactions')}`, color: '#fff' },
          { label: t('todayProfit'), value: fmt(todayRevenue * 0.3), sub: t('afterCogs'), color: C.success },
          { label: t('monthlyRevenue'), value: fmt(monthRevenue), sub: t('thisMonth'), color: C.steel || '#aaa' },
          { label: t('netProfit'), value: fmt(monthProfit), sub: t('afterExpenses'), color: monthProfit >= 0 ? C.success : C.red },
        ].map((card, i) => (
          <div key={card.label} style={{
            borderLeft: !isRTL && i > 0 && !isMobile ? `1px solid rgba(255,255,255,0.15)` : 'none',
            borderRight: isRTL && i > 0 && !isMobile ? `1px solid rgba(255,255,255,0.15)` : 'none',
            paddingLeft: !isRTL && i > 0 && !isMobile ? 20 : 0,
            paddingRight: isRTL && i > 0 && !isMobile ? 20 : 0,
          }}>
            <div style={{ fontSize: isMobile ? 9 : 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
            <div style={{ fontSize: isMobile ? 9 : 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Mobile Stat Cards */}
      {isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: t('totalCustomers'), value: totalCustomers, color: C.info },
            { label: t('lowStockAlert'), value: lowStockCount, color: C.warning },
            { label: language === 'ar' ? 'المصروفات' : 'Expenses', value: fmt(monthExpenses), color: C.red },
            { label: t('weekSales'), value: stats?.week?.count || 0, color: C.success },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap' }}>
          <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}44`, borderRadius: 8, padding: '8px 12px', fontSize: isMobile ? 11 : 13, color: C.warning, fontWeight: 500, flex: 1, minWidth: 140 }}>
            ⚠️ {lowStockCount} {t('lowStockAlert')}
          </div>
          {monthExpenses > 0 && (
            <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '8px 12px', fontSize: isMobile ? 11 : 13, color: C.red, fontWeight: 500, flex: 1, minWidth: 140 }}>
              💸 {fmt(monthExpenses)} {t('totalExpenses')}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards — desktop */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('totalCustomers'), value: totalCustomers, sub: language === 'ar' ? 'عميل مسجل' : 'registered', color: C.info },
            { label: t('lowStockAlert'), value: lowStockCount, sub: language === 'ar' ? 'منتج منخفض' : 'products low', color: C.warning },
            { label: language === 'ar' ? 'مبيعات الأسبوع' : 'Week Sales', value: stats?.week?.count || 0, sub: fmt(stats?.week?.revenue || 0), color: C.success },
            { label: language === 'ar' ? 'مصروفات الشهر' : 'Month Expenses', value: fmt(monthExpenses), sub: language === 'ar' ? 'هذا الشهر' : 'this month', color: C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '2fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 20 }}>

        {/* Revenue Chart */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{t('last7Days')}</div>
          {chartData.every(d => d.revenue === 0) ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={isMobile ? 40 : 60} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }} />
                <Bar dataKey="revenue" fill={C.info} radius={[3, 3, 0, 0]} name={t('revenue')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        {!isMobile && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{t('lowStockAlert')}</div>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: C.success, fontSize: 13 }}>✅ {t('allStocked')}</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                {lowStockProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{p.category || ''}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: p.stock === 0 ? C.red : C.warning }}>
                      {p.stock === 0 ? t('outOfStock') : p.stock}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>

        {/* Recent Sales */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('recentSales')}</div>
          {recentSales.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>{t('noData')}</div>
          ) : recentSales.map((sale, i) => (
            <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentSales.length - 1 ? `1px solid ${C.border}` : 'none', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                #{sale.invoice_number?.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: C.charcoal }}>{sale.customer || 'Walk-in'}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {new Date(sale.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.charcoal }}>{fmt(sale.total)}</div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>{t('topProducts')}</div>
          {topProducts.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>{t('noData')}</div>
          ) : topProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topProducts.length - 1 ? `1px solid ${C.border}` : 'none', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? `${C.red}20` : C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? C.red : C.charcoalMid, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{p.qty_sold} {t('unitsSold')}</div>
              </div>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: C.charcoal }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}