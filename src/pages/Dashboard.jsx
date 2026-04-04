import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getSales, getProducts, getCustomers,
  getExpenses, getDeliveries, getReturns,
  getEmployees, getPurchaseOrders
} from '../data/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function Dashboard() {
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

  // Today stats
  const todaySales = sales.filter(s => s.date.split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayProfit = todaySales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) =>
      ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0);

  // Month stats
  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthExpenses = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthProfit = monthSales.reduce((sum, s) =>
    sum + s.items.reduce((ps, item) =>
      ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0) - monthExpenses;

  // Low stock
  const lowStock = products.filter(p => p.stock <= (p.lowStockAlert || 5));
  const outOfStock = products.filter(p => p.stock === 0);

  // Pending items
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending');
  const pendingReturns = returns.filter(r => r.status === 'Pending');
  const pendingOrders = orders.filter(o => o.status === 'Ordered');

  // Customer debt
  const totalDebt = customers.reduce((sum, c) =>
    sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

  // Last 7 days chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date.split('T')[0] === dateStr);
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    return {
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      revenue: parseFloat(daySales.reduce((sum, s) => sum + s.total, 0).toFixed(2)),
      expenses: parseFloat(dayExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
      profit: parseFloat(daySales.reduce((sum, s) =>
        sum + s.items.reduce((ps, item) =>
          ps + (item.sellPrice - item.costPrice) * item.qty, 0), 0).toFixed(2)),
    };
  });

  // Top products
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

  // Recent sales
  const recentSales = [...sales].reverse().slice(0, 5);

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
          Dashboard
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Today highlight banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
        borderRadius: 12, padding: '20px 28px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20
      }}>
        {[
          { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, sub: `${todaySales.length} sales`, color: COLORS.white },
          { label: "Today's Profit", value: `$${todayProfit.toFixed(2)}`, sub: 'After cost of goods', color: COLORS.success },
          { label: 'Monthly Revenue', value: `$${monthRevenue.toFixed(2)}`, sub: 'This month', color: COLORS.steel },
          { label: 'Net Profit (Month)', value: `$${monthProfit.toFixed(2)}`, sub: 'After all expenses', color: monthProfit >= 0 ? COLORS.success : COLORS.red },
        ].map((card, i) => (
          <div key={card.label} style={{
            borderLeft: i > 0 ? `1px solid ${COLORS.charcoalMid}` : 'none',
            paddingLeft: i > 0 ? 20 : 0
          }}>
            <div style={{ fontSize: 11, color: COLORS.steelDark, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4, fontFamily: 'Georgia, serif' }}>
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
              ⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock
              {outOfStock.length > 0 && ` · ${outOfStock.length} out of stock`}
            </div>
          )}
          {pendingDeliveries.length > 0 && (
            <div style={{
              background: `${COLORS.info}12`, border: `1px solid ${COLORS.info}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.info, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              🚚 {pendingDeliveries.length} pending deliver{pendingDeliveries.length > 1 ? 'ies' : 'y'}
            </div>
          )}
          {pendingReturns.length > 0 && (
            <div style={{
              background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.red, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              🔄 {pendingReturns.length} pending return{pendingReturns.length > 1 ? 's' : ''}
            </div>
          )}
          {totalDebt > 0 && (
            <div style={{
              background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}44`,
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              color: COLORS.red, fontWeight: 500, flex: 1, minWidth: 200
            }}>
              💸 ${totalDebt.toFixed(2)} customer debt outstanding
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Products', value: products.length, sub: `${outOfStock.length} out of stock`, color: COLORS.info },
          { label: 'Total Customers', value: customers.length, sub: `${customers.filter(c => c.tag === 'VIP').length} VIP`, color: COLORS.success },
          { label: 'Total Employees', value: employees.filter(e => e.status === 'Active').length, sub: 'Active staff', color: COLORS.warning },
          { label: 'Supplier Orders', value: pendingOrders.length, sub: 'Awaiting delivery', color: COLORS.red },
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
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: 'Georgia, serif' }}>
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
            Last 7 Days
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            Revenue vs Expenses vs Profit
          </div>
          {sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: 13 }}>
              No sales data yet — start selling to see your chart!
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
                <Bar dataKey="revenue" fill={COLORS.charcoal} radius={[3, 3, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill={COLORS.warning} radius={[3, 3, 0, 0]} name="Expenses" />
                <Bar dataKey="profit" fill={COLORS.red} radius={[3, 3, 0, 0]} name="Profit" />
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
            Low Stock Alert
          </div>
          {lowStock.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '30px 0',
              color: COLORS.success, fontSize: 13
            }}>
              ✅ All products well stocked!
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
                    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                      Alert at {p.lowStockAlert || 5} units
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: p.stock === 0 ? COLORS.red : COLORS.warning,
                    minWidth: 40, textAlign: 'right'
                  }}>
                    {p.stock === 0 ? 'OUT' : p.stock}
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
            Recent Sales
          </div>
          {recentSales.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              No sales yet
            </div>
          ) : recentSales.map((sale, i) => (
            <div key={sale.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < recentSales.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${COLORS.red}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: COLORS.red, flexShrink: 0
              }}>
                #{sale.id.slice(-4).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>
                  {sale.customerName}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {new Date(sale.date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
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
            Top Products
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              No sales data yet
            </div>
          ) : topProducts.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: i < topProducts.length - 1 ? `1px solid ${COLORS.offWhite}` : 'none'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? `${COLORS.red}20` : COLORS.offWhite,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? COLORS.red : COLORS.charcoalMid,
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {p.qty} units sold
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