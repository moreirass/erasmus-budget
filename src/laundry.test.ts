import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addLaundryUse,
  adjustLaundryBalance,
  freshData,
  InsufficientLaundryCredit,
  laundryBalance,
  laundryPrice,
  makeTransaction,
  summary,
  validateData,
} from "./model.ts";
import { monthSeries } from "./views/desktop/series.ts";
import { laundryServiceLabel } from "./i18n.ts";
import { importCSV, parseCSV, toCSV } from "./transfer.ts";

const date = "2026-11-23";

test("reconciles card credit from the adjustment date without changing bank spending or past balances", () => {
  const original = addLaundryUse(workspace(), "wash", "2026-11-22").data;
  const adjusted = adjustLaundryBalance(original, 8860, date);
  assert.deepEqual(adjusted.transactions, original.transactions);
  assert.equal(laundryBalance(adjusted, "2026-11-22"), 19000);
  assert.equal(laundryBalance(adjusted, date), 8860);
  assert.equal(summary(adjusted, "2026-11").cash, 0);
  assert.equal(
    monthSeries(adjusted, "2026-11", adjusted.transactions).days[22].card,
    8860,
  );
  assert.equal(addLaundryUse(adjusted, "dry", date).transaction.credit, 6000);
  assert.throws(
    () => addLaundryUse(adjusted, "wash", date),
    InsufficientLaundryCredit,
  );
  assert.deepEqual(
    validateData(JSON.parse(JSON.stringify(adjusted))),
    adjusted,
  );

  const scheduled = addLaundryUse(workspace(), "wash", "2026-11-24").data;
  assert.throws(
    () => adjustLaundryBalance(scheduled, 1000, date),
    InsufficientLaundryCredit,
  );
});
function workspace(openingCard = 30000) {
  const data = freshData();
  data.settings = {
    ...data.settings,
    start: "2026-11",
    end: "2026-12",
    openingCard,
  };
  return data;
}

test("new and old documents default to 110 CZK to wash and 60 CZK to dry", () => {
  const data = workspace();
  assert.equal(laundryPrice(data.settings, "wash"), 110);
  assert.equal(laundryPrice(data.settings, "dry"), 60);
  delete data.settings.washPriceCzk;
  delete data.settings.dryPriceCzk;
  const restored = validateData(data);
  assert.equal(restored.settings.washPriceCzk, 110);
  assert.equal(restored.settings.dryPriceCzk, 60);
  for (const price of [0, -10, 1.001, null, "110"]) {
    assert.throws(
      () =>
        validateData({
          ...data,
          settings: { ...data.settings, dryPriceCzk: price },
        }),
      /greater than zero/,
    );
  }
});

test("changing prices affects only new entries, including through a JSON or CSV round trip", () => {
  const first = addLaundryUse(workspace(), "dry", date);
  const next = validateData({
    ...first.data,
    settings: { ...first.data.settings, dryPriceCzk: 75.5 },
  });
  const second = addLaundryUse(next, "dry", date);
  assert.equal(first.transaction.amount, 6000);
  assert.deepEqual(second.data.transactions[0], first.transaction);
  assert.equal(second.transaction.amount, 7550);
  assert.equal(second.transaction.service, "dry");
  assert.equal(second.transaction.eur, 0);
  assert.equal(summary(second.data, date.slice(0, 7)).cash, 0);
  assert.equal(laundryBalance(second.data, date), 16450);
  assert.deepEqual(
    validateData(JSON.parse(JSON.stringify(second.data))),
    second.data,
  );
  assert.deepEqual(importCSV(toCSV(second.data), workspace()), second.data);
  const withoutTime = parseCSV(toCSV(second.data))
    .map((row) =>
      row
        .filter((_, index) => index !== 15)
        .map((value) => '"' + value.replaceAll('"', '""') + '"')
        .join(","),
    )
    .join("\r\n");
  assert.deepEqual(importCSV(withoutTime, workspace()), second.data);
  assert.equal(
    importCSV(toCSV({ ...next, transactions: [] }), workspace()).settings
      .dryPriceCzk,
    75.5,
  );
});

test("insufficient card credit rejects an entry without changing the document", () => {
  const data = workspace(10999);
  assert.throws(
    () => addLaundryUse(data, "wash", date),
    InsufficientLaundryCredit,
  );
  assert.deepEqual(data.transactions, []);
  const enough = addLaundryUse(workspace(11000), "wash", date);
  assert.equal(laundryBalance(enough.data, date), 0);

  const later = addLaundryUse(workspace(15000), "wash", "2026-11-24").data;
  assert.throws(
    () => addLaundryUse(later, "dry", date),
    InsufficientLaundryCredit,
  );
});

test("old JSON and CSV backups preserve past wash values and do not overwrite custom prices when absent", () => {
  const old = workspace();
  delete old.settings.washPriceCzk;
  delete old.settings.dryPriceCzk;
  const legacy = makeTransaction({
    id: "legacy-wash",
    date,
    kind: "wash",
    category: "laundry",
    amount: 9500,
    currency: "CZK",
    rate: 25,
    note: "",
    addedOrder: 1,
  });
  old.transactions.push(legacy);
  const restored = validateData(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored.transactions[0], legacy);
  assert.equal(
    laundryServiceLabel(restored.transactions[0].service),
    laundryServiceLabel("wash"),
  );
  assert.equal(restored.settings.washPriceCzk, 110);
  const rows = parseCSV(toCSV(old));
  const csv = rows
    .slice(0, 2)
    .map((row) => row.slice(0, 15).join(","))
    .join("\n");
  const target = workspace();
  target.settings.dryPriceCzk = 80;
  const imported = importCSV(csv, target);
  assert.deepEqual(imported.transactions[0], legacy);
  assert.equal(imported.settings.dryPriceCzk, 80);
  assert.equal(laundryBalance(imported, date), 20500);
  assert.throws(
    () =>
      validateData({ ...old, transactions: [{ ...legacy, service: "fold" }] }),
    /Invalid laundry service/,
  );
  assert.throws(
    () =>
      validateData({
        ...old,
        transactions: [{ ...legacy, kind: "topup", service: "dry" }],
      }),
    /Invalid laundry service/,
  );
});
