import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getSales, getProducts, getCustomers,
  getExpenses, getDeliveries, getReturns,
  getEmployees, getPurchaseOrders
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
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
  const todayProfit = todaySales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0);

  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0);
  const monthProfit = monthSales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0) - monthExpenses;

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
      profit: parseFloat(daySales.reduce((sum, s) =>
        sum + s.items.reduce((ps, item) => ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0).toFixed(2)),
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
  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentSales = [...sales].reverse().slice(0, 5);
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily, background: C.offWhite, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
          {t('dashboard')}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          {new Date().toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Today Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.charcoal === '#e8eaed' ? '#1e293b' : COLORS.charcoal}, ${COLORS.charcoalLight})`,
        borderRadius: 12, padding: '20px 28px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20
      }}>
        {[
          { label: t('todayRevenue'), value: fmt(todayRevenue), sub: `${todaySales.length} ${t('transactions')}`, color: '#fff' },
          { label: t('todayProfit'), value: fmt(todayProfit), sub: t('afterCogs'), color: C.success },
          { label: t('monthlyRevenue'), value: fmt(monthRevenue), sub: t('thisMonth'), color: COLORS.steel },
          { label: t('netProfit'), value: fmt(monthProfit), sub: t('afterExpenses'), color: monthProfit >= 0 ? C.success : C.red },
        ].map((card, i) => (
          <div key={card.label} style={{
            borderLeft: !isRTL && i > 0 ? `1px solid ${COLORS.charcoalMid}` : 'none',
            borderRight: isRTL && i > 0 ? `1px solid ${COLORS.charcoalMid}` : 'none',
            paddingLeft: !isRTL && i > 0 ? 20 : 0,
            paddingRight: isRTL && i > 0 ? 20 : 0,
          }}>
            <div style={{ fontSize: 11, color: COLORS.steelDark, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
            <div style={{ fontSize: 11, color: COLORS.charcoalMid, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert Row */}
      {(lowStock.length > 0 || pendingDeliveries.length > 0 || pendingReturns.length > 0 || totalDebt > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {lowStock.length > 0 && (
            <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}44`, borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.warning, fontWeight: 500, flex: 1, minWidth: 200 }}>
              ⚠️ {lowStock.length} {t('lowStockAlert')} {outOfStock.length > 0 && `· ${outOfStock.length} ${t('outOfStock')}`}
            </div>
          )}
          {pendingDeliveries.length > 0 && (
            <div style={{ background: `${C.info}12`, border: `1px solid ${C.info}44`, borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.info, fontWeight: 500, flex: 1, minWidth: 200 }}>
              🚚 {pendingDeliveries.length} {t('pendingDeliveries')}
            </div>
          )}
          {pendingReturns.length > 0 && (
            <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.red, fontWeight: 500, flex: 1, minWidth: 200 }}>
              🔄 {pendingReturns.length} {t('pendingReturns')}
            </div>
          )}
          {totalDebt > 0 && (
            <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.red, fontWeight: 500, flex: 1, minWidth: 200 }}>
              💸 {fmt(totalDebt)} {t('customerDebt')}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('totalProducts'), value: products.length, sub: `${outOfStock.length} ${t('outOfStock')}`, color: C.info },
          { label: t('totalCustomers'), value: customers.length, sub: `${customers.filter(c => c.tag === 'VIP').length} VIP`, color: C.success },
          { label: t('totalEmployees'), value: employees.filter(e => e.status === 'Active').length, sub: t('activeStaff'), color: C.warning },
          { label: t('supplierOrders'), value: pendingOrders.length, sub: t('awaitingDelivery'), color: C.red },
        ].map(card => (
          <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', borderTop: `3px solid ${card.color}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>{t('last7Days')}</div>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: 13 }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last7Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip
                  formatter={(v, n) => [fmt(v), n]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: C.white, color: C.charcoal }}
                />
                <Bar dataKey="revenue" fill={C.info} radius={[3, 3, 0, 0]} name={t('revenue')} />
                <Bar dataKey="expenses" fill={C.warning} radius={[3, 3, 0, 0]} name={t('totalExpenses')} />
                <Bar dataKey="profit" fill={C.success} radius={[3, 3, 0, 0]} name={t('grossProfit')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{t('lowStockAlert')}</div>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.success, fontSize: 13 }}>✅ {t('allStocked')}</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 240 }}>
              {lowStock.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{t('lowStockAt')} {p.lowStockAlert || 5}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: p.stock === 0 ? C.red : C.warning, minWidth: 40, textAlign: isRTL ? 'left' : 'right' }}>
                    {p.stock === 0 ? t('outOfStock') : p.stock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Sales */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{t('recentSales')}</div>
          {recentSales.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>{t('noData')}</div>
          ) : recentSales.map((sale, i) => (
            <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < recentSales.length - 1 ? `1px solid ${C.border}` : 'none', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                #{sale.id.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.charcoal }}>{sale.customerName}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {new Date(sale.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{fmt(sale.total)}</div>
                <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'capitalize' }}>{t(sale.paymentMethod) || sale.paymentMethod}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', boxShadow: `0 1px 4px ${C.shadow}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{t('topProducts')}</div>
          {topProducts.length === 0 ? (
            <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>{t('noData')}</div>
          ) : topProducts.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < topProducts.length - 1 ? `1px solid ${C.border}` : 'none', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? `${C.red}20` : C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? C.red : C.charcoalMid, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{p.qty} {t('unitsSold')}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}