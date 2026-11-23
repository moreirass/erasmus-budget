import {
  lastDay,
  monthEnd,
  periodStart,
  summary,
  travelTypes,
  type Data,
  type Transaction,
} from "../../model.ts";

export type SpendingGroup = "all" | "daily" | "travel";
type Week = { start: string; end: string; days: number };

export const isOutflow = (row: Transaction) =>
  row.kind === "expense" || row.kind === "topup";

export function monthSeries(data: Data, month: string, rows: Transaction[]) {
  const start = periodStart(data, month);
  const firstDay = Number(start.slice(8));
  const dayCount = lastDay(month) - firstDay + 1;
  const byDate = new Map<
    string,
    { daily: number; travel: number; cardDelta: number }
  >();
  const currencies = new Map<string, { daily: number; travel: number }>();
  const trips = Object.fromEntries(
    travelTypes.map((type) => [type.id, 0]),
  ) as Record<(typeof travelTypes)[number]["id"], number>;
  let openingCard = data.settings.openingCard;
  let hasCard = openingCard > 0;
  const end = monthEnd(month);

  for (const row of data.transactions) {
    if (row.date > end || (row.kind !== "wash" && row.kind !== "topup"))
      continue;
    hasCard = true;
    if (row.date < start)
      openingCard += row.kind === "topup" ? row.credit : -row.credit;
  }

  for (const row of rows) {
    const day = byDate.get(row.date) ?? { daily: 0, travel: 0, cardDelta: 0 };
    if (isOutflow(row)) {
      const group = row.category === "travel" ? "travel" : "daily";
      day[group] += row.eur;
      const amounts = currencies.get(row.currency) ?? { daily: 0, travel: 0 };
      amounts[group] += row.eur;
      currencies.set(row.currency, amounts);
      if (group === "travel")
        trips[row.travelType ?? "unclassified"] += row.eur;
    }
    if (row.kind === "topup") day.cardDelta += row.credit;
    if (row.kind === "wash") day.cardDelta -= row.credit;
    byDate.set(row.date, day);
  }

  let dailyCumulative = 0,
    travelCumulative = 0,
    card = openingCard;
  const totals: number[] = [];
  let rolling = 0;
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = `${month}-${String(firstDay + index).padStart(2, "0")}`;
    const { daily = 0, travel = 0, cardDelta = 0 } = byDate.get(date) ?? {};
    const total = daily + travel;
    totals.push(total);
    rolling += total - (totals[index - 7] ?? 0);
    dailyCumulative += daily;
    travelCumulative += travel;
    card += cardDelta;
    return {
      date,
      daily,
      travel,
      dailyCumulative,
      travelCumulative,
      card,
      average: Math.round(rolling / Math.min(index + 1, 7)),
    };
  });
  return { days, hasCard, currencies, trips };
}

export function spendingPace(
  days: ReturnType<typeof monthSeries>["days"],
  budget: number,
  travelBudget: number,
  group: SpendingGroup,
) {
  const cap =
    group === "all"
      ? budget
      : group === "travel"
        ? travelBudget
        : budget - travelBudget;
  return days.map(({ date, dailyCumulative, travelCumulative }, index) => ({
    date,
    actual:
      (group === "daily" ? 0 : travelCumulative) +
      (group === "travel" ? 0 : dailyCumulative),
    ideal: Math.round((cap * (index + 1)) / days.length),
  }));
}

export function weeklySpending(data: Data, month: string, weeks: Week[]) {
  return weeks.map((week) => {
    const stats = summary(data, month, week);
    return {
      ...week,
      daily: stats.cash - stats.spent.travel,
      travel: stats.spent.travel,
      budget: stats.budget,
    };
  });
}

export function previousMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  return number === 1
    ? `${year - 1}-12`
    : `${year}-${String(number - 1).padStart(2, "0")}`;
}

export function movementSummary(rows: Transaction[], days: number) {
  let total = 0,
    largest = 0;
  for (const row of rows) {
    if (!isOutflow(row)) continue;
    total += row.eur;
    largest = Math.max(largest, row.eur);
  }
  return { total, dailyAverage: days ? Math.round(total / days) : 0, largest };
}
