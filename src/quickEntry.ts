import { fallbackCurrencies } from "./fx.ts";
import { categories, type Category, type Transaction } from "./model.ts";
const key = "pocket-last-entry-v1";
export function lastEntry(
  currencies = fallbackCurrencies().map((c) => c.code),
) {
  let value: { currency?: string; category?: Category; group?: string } = {};
  try {
    value = JSON.parse(localStorage.getItem(key) ?? "{}") ?? {};
  } catch {
    /* First use. */
  }
  return {
    currency: currencies.includes(value.currency ?? "")
      ? value.currency!
      : "CZK",
    category: categories.some(
      (c) => c.id === value.category && c.id !== "travel" && c.id !== "laundry",
    )
      ? value.category!
      : ("groceries" as Category),
    group: value.group === "travel" ? "travel" : "daily",
  };
}
export function rememberEntry(
  t: Transaction,
  source: "new" | "edit" | "recurring" | "favorite",
) {
  if (source !== "new" || !["expense", "income"].includes(t.kind)) return;
  const previous = lastEntry();
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        currency: t.currency,
        category:
          t.kind === "expense" && t.category !== "travel"
            ? t.category
            : previous.category,
        group:
          t.kind === "expense"
            ? t.category === "travel"
              ? "travel"
              : "daily"
            : previous.group,
      }),
    );
  } catch {
    /* Saving a transaction takes priority. */
  }
}
export function consumeAddShortcut(href: string) {
  const url = new URL(href);
  const open = url.searchParams.get("add") === "1";
  if (open) url.searchParams.delete("add");
  return { open, url: url.pathname + url.search + url.hash };
}
