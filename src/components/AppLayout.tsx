import { tr } from "../i18n";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  ChartPie,
  House,
  Moon,
  Plus,
  Settings,
  Sun,
  Wallet,
  WashingMachine,
} from "lucide-react";

const navigation = [
  { id: "Overview", label: "Home", icon: House },
  { id: "Analysis", label: "Analysis", icon: ChartPie },
  { id: "Transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "Budget & settings", label: "Settings", icon: Settings },
];
const card = { id: "Card", label: "Card", icon: WashingMachine };

export function AppLayout({
  tab,
  setTab,
  openNew,
  canAdd,
  dark,
  setDark,
  online,
  children,
  overlays,
}: {
  tab: string;
  setTab: (tab: string) => void;
  openNew: () => void;
  canAdd: boolean;
  dark: boolean;
  setDark: (dark: boolean) => void;
  online: boolean;
  children: ReactNode;
  overlays: ReactNode;
}) {
  const current = [...navigation, card].find((page) => page.id === tab);
  const navItem = ({ id, label, icon: Icon }: typeof card) => (
    <button
      key={id}
      aria-current={tab === id ? "page" : undefined}
      className={tab === id ? "active" : ""}
      onClick={() => setTab(id)}
    >
      <Icon size={19} />
      <span>{tr(label)}</span>
    </button>
  );
  const add = (
    <button
      className="pocket-add"
      aria-label={tr("Add transaction")}
      onClick={openNew}
      disabled={!canAdd}
    >
      <Plus size={24} />
    </button>
  );
  return (
    <div className="pocket-shell">
      <aside className="pocket-sidebar">
        <button className="pocket-brand" onClick={() => setTab("Overview")}>
          <span className="pocket-logo">
            <Wallet size={19} />
          </span>
          <span>
            Ostrava Pocket<small>{tr("Ostrava, Czechia")}</small>
          </span>
        </button>
        <nav aria-label={tr("Main navigation")}>
          {[...navigation.slice(0, 3), card, navigation[3]].map(navItem)}
        </nav>
        <button
          className="pocket-side-add"
          onClick={openNew}
          disabled={!canAdd}
        >
          <Plus size={19} /> {tr("Add transaction")}
        </button>
      </aside>
      <main className="pocket-main">
        <header className="pocket-header">
          <div className="pocket-heading">
            <h1>{current && tr(current.label)}</h1>
          </div>
          <div className="pocket-header-actions">
            {!online && <span className="muted">{tr("Offline")}</span>}
            <button
              className="pocket-theme"
              onClick={() => setDark(!dark)}
              aria-label={
                dark ? tr("Switch to light theme") : tr("Switch to dark theme")
              }
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        {children}
      </main>
      <nav className="pocket-bottom" aria-label={tr("Main navigation")}>
        {navigation.slice(0, 2).map(navItem)}
        {add}
        {navigation.slice(2).map(navItem)}
      </nav>
      {overlays}
    </div>
  );
}
