import assert from "node:assert/strict";
import { test } from "node:test";
import {
  freshData,
  makeTransaction,
  summary,
  weeks,
  type Transaction,
} from "./model.ts";
import {
  monthSeries,
  movementSummary,
  previousMonth,
  spendingPace,
  weeklySpending,
} from "./views/desktop/series.ts";

const month = "2026-11";
function fixture() {
  const data = freshData();
  data.settings.start = "2026-10";
  data.settings.end = month;
  data.settings.openingCard = 5000;
  function row(
    date: string,
    kind: Transaction["kind"],
    category: Transaction["category"],
    amount: number,
    currency = "EUR",
  ) {
    return makeTransaction({
      id: date + kind,
      date,
      kind,
      category,
      amount,
      currency,
      rate: currency === "CZK" ? 25 : 1,
      note: "",
    });
  }
  data.transactions = [
    row("2026-10-25", "wash", "laundry", 1000, "CZK"),
    row("2026-11-01", "expense", "groceries", 700),
    {
      ...row("2026-11-03", "expense", "travel", 3500),
      travelType: "transport",
    },
    row("2026-11-07", "topup", "laundry", 2500, "CZK"),
    row("2026-11-08", "wash", "laundry", 1500, "CZK"),
    row("2026-11-09", "income", "groceries", 5000),
  ];
  return data;
}

test("desktop daily series reconciles spend, rolling average, currencies and carried card credit", () => {
  const data = fixture(),
    stats = summary(data, month);
  const { days, hasCard, currencies, trips } = monthSeries(
    data,
    month,
    stats.rows,
  );
  assert.equal(days.length, 30);
  assert.equal(days[0].card, 4000);
  assert.equal(days[7].card, 5000);
  assert.equal(days.at(-1)?.card, stats.card);
  assert.equal(days[0].average, 700);
  assert.equal(days[7].average, Math.round(3600 / 7));
  assert.equal(days[8].daily, 0);
  assert.equal(hasCard, true);
  assert.equal(trips.transport, 3500);
  assert.deepEqual(currencies.get("EUR"), { daily: 700, travel: 3500 });
  assert.deepEqual(currencies.get("CZK"), { daily: 100, travel: 0 });
  for (const group of ["all", "daily", "travel"] as const) {
    const pace = spendingPace(days, 55000, 16000, group);
    assert.equal(
      pace.at(-1)?.actual,
      { all: 4300, daily: 800, travel: 3500 }[group],
    );
    assert.equal(
      pace.at(-1)?.ideal,
      { all: 55000, daily: 39000, travel: 16000 }[group],
    );
  }
});

test("desktop weekly budgets follow the model and movement averages include zero-spend days", () => {
  const data = fixture(),
    stats = summary(data, month);
  const weekly = weeklySpending(data, month, weeks(month, data));
  assert.equal(weekly[0].start, "2026-11-01");
  assert.equal(weekly[0].budget, Math.round(stats.budget / 30));
  assert.equal(
    weekly.reduce((n, w) => n + w.daily + w.travel, 0),
    stats.cash,
  );
  assert.deepEqual(movementSummary(stats.rows, 30), {
    total: 4300,
    dailyAverage: 143,
    largest: 3500,
  });
  assert.deepEqual(movementSummary([], 0), {
    total: 0,
    dailyAverage: 0,
    largest: 0,
  });
  assert.equal(previousMonth("2026-01"), "2025-12");
  assert.equal(previousMonth(month), "2026-10");
});
