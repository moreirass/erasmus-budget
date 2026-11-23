import { currentTime } from "../time";
import { lastEntry } from "../quickEntry";
import { RefreshCw } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CurrencyPicker } from "../CurrencyPicker";
import { currencyDigits, currencyFactor } from "../fx";
import { appLocale, displayDate, laundryServiceLabel, tr } from "../i18n";
import {
  categories,
  laundryPrice,
  laundryServices,
  makeTransaction,
  money,
  monthEnd,
  periodStart,
  today,
  travelTypes,
  validateData,
  type Category,
  type Data,
  type LaundryService,
  type Transaction,
  type TravelType,
} from "../model";
import { useExchangeRates } from "../useExchangeRates";
import { Field } from "./Primitives";

function categoryOption(category: Category, travelType?: TravelType) {
  return category === "travel"
    ? `travel:${travelType ?? "unclassified"}`
    : category;
}

export function TransactionForm({
  data,
  month,
  initial,
  initialKind,
  initialService = "wash",
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
  initialService?: LaundryService;
  fx: ReturnType<typeof useExchangeRates>;
  save: (t: Transaction) => void;
  extraFields?: ReactNode;
  ruleMode?: boolean;
  expenseOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const remembered = lastEntry(fx.currencies.map((c) => c.code));
  const [kind, setKind] = useState(initial?.kind ?? initialKind);
  const [service, setService] = useState<LaundryService>(
    initial ? (initial.service ?? "wash") : initialService,
  );
  const [categoryChoice, setCategoryChoice] = useState(
    initial ? categoryOption(initial.category, initial.travelType) : null,
  );
  const [currency, setCurrency] = useState(
      initial?.currency ??
        (["topup", "wash"].includes(initialKind) ? "CZK" : remembered.currency),
    ),
    [amount, setAmount] = useState(
      initial
        ? String(initial.amount / currencyFactor(initial.currency))
        : initialKind === "wash"
          ? String(laundryPrice(data.settings, service))
          : "",
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
  const selection =
    categoryChoice ??
    (kind === "income"
      ? categoryOption(
          remembered.incomeCategory ?? "groceries",
          remembered.incomeTravelType,
        )
      : categoryOption(
          remembered.group === "travel" ? "travel" : remembered.category,
          remembered.travelType,
        ));
  const travelType = laundry
    ? undefined
    : travelTypes.find(
        (type) => categoryOption("travel", type.id) === selection,
      )?.id;
  const category = laundry
    ? "laundry"
    : travelType
      ? "travel"
      : (selection as Category);
  const recordedService =
    kind === "wash" &&
    (!initial ||
      initial.kind !== "wash" ||
      initial.service !== undefined ||
      service === "dry")
      ? service
      : undefined;
  const needsRate =
    (currency !== "EUR" || laundry) && !(recordedService && currency === "CZK");
  const options = useRef<HTMLDetailsElement>(null);
  const quote = fx.cache?.rates[laundry ? "CZK" : currency];
  useEffect(() => {
    if (rateMode === "auto")
      setRate(needsRate && quote ? String(quote.rate) : needsRate ? "" : "1");
  }, [currency, rateMode, quote?.rate, needsRate]);
  const chooseCurrency = (code: string) => {
    onDirtyChange?.(true);
    setCurrency(code);
    setRateMode("auto");
    setRate("");
  };
  const chooseKind = (k: Transaction["kind"]) => {
    if (k === kind) return;
    onDirtyChange?.(true);
    setKind(k);
    if (!initial && k === "wash")
      setAmount(String(laundryPrice(data.settings, service)));
    if (!initial && kind === "wash") setAmount("");
    if (k === "expense" && selection === "laundry") setCategoryChoice(null);
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
      const f = new FormData(e.currentTarget);
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
        ...(!needsRate && recordedService
          ? {}
          : rateMode === "auto" && quote && needsRate
            ? { rateSource: "Frankfurter" as const, rateDate: quote.date }
            : rateMode === "saved"
              ? { rateSource: initial?.rateSource, rateDate: initial?.rateDate }
              : { rateSource: "manual" as const }),
        note: String(f.get("note")).trim(),
        ...(travelType ? { travelType } : {}),
        ...(recordedService ? { service: recordedService } : {}),
      });
      validateData({
        ...data,
        transactions: [...data.transactions.filter((x) => x.id !== t.id), t],
      });
      save(t);
    } catch (e) {
      setError((e as Error).message);
      if (options.current) options.current.open = true;
    }
  }
  return (
    <form
      className="transaction-form"
      onSubmit={submit}
      onInvalidCapture={(event) => {
        if (options.current?.contains(event.target as Node))
          options.current.open = true;
      }}
    >
      <div className="transaction-fields">
        <div
          className="segmented full transaction-kinds"
          role="group"
          aria-label={tr("Transaction type")}
        >
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
                {
                  {
                    expense: tr("Expense"),
                    income: tr("Support"),
                    topup: tr("Top-up"),
                    wash: tr("Wash"),
                  }[k]
                }
              </button>
            ))}
        </div>
        {kind === "wash" && (
          <Field label={tr("Laundry service")}>
            <select
              value={service}
              onChange={(event) => {
                const next = event.target.value as LaundryService;
                setService(next);
                if (!initial)
                  setAmount(String(laundryPrice(data.settings, next)));
              }}
            >
              {laundryServices.map((item) => (
                <option value={item} key={item}>
                  {laundryServiceLabel(item)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="transaction-amount-row">
          <label className="field transaction-amount-field">
            <span>{tr("Amount")}</span>
            <input
              data-dialog-autofocus
              type="number"
              inputMode="decimal"
              min={1 / factor}
              max={100000000 / factor}
              step={1 / factor}
              required
              placeholder={(0).toFixed(digits)}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <CurrencyPicker
            compact
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
          {entered > 0 && !ruleMode && (
            <p className="transaction-preview" aria-live="polite">
              {Number(rate) > 0 ? (
                <>
                  {kind === "wash"
                    ? tr("Card consumption only")
                    : tr("EUR equivalent: {0}", [money(eur)])}
                  {laundry &&
                    tr(" · CZK card {0} {1}", [
                      kind === "topup" ? "+" : "−",
                      money(
                        currency === "CZK"
                          ? entered
                          : Math.round(entered * Number(rate)),
                        "CZK",
                      ),
                    ])}
                </>
              ) : (
                tr("EUR equivalent unavailable")
              )}
            </p>
          )}
        </div>
        {!laundry && (
          <Field label={tr("Category")}>
            <select
              name="category"
              value={selection}
              onChange={(event) => setCategoryChoice(event.target.value)}
            >
              <optgroup label={tr("Day to day")}>
                {categories
                  .filter(
                    (item) =>
                      item.id !== "travel" &&
                      (kind === "income" || item.id !== "laundry"),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {tr(item.name)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={tr("Travel")}>
                {travelTypes.map((type) => (
                  <option
                    key={type.id}
                    value={categoryOption("travel", type.id)}
                  >
                    {tr(type.name)}
                  </option>
                ))}
              </optgroup>
            </select>
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
        <details className="pocket-advanced" ref={options}>
          <summary>{tr("More options")}</summary>
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
          {needsRate && !ruleMode && (
            <>
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
                    <option value="saved">
                      {tr("Saved transaction rate")}
                    </option>
                  )}
                </select>
              </Field>
              <Field
                label={tr("Rate · {0} for €1", [laundry ? "CZK" : currency])}
              >
                <input
                  type="number"
                  min="0.000000000001"
                  max="1000000000000"
                  step="any"
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
                          new Date(fx.cache!.fetchedAt).toLocaleString(
                            appLocale(),
                          ),
                        ],
                      )
                    : tr(
                        "No cached rate for this currency. Refresh online or choose a manual bank rate.",
                      )
                  : rateMode === "saved"
                    ? tr("This entry keeps its saved rate{0}.", [
                        initial?.rateDate
                          ? tr(" from {0}", [displayDate(initial.rateDate)])
                          : "",
                      ])
                    : tr(
                        "Enter your effective bank rate. It may differ from the reference rate.",
                      )}
              </p>
              <button
                type="button"
                disabled={fx.busy}
                onClick={() => fx.refresh(true)}
              >
                <RefreshCw size={15} />{" "}
                {fx.busy ? tr("Refreshing…") : tr("Refresh rates")}
              </button>
              {fx.error && (
                <p className="form-error" role="status">
                  {tr(fx.error)}
                </p>
              )}
            </>
          )}
        </details>
        {extraFields}
      </div>
      <div className="transaction-footer">
        {error && (
          <p className="form-error" role="alert">
            {tr(error)}
          </p>
        )}
        <button className="primary full" type="submit">
          {tr("Save")}
        </button>
      </div>
    </form>
  );
}
