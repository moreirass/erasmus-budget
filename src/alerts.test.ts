import { it } from "node:test";
import assert from "node:assert/strict";
import {
  freshData,
  makeTransaction,
  limitLevels,
  crossedLimits,
  validateData,
} from "./model.ts";
const entry = (amount: number, kind: "expense" | "income" = "expense") =>
  makeTransaction({
    id: crypto.randomUUID(),
    date: "2026-11-09",
    kind,
    category: "travel",
    currency: "EUR",
    amount,
    rate: 1,
    note: "",
  });
const setup = () => {
  const d = freshData();
  d.settings.start = "2026-11";
  d.settings.end = "2026-12";
  return d;
};
it("uses gross spending and the same support-adjusted monthly cap as overview", () => {
  const d = setup();
  d.transactions = [entry(12800)];
  assert.equal(limitLevels(d, "2026-11")[0].threshold, 80);
  d.transactions.push(entry(4000, "income"));
  assert.deepEqual(limitLevels(d, "2026-11"), []);
});
it("only notifies on crossings, remembers thresholds, separates months and can be disabled", () => {
  const before = setup(),
    after = setup();
  after.transactions = [entry(16000)];
  const alerts = crossedLimits(before, after, "2026-11", []);
  assert.deepEqual(
    alerts.map((a) => a.threshold),
    [80, 100],
  );
  assert.deepEqual(
    crossedLimits(
      before,
      after,
      "2026-11",
      alerts.map((a) => a.key),
    ),
    [],
  );
  assert.deepEqual(crossedLimits(after, after, "2026-11", []), []);
  assert.deepEqual(crossedLimits(before, after, "2026-12", []), []);
  after.settings.limitAlerts = false;
  assert.deepEqual(crossedLimits(before, after, "2026-11", []), []);
  assert.doesNotThrow(() => validateData(after));
});
