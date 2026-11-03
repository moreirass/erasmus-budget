import {
  ArrowDownLeft,
  Check,
  Plane,
  Plus,
  RefreshCw,
  Wallet,
  WashingMachine,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { CurrencyPicker } from "../CurrencyPicker";
import { currencyDigits, currencyFactor } from "../fx";
import {
  categories,
  makeTransaction,
  money,
  monthEnd,
  periodStart,
  today,
  travelTypes,
  validateData,
  type Category,
  type Data,
  type Transaction,
} from "../model";
import { CategoryIcon } from "../ui";
import { useExchangeRates } from "../useExchangeRates";
import { Field } from "./Primitives";
export function TransactionForm({
  data,
  month,
  initial,
  initialKind,
  fx,
  save,
}: {
  data: Data;
  month: string;
  initial?: Transaction;
  initialKind: Transaction["kind"];
  fx: ReturnType<typeof useExchangeRates>;
  save: (t: Transaction) => void;
}) {
  const [kind, setKind] = useState(initial?.kind ?? initialKind),
    [group, setGroup] = useState(
      initial?.category === "travel" ? "travel" : "daily",
    );
  const [category, setCategory] = useState<Category>(
    initial?.category &&
      initial.category !== "travel" &&
      (initial.kind === "income" || initial.category !== "laundry")
      ? initial.category
      : "groceries",
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "CZK"),
    [amount, setAmount] = useState(initial ? String(initial.amount / 100) : ""),
    [rate, setRate] = useState(
      initial
        ? String(initial.rate)
        : data.settings.rate
          ? String(data.settings.rate)
          : "",
    ),
    [error, setError] = useState("");
  const [rateMode, setRateMode] = useState(initial ? "saved" : "auto");
  const laundry = kind === "topup" || kind === "wash";
  const needsRate = currency !== "EUR" || laundry;
  const quote = fx.cache?.rates[laundry ? "CZK" : currency];
  useEffect(() => {
    if (rateMode === "auto")
      setRate(needsRate && quote ? String(quote.rate) : needsRate ? "" : "1");
  }, [currency, rateMode, quote?.rate, needsRate]);
  const chooseCurrency = (code: string) => {
    setCurrency(code);
    setRateMode("auto");
    setRate("");
  };
  const chooseKind = (k: Transaction["kind"]) => {
    setKind(k);
    if (k === "expense" && category === "laundry") setCategory("groceries");
    if ((k === "topup" || k === "wash") && !["EUR", "CZK"].includes(currency))
      chooseCurrency("CZK");
  };
  const digits = currencyDigits(currency),
    factor = currencyFactor(currency);
  const entered = Math.round(Number(amount) * factor),
    eur =
      currency === "EUR"
        ? entered
        : Math.round(((entered / factor) * 100) / Number(rate));

  const defaultDate =
    today() < periodStart(data, data.settings.start)
      ? periodStart(data, data.settings.start)
      : today() > monthEnd(data.settings.end)
        ? monthEnd(data.settings.end)
        : today();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const f = new FormData(e.currentTarget),
        laundry = kind === "topup" || kind === "wash";
      const category = laundry
        ? "laundry"
        : group === "travel"
          ? "travel"
          : (String(f.get("category")) as Category);
      const t = makeTransaction({
        addedOrder:
          initial?.addedOrder ??
          Math.max(0, ...data.transactions.map((t) => t.addedOrder ?? 0)) + 1,
        id: initial?.id ?? crypto.randomUUID(),
        date: String(f.get("date")),
        kind,
        category,
        amount: Math.round(Number(amount) * currencyFactor(currency)),
        currency,
        rate: needsRate ? Number(rate) : 1,
        ...(rateMode === "auto" && quote && needsRate
          ? { rateSource: "Frankfurter" as const, rateDate: quote.date }
          : rateMode === "saved"
            ? { rateSource: initial?.rateSource, rateDate: initial?.rateDate }
            : { rateSource: "manual" as const }),
        note: String(f.get("note")).trim(),
        ...(category === "travel"
          ? {
              travelType: String(
                f.get("travelType"),
              ) as Transaction["travelType"],
            }
          : {}),
      });
      validateData({
        ...data,
        transactions: [...data.transactions.filter((x) => x.id !== t.id), t],
      });
      save(t);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="segmented full transaction-kinds">
        {(["expense", "income", "topup", "wash"] as const).map((k) => (
          <button
            type="button"
            key={k}
            className={kind === k ? "selected" : ""}
            onClick={() => chooseKind(k)}
          >
            {k === "expense" ? (
              <Wallet size={20} />
            ) : k === "income" ? (
              <ArrowDownLeft size={20} />
            ) : k === "topup" ? (
              <Plus size={20} />
            ) : (
              <WashingMachine size={20} />
            )}
            <span>
              {
                {
                  expense: "Despesa",
                  income: "Apoio",
                  topup: "Carregar",
                  wash: "Lavagem",
                }[k]
              }
            </span>
          </button>
        ))}
      </div>
      {(kind === "expense" || kind === "income") && (
        <div className="form-section">
          <div className="field-label">ENVELOPE GLOBAL</div>
          <div className="group-options">
            <button
              type="button"
              className={group === "daily" ? "selected" : ""}
              onClick={() => setGroup("daily")}
            >
              <Wallet size={19} />
              <b>Dia a dia</b>
              <small>Despesas correntes</small>
            </button>
            <button
              type="button"
              className={group === "travel" ? "selected" : ""}
              onClick={() => setGroup("travel")}
            >
              <Plane size={19} />
              <b>Viagens & turismo</b>
              <small>Um limite independente</small>
            </button>
          </div>
        </div>
      )}
      <CurrencyPicker
        value={currency}
        onChange={chooseCurrency}
        currencies={
          laundry
            ? fx.currencies.filter((c) => ["EUR", "CZK"].includes(c.code))
            : fx.currencies
        }
      />
      <div className="amount-hero">
        <Field label={`Amount (${currency})`}>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            min={1 / factor}
            max={100000000 / factor}
            step={1 / factor}
            required
            placeholder={(0).toFixed(digits)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
      </div>
      {needsRate && (
        <>
          <Field label="Exchange rate source">
            <select
              value={rateMode}
              onChange={(e) => {
                const m = e.target.value;
                setRateMode(m);
                if (
                  m === "manual" &&
                  !rate &&
                  currency === "CZK" &&
                  data.settings.rate
                )
                  setRate(String(data.settings.rate));
              }}
            >
              <option value="auto">Automatic reference rate</option>
              <option value="manual">My bank / manual rate</option>
              {initial && <option value="saved">Saved transaction rate</option>}
            </select>
          </Field>
          <Field label={`Rate · ${laundry ? "CZK" : currency} for €1`}>
            <input
              type="number"
              min="0.000000000001"
              max="1000000000000"
              step="any"
              required
              readOnly={rateMode === "auto"}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={
                fx.busy
                  ? "Loading reference rate…"
                  : "Choose manual if no reference rate is available"
              }
            />
          </Field>
          <p className="help">
            {rateMode === "auto"
              ? quote
                ? `Frankfurter · published ${quote.date}. Last fetched ${new Date(fx.cache!.fetchedAt).toLocaleString()}. Cached rates remain available offline. This is the latest reference, including for backdated entries.`
                : "No cached rate for this currency. Refresh online or choose a manual bank rate."
              : rateMode === "saved"
                ? `This entry keeps its saved rate${initial?.rateDate ? ` from ${initial.rateDate}` : ""}.`
                : "Enter your effective bank rate. It may differ from the reference rate."}
          </p>
          <button
            type="button"
            disabled={fx.busy}
            onClick={() => fx.refresh(true)}
          >
            <RefreshCw size={15} /> {fx.busy ? "Refreshing…" : "Refresh rates"}
          </button>
          {fx.error && (
            <p className="form-error" role="status">
              {fx.error}
            </p>
          )}
        </>
      )}
      {amount && Number(rate) > 0 && (
        <p className="conversion">
          {kind === "wash"
            ? "Card consumption only"
            : `${kind === "income" ? "Money received" : "Bank outflow"}: ${money(eur)}`}
          {laundry
            ? ` · CZK card ${kind === "topup" ? "+" : "−"} ${money(currency === "CZK" ? entered : Math.round(entered * Number(rate)), "CZK")}`
            : ""}
        </p>
      )}
      <div className="form-grid">
        {(kind === "expense" || kind === "income") &&
          (group === "travel" ? (
            <Field label="Travel category">
              <select
                name="travelType"
                defaultValue={initial?.travelType ?? "unclassified"}
              >
                {travelTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="form-section category-picker">
              <div className="field-label">CATEGORIA</div>
              <input type="hidden" name="category" value={category} />
              <div className="category-chips">
                {categories
                  .filter(
                    (c) =>
                      c.id !== "travel" &&
                      (kind === "income" || c.id !== "laundry"),
                  )
                  .map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={category === c.id ? "selected" : ""}
                      onClick={() => setCategory(c.id)}
                    >
                      <CategoryIcon category={c.id} />
                      <span>{c.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        <Field label="Date">
          <input
            type="date"
            name="date"
            required
            min={periodStart(data, data.settings.start)}
            max={monthEnd(data.settings.end)}
            defaultValue={initial?.date ?? defaultDate}
          />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input
          name="note"
          maxLength={500}
          defaultValue={initial?.note}
          placeholder={
            kind === "income"
              ? "e.g. Parents · food reimbursement"
              : "What was it for?"
          }
        />
      </Field>
      <p className="help">
        {kind === "income"
          ? "Support adds to this month’s available money in the selected budget. The original purchases stay visible. Laundry support is cash: record a top-up when you load the card."
          : kind === "topup"
            ? "Counts once as bank outflow and adds CZK credit."
            : kind === "wash"
              ? "Uses existing card credit without adding another bank expense."
              : "Saved in EUR using this entry’s rate. Travel categories share one monthly limit."}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary full" type="submit">
        <Check size={18} /> Save{" "}
        {
          {
            expense: "expense",
            income: "money received",
            topup: "top-up",
            wash: "wash",
          }[kind]
        }
      </button>
    </form>
  );
}
