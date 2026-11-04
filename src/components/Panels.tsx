import {
  ArrowLeftRight,
  ChartPie,
  Check,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WashingMachine,
} from "lucide-react";
import { useState } from "react";
import { currencyDigits, currencyName, searchCurrencies } from "../fx";
import { appLocale, displayDate, kindLabel, tr, trCount } from "../i18n";
import {
  applyGlobalPlan,
  categories,
  globalPlan,
  money,
  monthLabel,
  periodStart,
  planFor,
  summary,
  today,
  transactionOrder,
  travelTypes,
  type Category,
  type Data,
  type Transaction,
} from "../model";
import { CategoryIcon, categoryInfo } from "../ui";
import { useExchangeRates } from "../useExchangeRates";
import { Field } from "./Primitives";
const toCents = (s: FormDataEntryValue | null) => Math.round(Number(s) * 100);
export function ExchangePanel({
  fx,
}: {
  fx: ReturnType<typeof useExchangeRates>;
}) {
  const [query, setQuery] = useState(""),
    [code, setCode] = useState("CZK"),
    [amount, setAmount] = useState("10");
  const quote =
    code === "EUR" ? { rate: 1, date: today() } : fx.cache?.rates[code];
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>
            <RefreshCw size={21} /> {tr("Exchange rates")}{" "}
          </h2>
          <p>{tr("Frankfurter reference rates · EUR base")}</p>
        </div>
        <button
          className="icon-button"
          onClick={() => fx.refresh(true)}
          disabled={fx.busy}
          aria-label={tr("Refresh rates")}
        >
          <RefreshCw size={18} className={fx.busy ? "spin" : ""} />
        </button>
      </div>
      <div className="rate-hero">
        <span className="tiny">{tr("REFERENCE RATE")}</span>
        <strong>
          {money(100)}{" "}
          <span>
            ≈{" "}
            {quote
              ? quote.rate.toLocaleString(appLocale(), {
                  maximumFractionDigits: 6,
                })
              : "—"}{" "}
            {code}
          </span>
        </strong>
        <p>
          {quote
            ? tr("Published on {0}", [displayDate(quote.date)])
            : tr("No saved rate for this currency.")}
        </p>
        <button
          className="primary full"
          disabled={fx.busy}
          onClick={() => fx.refresh(true)}
        >
          <RefreshCw size={18} />
          {fx.busy ? tr("Refreshing…") : tr("Refresh rates online")}
        </button>
        <small>
          {fx.cache
            ? tr("Last checked: {0}", [
                new Date(fx.cache.fetchedAt).toLocaleString(appLocale()),
              ])
            : tr("No completed request yet.")}
        </small>
      </div>
      <div className="rate-calculator">
        <Field label={tr("EUR amount")}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={tr("{0} equivalent", [code])}>
          <output>
            {quote
              ? (Number(amount || 0) * quote.rate).toLocaleString(appLocale(), {
                  maximumFractionDigits: currencyDigits(code) ?? 2,
                })
              : "—"}
          </output>
        </Field>
      </div>
      <p className="help">
        {tr(
          "Each transaction keeps its rate. This reference may differ from your bank rate. Cached rates are available offline.",
        )}{" "}
      </p>
      {fx.error && <p className="form-error">{tr(fx.error)}</p>}
      <label className="search">
        <Search size={19} />
        <input
          aria-label={tr("Search exchange currencies")}
          placeholder={tr("Search currency, name or code…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="exchange-list">
        {searchCurrencies(fx.currencies, query).map((c) => (
          <button
            key={c.code}
            className={code === c.code ? "selected" : ""}
            onClick={() => setCode(c.code)}
            aria-pressed={code === c.code}
          >
            <span className="currency-symbol">{c.code.slice(0, 1)}</span>
            <span>
              <b>{c.code}</b>
              <small>{currencyName(c.code)}</small>
            </span>
            <strong>
              {c.code === "EUR"
                ? (1).toLocaleString(appLocale(), { minimumFractionDigits: 4 })
                : (fx.cache?.rates[c.code]?.rate.toLocaleString(appLocale(), {
                    maximumFractionDigits: 4,
                  }) ?? "—")}
            </strong>
            {code === c.code && <CheckCircle2 size={17} />}
          </button>
        ))}
      </div>
      <p className="help">
        {trCount(
          "{0} searchable currencies. Automatic updates use a six-hour cache; the button forces a new attempt.",
          [fx.currencies.length],
        )}
      </p>
    </>
  );
}

export function PeriodSummary({
  stats,
  plan,
  month,
  range,
  group,
  selectGroup,
}: {
  stats: ReturnType<typeof summary>;
  plan: ReturnType<typeof planFor>;
  month: string;
  range?: { days: number; start: string; end: string };
  group: string;
  selectGroup: (group: string) => void;
}) {
  const remaining = stats.budget + stats.income - stats.cash,
    used = (stats.cash / Math.max(1, stats.budget)) * 100;
  return (
    <section className="period-summary">
      <div className="summary-top">
        <span className="tiny">
          {tr(range ? "TOTAL SPENT THIS WEEK" : "TOTAL SPENT THIS MONTH")}
        </span>
        <span className="pill">
          <span className="status-dot" />
          {trCount("{0} transactions", [stats.rows.length])}
        </span>
      </div>
      <div className="summary-values">
        <div>
          <strong>{money(stats.cash)}</strong>
          <span> / {money(stats.budget)}</span>
        </div>
        <span>{tr("{0} remaining", [money(remaining)])}</span>
      </div>
      <div className="track">
        <span
          style={{
            width: `${Math.min(100, used)}%`,
            background: used > 100 ? "var(--error)" : "var(--primary)",
          }}
        />
      </div>
      <div className="summary-foot">
        <span>
          {range
            ? `${range.start.slice(8)}–${range.end.slice(8)}`
            : monthLabel(month)}{" "}
          {tr("· support {0}", [money(stats.income)])}
        </span>
        <span>{remaining >= 0 ? tr("Within budget") : tr("Over budget")}</span>
      </div>
      <div className="budget-pills">
        <button
          className={group === "all" ? "selected" : ""}
          onClick={() => selectGroup("all")}
        >
          {tr("All")}{" "}
        </button>
        <button
          className={group === "daily" ? "selected" : ""}
          onClick={() => selectGroup("daily")}
        >
          {tr("Day to day")}{" "}
          <small>{tr("({0} left)", [money(stats.everydayRemaining)])}</small>
        </button>
        <button
          className={group === "travel" ? "selected" : ""}
          onClick={() => selectGroup("travel")}
        >
          {tr("Travel")}{" "}
          <small>{tr("({0} left)", [money(stats.travel)])}</small>
        </button>
      </div>
    </section>
  );
}

export function LaundryPanel({
  stats,
  openNew,
}: {
  stats: ReturnType<typeof summary>;
  openNew: (kind: Transaction["kind"]) => void;
}) {
  return (
    <div className="laundry-card">
      <div className="section-heading">
        <span className="laundry-title">
          <WashingMachine size={22} /> {tr("CZK CARD CREDIT")}{" "}
        </span>
      </div>
      <div className="laundry-value">{money(stats.card, "CZK")}</div>
      <p>
        {tr("Accumulated card credit. Washes use the balance already loaded.")}
      </p>
      <div className="button-pair">
        <button onClick={() => openNew("topup")}>
          <Plus size={16} /> {tr("Top up")}{" "}
        </button>
        <button onClick={() => openNew("wash")}>
          <WashingMachine size={16} /> {tr("Log wash")}{" "}
        </button>
      </div>
    </div>
  );
}

export function SpendingChart({ spent }: { spent: Record<Category, number> }) {
  const total = Object.values(spent).reduce((a, b) => a + b, 0);
  let offset = 0;
  return (
    <div className="spending-chart">
      <div className="donut-wrap">
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={
            total
              ? tr("Spending by category. Total {0}.", [money(total)])
              : tr("No spending recorded")
          }
        >
          <circle
            cx="80"
            cy="80"
            r="61"
            fill="none"
            stroke="#edf0e9"
            strokeWidth="17"
          />
          {categories
            .filter((c) => spent[c.id] > 0)
            .map((c) => {
              const length = (spent[c.id] / total) * 383.274;
              const node = (
                <circle
                  key={c.id}
                  cx="80"
                  cy="80"
                  r="61"
                  fill="none"
                  stroke={c.color}
                  strokeWidth="17"
                  strokeDasharray={`${length} ${383.274 - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                />
              );
              offset += length;
              return node;
            })}
        </svg>
        <div className="donut-label">
          <strong>{money(total)}</strong>
          <span>{total ? tr("MONEY OUT") : tr("A FRESH START")}</span>
        </div>
      </div>
      {total ? (
        <div className="legend">
          {categories
            .filter((c) => spent[c.id] > 0)
            .map((c) => (
              <div key={c.id}>
                <span style={{ background: c.color }} />
                {tr(c.name)}
                <b>{Math.round((spent[c.id] / total) * 100)}%</b>
              </div>
            ))}
        </div>
      ) : (
        <p className="empty-caption">
          {tr("Your story starts with your first expense.")} <br />
          {tr("No spending recorded yet.")}{" "}
        </p>
      )}
    </div>
  );
}

export function TransactionList({
  rows,
  edit,
  remove,
  add,
}: {
  rows: Transaction[];
  edit: (t: Transaction) => void;
  remove: (t: Transaction) => void;
  add: () => void;
}) {
  if (!rows.length)
    return (
      <div className="empty-state">
        <span>
          <ArrowLeftRight size={26} />
        </span>
        <h3>{tr("A fresh page for your adventures.")}</h3>
        <p>{tr("No transactions in this view.")}</p>
        <button className="text-button" onClick={add}>
          <Plus size={16} /> {tr("Add expense")}{" "}
        </button>
      </div>
    );
  const ordered = [...rows].sort(transactionOrder),
    days = [...new Set(ordered.map((t) => t.date))];
  return (
    <div className="transactions">
      {days.map((day) => (
        <section className="transaction-day" key={day}>
          <h3>
            <span className="day-dot" />
            {day === today() ? tr("Today, ") : ""}
            {new Date(day + "T12:00:00").toLocaleDateString(appLocale(), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            <span className="day-total">
              {money(
                ordered
                  .filter((t) => t.date === day && t.kind !== "wash")
                  .reduce(
                    (sum, t) => sum + (t.kind === "income" ? t.eur : -t.eur),
                    0,
                  ),
              )}
            </span>
          </h3>
          {ordered
            .filter((t) => t.date === day)
            .map((t) => {
              const c = categories.find((c) => c.id === t.category)!;
              return (
                <div
                  className={`transaction kind-${t.kind} cat-${c.id}`}
                  key={t.id}
                >
                  <span className={`category-emoji cat-${c.id}`}>
                    <CategoryIcon category={c.id} travelType={t.travelType} />
                  </span>
                  <div className="transaction-description">
                    <strong>
                      {t.note ||
                        (t.kind === "income"
                          ? tr("Money received")
                          : t.kind === "topup"
                            ? tr("Laundry top-up")
                            : t.kind === "wash"
                              ? tr("Laundry wash")
                              : tr(c.name))}
                    </strong>
                    <small>
                      {tr(c.name)}
                      {t.category === "travel"
                        ? ` · ${tr(travelTypes.find((x) => x.id === (t.travelType ?? "unclassified"))!.name)}`
                        : ""}
                      {t.kind === "income"
                        ? tr(" · RECEIVED")
                        : t.kind === "topup"
                          ? tr(" · +{0} card", [money(t.credit, "CZK")])
                          : ""}
                      {t.legacyCategory
                        ? tr(" · Review: {0}", [t.legacyCategory])
                        : ""}
                      {t.date > today() ? tr(" · Future dated") : ""}
                    </small>
                  </div>
                  <div className="transaction-amount">
                    <strong>
                      {t.kind === "wash"
                        ? `− ${money(t.credit, "CZK")}`
                        : `${t.kind === "income" ? "+" : "−"} ${money(t.eur)}`}
                    </strong>
                    <small>
                      {t.kind === "wash"
                        ? tr("{0} bank outflow", [money(0)])
                        : t.currency !== "EUR"
                          ? money(t.amount, t.currency)
                          : t.kind === "income"
                            ? tr("Support received")
                            : tr("Bank outflow")}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => edit(t)}
                    aria-label={tr("Edit {0}", [t.note || kindLabel(t.kind)])}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => remove(t)}
                    aria-label={tr("Delete {0}", [t.note || kindLabel(t.kind)])}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}

export function TravelBreakdown({ rows }: { rows: Transaction[] }) {
  return (
    <div className="panel">
      <h2>{tr("Inside your travel budget")}</h2>
      <p className="help">
        {tr(
          "One shared limit. Subcategories describe spending, not separate caps.",
        )}{" "}
      </p>
      {travelTypes.map((t) => (
        <div className="allocation-total" key={t.id}>
          <span>{tr(t.name)}</span>
          <b>
            {money(
              rows
                .filter(
                  (x) =>
                    x.category === "travel" &&
                    x.kind === "expense" &&
                    (x.travelType ?? "unclassified") === t.id,
                )
                .reduce((s, x) => s + x.eur, 0),
            )}
          </b>
        </div>
      ))}
    </div>
  );
}

export function BudgetForm({
  data,
  save,
}: {
  data: Data;
  save: (d: Data) => boolean;
}) {
  const p = globalPlan(data),
    [budget, setBudget] = useState(p.budget / 100),
    [limits, setLimits] = useState({ ...p.limits });
  const total = Object.values(limits).reduce((a, b) => a + b, 0);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(
          applyGlobalPlan(data, { budget: Math.round(budget * 100), limits }),
        );
      }}
    >
      <div className="plan-total-label">
        <ChartPie size={22} />
        <span>{tr("MONTHLY LIMIT · ALL MONTHS")}</span>
      </div>
      <Field label={tr("Monthly budget (€)")}>
        <input
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          required
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </Field>
      {categories.map((c) => (
        <label className="limit-input" key={c.id}>
          <span className="limit-description">
            <span className={`category-emoji cat-${c.id}`}>
              <CategoryIcon category={c.id} />
            </span>
            <span>
              <b>{tr(c.name)}</b>
              <small>{tr(categoryInfo[c.id].description)}</small>
            </span>
          </span>
          <span>
            €{" "}
            <input
              aria-label={tr("{0} monthly limit", [tr(c.name)])}
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              required
              value={limits[c.id] / 100}
              onChange={(e) =>
                setLimits({
                  ...limits,
                  [c.id]: Math.round(Number(e.target.value) * 100),
                })
              }
            />
          </span>
        </label>
      ))}
      <div
        className={
          "allocation-total " +
          (total !== Math.round(budget * 100) ? "form-error" : "")
        }
      >
        <span>{tr("Allocated")}</span>
        <b>
          {money(total)} / {money(Math.round(budget * 100))}
        </b>
      </div>
      {total !== Math.round(budget * 100) && (
        <p className="form-error">
          {tr("Adjust allocations by {0} to match the budget.", [
            money(Math.round(budget * 100) - total),
          ])}
        </p>
      )}
      <p className="budget-rule">
        <CheckCircle2 size={18} />{" "}
        {tr("Two independent budgets. Only laundry credit carries over.")}{" "}
      </p>
      <button
        className="primary full"
        disabled={total !== Math.round(budget * 100)}
      >
        <Check size={18} /> {tr("Save plan for all months")}{" "}
      </button>
    </form>
  );
}

export function SettingsForm({
  data,
  save,
}: {
  data: Data;
  save: (d: Data) => boolean;
}) {
  const s = data.settings;
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          save(
            applyGlobalPlan(
              {
                ...data,
                settings: {
                  firstDay: Number(f.get("firstDay")),
                  start: String(f.get("start")),
                  end: String(f.get("end")),
                  rate: f.get("rate") ? Number(f.get("rate")) : null,
                  openingCard: toCents(f.get("card")),
                  openingTravel: s.openingTravel,
                  openingEmergency: s.openingEmergency,
                },
              },
              globalPlan(data),
            ),
          );
          setError("");
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <Field label={tr("Start month")}>
          <input type="month" name="start" required defaultValue={s.start} />
        </Field>
        <Field label={tr("End month")}>
          <input type="month" name="end" required defaultValue={s.end} />
        </Field>
      </div>
      <Field label={tr("First tracked day (in the starting month)")}>
        <input
          type="number"
          name="firstDay"
          min="1"
          max="31"
          required
          defaultValue={Number(periodStart(data, s.start).slice(8))}
        />
      </Field>
      <Field label={tr("Manual fallback · CZK for €1")}>
        <input
          type="number"
          name="rate"
          min="0.0001"
          max="1000"
          step="0.0001"
          defaultValue={s.rate ?? ""}
          placeholder={tr("Optional · entered manually")}
        />
      </Field>
      <Field label={tr("Opening laundry credit (CZK)")}>
        <input
          type="number"
          name="card"
          min="0"
          max="1000000"
          step="0.01"
          required
          defaultValue={s.openingCard / 100}
        />
      </Field>
      {error && (
        <p role="alert" className="form-error">
          {tr(error)}
        </p>
      )}
      <button className="secondary full">{tr("Save settings")}</button>
    </form>
  );
}
