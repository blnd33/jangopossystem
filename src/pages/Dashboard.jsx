import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getSales, getProducts, getCustomers, getExpenses,
  getDeliveries, getReturns, getEmployees, getPurchaseOrders
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile, isTablet } = useWindowSize();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [returns, setReturns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setSales(getSales());
    setProducts(getProducts());
    setCustomers(getCustomers());
    setExpenses(getExpenses());
    setDeliveries(getDeliveries());
    setReturns(getReturns());
    setEmployees(getEmployees());
    setOrders(getPurchaseOrders());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const todaySales = sales.filter(s => s.date.split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayProfit = todaySales.reduce((sum, s) => sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0);
  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0);
  const monthProfit = monthSales.reduce((sum, s) => sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0) - monthExpenses;

  const lowStock = products.filter(p => p.stock <= (p.lowStockAlert || 5));
  const outOfStock = products.filter(p => p.stock === 0);
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending');
  const pendingReturns = returns.filter(r => r.status === 'Pending');
  const pendingOrders = orders.filter(o => o.status === 'Ordered');
  const totalDebt = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date.split('T')[0] === dateStr);
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    return {
      label: d.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'short', day: 'numeric' }),
      revenue: parseFloat(daySales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      expenses: parseFloat(dayExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
      profit: parseFloat(daySales.reduce((sum, s) => sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0).toFixed(2)),
    };
  });

  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 };
      productSales[item.name].qty += item.qty;
      productSales[item.name].revenue += item.sellPrice * item.qty;
    });
  });
  const topProducts = Object.entries(productSales).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const recentSales = [...sales].reverse().slice(0, 5);
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

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
        background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
        borderRadius: 12, padding: isMobile ? '14px 16px' : '20px 28px', marginBottom: isMobile ? 14 : 20,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? 12 : 20
      }}>
        {[
          { label: t('todayRevenue'), value: fmt(todayRevenue), sub: `${todaySales.length} ${t('transactions')}`, color: '#fff' },
          { label: t('todayProfit'), value: fmt(todayProfit), sub: t('afterCogs'), color: C.success },
          { label: t('monthlyRevenue'), value: fmt(monthRevenue), sub: t('thisMonth'), color: COLORS.steel },
          { label: t('netProfit'), value: fmt(monthProfit), sub: t('afterExpenses'), color: monthProfit >= 0 ? C.success : C.red },
        ].map((card, i) => (
          <div key={card.label} style={{
            borderLeft: !isRTL && i > 0 && !isMobile ? `1px solid ${COLORS.charcoalMid}` : 'none',
            borderRight: isRTL && i > 0 && !isMobile ? `1px solid ${COLORS.charcoalMid}` : 'none',
            paddingLeft: !isRTL && i > 0 && !isMobile ? 20 : 0,
            paddingRight: isRTL && i > 0 && !isMobile ? 20 : 0,
          }}>
            <div style={{ fontSize: isMobile ? 9 : 11, color: COLORS.steelDark, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
            <div style={{ fontSize: isMobile ? 9 : 11, color: COLORS.charcoalMid, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Stat Cards — mobile shows here */}
      {isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: t('totalProducts'), value: products.length, color: C.info },
            { label: t('totalCustomers'), value: customers.length, color: C.success },
            { label: t('lowStockAlert'), value: lowStock.length, color: C.warning },
            { label: t('pendingDeliveries'), value: pendingDeliveries.length, color: C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {(lowStock.length > 0 || pendingDeliveries.length > 0 || totalDebt > 0) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap' }}>
          {lowStock.length > 0 && (
            <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}44`, borderRadius: 8, padding: '8px 12px', fontSize: isMobile ? 11 : 13, color: C.warning, fontWeight: 500, flex: 1, minWidth: 140 }}>
              ⚠️ {lowStock.length} {t('lowStockAlert')}
            </div>
          )}
          {pendingDeliveries.length > 0 && (
            <div style={{ background: `${C.info}12`, border: `1px solid ${C.info}44`, borderRadius: 8, padding: '8px 12px', fontSize: isMobile ? 11 : 13, color: C.info, fontWeight: 500, flex: 1, minWidth: 140 }}>
              🚚 {pendingDeliveries.length} {t('pendingDeliveries')}
            </div>
          )}
          {totalDebt > 0 && (
            <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '8px 12px', fontSize: isMobile ? 11 : 13, color: C.red, fontWeight: 500, flex: 1, minWidth: 140 }}>
              💸 {fmt(totalDebt)} {t('customerDebt')}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards — desktop only */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: t('totalProducts'), value: products.length, sub: `${outOfStock.length} ${t('outOfStock')}`, color: C.info },
            { label: t('totalCustomers'), value: customers.length, sub: `${customers.filter(c => c.tag === 'VIP').length} VIP`, color: C.success },
            { label: t('totalEmployees'), value: employees.filter(e => e.status === 'Active').length, sub: t('activeStaff'), color: C.warning },
            { label: t('supplierOrders'), value: pendingOrders.length, sub: t('awaitingDelivery'), color: C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '2fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 20 }}>

        {/* Revenue Chart */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? '14px' : '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{t('last7Days')}</div>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
              <BarChart data={last7Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={isMobile ? 40 : 60} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }} />
                <Bar dataKey="revenue" fill={C.info} radius={[3, 3, 0, 0]} name={t('revenue')} />
                <Bar dataKey="expenses" fill={C.warning} radius={[3, 3, 0, 0]} name={t('totalExpenses')} />
                <Bar dataKey="profit" fill={C.success} radius={[3, 3, 0, 0]} name={t('grossProfit')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        {!isMobile && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{t('lowStockAlert')}</div>
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: C.success, fontSize: 13 }}>✅ {t('allStocked')}</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                {lowStock.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t('lowStockAt')} {p.lowStockAlert || 5}</div>
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
                #{sale.id.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: C.charcoal }}>{sale.customerName}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {new Date(sale.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short' })}
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
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topProducts.length - 1 ? `1px solid ${C.border}` : 'none', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? `${C.red}20` : C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? C.red : C.charcoalMid, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{p.qty} {t('unitsSold')}</div>
              </div>
              <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: C.charcoal }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}