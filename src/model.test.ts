import {
  currencyDigits,
  currencyFactor,
  parseRates,
  parseRateCache,
  parseCurrencies,
  searchCurrencies,
} from "./fx.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  freshData as dynamicFreshData,
  makeTransaction,
  summary,
  validateData,
  applyGlobalPlan,
  globalPlan,
  currentPeriod,
  transactionOrder,
  planFor,
  weeks,
  type Transaction,
} from "./model.ts";
import { importCSV, toCSV } from "./transfer.ts";
const actualFreshData = () => {
  const d = dynamicFreshData();
  d.settings = {
    ...d.settings,
    start: "2026-10",
    end: "2027-01",
    firstDay: 25,
  };
  return applyGlobalPlan(d, globalPlan(dynamicFreshData()));
};
const freshData = () => {
  const d = actualFreshData();
  d.settings.start = "2026-11";
  d.settings.firstDay = 1;
  delete d.plans["2026-10"];
  return d;
};
const tx = (overrides: Partial<Transaction> = {}) =>
  makeTransaction({
    id: crypto.randomUUID(),
    date: "2026-11-03",
    kind: "expense",
    category: "groceries",
    amount: 25000,
    currency: "CZK",
    rate: 25,
    note: "",
    ...overrides,
  });
describe("accounting and backups", () => {
  it("starts empty with the correct budget", () => {
    const d = freshData(),
      s = summary(d, "2026-11");
    assert.deepEqual(d.transactions, []);
    assert.equal(s.cash, 0);
    assert.equal(s.card, 0);
    assert.equal(s.travel, 16000);
    assert.equal(s.everydayRemaining, 39000);
  });
  it("counts topups once and rolls credit forward", () => {
    const d = freshData();
    d.transactions = [
      tx({ kind: "topup", category: "laundry", amount: 100000 }),
      tx({
        kind: "wash",
        category: "laundry",
        amount: 25000,
        date: "2026-12-03",
      }),
    ];
    validateData(d);
    assert.equal(summary(d, "2026-11").cash, 4000);
    assert.equal(summary(d, "2026-11").card, 100000);
    assert.equal(summary(d, "2026-12").cash, 0);
    assert.equal(summary(d, "2026-12").card, 75000);
  });
  it("blocks negative historical card credit", () => {
    const d = freshData();
    d.transactions = [
      tx({ kind: "wash", category: "laundry", date: "2026-11-01" }),
    ];
    assert.throws(() => validateData(d), /negative/);
    d.transactions.push(
      tx({ kind: "topup", category: "laundry", date: "2026-11-02" }),
    );
    assert.throws(() => validateData(d), /negative/);
  });
  it("opening credit is not spending", () => {
    const d = freshData();
    d.settings.openingCard = 50000;
    d.transactions = [tx({ kind: "wash", category: "laundry" })];
    const s = summary(validateData(d), "2026-11");
    assert.equal(s.cash, 0);
    assert.equal(s.card, 25000);
  });
  it("travel resets monthly and spending stays separate from day to day", () => {
    const d = freshData();
    d.transactions = [
      tx({ category: "travel", currency: "EUR", amount: 20000 }),
    ];
    assert.equal(summary(d, "2026-11").travel, -4000);
    assert.equal(summary(d, "2026-12").travel, 16000);
    assert.equal(summary(d, "2026-11").everydayRemaining, 39000);
  });
  it("preserves conversion snapshots", () => {
    const d = freshData();
    d.transactions = [tx()];
    d.settings.rate = 30;
    assert.equal(summary(d, "2026-11").cash, 1000);
  });
  it("prorates clipped calendar weeks", () => {
    for (const m of ["2026-11", "2026-12", "2027-01"]) {
      const ws = weeks(m);
      assert.equal(
        ws.reduce((s, w) => s + w.days, 0),
        m === "2026-11" ? 30 : 31,
      );
      assert.equal(ws[0].start, m + "-01");
    }
    assert.equal(
      summary(freshData(), "2026-11", weeks("2026-11")[0]).budget,
      Math.round(55000 / 30),
    );
  });
  it("rejects tampered conversions, dates and plans", () => {
    const d = freshData();
    d.transactions = [{ ...tx(), eur: 5 }];
    assert.throws(() => validateData(d), /conversion/);
    d.transactions = [tx({ date: "2026-11-31" })];
    assert.throws(() => validateData(d), /date/);
    d.transactions = [];
    d.plans["2026-11"].limits.laundry = 2;
    assert.throws(() => validateData(d), /add up/);
  });
  it("converts EUR topups to CZK card credit", () => {
    const d = freshData();
    d.transactions = [
      tx({
        kind: "topup",
        category: "laundry",
        amount: 5000,
        currency: "EUR",
        rate: 24.5,
      }),
    ];
    const s = summary(validateData(d), "2026-11");
    assert.equal(s.cash, 5000);
    assert.equal(s.card, 122500);
  });
  it("roundtrips quoted multiline Unicode and formula-like notes", () => {
    const d = freshData();
    d.transactions = [tx({ note: '=hello, "Ostrava"\nčaj' })];
    const csv = toCSV(d);
    assert.ok(csv.includes("'=hello"));
    assert.deepEqual(
      importCSV(csv, freshData()).transactions,
      validateData(d).transactions,
    );
  });
  it("deduplicates identical CSV and rejects changed duplicate IDs", () => {
    const d = freshData();
    d.transactions = [tx()];
    assert.equal(importCSV(toCSV(d), d).transactions.length, 1);
    const other = structuredClone(d);
    other.transactions[0].note = "different";
    assert.throws(() => importCSV(toCSV(other), d), /existing ID/);
  });
  it("rejects unsupported backups, CSV and rates", () => {
    assert.throws(() => validateData({ version: 2 }));
    assert.throws(() => importCSV("bad,headers", freshData()));
    const d = freshData();
    d.transactions = [tx({ rate: 0 })];
    assert.throws(() => validateData(d));
  });
});

it("includes seven October days and preserves November", () => {
  const d = actualFreshData();
  assert.equal(
    weeks("2026-10", d).reduce((n, w) => n + w.days, 0),
    7,
  );
  assert.equal(planFor(d, "2026-11").budget, 55000);
  assert.equal(summary(d, "2026-10").travel, Math.round((16000 * 7) / 31));
});

it("applies global limits to all months and prorates October once", () => {
  const d = actualFreshData(),
    p = structuredClone(globalPlan(d));
  p.limits.groceries += 1000;
  p.limits.nightlife -= 1000;
  d.plans["2026-12"] = { ...p, budget: 1 };
  const next = applyGlobalPlan(d, p);
  for (const m of ["2026-11", "2026-12", "2027-01"])
    assert.deepEqual(planFor(next, m), p);
  assert.equal(
    planFor(next, "2026-10").limits.groceries,
    Math.round((p.limits.groceries * 7) / 31),
  );
  assert.deepEqual(globalPlan(next), p);
  assert.deepEqual(applyGlobalPlan(next, p), next);
  assert.deepEqual(next.transactions, d.transactions);
});

it("support increases available category money without becoming spending or card credit", () => {
  const d = freshData();
  d.transactions = [
    tx({
      kind: "income",
      amount: 5000,
      currency: "EUR",
      category: "groceries",
    }),
    tx({ kind: "income", amount: 2000, currency: "EUR", category: "travel" }),
    tx({ kind: "income", amount: 1000, currency: "EUR", category: "laundry" }),
  ];
  validateData(d);
  const s = summary(d, "2026-11");
  assert.equal(s.cash, 0);
  assert.equal(s.card, 0);
  assert.equal(s.income, 8000);
  assert.equal(s.everydayRemaining, 45000);
  assert.equal(s.travel, 18000);
  assert.equal(summary(d, "2026-12").travel, 16000);
  assert.equal(s.received.groceries, 5000);
  assert.deepEqual(
    importCSV(toCSV(d), freshData()).transactions,
    validateData(d).transactions,
  );
  d.transactions = [];
  assert.equal(summary(d, "2026-11").income, 0);
});

it("selects the current calendar period, including boundaries", () => {
  const d = actualFreshData();
  assert.deepEqual(currentPeriod(d, "2026-11-03"), {
    month: "2026-11",
    week: 1,
  });
  assert.deepEqual(currentPeriod(d, "2026-12-01"), {
    month: "2026-12",
    week: 0,
  });
  assert.deepEqual(currentPeriod(d, "2026-11-30"), {
    month: "2026-11",
    week: 5,
  });
  assert.deepEqual(currentPeriod(d, "2026-10-24"), {
    month: "2026-10",
    week: 0,
  });
  assert.equal(currentPeriod(d, "2027-02-02").month, "2027-01");
});
it("migrates legacy plans, removed categories and vending without losing money", () => {
  const old = {
    ...actualFreshData(),
    layoutVersion: undefined,
    plans: {
      "2000-01": {
        budget: 55000,
        limits: {
          groceries: 17000,
          restaurants: 4000,
          laundry: 5500,
          nightlife: 8000,
          travel: 15000,
          other: 2500,
          emergency: 3000,
          lodging: 0,
          transport: 0,
        },
      },
    },
    transactions: [
      tx({
        category: "emergency" as Transaction["category"],
        amount: 2174,
        currency: "EUR",
      }),
      tx({ note: "vending machine" }),
      tx({ category: "travel", amount: 500, currency: "EUR" }),
      tx({ kind: "income", amount: 6000, currency: "EUR" }),
    ],
  };
  const copy = structuredClone(old),
    d = validateData(old);
  assert.deepEqual(old, copy);
  assert.equal(d.layoutVersion, 2);
  assert.equal(globalPlan(d).limits.snacks, 4500);
  assert.equal(d.transactions.length, 4);
  assert.equal(d.transactions[0].category, "other");
  assert.equal(d.transactions[0].legacyCategory, "emergency");
  assert.equal(d.transactions[1].category, "snacks");
  for (let i = 0; i < 4; i++)
    for (const k of [
      "id",
      "amount",
      "eur",
      "rate",
      "date",
      "note",
      "kind",
      "credit",
      "currency",
    ] as const)
      assert.equal(d.transactions[i][k], old.transactions[i][k]);
  assert.deepEqual(validateData(d), d);
  assert.deepEqual(d.legacy?.plans, old.plans);
  const s = summary(d, "2026-11");
  assert.equal(s.cash, 3674);
  assert.equal(s.income, 6000);
  assert.equal(s.travel, 15500);
});
it("travel subcategories roundtrip through backups and CSV", () => {
  const d = freshData();
  d.transactions = [
    tx({ category: "travel", travelType: "food" }),
    tx({ category: "travel", travelType: "accommodation", kind: "income" }),
  ];
  assert.deepEqual(
    importCSV(toCSV(d), freshData()).transactions,
    validateData(d).transactions,
  );
  assert.deepEqual(
    validateData(JSON.parse(JSON.stringify(d))),
    validateData(d),
  );
  const other = structuredClone(d);
  other.transactions[0].travelType = "activities";
  assert.throws(() => importCSV(toCSV(other), d), /existing ID/);
});

it("sorts by date then insertion order and preserves that order on edits and CSV import", () => {
  const d = freshData();
  d.transactions = [
    tx({ id: "first", addedOrder: 1 }),
    tx({ id: "second", addedOrder: 2 }),
    tx({ id: "new-day", date: "2026-11-04", addedOrder: 3 }),
  ];
  const edited = { ...d.transactions[0], note: "edited" };
  d.transactions = [d.transactions[1], d.transactions[2], edited];
  assert.deepEqual(
    [...d.transactions].sort(transactionOrder).map((t) => t.id),
    ["new-day", "first", "second"],
  );
  assert.deepEqual(
    importCSV(toCSV(d), freshData())
      .transactions.sort(transactionOrder)
      .map((t) => t.id),
    ["new-day", "first", "second"],
  );
  const legacy = structuredClone(d);
  legacy.transactions.forEach((t) => delete t.addedOrder);
  assert.deepEqual(
    validateData(legacy).transactions.map((t) => t.addedOrder),
    [1, 2, 3],
  );
});

it("converts currencies with zero, two and three fractional digits and large rates", () => {
  const d = freshData();
  d.transactions = [
    tx({ currency: "JPY", amount: 1500, rate: 150 }),
    tx({ currency: "USD", amount: 1100, rate: 1.1 }),
    tx({ currency: "KWD", amount: 3300, rate: 0.33 }),
    tx({ currency: "VND", amount: 280000, rate: 28000 }),
  ];
  const validated = validateData(d);
  assert.equal(currencyDigits("JPY"), 0);
  assert.equal(currencyFactor("KWD"), 1000);
  assert.equal(validated.transactions[0].eur, 1000);
  assert.equal(validated.transactions[1].eur, 1000);
  assert.equal(validated.transactions[2].eur, 1000);
  assert.equal(validated.transactions[3].eur, 1000);
  assert.deepEqual(
    importCSV(toCSV(d), freshData()).transactions,
    validated.transactions,
  );
  d.transactions = [tx({ kind: "wash", category: "laundry", currency: "USD" })];
  assert.throws(() => validateData(d), /EUR or CZK/);
});
it("validates rates and keeps cached publication dates", () => {
  const rates = parseRates([
    { base: "EUR", quote: "CZK", rate: 24.5, date: "2026-11-02" },
    { base: "EUR", quote: "CZK", rate: 24.6, date: "2026-11-03" },
    { base: "USD", quote: "JPY", rate: 100, date: "2026-11-03" },
    { base: "EUR", quote: "GBP", rate: -1, date: "2026-11-03" },
  ]);
  assert.deepEqual(rates, { CZK: { rate: 24.6, date: "2026-11-03" } });
  assert.throws(() => parseRates({}));
  assert.throws(() => parseRates([]));
  assert.deepEqual(parseRateCache({ fetchedAt: 100, rates }), {
    fetchedAt: 100,
    rates,
  });
  assert.equal(parseRateCache(null), null);
  assert.deepEqual(
    parseRateCache({
      fetchedAt: 1,
      rates: { CZK: { rate: NaN, date: "2026-11-03" } },
    }),
    null,
  );
});
it("searches full currency names, ISO codes and Portuguese names", () => {
  const list = parseCurrencies([
    { iso_code: "USD", name: "United States Dollar" },
    { iso_code: "JPY", name: "Japanese Yen" },
    { iso_code: "BAD!", name: "Invalid" },
  ]);
  assert.equal(searchCurrencies(list, "usd")[0].code, "USD");
  assert.equal(searchCurrencies(list, "japanese")[0].code, "JPY");
  assert.equal(searchCurrencies(list, "dolar")[0].code, "USD");
  assert.ok(list.some((c) => c.code === "EUR"));
});
it("preserves rate provenance and existing conversion snapshots across JSON and CSV", () => {
  const d = freshData();
  d.transactions = [
    tx({
      currency: "GBP",
      amount: 860,
      rate: 0.86,
      rateSource: "Frankfurter",
      rateDate: "2026-11-02",
    }),
  ];
  assert.equal(d.transactions[0].eur, 1000);
  d.settings.rate = 99;
  assert.deepEqual(
    importCSV(toCSV(d), freshData()).transactions,
    validateData(d).transactions,
  );
  assert.deepEqual(
    validateData(JSON.parse(JSON.stringify(d))),
    validateData(d),
  );
});

it("prorates any first month, not only the Erasmus dates", () => {
  const d = dynamicFreshData();
  d.settings = {
    ...d.settings,
    start: "2028-02",
    end: "2028-05",
    firstDay: 15,
  };
  const next = applyGlobalPlan(d, globalPlan(d));
  assert.equal(
    weeks("2028-02", next).reduce((n, w) => n + w.days, 0),
    15,
  );
  assert.equal(planFor(next, "2028-03").budget, 55000);
  assert.equal(
    planFor(next, "2028-02").limits.travel,
    Math.round((16000 * 15) / 29),
  );
  assert.deepEqual(validateData(next), next);
});

it("rejects start-day changes that exclude entries", () => {
  const d = freshData();
  d.transactions = [tx({ date: "2026-11-03" })];
  d.settings.firstDay = 10;
  assert.throws(() => validateData(d), /date/);
});
