import { COLORS, PAGE_TITLES } from '../data/store';
import { BellIcon, PosIcon } from './Icons';

export default function TopBar({ activePage, setActivePage }) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div style={{
      background: COLORS.white,
      borderBottom: `1px solid ${COLORS.border}`,
      padding: "0 28px", height: 60,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
    }}>

      {/* Left — Page Title */}
      <div>
        <div style={{
          fontSize: 18, fontWeight: 700,
          color: COLORS.charcoal,
          fontFamily: "Georgia, serif"
        }}>
          {PAGE_TITLES[activePage]}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
          {today}
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Bell */}
        <button style={{
          background: COLORS.offWhite,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "7px 10px",
          cursor: "pointer", color: COLORS.charcoalMid,
          display: "flex", alignItems: "center",
          position: "relative"
        }}>
          <BellIcon />
          <span style={{
            position: "absolute", top: 5, right: 6,
            width: 8, height: 8,
            background: COLORS.red, borderRadius: "50%",
            border: `2px solid ${COLORS.white}`
          }} />
        </button>

        {/* New Sale Button */}
        <button
          onClick={() => setActivePage("pos")}
          style={{
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            border: "none", borderRadius: 8,
            padding: "8px 18px", cursor: "pointer",
            color: COLORS.white, fontSize: 13,
            fontWeight: 600, letterSpacing: 0.3,
            boxShadow: `0 2px 8px ${COLORS.red}44`,
            display: "flex", alignItems: "center", gap: 6
          }}
        >
          <PosIcon />
          New Sale
        </button>

        {/* User Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: COLORS.charcoal,
          cursor: "pointer", border: `2px solid ${COLORS.border}`
        }}>
          AD
        </div>
      </div>
    </div>
  );
}