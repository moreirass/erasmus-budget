import { displayDate, tr } from "../i18n";
import {
  monthEnd,
  periodStart,
  transactionOrder,
  type Data,
  type Transaction,
} from "../model";
import type { ViewProps } from "./types";

export type CardAdjustment = {
  id: string;
  date: string;
  delta: number;
  index: number;
};
export type HistoryEntry = Transaction | CardAdjustment;

export function cardAdjustments(
  data: Data,
  start?: string,
  end?: string,
): CardAdjustment[] {
  return (data.settings.laundryAdjustments ?? [])
    .map((adjustment, index) => ({
      ...adjustment,
      index,
      id: `card-adjustment:${index}`,
    }))
    .filter(({ date }) => (!start || date >= start) && (!end || date <= end));
}

export function movementAdjustments({
  data,
  month,
  range,
  group,
  filter,
  search,
}: Pick<
  ViewProps,
  "data" | "month" | "range" | "group" | "filter" | "search"
>) {
  if (group === "travel" || (filter !== "all" && filter !== "laundry"))
    return [];
  const query = search.toLocaleLowerCase();
  return cardAdjustments(
    data,
    range?.start ?? periodStart(data, month),
    range?.end ?? monthEnd(month),
  ).filter(({ date }) =>
    `${tr("Balance adjustment")} ${tr("Laundry")} ${displayDate(date)}`
      .toLocaleLowerCase()
      .includes(query),
  );
}

export function historyOrder(a: HistoryEntry, b: HistoryEntry) {
  if (!("delta" in a) && !("delta" in b)) return transactionOrder(a, b);
  return (
    b.date.localeCompare(a.date) ||
    ("delta" in a ? ("delta" in b ? b.index - a.index : -1) : 1)
  );
}
