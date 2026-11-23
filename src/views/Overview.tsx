import type { ReactNode } from "react";
import { Bell, Wallet, Plane } from "lucide-react";
import { categories, limitLevels, money, type Category } from "../model";
import { tr } from "../i18n";
import { PocketHistory, StatusBar } from "./PocketDetails";
import type { ViewProps } from "./types";

export function OverviewView({
  data,
  month,
  stats,
  setTab,
  setEditor,
  setPendingDelete,
  favorites,
  laundryCard,
}: ViewProps & { favorites: ReactNode; laundryCard: ReactNode }) {
  const daily = categories.filter((c) => c.id !== "travel").map((c) => c.id);
  const budgetCards = [
    {
      label: tr("Day to day"),
      icon: Wallet,
      remaining: stats.everydayRemaining,
      keys: daily,
    },
    {
      label: tr("Travel"),
      icon: Plane,
      remaining: stats.travel,
      keys: ["travel"] as Category[],
    },
  ];
  return (
    <div className="pocket-stack">
      <div className="pocket-budgets">
        {budgetCards.map(({ label, icon: Icon, remaining, keys }) => {
          const spent = keys.reduce(
            (total, key) => total + stats.spent[key],
            0,
          );
          const support = keys.reduce(
            (total, key) => total + stats.received[key],
            0,
          );
          return (
            <section className="pocket-panel budget-tile" key={label}>
              <div className="budget-label">
                <span className="pocket-symbol">
                  <Icon size={18} />
                </span>
                <h2>{label}</h2>
              </div>
              <div className="pocket-number">{money(remaining)}</div>
              <span className="muted">{tr("Remaining this month")}</span>
              <StatusBar spent={spent} cap={spent + remaining} />
              <dl className="budget-meta">
                <div>
                  <dt>{tr("Spent")}</dt>
                  <dd>{money(spent)}</dd>
                </div>
                {support !== 0 && (
                  <div>
                    <dt>{tr("Support")}</dt>
                    <dd>{money(support)}</dd>
                  </div>
                )}
              </dl>
            </section>
          );
        })}
      </div>
      <section className="pocket-panel">
        <div className="pocket-section-head">
          <h2>{tr("Recent activity")}</h2>
          <button onClick={() => setTab("Transactions")}>
            {tr("View all")}
          </button>
        </div>
        <PocketHistory
          rows={stats.rows}
          limit={3}
          setEditor={setEditor}
          setPendingDelete={setPendingDelete}
        />
      </section>
      {favorites}
      <OverviewAlert data={data} month={month} setTab={setTab} />
      {laundryCard}
    </div>
  );
}

export function OverviewAlert({
  data,
  month,
  setTab,
}: Pick<ViewProps, "data" | "month" | "setTab">) {
  const alerts =
    data.settings.limitAlerts === false ? [] : limitLevels(data, month);
  if (!alerts.length) return null;
  return (
    <button
      className="pocket-alert"
      onClick={() => setTab("Analysis")}
      data-status={
        alerts.some((alert) => alert.threshold === 100) ? "limit" : "near"
      }
    >
      <Bell size={18} />
      <span>
        {alerts
          .map(
            (alert) =>
              `${tr(categories.find((c) => c.id === alert.category)!.name)} · ${Math.floor(alert.percent)}%`,
          )
          .join("  /  ")}
      </span>
    </button>
  );
}
