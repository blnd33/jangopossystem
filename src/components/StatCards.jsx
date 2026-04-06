import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import { getSales, getProducts, getDeliveries } from '../data/store';

export default function StatCards() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const sales = getSales();
  const products = getProducts();
  const deliveries = getDeliveries();

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = products.filter(p => p.stock <= (p.lowStockAlert || 5)).length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;

  const stats = [
    { label: t('todayRevenue'), value: fmt(todayRevenue), sub: `${todaySales.length} ${t('transactions')}`, color: C.success },
    { label: t('totalProducts'), value: products.length, sub: t('inventory'), color: C.info },
    { label: t('lowStockAlert'), value: lowStock, sub: t('inventory'), color: C.warning },
    { label: t('pendingDeliveries'), value: pendingDeliveries, sub: t('delivery'), color: C.red },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: isMobile ? 10 : 16,
      marginBottom: isMobile ? 16 : 28
    }}>
      {stats.map(card => (
        <div key={card.label} style={{
          background: C.white, borderRadius: 10,
          border: `1px solid ${C.border}`,
          padding: isMobile ? '12px 14px' : '16px 18px',
          borderTop: `3px solid ${card.color}`,
          boxShadow: `0 1px 4px ${C.shadow}`
        }}>
          <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            {card.label}
          </div>
          <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: C.charcoal, margin: '6px 0 2px', fontFamily: 'Georgia, serif' }}>
            {card.value}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}