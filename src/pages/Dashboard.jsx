import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getSales, getProducts, getCustomers,
  getExpenses, getDeliveries, getReturns,
  getEmployees, getPurchaseOrders
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { t, isRTL, language } = useLanguage();
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
    sum + s.items.reduce((ps, item) =>
      ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0);

  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthExpenses = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthProfit = monthSales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) =>
      ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0) - monthExpenses;

  const lowStock = products.filter(p => p.stock <= (p.lowStockAlert || 5));
  const outOfStock = products.filter(p => p.stock === 0);
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending');
  const pendingReturns = returns.filter(r => r.status === 'Pending');
  const pendingOrders = orders.filter(o => o.status === 'Ordered');
  const totalDebt = customers.reduce((sum, c) =>
    sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

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
        sum + s.items.reduce((ps, item) =>
          ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0).toFixed(2)),
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

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif';

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily }}>
          {t('dashboard')}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
          {new Date().toLocaleDateString(
            language === 'ar' ? 'ar-IQ' : 'en-GB',
            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
          )}
        </div>
      </div>

      {/* Today Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
        borderRadius: 12, padding: '20px 28px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20
      }}>
        {[
          { label: t('todayRevenue'), value: `$${todayRevenue.toFixed(2)}`, sub: `${todaySales.length} ${t('transactions')}`, color: COLORS.white },
          { label: t('todayProfit'), value: `$${todayProfit.toFixed(2)}`, sub: t('afterCogs'), color: COLORS.success },
          { label: t('monthlyRevenue'), value: `$${monthRevenue.toFixed(2)}`, sub: t('thisMonth'), color: COLORS.steel },
          { label: t('netProfit'), value: `$${monthProfit.toFixed(2)}`, sub: t('afterExpenses'), color: monthProfit >= 0 ? COLORS.success : COLORS.red },
        ].map((card, i) => (
          <div key={card.label} style={{
            borderLeft: !isRTL && i > 0 ? `1px solid ${COLORS.charcoalMid}` : 'none',
            borderRight: isRTL && i > 0 ? `1px solid ${COLORS.charcoalMid}` : 'none',
            paddingLeft: !isRTL && i > 0 ? 20 : 0,
            paddingRight: isRTL && i > 0 ? 20 : 0,
          }}>
            <div style={{ fontSize: 11, color: COLORS.steelDark, textTransform: 'uppercase', letterSpacing: language === 'ar' ? 0 : 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4, fontFamily }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: COLORS.charcoalMid, marginTop: 2 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Alert Row */}
      {(lowStock.length > 0 || pendingDeliveries.length > 0 || pendingReturns.length > 0 || totalDebt > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {lowStock.length > 0 && (
            <div style={{
              background: `${COLORS.warning}12`, border: `1px solid ${COLORS.warning}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.warning, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              ⚠️ {lowStock.length} {t('lowStockAlert')}
              {outOfStock.length > 0 && ` · ${outOfStock.length} ${t('outOfStock')}`}
            </div>
          )}
          {pendingDeliveries.length > 0 && (
            <div style={{
              background: `${COLORS.info}12`, border: `1px solid ${COLORS.info}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.info, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              🚚 {pendingDeliveries.length} {t('pendingDeliveries')}
            </div>
          )}
          {pendingReturns.length > 0 && (
            <div style={{
              background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.red, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              🔄 {pendingReturns.length} {t('pendingReturns')}
            </div>
          )}
          {totalDebt > 0 && (
            <div style={{
              background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.red, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              💸 ${totalDebt.toFixed(2)} {t('customerDebt')}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('totalProducts'), value: products.length, sub: `${outOfStock.length} ${t('outOfStock')}`, color: COLORS.info },
          { label: t('totalCustomers'), value: customers.length, sub: `${customers.filter(c => c.tag === 'VIP').length} VIP`, color: COLORS.success },
          { label: t('totalEmployees'), value: employees.filter(e => e.status === 'Active').length, sub: t('activeStaff'), color: COLORS.warning },
          { label: t('supplierOrders'), value: pendingOrders.length, sub: t('awaitingDelivery'), color: COLORS.red },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: language === 'ar' ? 0 : 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 4 }}>
            {t('last7Days')}
          </div>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
              {t('noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last7Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(v, n) => [`$${v.toFixed(2)}`, n]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill={COLORS.charcoal} radius={[3, 3, 0, 0]} name={t('revenue')} />
                <Bar dataKey="expenses" fill={COLORS.warning} radius={[3, 3, 0, 0]} name={t('totalExpenses')} />
                <Bar dataKey="profit" fill={COLORS.red} radius={[3, 3, 0, 0]} name={t('grossProfit')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>
            {t('lowStockAlert')}
          </div>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: COLORS.success, fontSize: 13 }}>
              ✅ {t('allStocked')}
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 240 }}>
              {lowStock.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: `1px solid ${COLORS.offWhite}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                      {t('lowStockAt')} {p.lowStockAlert || 5} {t('units')}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: p.stock === 0 ? COLORS.red : COLORS.warning,
                    minWidth: 40, textAlign: isRTL ? 'left' : 'right'
                  }}>
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
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>
            {t('recentSales')}
          </div>
          {recentSales.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              {t('noData')}
            </div>
          ) : recentSales.map((sale, i) => (
            <div key={sale.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < recentSales.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${COLORS.red}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: COLORS.red, flexShrink: 0
              }}>
                #{sale.id.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>
                  {sale.customerName}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {new Date(sale.date).toLocaleDateString(
                    language === 'ar' ? 'ar-IQ' : 'en-GB',
                    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                  )}
                </div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.charcoal }}>
                  ${sale.total.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'capitalize' }}>
                  {sale.paymentMethod}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: '20px 24px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, marginBottom: 14 }}>
            {t('topProducts')}
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              {t('noData')}
            </div>
          ) : topProducts.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < topProducts.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none',
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? `${COLORS.red}20` : COLORS.offWhite,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? COLORS.red : COLORS.charcoalMid, flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {p.qty} {t('unitsSold')}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>
                ${p.revenue.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}