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
import { currencyDigits, searchCurrencies } from "../fx";
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
            <RefreshCw size={21} /> Exchange rates
          </h2>
          <p>Referências Frankfurter · base EUR</p>
        </div>
        <button
          className="icon-button"
          onClick={() => fx.refresh(true)}
          disabled={fx.busy}
          aria-label="Refresh rates"
        >
          <RefreshCw size={18} className={fx.busy ? "spin" : ""} />
        </button>
      </div>
      <div className="rate-hero">
        <span className="tiny">TAXA DE REFERÊNCIA</span>
        <strong>
          €1,00{" "}
          <span>
            ≈{" "}
            {quote
              ? quote.rate.toLocaleString("pt-PT", { maximumFractionDigits: 6 })
              : "—"}{" "}
            {code}
          </span>
        </strong>
        <p>
          {quote
            ? `Publicada em ${quote.date}`
            : "Sem taxa guardada para esta moeda."}
        </p>
        <button
          className="primary full"
          disabled={fx.busy}
          onClick={() => fx.refresh(true)}
        >
          <RefreshCw size={18} />
          {fx.busy ? "A atualizar…" : "Atualizar taxas online"}
        </button>
        <small>
          {fx.cache
            ? `Última consulta: ${new Date(fx.cache.fetchedAt).toLocaleString("pt-PT")}`
            : "Ainda sem consulta concluída."}
        </small>
      </div>
      <div className="rate-calculator">
        <Field label="Montante EUR">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={`Equivalente ${code}`}>
          <output>
            {quote
              ? (Number(amount || 0) * quote.rate).toLocaleString("pt-PT", {
                  maximumFractionDigits: currencyDigits(code) ?? 2,
                })
              : "—"}
          </output>
        </Field>
      </div>
      <p className="help">
        Cada movimento guarda a taxa utilizada. Esta referência pode diferir da
        taxa do banco. As taxas em cache estão disponíveis offline.
      </p>
      {fx.error && <p className="form-error">{fx.error}</p>}
      <label className="search">
        <Search size={19} />
        <input
          aria-label="Search exchange currencies"
          placeholder="Pesquisar moeda, nome ou código…"
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
              <small>{c.name}</small>
            </span>
            <strong>
              {c.code === "EUR"
                ? "1,0000"
                : (fx.cache?.rates[c.code]?.rate.toLocaleString("pt-PT", {
                    maximumFractionDigits: 4,
                  }) ?? "—")}
            </strong>
            {code === c.code && <CheckCircle2 size={17} />}
          </button>
        ))}
      </div>
      <p className="help">
        {fx.currencies.length} moedas pesquisáveis. A consulta automática usa
        cache de seis horas; o botão força uma nova tentativa.
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
          TOTAL GASTO {range ? "NA SEMANA" : "NO MÊS"}
        </span>
        <span className="pill">
          <span className="status-dot" />
          {stats.rows.length} movimentos
        </span>
      </div>
      <div className="summary-values">
        <div>
          <strong>{money(stats.cash)}</strong>
          <span> / {money(stats.budget)}</span>
        </div>
        <span>Restam {money(remaining)}</span>
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
          · apoio {money(stats.income)}
        </span>
        <span>
          {remaining >= 0 ? "Dentro do orçamento" : "Acima do orçamento"}
        </span>
      </div>
      <div className="budget-pills">
        <button
          className={group === "all" ? "selected" : ""}
          onClick={() => selectGroup("all")}
        >
          Todos
        </button>
        <button
          className={group === "daily" ? "selected" : ""}
          onClick={() => selectGroup("daily")}
        >
          Dia a dia <small>({money(stats.everydayRemaining)} rest.)</small>
        </button>
        <button
          className={group === "travel" ? "selected" : ""}
          onClick={() => selectGroup("travel")}
        >
          Viagens <small>({money(stats.travel)} rest.)</small>
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
          <WashingMachine size={22} /> CZK CARD CREDIT
        </span>
      </div>
      <div className="laundry-value">{money(stats.card, "CZK")}</div>
      <p>Crédito acumulado do cartão. As lavagens usam o saldo já carregado.</p>
      <div className="button-pair">
        <button onClick={() => openNew("topup")}>
          <Plus size={16} /> Top up
        </button>
        <button onClick={() => openNew("wash")}>
          <WashingMachine size={16} /> Log wash
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
              ? `Spending by category. Total ${money(total)}.`
              : "No spending recorded"
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
          <span>{total ? "MONEY OUT" : "A FRESH START"}</span>
        </div>
      </div>
      {total ? (
        <div className="legend">
          {categories
            .filter((c) => spent[c.id] > 0)
            .map((c) => (
              <div key={c.id}>
                <span style={{ background: c.color }} />
                {c.name}
                <b>{Math.round((spent[c.id] / total) * 100)}%</b>
              </div>
            ))}
        </div>
      ) : (
        <p className="empty-caption">
          Your story starts with your first expense.
          <br />
          No spending recorded yet.
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
        <h3>A fresh page for your adventures.</h3>
        <p>No transactions in this view.</p>
        <button className="text-button" onClick={add}>
          <Plus size={16} /> Add expense
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
            {day === today() ? "Hoje, " : ""}
            {new Date(day + "T12:00:00").toLocaleDateString("pt-PT", {
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
                          ? "Money received"
                          : t.kind === "topup"
                            ? "Laundry top-up"
                            : t.kind === "wash"
                              ? "Laundry wash"
                              : c.name)}
                    </strong>
                    <small>
                      {c.name}
                      {t.category === "travel"
                        ? ` · ${travelTypes.find((x) => x.id === (t.travelType ?? "unclassified"))?.name}`
                        : ""}
                      {t.kind === "income"
                        ? " · RECEBIDO"
                        : t.kind === "topup"
                          ? ` · +${money(t.credit, "CZK")} cartão`
                          : ""}
                      {t.legacyCategory ? ` · Rever: ${t.legacyCategory}` : ""}
                      {t.date > today() ? " · Future dated" : ""}
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
                        ? "€0,00 na conta"
                        : t.currency !== "EUR"
                          ? money(t.amount, t.currency)
                          : t.kind === "income"
                            ? "Apoio recebido"
                            : "Saída da conta"}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => edit(t)}
                    aria-label={`Edit ${t.note || t.kind}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => remove(t)}
                    aria-label={`Delete ${t.note || t.kind}`}
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
      <h2>Inside your travel budget</h2>
      <p className="help">
        One shared limit. Subcategories describe spending, not separate caps.
      </p>
      {travelTypes.map((t) => (
        <div className="allocation-total" key={t.id}>
          <span>{t.name}</span>
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
        <span>TETO MENSAL · TODOS OS MESES</span>
      </div>
      <Field label="Monthly budget (€)">
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
              <b>{c.name}</b>
              <small>{categoryInfo[c.id].description}</small>
            </span>
          </span>
          <span>
            €{" "}
            <input
              aria-label={`${c.name} monthly limit`}
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
        <span>Allocated</span>
        <b>
          {money(total)} / {money(Math.round(budget * 100))}
        </b>
      </div>
      {total !== Math.round(budget * 100) && (
        <p className="form-error">
          Adjust allocations by {money(Math.round(budget * 100) - total)} to
          match the budget.
        </p>
      )}
      <p className="budget-rule">
        <CheckCircle2 size={18} /> Dois orçamentos independentes. Só o crédito
        da lavandaria transita.
      </p>
      <button
        className="primary full"
        disabled={total !== Math.round(budget * 100)}
      >
        <Check size={18} /> Save plan for all months
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
        <Field label="Start month">
          <input type="month" name="start" required defaultValue={s.start} />
        </Field>
        <Field label="End month">
          <input type="month" name="end" required defaultValue={s.end} />
        </Field>
      </div>
      <Field label="Primeiro dia acompanhado (no mês inicial)">
        <input
          type="number"
          name="firstDay"
          min="1"
          max="31"
          required
          defaultValue={Number(periodStart(data, s.start).slice(8))}
        />
      </Field>
      <Field label="Manual fallback · CZK for €1">
        <input
          type="number"
          name="rate"
          min="0.0001"
          max="1000"
          step="0.0001"
          defaultValue={s.rate ?? ""}
          placeholder="Optional · entered manually"
        />
      </Field>
      <Field label="Opening laundry credit (CZK)">
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
          {error}
        </p>
      )}
      <button className="secondary full">Save settings</button>
    </form>
  );
}
