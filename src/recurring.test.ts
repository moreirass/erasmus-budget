import { it } from "node:test";
import assert from "node:assert/strict";
import {
  freshData,
  validateData,
  dueOccurrences,
  generateRecurring,
  settleOccurrence,
  type RecurringRule,
} from "./model.ts";
const setup = () => {
  const d = freshData();
  d.settings.start = "2026-11";
  d.settings.end = "2027-02";
  const r: RecurringRule = {
    id: "rent",
    kind: "expense",
    category: "other",
    amount: 10000,
    currency: "EUR",
    note: "rent",
    frequency: "monthly",
    day: 31,
    start: "2026-10-01",
    mode: "auto",
    generated: [],
    ignored: [],
  };
  d.recurring = [r];
  return d;
};
it("keeps old backups compatible and validates rules", () => {
  assert.equal(validateData(freshData()).recurring, undefined);
  const d = setup();
  d.recurring![0].day = 32;
  assert.throws(() => validateData(d), /recurring/);
});
it("clamps day 31, clips tracking period, catches up and is idempotent", () => {
  const d = setup();
  const result = generateRecurring(d, {}, "2027-02-28");
  assert.deepEqual(
    result.added.map((t) => t.date),
    ["2026-11-30", "2026-12-31", "2027-01-31", "2027-02-28"],
  );
  assert.equal(
    generateRecurring(result.data, {}, "2027-02-28").added.length,
    0,
  );
  assert.deepEqual(
    result.added.map((t) => t.id),
    generateRecurring(d, {}, "2027-02-28").added.map((t) => t.id),
  );
});
it("leaves missing rates pending, uses saved/manual rates, and respects ignored dates", () => {
  const d = setup();
  d.recurring![0].currency = "CZK";
  assert.equal(generateRecurring(d, {}, "2026-11-30").pending.length, 1);
  const result = generateRecurring(
    d,
    { CZK: { rate: 25, date: "2026-11-29" } },
    "2026-11-30",
  );
  assert.equal(result.added[0].eur, 400);
  d.recurring![0].manualRate = 20;
  assert.equal(generateRecurring(d, {}, "2026-11-30").added[0].eur, 500);
  const o = dueOccurrences(d, "2026-11-30")[0];
  assert.equal(
    generateRecurring(settleOccurrence(d, o), {}, "2026-11-30").added.length,
    0,
  );
});
it("supports weekly confirmation and topups using existing card validation", () => {
  const d = setup();
  Object.assign(d.recurring![0], {
    frequency: "weekly",
    day: 1,
    mode: "confirm",
    kind: "topup",
    category: "laundry",
    currency: "CZK",
    manualRate: 25,
    end: "2026-11-16",
  });
  assert.deepEqual(
    dueOccurrences(d, "2026-11-30").map((o) => o.date),
    ["2026-11-02", "2026-11-09", "2026-11-16"],
  );
  assert.equal(generateRecurring(d, {}, "2026-11-30").added.length, 0);
  d.recurring![0].mode = "auto";
  const r = generateRecurring(d, {}, "2026-11-30");
  assert.equal(r.added.length, 3);
  assert.equal(r.added[0].credit, 10000);
  assert.doesNotThrow(() => validateData(r.data));
});
