import { useSyncExternalStore } from "react";
import { portuguese } from "./locales/pt.ts";
import { english } from "./locales/en.ts";
import type { LaundryService, Transaction } from "./model.ts";

export type Language = "en" | "pt";
const storageKey = "pocket-language";
export function readLanguage(fallback?: Language): Language {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "pt" || saved === "en") return saved;
  } catch {}
  if (fallback) return fallback;
  return typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("pt")
    ? "pt"
    : "en";
}
let language: Language = readLanguage();
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const appLocale = () => (language === "pt" ? "pt-PT" : "en-GB");

export function setLanguage(next: Language) {
  language = next === "pt" ? "pt" : "en";
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // The current session still works when browser storage is unavailable.
  }
  listeners.forEach((notify) => notify());
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      language = readLanguage();
      listeners.forEach((listener) => listener());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}
export function useLanguage() {
  return {
    language: useSyncExternalStore(subscribe, getLanguage, () => "en" as const),
    setLanguage,
  };
}

const messages: Readonly<Record<string, string>> = portuguese;
const interpolate = (text: string, values: readonly (string | number)[]) =>
  text.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
    String(values[Number(index)] ?? placeholder),
  );

// Model and sync errors remain English internally and are translated when rendered.
const dynamicMessages = Object.keys(messages)
  .filter((key) => /\{\d+\}/.test(key))
  .map((key) => ({
    key,
    pattern: new RegExp(
      "^" +
        key
          .split(/\{\d+\}/)
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("([\\s\\S]*?)") +
        "$",
    ),
  }));
export function tr(
  message: string,
  values: readonly (string | number)[] = [],
): string {
  if (language === "en")
    return interpolate(
      (english as Record<string, string>)[message] ?? message,
      values,
    );
  if (Object.hasOwn(messages, message))
    return interpolate(messages[message], values);
  if (!values.length) {
    for (const { key, pattern } of dynamicMessages) {
      const match = message.match(pattern);
      if (match)
        return interpolate(
          messages[key],
          match
            .slice(1)
            .map((value) =>
              /^\d{4}-\d{2}-\d{2}$/.test(value) ? displayDate(value) : value,
            ),
        );
    }
  }
  return message;
}

export function kindLabel(kind: string) {
  return tr(
    (
      {
        expense: "Expense",
        income: "Money received",
        topup: "Top up",
        wash: "Wash",
      } as Record<string, string>
    )[kind] ?? kind,
  );
}
export function laundryServiceLabel(service: LaundryService = "wash") {
  return service === "dry" ? tr("Drying") : tr("Wash");
}
export function transactionKindLabel(
  row: Pick<Transaction, "kind" | "service">,
) {
  return row.kind === "wash"
    ? laundryServiceLabel(row.service)
    : kindLabel(row.kind);
}
const singularMessages: Readonly<Record<string, string>> = {
  "{0} transactions": "{0} transaction",
  "{0} transactions this period · {1} money out":
    "{0} transaction this period · {1} money out",
  "{0} transactions in the resulting workspace.":
    "{0} transaction in the resulting workspace.",
  "{0} transactions · sync later": "{0} transaction · sync later",
  "{0} searchable currencies. Automatic updates use a six-hour cache; the button forces a new attempt.":
    "{0} searchable currency. Automatic updates use a six-hour cache; the button forces a new attempt.",
};
export function trCount(
  message: string,
  values: readonly [number, ...(string | number)[]],
) {
  return tr(
    new Intl.PluralRules(appLocale()).select(values[0]) === "one"
      ? (singularMessages[message] ?? message)
      : message,
    values.map((value) =>
      typeof value === "number" ? formatNumber(value) : value,
    ),
  );
}
export function displayDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString(appLocale());
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(appLocale(), options).format(value);
}
export function formatPercent(value: number) {
  return formatNumber(value, { style: "percent", maximumFractionDigits: 0 });
}
export function errorMessage(message: string) {
  if (
    Object.hasOwn(messages, message) ||
    dynamicMessages.some(({ pattern }) => pattern.test(message))
  )
    return tr(message);
  if (Object.values(messages).includes(message)) return message;
  if (/JSON|Unexpected token|Unexpected end/i.test(message))
    return tr(
      "This file is not valid JSON. Choose a Pocket JSON backup or CSV export.",
    );
  return tr(
    "The request could not be completed. Check your connection and configuration, then try again.",
  );
}
