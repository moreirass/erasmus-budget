import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  ChartPie,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Sun,
  UserRound,
  Wallet,
  WashingMachine,
} from "lucide-react";
import { appLocale, displayDate, tr } from "../i18n";
import { money } from "../model";
import type { BudgetStore } from "../hooks/types";
import type { ViewProps } from "../views/types";
type AppLayoutProps = Pick<
  ViewProps,
  | "data"
  | "stats"
  | "fx"
  | "setTab"
  | "setGroup"
  | "setSettingsSection"
  | "openNew"
> & {
  store: BudgetStore;
  tab: string;
  isSettings: boolean;
  online: boolean;
  dark: boolean;
  setDark: (dark: boolean) => void;
  children: ReactNode;
  overlays: ReactNode;
};
export function AppLayout({
  data,
  stats,
  fx,
  setTab,
  setGroup,
  setSettingsSection,
  openNew,
  store,
  tab,
  isSettings,
  online,
  dark,
  setDark,
  children,
  overlays,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("Overview");
          }}
        >
          <span className="brand-icon">
            <Wallet size={24} />
          </span>
          <span>
            Pocket<small>{tr("Your Erasmus Companion")}</small>
          </span>
        </a>
        <div className="active-term">
          <MapPin size={17} />
          <div>
            <span>{tr("ACTIVE TERM")}</span>
            <strong>
              Erasmus · {data.settings.start.slice(0, 4)}/
              {data.settings.end.slice(2, 4)}
            </strong>
          </div>
        </div>
        <nav>
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Transactions", icon: ArrowLeftRight },
            { name: "Budget & settings", icon: SlidersHorizontal },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                tab === name || (name === "Budget & settings" && isSettings)
                  ? "active"
                  : ""
              }
              onClick={() => setTab(name)}
            >
              <Icon size={20} />
              <span>{tr(name)}</span>
            </button>
          ))}
        </nav>
        <button
          className="sidebar-laundry"
          onClick={() => {
            setTab("Overview");
            setGroup("daily");
          }}
        >
          <WashingMachine size={20} />
          <span>
            {tr("Laundry")}
            <strong>{money(stats.card, "CZK")}</strong>
          </span>
          <ChevronRight size={16} />
        </button>
        <div className="storage-badge">
          <MapPin size={14} />
          <span>{tr("Ostrava, Czechia")}</span>
          <span className={online ? "status-dot" : "status-dot offline"} />
          <small>{store.user?.email ?? tr("Saved on this device")}</small>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label={tr("Mobile navigation")}>
        <button
          className={tab === "Overview" ? "active" : ""}
          onClick={() => setTab("Overview")}
        >
          <LayoutDashboard size={21} />
          <span>{tr("Overview")}</span>
        </button>
        <button
          className={tab === "Transactions" ? "active" : ""}
          onClick={() => setTab("Transactions")}
        >
          <ArrowLeftRight size={21} />
          <span>{tr("Transactions")}</span>
        </button>
        <button
          className="quick-add"
          aria-label={tr("Add transaction")}
          onClick={() => openNew()}
          disabled={!store.ready || store.corrupt}
        >
          <Plus size={29} />
        </button>
        <button
          className={tab === "Budget" ? "active" : ""}
          onClick={() => {
            setTab("Budget");
            setSettingsSection("plan");
          }}
        >
          <ChartPie size={21} />
          <span>{tr("Budget")}</span>
        </button>
        <button
          className={tab === "Budget & settings" ? "active" : ""}
          onClick={() => {
            setTab("Budget & settings");
            setSettingsSection("rates");
          }}
        >
          <Settings size={21} />
          <span>{tr("Settings")}</span>
        </button>
      </nav>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <span className="desktop-crumb">
              <LayoutDashboard size={15} /> {tr("/ Erasmus Hub /")}{" "}
              <b>{tr(tab)}</b>
            </span>
            <span className="mobile-brand">
              <span className="brand-icon">
                <Wallet size={22} />
              </span>
              <span>
                Pocket <em>Erasmus+</em>
                <small>ERASMUS · OSTRAVA</small>
              </span>
            </span>
          </div>
          <div className="header-actions">
            <span
              className="fx-pill"
              title={
                fx.cache?.rates.CZK
                  ? tr("Published on {0}", [
                      displayDate(fx.cache.rates.CZK.date),
                    ])
                  : tr("No cached rate")
              }
            >
              <RefreshCw size={16} />{" "}
              {fx.cache?.rates.CZK ? (
                <>
                  <span>1 EUR ≈ </span>
                  <strong>
                    {fx.cache.rates.CZK.rate.toLocaleString(appLocale(), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    CZK
                  </strong>
                </>
              ) : (
                <strong>EUR / CZK</strong>
              )}
            </span>
            <button
              className="sync-pill"
              onClick={() => {
                setTab("Budget & settings");
                setSettingsSection("sync");
              }}
            >
              <span
                className={
                  store.user &&
                  !store.dirty &&
                  store.status === "Synced just now"
                    ? "status-dot"
                    : "status-dot offline"
                }
              />
              {!online
                ? tr("Offline")
                : !store.user
                  ? tr("Local workspace")
                  : store.dirty
                    ? tr("Sync pending")
                    : tr(store.status)}
              {store.user && store.lastSyncedAt && (
                <small>
                  {tr("Last sync: {0}", [
                    new Date(store.lastSyncedAt).toLocaleTimeString(
                      appLocale(),
                      { hour: "2-digit", minute: "2-digit" },
                    ),
                  ])}
                </small>
              )}
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label={
                dark ? tr("Switch to light theme") : tr("Switch to dark theme")
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="primary top-add"
              onClick={() => openNew()}
              disabled={!store.ready || store.corrupt}
            >
              <Plus size={18} /> {tr("Add transaction")}{" "}
            </button>
            <button
              className="avatar"
              aria-label={tr("Account settings")}
              onClick={() => {
                setTab("Budget & settings");
                setSettingsSection("sync");
              }}
            >
              <UserRound size={19} />
            </button>
          </div>
        </header>
        <div
          className={`content screen-${tab === "Transactions" ? "transactions" : isSettings ? "settings" : "overview"}`}
        >
          <div className="page-heading">
            <div>
              <div className="eyebrow">ERASMUS · OSTRAVA 2026/27</div>
              <h1>
                {tab === "Overview"
                  ? tr("Your adventure, in balance.")
                  : tab === "Transactions"
                    ? tr("The little things add up.")
                    : tr("A plan that fits your life.")}
              </h1>
              <p>
                {tab === "Overview"
                  ? tr(
                      "A clear view of your money. More headspace for Erasmus.",
                    )
                  : tab === "Transactions"
                    ? tr(
                        "Every coffee, train ride and laundry day, in one place.",
                      )
                    : tr(
                        "Your monthly budgets, laundry credit and data — all in your hands.",
                      )}
              </p>
            </div>
            <button
              className="primary"
              onClick={() => openNew()}
              disabled={!store.ready || store.corrupt}
            >
              <Plus size={18} /> {tr("Add transaction")}{" "}
            </button>
          </div>
          {children}
          <footer>
            <span>
              pocket.{" "}
              <span className="muted">
                {tr("Made for your Ostrava chapter.")}
              </span>
            </span>
            <span className="muted">
              {tr("EUR budget · multiple currencies · CZK laundry card")}{" "}
            </span>
          </footer>
        </div>
      </main>
      {overlays}
    </div>
  );
}
