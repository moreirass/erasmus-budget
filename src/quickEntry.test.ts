import { it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { lastEntry, rememberEntry, consumeAddShortcut } from "./quickEntry.ts";
import {
  freshData,
  makeTransaction,
  favoriteTransaction,
  validateData,
} from "./model.ts";
const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  },
});
afterEach(() => storage.clear());
const tx = () =>
  makeTransaction({
    id: "a",
    date: "2026-11-09",
    kind: "expense",
    category: "travel",
    currency: "USD",
    amount: 1000,
    rate: 1.1,
    note: "",
  });
it("remembers currency only for successful new manual expenses/support, retaining expense group", () => {
  assert.equal(lastEntry().currency, "CZK");
  rememberEntry(tx(), "new");
  assert.equal(lastEntry().currency, "USD");
  assert.equal(lastEntry().group, "travel");
  for (const source of ["edit", "recurring", "favorite"] as const)
    rememberEntry({ ...tx(), currency: "EUR" }, source);
  assert.equal(lastEntry().currency, "USD");
  rememberEntry({ ...tx(), kind: "topup", currency: "CZK" }, "new");
  assert.equal(lastEntry().currency, "USD");
  rememberEntry({ ...tx(), kind: "income", currency: "GBP" }, "new");
  assert.equal(lastEntry().currency, "GBP");
  assert.equal(lastEntry().group, "travel");
  assert.equal(lastEntry(["CZK", "EUR"]).currency, "CZK");
});
it("consumes the PWA shortcut while retaining unrelated URL state", () => {
  assert.deepEqual(consumeAddShortcut("https://example.test/?add=1&x=2#hi"), {
    open: true,
    url: "/?x=2#hi",
  });
  assert.equal(consumeAddShortcut("https://example.test/?add=0").open, false);
});
it("favorites preserve their currency, require real rates, validate and survive old backups", () => {
  const d = freshData();
  d.settings.start = "2026-11";
  d.settings.end = "2026-12";
  const f = {
    id: "coffee",
    name: "Coffee",
    currency: "USD",
    amount: 500,
    category: "snacks" as const,
  };
  d.favorites = [f];
  assert.doesNotThrow(() => validateData(d));
  assert.equal(favoriteTransaction(f, d, {}, "2026-11-09"), null);
  const t = favoriteTransaction(
    f,
    d,
    { USD: { rate: 1.25, date: "2026-11-06" } },
    "2026-11-09",
  )!;
  assert.equal(t.currency, "USD");
  assert.equal(t.eur, 400);
  assert.equal(t.date, "2026-11-09");
  assert.notEqual(
    t.id,
    favoriteTransaction(
      f,
      d,
      { USD: { rate: 1.25, date: "2026-11-06" } },
      "2026-11-09",
    )!.id,
  );
  assert.equal(validateData(freshData()).favorites, undefined);
});
