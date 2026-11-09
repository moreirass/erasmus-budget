import { currencyFactor, validCurrency, validRate } from "./fx.ts";
import { appLocale } from "./i18n.ts";
export const categories = [
  {
    id: "groceries",
    name: "Groceries & hygiene",
    icon: "🥑",
    color: "#60886a",
    limit: 10000,
  },
  {
    id: "snacks",
    name: "Snacks & coffee",
    icon: "☕",
    color: "#c49b69",
    limit: 4500,
  },
  {
    id: "restaurants",
    name: "Restaurants & canteen",
    icon: "🍜",
    color: "#d9a65d",
    limit: 7500,
  },
  { id: "laundry", name: "Laundry", icon: "🫧", color: "#7daab1", limit: 5500 },
  {
    id: "nightlife",
    name: "Nightlife",
    icon: "✨",
    color: "#9a89b8",
    limit: 9000,
  },
  { id: "other", name: "Other", icon: "🧴", color: "#bd8d7c", limit: 2500 },
  {
    id: "travel",
    name: "Travel & tourism",
    icon: "🚆",
    color: "#517f9e",
    limit: 16000,
  },
] as const;
export const travelTypes = [
  { id: "transport", name: "Transport", guide: 6500 },
  { id: "accommodation", name: "Accommodation", guide: 4500 },
  { id: "food", name: "Food on trips", guide: 3000 },
  { id: "activities", name: "Tourism & activities", guide: 2000 },
  { id: "unclassified", name: "Unclassified travel", guide: 0 },
] as const;
export type TravelType = (typeof travelTypes)[number]["id"];
export type Category = (typeof categories)[number]["id"];
export type Plan = { budget: number; limits: Record<Category, number> };
export type Transaction = {
  id: string;
  date: string;
  kind: "expense" | "topup" | "wash" | "income";
  category: Category;
  amount: number;
  currency: string;
  rate: number;
  eur: number;
  credit: number;
  note: string;
  travelType?: TravelType;
  legacyCategory?: string;
  addedOrder?: number;
  rateDate?: string;
  rateSource?: "Frankfurter" | "manual";
};
export type Data = {
  recurring?: RecurringRule[];
  version: 1;
  layoutVersion?: 2;
  legacy?: { plans: unknown; openingTravel: number; openingEmergency: number };
  settings: {
    limitAlerts?: boolean;
    firstDay?: number;
    start: string;
    end: string;
    rate: number | null;
    openingCard: number;
    openingTravel: number;
    openingEmergency: number;
  };
  plans: Record<string, Plan>;
  transactions: Transaction[];
};
export const defaultPlan = (): Plan => ({
  budget: 55000,
  limits: Object.fromEntries(
    categories.map((c) => [c.id, c.limit]),
  ) as Plan["limits"],
});
export const nextMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
};
// The historical October rule is retained only for documents predating firstDay.
export const firstTrackedDay = (d: Data) =>
  d.settings.firstDay ?? (d.settings.start === "2026-10" ? 25 : 1);
export const periodStart = (d: Data, m: string) =>
  `${m}-${String(m === d.settings.start ? firstTrackedDay(d) : 1).padStart(2, "0")}`;
export const periodDays = (d: Data, m: string) =>
  lastDay(m) - Number(periodStart(d, m).slice(8)) + 1;
export const partialPlan = (p: Plan, fraction: number): Plan => {
  const limits = Object.fromEntries(
    categories.map((c) => [c.id, Math.round(p.limits[c.id] * fraction)]),
  ) as Plan["limits"];
  return { budget: Object.values(limits).reduce((a, b) => a + b, 0), limits };
};
export const freshData = (): Data => {
  const start = today().slice(0, 7);
  let end = start;
  for (let i = 0; i < 3; i++) end = nextMonth(end);
  return {
    version: 1,
    layoutVersion: 2,
    settings: {
      firstDay: 1,
      start,
      end,
      rate: null,
      openingCard: 0,
      openingTravel: 0,
      openingEmergency: 0,
    },
    plans: { "2000-01": defaultPlan() },
    transactions: [],
  };
};
export const money = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat(appLocale(), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / currencyFactor(currency));
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function monthLabel(m: string) {
  return new Date(m + "-15T12:00:00").toLocaleDateString(appLocale(), {
    month: "long",
    year: "numeric",
  });
}
export function months(start: string, end: string) {
  const result: string[] = [];
  let [y, m] = start.split("-").map(Number);
  while (`${y}-${String(m).padStart(2, "0")}` <= end && result.length < 120) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      y++;
      m = 1;
    }
  }
  return result;
}
export const lastDay = (m: string) =>
  new Date(Number(m.slice(0, 4)), Number(m.slice(5)), 0).getDate();
export const monthEnd = (m: string) => `${m}-${lastDay(m)}`;
export function planFor(d: Data, m: string): Plan {
  const key = Object.keys(d.plans)
    .filter((k) => k <= m)
    .sort()
    .at(-1);
  return key ? d.plans[key] : defaultPlan();
}
export function weeks(m: string, d?: Data) {
  const n = lastDay(m);
  const out: { start: string; end: string; days: number }[] = [];
  let day = d ? Number(periodStart(d, m).slice(8)) : 1;
  while (day <= n) {
    const dow = new Date(
      `${m}-${String(day).padStart(2, "0")}T12:00:00`,
    ).getDay();
    const end = Math.min(n, day + (7 - (dow || 7)));
    out.push({
      start: `${m}-${String(day).padStart(2, "0")}`,
      end: `${m}-${String(end).padStart(2, "0")}`,
      days: end - day + 1,
    });
    day = end + 1;
  }
  return out;
}
export function summary(
  d: Data,
  m: string,
  range?: { start: string; end: string; days: number },
) {
  const start = range?.start ?? periodStart(d, m),
    end = range?.end ?? monthEnd(m),
    p = planFor(d, m);
  const rows = d.transactions.filter((t) => t.date >= start && t.date <= end);
  const spent = Object.fromEntries(
    categories.map((c) => [
      c.id,
      rows
        .filter(
          (t) =>
            t.category === c.id && (t.kind === "expense" || t.kind === "topup"),
        )
        .reduce((s, t) => s + t.eur, 0),
    ]),
  ) as Record<Category, number>;
  const received = Object.fromEntries(
    categories.map((c) => [
      c.id,
      rows
        .filter((t) => t.category === c.id && t.kind === "income")
        .reduce((s, t) => s + t.eur, 0),
    ]),
  ) as Record<Category, number>;
  const income = Object.values(received).reduce((a, b) => a + b, 0);
  const card =
    d.settings.openingCard +
    d.transactions
      .filter((t) => t.date <= end)
      .reduce(
        (s, t) =>
          s +
          (t.kind === "topup" ? t.credit : t.kind === "wash" ? -t.credit : 0),
        0,
      );
  const cash = Object.values(spent).reduce((a, b) => a + b, 0);
  const fraction = range ? range.days / periodDays(d, m) : 1;
  const everyday = categories
    .filter((c) => c.id !== "travel")
    .reduce((s, c) => s + spent[c.id], 0);
  return {
    rows,
    spent,
    received,
    income,
    cash,
    card,
    travel:
      Math.round(p.limits.travel * fraction) + received.travel - spent.travel,
    wash: rows
      .filter((t) => t.kind === "wash")
      .reduce((s, t) => s + t.credit, 0),
    everydayRemaining:
      Math.round((p.budget - p.limits.travel) * fraction) -
      everyday +
      income -
      received.travel,
    budget: Math.round(p.budget * fraction),
  };
}
export function makeTransaction(
  input: Omit<Transaction, "eur" | "credit">,
): Transaction {
  const eur =
    input.currency === "EUR"
      ? input.amount
      : Math.round(
          ((input.amount / currencyFactor(input.currency)) * 100) / input.rate,
        );
  const credit =
    input.kind === "expense" || input.kind === "income"
      ? 0
      : input.currency === "CZK"
        ? input.amount
        : Math.round(input.amount * input.rate);
  return { ...input, eur, credit };
}
const monthValid = (s: unknown): s is string =>
  typeof s === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(s);
const nonnegative = (n: unknown): n is number =>
  Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 100000000;
const fail = (message: string): never => {
  throw new Error(message);
};
export function validateData(value: unknown): Data {
  const d = migrateData(value);
  if (
    !d ||
    d.version !== 1 ||
    !d.settings ||
    !d.plans ||
    !Array.isArray(d.transactions)
  )
    fail("This is not a Pocket v1 backup.");
  const s = d.settings;
  if (s.limitAlerts !== undefined && typeof s.limitAlerts !== "boolean")
    throw new Error("Invalid alert setting.");
  validateRecurring(d);
  if (
    !monthValid(s.start) ||
    !monthValid(s.end) ||
    s.start > s.end ||
    months(s.start, s.end).length >= 120
  )
    fail("Choose a valid tracking period shorter than 10 years.");
  if (
    s.firstDay !== undefined &&
    (!Number.isInteger(s.firstDay) ||
      s.firstDay < 1 ||
      s.firstDay > lastDay(s.start))
  )
    fail("Invalid first tracked day.");
  if (
    s.rate !== null &&
    (!Number.isFinite(s.rate) || s.rate <= 0 || s.rate > 1000)
  )
    fail("Exchange rate must be between 0 and 1000 CZK per EUR.");
  if (![s.openingCard, s.openingTravel, s.openingEmergency].every(nonnegative))
    fail("Opening balances must be non-negative amounts.");
  if (Object.keys(d.plans).length === 0)
    fail("At least one budget plan is required.");
  for (const [m, p] of Object.entries(d.plans)) {
    if (
      !monthValid(m) ||
      !p ||
      !p.limits ||
      !nonnegative(p.budget) ||
      !categories.every((c) => nonnegative(p.limits[c.id]))
    )
      fail("Invalid monthly limits.");
    if (categories.reduce((a, c) => a + p.limits[c.id], 0) !== p.budget)
      fail("Category allocations must add up to your monthly budget.");
  }
  if (d.transactions.length > 100000) fail("Backup is too large.");
  let order = Math.max(0, ...d.transactions.map((t) => t.addedOrder ?? 0));
  for (const t of d.transactions) {
    if (t.addedOrder === undefined) t.addedOrder = ++order;
    if (!Number.isSafeInteger(t.addedOrder) || t.addedOrder < 1)
      fail("Invalid transaction order.");
  }
  const ids = new Set<string>();
  for (const t of d.transactions) {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      t.id.length > 100 ||
      ids.has(t.id)
    )
      fail("Transactions need unique IDs.");
    ids.add(t.id);
    if (
      typeof t.date !== "string" ||
      !/^20\d{2}-\d{2}-\d{2}$/.test(t.date) ||
      !monthValid(t.date.slice(0, 7)) ||
      Number(t.date.slice(8)) < 1 ||
      Number(t.date.slice(8)) > lastDay(t.date.slice(0, 7)) ||
      t.date <
        (s.firstDay !== undefined
          ? periodStart(d, s.start)
          : s.start + "-01") ||
      t.date > monthEnd(s.end)
    )
      fail(
        "A transaction date falls outside the tracking period or is invalid.",
      );
    if (
      !["expense", "topup", "wash", "income"].includes(t.kind) ||
      !categories.some((c) => c.id === t.category) ||
      !validCurrency(t.currency) ||
      !nonnegative(t.amount) ||
      !t.amount ||
      !validRate(t.rate) ||
      typeof t.note !== "string" ||
      t.note.length > 500
    )
      fail("Invalid transaction fields.");
    if (
      ((t.kind === "topup" || t.kind === "wash") && t.category !== "laundry") ||
      (t.kind === "expense" && t.category === "laundry")
    )
      fail("Laundry must be a top-up or wash.");
    if (
      (t.kind === "topup" || t.kind === "wash") &&
      !["EUR", "CZK"].includes(t.currency)
    )
      fail("Laundry card entries use EUR or CZK.");
    if (t.rateDate !== undefined && !/^20\d{2}-\d{2}-\d{2}$/.test(t.rateDate))
      fail("Invalid rate date.");
    if (
      t.rateSource !== undefined &&
      !["Frankfurter", "manual"].includes(t.rateSource)
    )
      fail("Invalid rate source.");
    if (
      t.travelType !== undefined &&
      (t.category !== "travel" ||
        !travelTypes.some((x) => x.id === t.travelType))
    )
      fail("Invalid travel subcategory.");
    const rebuilt = makeTransaction(t);
    if (
      !nonnegative(t.eur) ||
      !nonnegative(t.credit) ||
      t.eur !== rebuilt.eur ||
      t.credit !== rebuilt.credit
    )
      fail("Transaction conversion does not match its saved rate.");
  }
  let card = s.openingCard;
  // Credit is checked by date; top-ups precede washes on the same day.
  for (const t of [...d.transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.kind === "topup" ? -1 : 1),
  )) {
    card += t.kind === "topup" ? t.credit : t.kind === "wash" ? -t.credit : 0;
    if (card < 0)
      fail(
        `Laundry credit would be negative on ${t.date}. Add the missing top-up or opening credit first.`,
      );
  }
  return structuredClone(d);
}

export const globalPlan = (d: Data): Plan =>
  planFor(
    d,
    firstTrackedDay(d) > 1 ? nextMonth(d.settings.start) : d.settings.start,
  );
export function applyGlobalPlan(d: Data, p: Plan): Data {
  const plans: Record<string, Plan> = { "2000-01": structuredClone(p) };
  if (firstTrackedDay(d) > 1) {
    plans[d.settings.start] = partialPlan(
      p,
      periodDays(d, d.settings.start) / lastDay(d.settings.start),
    );
    plans[nextMonth(d.settings.start)] = structuredClone(p);
  }
  return validateData({ ...d, plans });
}

// Legacy financial values and IDs are retained; only categories and budget configuration change.
export function migrateTransaction(t: Transaction): Transaction {
  const category = String(t.category);
  if (["emergency", "lodging", "transport"].includes(category))
    return { ...t, category: "other", legacyCategory: category };
  if (category === "groceries" && /vending machine/i.test(t.note))
    return { ...t, category: "snacks", legacyCategory: category };
  return { ...t };
}
export function migrateData(value: unknown): Data {
  const raw = value as Data;
  if (
    !raw ||
    raw.version !== 1 ||
    !raw.settings ||
    !raw.plans ||
    !Array.isArray(raw.transactions)
  )
    fail("This is not a Pocket backup.");
  if (raw.layoutVersion === 2) return structuredClone(raw);
  if (raw.layoutVersion !== undefined) fail("Unsupported budget layout.");
  // Validate legacy plan totals before migrating instead of hiding corrupted input.
  for (const p of Object.values(raw.plans))
    if (
      !p ||
      !p.limits ||
      !nonnegative(p.budget) ||
      !Object.values(p.limits).every(nonnegative) ||
      Object.values(p.limits).reduce((a, b) => a + b, 0) !== p.budget
    )
      fail("Invalid legacy monthly limits.");
  const base = defaultPlan();
  return {
    ...structuredClone(raw),
    layoutVersion: 2,
    legacy: {
      plans: structuredClone(raw.plans),
      openingTravel: raw.settings.openingTravel,
      openingEmergency: raw.settings.openingEmergency,
    },
    plans: {
      "2000-01": base,
      ...(firstTrackedDay(raw) > 1
        ? {
            [raw.settings.start]: partialPlan(
              base,
              periodDays(raw, raw.settings.start) / lastDay(raw.settings.start),
            ),
            [nextMonth(raw.settings.start)]: base,
          }
        : {}),
    },
    transactions: raw.transactions.map(migrateTransaction),
  };
}
export function currentPeriod(d: Data, date = today()) {
  const month =
    date.slice(0, 7) < d.settings.start
      ? d.settings.start
      : date.slice(0, 7) > d.settings.end
        ? d.settings.end
        : date.slice(0, 7);
  const list = weeks(month, d);
  const week =
    date < list[0].start
      ? 0
      : date > list.at(-1)!.end
        ? list.length - 1
        : list.findIndex((w) => w.start <= date && w.end >= date);
  return { month, week };
}

export const transactionOrder = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date) || (a.addedOrder ?? 0) - (b.addedOrder ?? 0);

export function applyMonthlyPlan(
  d: Data,
  month: string,
  plan: Plan,
  scope: "month" | "following",
): Data {
  const plans = structuredClone(d.plans);
  const next = nextMonth(month);
  if (scope === "month" && next <= d.settings.end && !plans[next])
    plans[next] = structuredClone(planFor(d, next));
  if (scope === "following") {
    for (const key of Object.keys(plans)) if (key > month) delete plans[key];
  }
  plans[month] = structuredClone(plan);
  return validateData({ ...d, plans });
}

export function resizePlan(plan: Plan, budget: number): Plan {
  const limits = {} as Plan["limits"];
  let previous = 0,
    assigned = 0;
  categories.forEach((c, index) => {
    previous += plan.budget ? plan.limits[c.id] : 1;
    const cumulative = Math.round(
      (budget * previous) / (plan.budget || categories.length),
    );
    limits[c.id] =
      index === categories.length - 1
        ? budget - assigned
        : cumulative - assigned;
    assigned += limits[c.id];
  });
  return { budget, limits };
}

export type RecurringRule = {
  id: string;
  kind: "expense" | "income" | "topup";
  amount: number;
  currency: string;
  category: Category;
  travelType?: TravelType;
  note: string;
  frequency: "monthly" | "weekly";
  day: number;
  start: string;
  end?: string;
  mode: "confirm" | "auto";
  manualRate?: number;
  generated: string[];
  ignored: string[];
};
export type Occurrence = { rule: RecurringRule; date: string; id: string };
export type Quotes = Record<string, { rate: number; date: string }>;
export const validDate = (date: unknown): date is string =>
  typeof date === "string" &&
  /^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(date) &&
  Number(date.slice(8)) >= 1 &&
  Number(date.slice(8)) <= lastDay(date.slice(0, 7));
function validateRecurring(d: Data) {
  if (d.recurring === undefined) return;
  if (!Array.isArray(d.recurring) || d.recurring.length > 1000)
    throw new Error("Invalid recurring rules.");
  const ids = new Set<string>();
  for (const r of d.recurring) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,60}$/.test(r.id) ||
      ids.has(r.id) ||
      !["expense", "income", "topup"].includes(r.kind) ||
      !["monthly", "weekly"].includes(r.frequency) ||
      !Number.isInteger(r.day) ||
      r.day < (r.frequency === "weekly" ? 0 : 1) ||
      r.day > (r.frequency === "weekly" ? 6 : 31) ||
      !validDate(r.start) ||
      (r.end !== undefined && (!validDate(r.end) || r.end < r.start)) ||
      !["confirm", "auto"].includes(r.mode) ||
      (r.manualRate !== undefined && !validRate(r.manualRate)) ||
      !Array.isArray(r.generated) ||
      !Array.isArray(r.ignored) ||
      ![...r.generated, ...r.ignored].every(validDate)
    )
      throw new Error("Invalid recurring rules.");
    ids.add(r.id);
    // Reuse transaction validation, without recursively validating rules.
    validateData({
      ...d,
      recurring: undefined,
      transactions: [
        makeTransaction({
          id: r.id,
          date: periodStart(d, d.settings.start),
          kind: r.kind,
          category: r.category,
          amount: r.amount,
          currency: r.currency,
          rate: r.manualRate ?? 1,
          note: r.note,
          ...(r.travelType ? { travelType: r.travelType } : {}),
        }),
      ],
    });
  }
}
export function dueOccurrences(d: Data, through = today()): Occurrence[] {
  const due: Occurrence[] = [];
  for (const rule of d.recurring ?? []) {
    const start = [rule.start, periodStart(d, d.settings.start)].sort().at(-1)!;
    const end = [
      through,
      rule.end ?? monthEnd(d.settings.end),
      monthEnd(d.settings.end),
    ].sort()[0];
    for (const month of months(start.slice(0, 7), end.slice(0, 7))) {
      for (let day = 1; day <= lastDay(month); day++) {
        const date = month + "-" + String(day).padStart(2, "0");
        const matches =
          rule.frequency === "monthly"
            ? day === Math.min(rule.day, lastDay(month))
            : new Date(date + "T12:00:00Z").getUTCDay() === rule.day;
        const id = "rec-" + rule.id + "-" + date;
        if (
          matches &&
          date >= start &&
          date <= end &&
          !rule.generated.includes(date) &&
          !rule.ignored.includes(date) &&
          !d.transactions.some((t) => t.id === id)
        )
          due.push({ rule, date, id });
      }
    }
  }
  return due.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
export function occurrenceTransaction(
  o: Occurrence,
  d: Data,
  quotes: Quotes,
): Transaction | null {
  const r = o.rule;
  const quote = quotes[r.kind === "topup" ? "CZK" : r.currency];
  const rate =
    r.currency === "EUR" && r.kind !== "topup"
      ? 1
      : (r.manualRate ??
        quote?.rate ??
        (r.currency === "CZK" ? d.settings.rate : null));
  if (!rate || !validRate(rate)) return null;
  return makeTransaction({
    id: o.id,
    date: o.date,
    kind: r.kind,
    category: r.category,
    currency: r.currency,
    amount: r.amount,
    rate,
    note: r.note,
    ...(r.travelType ? { travelType: r.travelType } : {}),
    ...(r.manualRate || !quote
      ? { rateSource: "manual" as const }
      : { rateSource: "Frankfurter" as const, rateDate: quote.date }),
  });
}
export function settleOccurrence(
  d: Data,
  o: Occurrence,
  transaction?: Transaction,
): Data {
  if (!d.recurring?.some((r) => r.id === o.rule.id))
    throw new Error("Invalid recurring rules.");
  const field = transaction ? "generated" : "ignored";
  return validateData({
    ...d,
    recurring: d.recurring.map((r) =>
      r.id === o.rule.id
        ? { ...r, [field]: [...new Set([...r[field], o.date])] }
        : r,
    ),
    transactions:
      transaction && !d.transactions.some((t) => t.id === o.id)
        ? [...d.transactions, { ...transaction, id: o.id, date: o.date }]
        : d.transactions,
  });
}
export function generateRecurring(d: Data, quotes: Quotes, through = today()) {
  let data = d;
  const added: Transaction[] = [];
  for (const o of dueOccurrences(d, through)) {
    if (o.rule.mode !== "auto") continue;
    const t = occurrenceTransaction(o, data, quotes);
    if (!t) continue;
    try {
      data = settleOccurrence(data, o, t);
      added.push(t);
    } catch {
      /* Keep invalid entries pending. */
    }
  }
  return { data, added, pending: dueOccurrences(data, through) };
}

export function limitLevels(d: Data, month: string) {
  const stats = summary(d, month),
    plan = planFor(d, month);
  return categories.flatMap((c) => {
    const cap = plan.limits[c.id] + stats.received[c.id],
      spent = stats.spent[c.id];
    const percent = cap > 0 ? (spent / cap) * 100 : spent > 0 ? 100 : 0;
    return percent >= 80
      ? [{ category: c.id, threshold: percent >= 100 ? 100 : 80, percent }]
      : [];
  });
}
export function crossedLimits(
  before: Data,
  after: Data,
  month: string,
  seen: string[],
) {
  if (after.settings.limitAlerts === false) return [];
  const old = summary(before, month),
    plan = planFor(after, month),
    stats = summary(after, month);
  return categories.flatMap((c) =>
    [80, 100].flatMap((threshold) => {
      const key = month + ":" + c.id + ":" + threshold;
      const cap = plan.limits[c.id] + stats.received[c.id];
      const oldCap = planFor(before, month).limits[c.id] + old.received[c.id];
      const reached = (spent: number, limit: number) =>
        spent > 0 && (limit === 0 || spent * 100 >= limit * threshold);
      return !seen.includes(key) &&
        reached(stats.spent[c.id], cap) &&
        !reached(old.spent[c.id], oldCap)
        ? [{ key, category: c.id, threshold }]
        : [];
    }),
  );
}
