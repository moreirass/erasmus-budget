import { limitLevels } from "../model";
import {
  ArrowUpRight,
  Check,
  Plane,
  Plus,
  Wallet,
  WashingMachine,
} from "lucide-react";
import {
  SpendingChart,
  TransactionList,
  TravelBreakdown,
} from "../components/Panels";
import { displayDate, tr, trCount } from "../i18n";
import {
  categories,
  money,
  monthEnd,
  monthLabel,
  periodDays,
  summary,
  type Category,
} from "../model";
import { CategoryIcon } from "../ui";
import type { ViewProps } from "./types";
export function OverviewView({
  data,
  month,
  view,
  range,
  group,
  stats,
  plan,
  weekList,
  rows,
  isFuture,
  fx,
  search,
  filter,
  setTab,
  setSettingsSection,
  selectBudget,
  groupCash,
  openNew,
  setEditor,
  setPendingDelete,
  setSearch,
  setFilter,
  setGroup,
}: ViewProps) {
  const alerts =
    data.settings.limitAlerts === false ? [] : limitLevels(data, month);
  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="tiny">
            OSTRAVA · {monthLabel(month).toUpperCase()}
          </span>
          <h2>
            {stats.rows.length
              ? tr("Your Erasmus, in balance.")
              : tr("A blank page for new adventures.")}
          </h2>
          <p>
            {stats.rows.length
              ? trCount("{0} transactions this period · {1} money out", [
                  stats.rows.length,
                  money(stats.cash),
                ])
              : tr(
                  "No transactions this period. Record your first purchase when you’re ready.",
                )}
          </p>
        </div>
        <Wallet size={24} />
      </section>
      <section className="hero-grid two-budgets">
        <div
          className={`balance-card budget-card ${group === "daily" ? "budget-selected" : ""}`}
        >
          <button
            type="button"
            className="budget-card-button"
            aria-label={tr("View Day to day budget")}
            aria-pressed={group === "daily"}
            onClick={() => selectBudget("daily")}
          />
          <div className="card-kicker">
            <span>
              {tr(
                view === "week"
                  ? "DAY TO DAY · LEFT THIS WEEK"
                  : "DAY TO DAY · LEFT THIS MONTH",
              )}
            </span>
            <Wallet size={20} />
          </div>
          <div className="balance-number">{money(stats.everydayRemaining)}</div>
          <div className="track">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, ((stats.cash - stats.spent.travel) / Math.max(1, Math.round((plan.budget - plan.limits.travel) * (range ? range.days / periodDays(data, month) : 1)))) * 100))}%`,
              }}
            />
          </div>
          <p>
            {tr(
              "Groceries, snacks, meals, laundry, nightlife and other spending",
            )}
          </p>
          <div className="balance-footer">
            <span>
              {tr("Period budget")}{" "}
              <strong>
                {money(
                  Math.round(
                    (plan.budget - plan.limits.travel) *
                      (range ? range.days / periodDays(data, month) : 1),
                  ),
                )}
              </strong>
            </span>
            <span>
              {tr("Money out")}
              <strong>{money(stats.cash - stats.spent.travel)}</strong>
            </span>
            <span>
              {tr("Support received")}{" "}
              <strong>{money(stats.income - stats.received.travel)}</strong>
            </span>
          </div>
        </div>
        <div
          className={`mini-card budget-card ${group === "travel" ? "budget-selected" : ""}`}
        >
          <button
            type="button"
            className="budget-card-button"
            aria-label={tr("View Travel and tourism budget")}
            aria-pressed={group === "travel"}
            onClick={() => selectBudget("travel")}
          />
          <div className="mini-icon blue">
            <Plane size={21} />
          </div>
          <span className="tiny">
            {tr(
              view === "week"
                ? "TRAVEL & TOURISM · LEFT THIS WEEK"
                : "TRAVEL & TOURISM · LEFT THIS MONTH",
            )}
          </span>
          <h2>{money(stats.travel)}</h2>
          <div className="track">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, (stats.spent.travel / Math.max(1, Math.round(plan.limits.travel * (range ? range.days / periodDays(data, month) : 1)))) * 100))}%`,
              }}
            />
          </div>
          <p>
            {tr(
              "One shared limit for transport, accommodation, food and activities.",
            )}{" "}
          </p>
          <div className="mini-footer">
            <span>
              {tr("{0} for this month · no rollover", [
                money(plan.limits.travel),
              ])}
            </span>
          </div>
          <div className="travel-totals">
            <span>{tr("Out: {0}", [money(stats.spent.travel)])}</span>
            <span>{tr("Support: {0}", [money(stats.received.travel)])}</span>
          </div>
        </div>
      </section>
      <div className="under-hero">
        <span>
          <Check size={14} />{" "}
          {group === "all"
            ? tr("Tap a budget card to filter · tap again for both")
            : group === "daily"
              ? tr("Viewing Day to day · tap its card again for both")
              : tr("Viewing Travel & tourism · tap its card again for both")}
        </span>
        <span>
          {tr("Laundry credit through {0}", [
            displayDate(range?.end ?? monthEnd(month)),
          ])}
          {isFuture ? tr(" · plan preview") : ""}
        </span>
      </div>
      <section className="dashboard-grid">
        <div className="panel category-panel">
          <div className="section-heading">
            <div>
              <h2>{tr("Where it’s going")}</h2>
              <p>
                {tr(
                  view === "week"
                    ? "Your prorated weekly category guide"
                    : "Your monthly category guide",
                )}
              </p>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setTab("Budget & settings");
                setSettingsSection("plan");
              }}
            >
              {tr("Edit limits")} <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="category-list">
            {categories
              .filter(
                (c) =>
                  group === "all" ||
                  (group === "travel" ? c.id === "travel" : c.id !== "travel"),
              )
              .map((c) => {
                const cap =
                    Math.round(
                      plan.limits[c.id] *
                        (range ? range.days / periodDays(data, month) : 1),
                    ) + stats.received[c.id],
                  spent = stats.spent[c.id];
                return (
                  <div className="category-row" key={c.id}>
                    <div className={`category-emoji cat-${c.id}`}>
                      <CategoryIcon category={c.id} />
                    </div>
                    <div className="category-main">
                      <div className="category-label">
                        <strong>
                          {tr(c.name)}
                          {alerts.some((a) => a.category === c.id) && (
                            <small role="status">
                              {tr("Monthly limit: {0}% reached", [
                                alerts.find((a) => a.category === c.id)!
                                  .threshold,
                              ])}
                            </small>
                          )}
                        </strong>
                        <span>
                          <b>{money(spent)}</b>{" "}
                          <span className="muted">/ {money(cap)}</span>
                        </span>
                      </div>
                      <div className="track">
                        <span
                          style={{
                            width: `${Math.min(100, (spent / Math.max(1, cap)) * 100)}%`,
                            background: spent > cap ? "#b86148" : c.color,
                          }}
                        />
                      </div>
                      <small>
                        {c.id === "laundry"
                          ? tr("Top-ups only · washes use card credit")
                          : spent > cap
                            ? tr("{0} above this period’s guide", [
                                money(spent - cap),
                              ])
                            : tr("{0} left in this period · no rollover", [
                                money(cap - spent),
                              ])}
                      </small>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="right-stack">
          {group !== "daily" && <TravelBreakdown rows={stats.rows} />}
          <div className="panel">
            <div className="section-heading">
              <div>
                <h2>{tr("Spending mix")}</h2>
                <p>{tr("Money leaving your bank")}</p>
              </div>
              <span className="pill">
                {view === "week" ? tr("This week") : tr("This month")}
              </span>
            </div>
            <SpendingChart
              spent={
                Object.fromEntries(
                  categories.map((c) => [
                    c.id,
                    group === "all" ||
                    (group === "travel" ? c.id === "travel" : c.id !== "travel")
                      ? stats.spent[c.id]
                      : 0,
                  ]),
                ) as Record<Category, number>
              }
            />
          </div>
          {group !== "travel" && (
            <div className="laundry-card">
              <div className="section-heading">
                <span className="laundry-title">
                  <WashingMachine size={21} /> {tr("Laundry card")}{" "}
                </span>
                <span className="pill">{tr("CZK CREDIT")}</span>
              </div>
              <div className="laundry-value">{money(stats.card, "CZK")}</div>
              <p>{tr("Credit carries over. Washes aren’t counted twice.")}</p>
              <div className="laundry-meta">
                <span>
                  {tr("Top-ups this period")}{" "}
                  <b>{money(stats.spent.laundry)}</b>
                </span>
                <span>
                  {tr("Credit used")} <b>{money(stats.wash, "CZK")}</b>
                </span>
              </div>
              <div className="button-pair">
                <button onClick={() => openNew("topup")}>
                  <Plus size={16} /> {tr("Top up")}{" "}
                </button>
                <button onClick={() => openNew("wash")}>
                  <WashingMachine size={16} /> {tr("Log wash")}{" "}
                </button>
              </div>
            </div>
          )}
          <div className="panel weekly-panel">
            <div className="section-heading">
              <h2>{tr("Weekly rhythm")}</h2>
              <span className="muted">
                {tr("{0} total", [money(groupCash(summary(data, month)))])}
              </span>
            </div>
            <div className="bar-chart">
              {weekList.map((w) => {
                const s = summary(data, month, w);
                const max = Math.max(
                  1,
                  ...weekList.map((x) => groupCash(summary(data, month, x))),
                );
                return (
                  <div className="bar-column" key={w.start}>
                    <span>{money(groupCash(s))}</span>
                    <div className="bar-slot">
                      <div
                        style={{ height: `${(groupCash(s) / max) * 100}%` }}
                      />
                    </div>
                    <small>
                      {w.start.slice(8)}–{w.end.slice(8)}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{tr("Recent activity")}</h2>
            <p>{tr("Small moments, clearly recorded.")}</p>
          </div>
          <button
            className="text-button"
            onClick={() => setTab("Transactions")}
          >
            {tr("View all")} <ArrowUpRight size={15} />
          </button>
        </div>
        <TransactionList
          rows={rows.slice(0, 5)}
          edit={setEditor}
          remove={setPendingDelete}
          add={() => openNew()}
        />
      </section>
    </>
  );
}
