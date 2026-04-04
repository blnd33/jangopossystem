import { COLORS } from '../data/store';

const stats = [
  {
    label: "Today's Sales",
    value: "$0",
    sub: "0 transactions",
    color: COLORS.success
  },
  {
    label: "Products",
    value: "0",
    sub: "In inventory",
    color: COLORS.info
  },
  {
    label: "Low Stock",
    value: "0",
    sub: "Need restocking",
    color: COLORS.warning
  },
  {
    label: "Pending Deliveries",
    value: "0",
    sub: "To be delivered",
    color: COLORS.red
  },
];

export default function StatCards() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
      marginBottom: 28
    }}>
      {stats.map(card => (
        <div key={card.label} style={{
          background: COLORS.white,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          padding: "16px 18px",
          borderTop: `3px solid ${card.color}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <div style={{
            fontSize: 11, color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.8, fontWeight: 600
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: 26, fontWeight: 800,
            color: COLORS.charcoal,
            margin: "6px 0 2px",
            fontFamily: "Georgia, serif"
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}