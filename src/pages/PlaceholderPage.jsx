import { COLORS, PAGE_TITLES, MODULE_DESCRIPTIONS } from '../data/store';
import {
  DashIcon, PosIcon, BoxIcon, TruckIcon, TagIcon, ClipboardIcon,
  UsersIcon, DeliveryIcon, ReturnIcon, ChartIcon, WalletIcon,
  PLIcon, FlowIcon, TeamIcon, ReportIcon, SettingsIcon
} from '../components/Icons';

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

const PAGE_COLORS = {
  dashboard: COLORS.info,
  pos: COLORS.red,
  inventory: COLORS.charcoalLight,
  suppliers: COLORS.warning,
  categories: COLORS.success,
  "purchase-orders": COLORS.info,
  customers: COLORS.red,
  delivery: COLORS.charcoalLight,
  returns: COLORS.warning,
  "sales-report": COLORS.success,
  expenses: COLORS.red,
  pl: COLORS.info,
  cashflow: COLORS.charcoalLight,
  employees: COLORS.warning,
  reports: COLORS.success,
  settings: COLORS.charcoalLight,
};

export default function PlaceholderPage({ pageId }) {
  const color = PAGE_COLORS[pageId] || COLORS.charcoal;
  const description = MODULE_DESCRIPTIONS[pageId] || "";
  const title = PAGE_TITLES[pageId] || pageId;
  const Icon = ICON_MAP[pageId];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 20
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${color}40`
      }}>
        <div style={{ color: color, opacity: 0.8 }}>
          {Icon && <Icon />}
        </div>
      </div>

      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{
          fontSize: 22, fontWeight: 700,
          color: COLORS.charcoal, marginBottom: 8,
          fontFamily: "Georgia, serif"
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7
        }}>
          {description}
        </div>
      </div>

      <div style={{
        background: color + "14",
        border: `1px solid ${color}30`,
        borderRadius: 8, padding: "8px 20px",
        fontSize: 12, fontWeight: 600,
        color: color, letterSpacing: 1,
        textTransform: "uppercase"
      }}>
        Phase Coming Soon
      </div>
    </div>
  );
}