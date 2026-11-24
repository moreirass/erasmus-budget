import { useState, type ReactNode } from "react";
import { Wallet, Plane } from "lucide-react";
import { PeriodFilter } from "../components/PeriodControls";
import {
  categories,
  currentPeriod,
  money,
  summary,
  type Category,
} from "../model";
import { tr } from "../i18n";
import { PocketHistory, StatusBar } from "./PocketDetails";
import type { ViewProps } from "./types";

export function OverviewView({
  data,
  month,
  stats,
  weekList,
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
      <CategorySpendingCard
        data={data}
        month={month}
        stats={stats}
        weekList={weekList}
      />
      {laundryCard}
    </div>
  );
}

export function CategorySpendingCard({
  data,
  month,
  stats,
  weekList,
}: Pick<ViewProps, "data" | "month" | "stats" | "weekList">) {
  const [view, setView] = useState("month");
  const [selection, setSelection] = useState<{ month: string; week: number }>();
  const current = currentPeriod(data);
  const week = Math.min(
    selection?.month === month
      ? selection.week
      : current.month === month
        ? current.week
        : 0,
    weekList.length - 1,
  );
  const spending =
    view === "week" ? summary(data, month, weekList[week]) : stats;
  return (
    <section className="pocket-panel category-spending">
      <div className="pocket-section-head">
        <h2>{tr("Spending by category")}</h2>
        <span className="muted">
          {tr("Total spent")} <strong>{money(spending.cash)}</strong>
        </span>
      </div>
      <div className="category-spending-period">
        <PeriodFilter
          week={week}
          weekList={weekList}
          view={view}
          setView={setView}
          setWeek={(selected) => setSelection({ month, week: selected })}
        />
      </div>
      <dl className="category-spending-list">
        {categories.map((category) => (
          <div key={category.id}>
            <dt>{tr(category.name)}</dt>
            <dd>{money(spending.spent[category.id])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
