import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { weekLabel } from "../components/PeriodControls";
import { displayDate, transactionKindLabel, tr } from "../i18n";
import {
  categories,
  laundryBalance,
  money,
  summary,
  transactionOrder,
  travelTypes,
  type Transaction,
} from "../model";
import { CategoryIcon } from "../ui";
import { displayTime } from "../time";
import type { ViewProps } from "./types";

export function StatusBar({ spent, cap }: { spent: number; cap: number }) {
  const percent = cap > 0 ? (spent / cap) * 100 : spent > 0 ? 100 : 0;
  return (
    <div
      className="pocket-meter"
      role="progressbar"
      aria-label={tr("Limit used")}
      aria-valuenow={Math.min(100, Math.floor(percent))}
      aria-valuetext={tr("{0}% of limit", [Math.floor(percent)])}
      data-status={percent >= 100 ? "limit" : percent >= 80 ? "near" : "ok"}
    >
      {percent > 0 && <span style={{ width: `${Math.min(100, percent)}%` }} />}
    </div>
  );
}

export function PocketHistory({
  rows,
  limit,
  setEditor,
  setPendingDelete,
  empty = tr("No transactions in this period."),
}: Pick<ViewProps, "rows" | "setEditor" | "setPendingDelete"> & {
  limit?: number;
  empty?: string;
}) {
  const days = new Map<string, Transaction[]>();
  for (const row of [...rows].sort(transactionOrder).slice(0, limit)) {
    const entries = days.get(row.date) ?? [];
    entries.push(row);
    days.set(row.date, entries);
  }
  if (!rows.length) return <p className="pocket-empty">{empty}</p>;
  return (
    <div className="pocket-history">
      {[...days].map(([day, entries]) => (
        <section key={day}>
          {!limit && <h3>{displayDate(day)}</h3>}
          <ul>
            {entries?.map((row: Transaction) => {
              const category = categories.find(
                (item) => item.id === row.category,
              )!;
              const sign = row.kind === "income" ? "+" : "−";
              const name =
                row.kind === "expense"
                  ? tr(category.name)
                  : `${transactionKindLabel(row)} · ${tr(category.name)}`;
              return (
                <li key={row.id}>
                  <span className="pocket-symbol">
                    <CategoryIcon category={row.category} />
                  </span>
                  <div className="pocket-item-label">
                    <strong>{name}</strong>
                    <small>
                      {row.note ||
                        (limit
                          ? displayDate(row.date)
                          : row.travelType
                            ? tr(
                                travelTypes.find(
                                  (type) => type.id === row.travelType,
                                )!.name,
                              )
                            : "")}
                    </small>
                  </div>
                  <div className="pocket-item-value">
                    <strong>
                      {sign}
                      {money(row.amount, row.currency)}
                    </strong>
                    {row.currency !== "EUR" && (
                      <small>
                        {row.kind === "wash" ? money(0) : money(row.eur)}
                      </small>
                    )}
                    {row.time && <small>{displayTime(row.time)}</small>}
                  </div>
                  {!limit && (
                    <div className="pocket-row-actions">
                      <button
                        onClick={() => setEditor(row)}
                        aria-label={tr("Edit {0}", [name])}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(row)}
                        aria-label={tr("Delete {0}", [name])}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function AnalysisView({ data, month, plan, weekList }: ViewProps) {
  const stats = summary(data, month);
  const weekly = weekList.map((week) => ({
    ...week,
    cash: summary(data, month, week).cash,
  }));
  const [showAll, setShowAll] = useState(false);
  const everyday = categories.filter((category) => category.id !== "travel");
  const shown = everyday.filter(
    (category) => showAll || stats.spent[category.id] > 0,
  );
  const categoryLimit = (category: (typeof categories)[number]) => {
    const spent = stats.spent[category.id],
      cap = plan.limits[category.id] + stats.received[category.id];
    const percent =
      cap > 0 ? Math.floor((spent / cap) * 100) : spent > 0 ? 100 : 0;
    return (
      <div key={category.id}>
        <div className="analysis-line">
          <strong>{tr(category.name)}</strong>
          <span>
            {money(spent)} / {money(cap)} · {percent}%
          </span>
        </div>
        <StatusBar spent={spent} cap={cap} />
      </div>
    );
  };
  return (
    <div className="pocket-stack">
      <section className="pocket-panel">
        <div className="pocket-section-head">
          <h2>{tr("Category limits")}</h2>
          {everyday.some((category) => stats.spent[category.id] === 0) && (
            <button
              aria-expanded={showAll}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? tr("Show fewer") : tr("Show all")}
            </button>
          )}
        </div>
        {shown.length ? (
          <div className="analysis-list">{shown.map(categoryLimit)}</div>
        ) : (
          <p className="pocket-empty">
            {tr("No day-to-day spending this month.")}
          </p>
        )}
      </section>
      <div className={stats.cash === 0 ? "pocket-stack" : "pocket-budgets"}>
        {stats.cash === 0 ? (
          <section className="pocket-panel analysis-empty">
            <h2>{tr("Spending distribution")}</h2>
            <p className="pocket-empty">{tr("No spending this month.")}</p>
          </section>
        ) : (
          <section className="pocket-panel">
            <h2>{tr("Spending distribution")}</h2>
            <div className="analysis-list">
              {categories
                .filter((category) => stats.spent[category.id] > 0)
                .map((category) => {
                  const percent = (stats.spent[category.id] / stats.cash) * 100;
                  return (
                    <div key={category.id}>
                      <div className="analysis-line">
                        <span>{tr(category.name)}</span>
                        <strong>{Math.round(percent)}%</strong>
                      </div>
                      <div className="pocket-meter neutral">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
        <section className="pocket-panel">
          <h2>{tr("Spending by week")}</h2>
          <div className="analysis-list">
            {weekly.map((week) => (
              <div key={week.start}>
                <div className="analysis-line">
                  <span>{weekLabel(week.start, week.end)}</span>
                  <strong>{money(week.cash)}</strong>
                </div>
                <div className="pocket-meter neutral">
                  {week.cash > 0 && (
                    <span
                      style={{
                        width: `${(week.cash / Math.max(1, ...weekly.map((item) => item.cash))) * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="pocket-panel">
        <h2>{tr("Trip spending")}</h2>
        <div className="analysis-list">
          {categoryLimit(
            categories.find((category) => category.id === "travel")!,
          )}
          {travelTypes.map((type) => (
            <div className="analysis-line" key={type.id}>
              <span>{tr(type.name)}</span>
              <strong>
                {money(
                  stats.rows
                    .filter(
                      (row) =>
                        row.kind === "expense" &&
                        row.category === "travel" &&
                        (row.travelType ?? "unclassified") === type.id,
                    )
                    .reduce((total, row) => total + row.eur, 0),
                )}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CardView({
  data,
  openNew,
  setEditor,
  setPendingDelete,
}: ViewProps) {
  const rows = data.transactions.filter(
    (row) => row.kind === "topup" || row.kind === "wash",
  );
  const balance = laundryBalance(data);
  return (
    <div className="pocket-stack">
      <section className="pocket-panel card-balance">
        <h2>{tr("Laundry credit")}</h2>
        <div className="pocket-number">{money(balance, "CZK")}</div>
        <div className="button-pair laundry-card-actions">
          <button className="primary" onClick={() => openNew("topup")}>
            {tr("Top up")}
          </button>
          <button className="pocket-card-wash" onClick={() => openNew("wash")}>
            {tr("Log a wash")}
          </button>
          <button
            className="pocket-card-wash"
            onClick={() => openNew("wash", "dry")}
          >
            {tr("Log a dry")}
          </button>
        </div>
      </section>
      <section className="pocket-panel">
        <h2>{tr("Card history")}</h2>
        <PocketHistory
          rows={rows}
          setEditor={setEditor}
          setPendingDelete={setPendingDelete}
          empty={tr("No top-ups or washes yet.")}
        />
      </section>
    </div>
  );
}
