import { COLORS, NAV_SECTIONS, PAGE_TITLES } from '../data/store';
import {
  DashIcon, PosIcon, BoxIcon, TruckIcon, TagIcon, ClipboardIcon,
  UsersIcon, DeliveryIcon, ReturnIcon, ChartIcon, WalletIcon,
  PLIcon, FlowIcon, TeamIcon, ReportIcon, SettingsIcon, MenuIcon, ChevronRight
} from './Icons';

const ICON_MAP = {
  dashboard: DashIcon,
  pos: PosIcon,
  inventory: BoxIcon,
  suppliers: TruckIcon,
  categories: TagIcon,
  "purchase-orders": ClipboardIcon,
  customers: UsersIcon,
  delivery: DeliveryIcon,
  returns: ReturnIcon,
  "sales-report": ChartIcon,
  expenses: WalletIcon,
  pl: PLIcon,
  cashflow: FlowIcon,
  employees: TeamIcon,
  reports: ReportIcon,
  settings: SettingsIcon,
};

function JangoLogo({ collapsed }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: collapsed ? 0 : 10,
      justifyContent: collapsed ? "center" : "flex-start"
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${COLORS.steel} 0%, ${COLORS.steelDark} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.3)"
      }}>
        <span style={{
          fontSize: 16, fontWeight: 900, color: COLORS.charcoal,
          fontFamily: "Georgia, serif", letterSpacing: -1
        }}>J</span>
      </div>
      {!collapsed && (
        <div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: COLORS.white,
            fontFamily: "Georgia, serif", lineHeight: 1, letterSpacing: 0.5
          }}>
            Jango
          </div>
          <div style={{
            fontSize: 9, color: COLORS.steelDark,
            letterSpacing: 2, textTransform: "uppercase", marginTop: 1
          }}>
            Furniture POS
          </div>
          <div style={{
            width: 36, height: 2.5,
            background: `linear-gradient(90deg, ${COLORS.red}, transparent)`,
            borderRadius: 2, marginTop: 2
          }} />
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }) {
  return (
    <div style={{
      width: collapsed ? 64 : 240,
      background: COLORS.charcoal,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden", flexShrink: 0,
      boxShadow: "2px 0 16px rgba(0,0,0,0.18)"
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 14px" : "20px 18px",
        borderBottom: `1px solid ${COLORS.charcoalLight}`,
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between"
      }}>
        <JangoLogo collapsed={collapsed} />
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: COLORS.steelDark, padding: 4, borderRadius: 4,
            display: "flex", alignItems: "center"
          }}>
            <MenuIcon />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                textTransform: "uppercase", color: COLORS.charcoalMid,
                padding: "10px 18px 4px"
              }}>
                {section.label}
              </div>
            )}
            {collapsed && <div style={{ height: 8 }} />}
            {section.items.map(item => {
              const isActive = activePage === item.id;
              const Icon = ICON_MAP[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 10, padding: collapsed ? "10px 0" : "9px 18px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    background: isActive
                      ? `linear-gradient(90deg, ${COLORS.red}22, ${COLORS.red}08)`
                      : "none",
                    border: "none",
                    borderLeft: isActive
                      ? `3px solid ${COLORS.red}`
                      : "3px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                    color: isActive ? COLORS.white : COLORS.steelDark,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = `${COLORS.charcoalLight}66`;
                      e.currentTarget.style.color = COLORS.steel;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = COLORS.steelDark;
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }}>
                    {Icon && <Icon />}
                  </span>
                  {!collapsed && (
                    <span style={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: "nowrap"
                    }}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6,
                      borderRadius: "50%", background: COLORS.red, flexShrink: 0
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{
          padding: "12px 0",
          borderTop: `1px solid ${COLORS.charcoalLight}`,
          display: "flex", justifyContent: "center"
        }}>
          <button onClick={() => setCollapsed(false)} style={{
            background: `${COLORS.charcoalLight}88`, border: "none",
            cursor: "pointer", color: COLORS.steelDark,
            padding: "6px 10px", borderRadius: 6,
            display: "flex", alignItems: "center"
          }}>
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Version */}
      {!collapsed && (
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${COLORS.charcoalLight}` }}>
          <div style={{ fontSize: 10, color: COLORS.charcoalMid, letterSpacing: 0.5 }}>
            Jango POS v1.0
          </div>
          <div style={{ fontSize: 10, color: COLORS.charcoalMid, marginTop: 2 }}>
            Phase 1 — Navigation
          </div>
        </div>
      )}
    </div>
  );
}