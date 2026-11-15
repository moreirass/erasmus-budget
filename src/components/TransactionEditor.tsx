import { currentTime } from "../time";
import { errorMessage } from "../i18n";
import { lastEntry } from "../quickEntry";
import {
  AlertTriangle,
  ArrowDownLeft,
  Check,
  Plane,
  Plus,
  RefreshCw,
  Wallet,
  WashingMachine,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CurrencyPicker } from "../CurrencyPicker";
import { currencyDigits, currencyFactor } from "../fx";
import { appLocale, displayDate, tr } from "../i18n";
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
  extraFields,
  ruleMode = false,
  expenseOnly = false,
  onDirtyChange,
}: {
  data: Data;
  month: string;
  initial?: Transaction;
  initialKind: Transaction["kind"];
  fx: ReturnType<typeof useExchangeRates>;
  save: (t: Transaction) => void;
  extraFields?: ReactNode;
  ruleMode?: boolean;
  expenseOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const remembered = lastEntry(fx.currencies.map((c) => c.code));
  const [kind, setKind] = useState(initial?.kind ?? initialKind),
    [group, setGroup] = useState(
      initial
        ? initial.category === "travel"
          ? "travel"
          : "daily"
        : initialKind === "expense"
          ? remembered.group
          : "daily",
    );
  const [category, setCategory] = useState<Category>(
    initial?.category &&
      initial.category !== "travel" &&
      (initial.kind === "income" || initial.category !== "laundry")
      ? initial.category
      : !initial && initialKind === "expense"
        ? remembered.category
        : "groceries",
  );
  const [currency, setCurrency] = useState(
      initial?.currency ??
        (["topup", "wash"].includes(initialKind) ? "CZK" : remembered.currency),
    ),
    [amount, setAmount] = useState(
      initial ? String(initial.amount / currencyFactor(initial.currency)) : "",
    ),
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
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const chooseCurrency = (code: string) => {
    onDirtyChange?.(true);
    setCurrency(code);
    setRateMode("auto");
    setRate("");
  };
  const chooseKind = (k: Transaction["kind"]) => {
    onDirtyChange?.(true);
    setKind(k);
    if (k === "expense" && category === "laundry") setCategory("groceries");
    if (
      (k === "topup" || k === "wash") &&
      (!initial || !["EUR", "CZK"].includes(currency))
    )
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
        ...(f.get("time") ? { time: String(f.get("time")) } : {}),
        kind,
        category,
        amount: Math.round(Number(amount) * currencyFactor(currency)),
        currency,
        rate: ruleMode ? 1 : needsRate ? Number(rate) : 1,
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
    <form
      className="transaction-editor"
      onSubmit={submit}
      onChangeCapture={(e) => {
        if ((e.target as HTMLElement).getAttribute("role") !== "combobox")
          onDirtyChange?.(true);
      }}
    >
      <div className="segmented full transaction-kinds">
        {(["expense", "income", "topup", "wash"] as const)
          .filter((k) =>
            expenseOnly ? k === "expense" : !ruleMode || k !== "wash",
          )
          .map((k) => (
            <button
              type="button"
              key={k}
              className={kind === k ? "selected" : ""}
              aria-pressed={kind === k}
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
                    expense: tr("Expense"),
                    income: tr("Money received"),
                    topup: tr("Top up"),
                    wash: tr("Wash"),
                  }[k]
                }
              </span>
            </button>
          ))}
      </div>
      <section className="editor-money" aria-label={tr("Amount and currency")}>
        <CurrencyPicker
          value={currency}
          onChange={chooseCurrency}
          currencies={
            laundry
              ? fx.currencies.filter((c) =>
                  (initial ? ["EUR", "CZK"] : ["CZK"]).includes(c.code),
                )
              : fx.currencies
          }
        />
        <div className="amount-hero">
          <Field label={tr("Amount ({0})", [currency])}>
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
      </section>
      {needsRate && !ruleMode && (
        <section
          className="editor-rate"
          aria-label={tr("Exchange rate source")}
        >
          <Field label={tr("Exchange rate source")}>
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
              <option value="auto">{tr("Automatic reference rate")}</option>
              <option value="manual">{tr("My bank / manual rate")}</option>
              {initial && (
                <option value="saved">{tr("Saved transaction rate")}</option>
              )}
            </select>
          </Field>
          <Field label={tr("Rate · {0} for €1", [laundry ? "CZK" : currency])}>
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
                  ? tr("Loading reference rate…")
                  : tr("Choose manual if no reference rate is available")
              }
            />
          </Field>
          <p className="help">
            {rateMode === "auto"
              ? quote
                ? tr(
                    "Frankfurter · published {0}. Last fetched {1}. Cached rates remain available offline. This is the latest reference, including for backdated entries.",
                    [
                      displayDate(quote.date),
                      new Date(fx.cache!.fetchedAt).toLocaleString(appLocale()),
                    ],
                  )
                : tr(
                    "No cached rate for this currency. Refresh online or choose a manual bank rate.",
                  )
              : rateMode === "saved"
                ? initial?.rateDate
                  ? tr("This entry keeps its saved rate from {0}.", [
                      displayDate(initial.rateDate),
                    ])
                  : tr("This entry keeps its saved rate.")
                : tr(
                    "Enter your effective bank rate. It may differ from the reference rate.",
                  )}
          </p>
          <button
            type="button"
            disabled={fx.busy}
            onClick={() => fx.refresh(true)}
          >
            <RefreshCw size={16} />{" "}
            {fx.busy ? tr("Refreshing…") : tr("Refresh rates")}
          </button>
          {fx.error && (
            <p className="form-error" role="status">
              <AlertTriangle size={20} aria-hidden="true" />
              {errorMessage(fx.error)}
            </p>
          )}
        </section>
      )}
      {amount && Number(rate) > 0 && !ruleMode && (
        <p className="conversion">
          {kind === "wash"
            ? tr("Card consumption only")
            : `${kind === "income" ? tr("Money received") : tr("Bank outflow")}: ${money(eur)}`}
          {laundry
            ? tr(" · CZK card {0} {1}", [
                kind === "topup" ? "+" : "−",
                money(
                  currency === "CZK"
                    ? entered
                    : Math.round(entered * Number(rate)),
                  "CZK",
                ),
              ])
            : ""}
        </p>
      )}
      {(kind === "expense" || kind === "income") && (
        <div className="form-section">
          <div className="field-label">{tr("BUDGET GROUP")}</div>
          <div className="group-options">
            <button
              type="button"
              className={group === "daily" ? "selected" : ""}
              aria-pressed={group === "daily"}
              onClick={() => {
                setGroup("daily");
                onDirtyChange?.(true);
              }}
            >
              <Wallet size={20} />
              <b>{tr("Day to day")}</b>
              <small>{tr("Everyday expenses")}</small>
            </button>
            <button
              type="button"
              className={group === "travel" ? "selected" : ""}
              aria-pressed={group === "travel"}
              onClick={() => {
                setGroup("travel");
                onDirtyChange?.(true);
              }}
            >
              <Plane size={20} />
              <b>{tr("Travel & tourism")}</b>
              <small>{tr("An independent limit")}</small>
            </button>
          </div>
        </div>
      )}
      <div className="form-grid editor-details">
        {(kind === "expense" || kind === "income") &&
          (group === "travel" ? (
            <Field label={tr("Travel category")}>
              <select
                name="travelType"
                defaultValue={initial?.travelType ?? "unclassified"}
              >
                {travelTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tr(t.name)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="form-section category-picker">
              <div className="field-label">{tr("CATEGORY")}</div>
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
                      aria-pressed={category === c.id}
                      onClick={() => {
                        setCategory(c.id);
                        onDirtyChange?.(true);
                      }}
                    >
                      <CategoryIcon category={c.id} />
                      <span>{tr(c.name)}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        <Field label={tr("Date")}>
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
      {!ruleMode && (
        <Field label={tr("Time (Ostrava)")}>
          <input
            type="time"
            name="time"
            required={!initial}
            defaultValue={initial ? (initial.time ?? "") : currentTime()}
          />
        </Field>
      )}
      <Field label={tr("Note (optional)")}>
        <input
          name="note"
          maxLength={500}
          defaultValue={initial?.note}
          placeholder={
            kind === "income"
              ? tr("e.g. Parents · food reimbursement")
              : tr("What was it for?")
          }
        />
      </Field>
      <p className="help">
        {kind === "income"
          ? tr(
              "Support adds to this month’s available money in the selected budget. The original purchases stay visible. Laundry support is cash: record a top-up when you load the card.",
            )
          : kind === "topup"
            ? tr("Counts once as bank outflow and adds CZK credit.")
            : kind === "wash"
              ? tr(
                  "Uses existing card credit without adding another bank expense.",
                )
              : tr(
                  "Saved in EUR using this entry’s rate. Travel categories share one monthly limit.",
                )}
      </p>
      {extraFields}
      {error && (
        <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">
          <AlertTriangle size={20} aria-hidden="true" />
          {errorMessage(error)}
        </p>
      )}
      <div className="editor-actions">
        <button className="primary full" type="submit">
          <Check size={20} />{" "}
          {tr(
            {
              expense: "Save expense",
              income: "Save money received",
              topup: "Save top-up",
              wash: "Save wash",
            }[kind],
          )}
        </button>
      </div>
    </form>
  );
}
