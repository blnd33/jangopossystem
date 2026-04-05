import { COLORS } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getSales, getProducts, getDeliveries } from '../data/store';

export default function StatCards() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();

  const sales = getSales();
  const products = getProducts();
  const deliveries = getDeliveries();

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = products.filter(p => p.stock <= (p.lowStockAlert || 5)).length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;

  const stats = [
    { label: t('todayRevenue'), value: fmt(todayRevenue), sub: `${todaySales.length} ${t('transactions')}`, color: COLORS.success },
    { label: t('totalProducts'), value: products.length, sub: t('inventory'), color: COLORS.info },
    { label: t('lowStockAlert'), value: lowStock, sub: t('inventory'), color: COLORS.warning },
    { label: t('pendingDeliveries'), value: pendingDeliveries, sub: t('delivery'), color: COLORS.red },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
      {stats.map(card => (
        <div key={card.label} style={{
          background: COLORS.white, borderRadius: 10,
          border: `1px solid ${COLORS.border}`, padding: '16px 18px',
          borderTop: `3px solid ${card.color}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            {card.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.charcoal, margin: '6px 0 2px', fontFamily: 'Georgia, serif' }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}