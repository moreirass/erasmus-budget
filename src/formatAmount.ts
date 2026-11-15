import { currencyDigits, currencyFactor } from "./fx.ts";
import { appLocale } from "./i18n.ts";

// Display original minor units without rounding away a currency's precision.
// Accounting and stored conversion values remain in the model.
export function formatAmount(amount: number, currency: string): string {
  const digits = currencyDigits(currency);
  return new Intl.NumberFormat(appLocale(), {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / currencyFactor(currency));
}
