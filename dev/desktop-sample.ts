import {
  freshData,
  lastDay,
  makeTransaction,
  today,
  validateData,
  type Transaction,
} from "../src/model.ts";
import { previousMonth } from "../src/views/desktop/series.ts";

// Use only in an isolated browser profile. This fixture is outside the app's import graph.
export function desktopSample(month = today().slice(0, 7)) {
  const data = freshData();
  const previous = previousMonth(month);
  data.settings = {
    ...data.settings,
    start: previous,
    end: month,
    openingCard: 20000,
  };
  function add(
    period: string,
    day: number,
    kind: Transaction["kind"],
    category: Transaction["category"],
    amount: number,
    currency = "EUR",
    travelType?: Transaction["travelType"],
  ) {
    const order = data.transactions.length + 1;
    const date = `${period}-${String(Math.min(lastDay(period), day)).padStart(2, "0")}`;
    data.transactions.push(
      makeTransaction({
        id: `desktop-sample-${order}`,
        date,
        kind,
        category,
        amount,
        currency,
        rate: currency === "CZK" ? 25 : 1,
        travelType,
        addedOrder: order,
        note: "",
      }),
    );
  }
  for (const period of [previous, month]) {
    const current = period === month;
    const factor = current ? 1 : 0.75;
    add(period, 1, "expense", "groceries", Math.round(6700 * factor), "EUR");
    add(period, 2, "topup", "laundry", 12500, "CZK");
    add(period, 3, "expense", "restaurants", 16250, "CZK");
    add(
      period,
      5,
      "expense",
      "travel",
      Math.round(3600 * factor),
      "EUR",
      "transport",
    );
    add(period, 6, "expense", "snacks", 2100, "EUR");
    add(period, 7, "wash", "laundry", 6000, "CZK");
    add(period, 9, "expense", "nightlife", Math.round(9000 * factor), "EUR");
    add(period, 11, "expense", "travel", 122500, "CZK", "accommodation");
    add(period, 12, "expense", "groceries", 42500, "CZK");
    add(period, 13, "expense", "restaurants", 2400);
    add(period, 14, "wash", "laundry", 6000, "CZK");
    add(period, 15, "expense", "travel", 2600, "EUR", "food");
    add(period, 17, "income", "groceries", 750);
    add(period, 18, "topup", "laundry", 20000, "CZK");
    add(period, 19, "expense", "other", 950);
    add(period, 20, "expense", "groceries", 55000, "CZK");
    add(period, 22, "expense", "travel", 3000, "EUR", "activities");
    add(period, 23, "wash", "laundry", 7000, "CZK");
    add(period, 24, "expense", "snacks", 48750, "CZK");
    add(period, 26, "expense", "restaurants", 3900);
  }
  return validateData(data);
}
