import { useState, type ReactNode } from "react";
import { ArrowDownUp, Pencil, Scale, Search, Trash2 } from "lucide-react";
import { weekLabel } from "../../components/PeriodControls";
import { currencyDigits, currencyFactor } from "../../fx";
import {
  appLocale,
  displayDate,
  transactionKindLabel,
  tr,
  trCount,
} from "../../i18n";
import {
  categories,
  money,
  monthEnd,
  monthLabel,
  periodDays,
  periodStart,
  summary,
  travelTypes,
  type Transaction,
} from "../../model";
import { BudgetBalance, StatusBar } from "../PocketDetails";
import { displayTime } from "../../time";
import { CategorySpendingCard } from "../Overview";
import {
  cardAdjustments,
  historyOrder,
  movementAdjustments,
  type HistoryEntry,
} from "../historyEntries";
import type { ViewProps } from "../types";
import { ChartPanel, colors, Donut, HorizontalBars, Plot } from "./Charts";
import {
  monthSeries,
  movementSummary,
  previousMonth,
  spendingPace,
  weeklySpending,
  type SpendingGroup,
} from "./series";
import "./desktop.css";

type Props = ViewProps & {
  tab: string;
  favorites?: ReactNode;
  laundryCard?: ReactNode;
  monthControl?: ReactNode;
  periodFilter?: ReactNode;
};

export default function DesktopViews(props: Props) {
  if (props.tab === "Overview") return <DesktopHome {...props} />;
  if (props.tab === "Analysis") return <DesktopAnalysis {...props} />;
  return <DesktopMovements {...props} />;
}

function BudgetCard({
  label,
  spent,
  budget,
  available,
  support,
  group,
  credit,
}: {
  label: string;
  spent: number;
  budget: number;
  available: number;
  support: number;
  group: SpendingGroup;
  credit?: number;
}) {
  return (
    <section
      className="pocket-panel desktop-budget"
      style={{ borderTopColor: colors[group] }}
    >
      <h2>{label}</h2>
      <BudgetBalance available={available} className="desktop-budget-value" />
      <StatusBar spent={spent} cap={budget + support} />
      <dl>
        <div>
          <dt>{tr("Budget")}</dt>
          <dd>{money(budget)}</dd>
        </div>
        <div>
          <dt>{tr("Spent")}</dt>
          <dd>{money(spent)}</dd>
        </div>
        {support > 0 && (
          <div>
            <dt>{tr("Support")}</dt>
            <dd>{money(support)}</dd>
          </div>
        )}
        {credit !== undefined && (
          <div>
            <dt>{tr("Laundry credit")}</dt>
            <dd>{money(credit, "CZK")}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function DesktopHome({
  data,
  month,
  plan,
  stats,
  weekList,
  setTab,
  favorites,
  laundryCard,
}: Props) {
  const [group, setGroup] = useState<SpendingGroup>("all");
  const { days } = monthSeries(data, month, stats.rows);
  const pace = spendingPace(days, stats.budget, plan.limits.travel, group);
  const weekly = weeklySpending(data, month, weekList);
  const spending =
    group === "all"
      ? stats.cash
      : group === "travel"
        ? stats.spent.travel
        : stats.cash - stats.spent.travel;
  const distribution = categories.flatMap((category, index) =>
    stats.spent[category.id] > 0
      ? [
          {
            label: tr(category.name),
            amount: stats.spent[category.id],
            color: colors[category.id === "travel" ? "travel" : "daily"],
            opacity: category.id === "travel" ? 1 : 1 - index * 0.09,
          },
        ]
      : [],
  );
  const tabs = [
    { id: "all", label: tr("All") },
    { id: "daily", label: tr("Day to day") },
    { id: "travel", label: tr("Travel") },
  ] as const;
  return (
    <div className="desktop-grid">
      <BudgetCard
        label={tr("Day to day")}
        spent={stats.cash - stats.spent.travel}
        budget={stats.budget - plan.limits.travel}
        available={stats.everydayRemaining}
        support={stats.income - stats.received.travel}
        group="daily"
      />
      <BudgetCard
        label={tr("Travel")}
        spent={stats.spent.travel}
        budget={plan.limits.travel}
        available={stats.travel}
        support={stats.received.travel}
        group="travel"
      />
      <BudgetCard
        label={tr("Month overview")}
        spent={stats.cash}
        budget={stats.budget}
        available={stats.everydayRemaining + stats.travel}
        support={stats.income}
        group="all"
        credit={stats.card}
      />
      <div className="desktop-full">{laundryCard}</div>
      <ChartPanel
        title={tr("Spending pace")}
        className="desktop-wide"
        empty={!spending}
        controls={
          <div
            className="segmented desktop-pace-switch"
            aria-label={tr("Group")}
            role="group"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={group === tab.id}
                className={group === tab.id ? "selected" : ""}
                onClick={() => setGroup(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      >
        <Plot
          label={tr("Spending pace")}
          points={pace.map((day) => ({
            label: String(Number(day.date.slice(8))),
            values: [day.actual, day.ideal],
          }))}
          series={[
            {
              label: tr("Cumulative spending"),
              color: colors[group],
              kind: "line",
            },
            {
              label: tr("Ideal pace"),
              color: colors.reference,
              kind: "line",
              dashed: true,
            },
          ]}
        />
      </ChartPanel>
      <ChartPanel
        title={tr("Spending distribution")}
        className="desktop-narrow"
        empty={!stats.cash}
      >
        <Donut items={distribution} total={stats.cash} />
      </ChartPanel>
      <ChartPanel
        title={tr("Spending by week")}
        className="desktop-full"
        empty={!stats.cash}
      >
        <Plot
          label={tr("Spending by week")}
          points={weekly.map((week) => ({
            label: weekLabel(week.start, week.end),
            values: [week.daily + week.travel, week.budget],
          }))}
          series={[
            { label: tr("Spent"), color: colors.all, kind: "bar" },
            {
              label: tr("Weekly budget"),
              color: colors.reference,
              kind: "line",
              dashed: true,
            },
          ]}
        />
      </ChartPanel>
      <section className="pocket-panel desktop-full">
        <div className="desktop-chart-heading">
          <h2>{tr("Recent activity")}</h2>
          <button onClick={() => setTab("Transactions")}>
            {tr("View all")}
          </button>
        </div>
        <MovementTable
          rows={[
            ...stats.rows,
            ...cardAdjustments(data, periodStart(data, month), monthEnd(month)),
          ]
            .sort(historyOrder)
            .slice(0, 8)}
        />
      </section>
      {data.favorites?.length ? (
        <div className="desktop-full">{favorites}</div>
      ) : null}
      <div className="desktop-full">
        <CategorySpendingCard
          data={data}
          month={month}
          stats={stats}
          weekList={weekList}
        />
      </div>
    </div>
  );
}

function DesktopAnalysis({ data, month, plan, stats, weekList }: Props) {
  const { days, trips, currencies, hasCard } = monthSeries(
    data,
    month,
    stats.rows,
  );
  const weekly = weeklySpending(data, month, weekList);
  const earlierMonth = previousMonth(month);
  const earlier =
    earlierMonth >= data.settings.start ? summary(data, earlierMonth) : null;
  const previousDaily = earlier ? earlier.cash - earlier.spent.travel : 0;
  const daily = stats.cash - stats.spent.travel;
  const tripItems = travelTypes
    .filter((type) => trips[type.id] > 0)
    .map((type) => ({
      label: tr(type.name),
      parts: [
        { label: tr("Travel"), amount: trips[type.id], color: colors.travel },
      ],
    }));
  const currencyCodes = [
    "EUR",
    "CZK",
    ...[...currencies.keys()]
      .filter((code) => code !== "EUR" && code !== "CZK")
      .sort(),
  ];
  const currencyItems = currencyCodes.map((code) => ({
    label: code,
    parts: [
      {
        label: tr("Day to day"),
        amount: currencies.get(code)?.daily ?? 0,
        color: colors.daily,
      },
      {
        label: tr("Travel"),
        amount: currencies.get(code)?.travel ?? 0,
        color: colors.travel,
      },
    ],
  }));
  return (
    <div className="desktop-grid">
      <ChartPanel title={tr("Category limits")} className="desktop-full">
        <div className="desktop-limits">
          {categories.map((category) => {
            const spent = stats.spent[category.id],
              cap = plan.limits[category.id] + stats.received[category.id];
            const percent = cap
              ? Math.floor((spent / cap) * 100)
              : spent
                ? 100
                : 0;
            const status =
              percent >= 100 ? "limit" : percent >= 80 ? "near" : "ok";
            return (
              <div className="desktop-limit" key={category.id}>
                <div>
                  <strong>{tr(category.name)}</strong>
                  <span data-status={status}>{percent}%</span>
                </div>
                <StatusBar spent={spent} cap={cap} />
                <small>
                  {money(spent)} / {money(cap)}
                </small>
              </div>
            );
          })}
        </div>
      </ChartPanel>
      <ChartPanel
        title={tr("Daily spending")}
        className="desktop-half"
        empty={!stats.cash}
      >
        <Plot
          label={tr("Daily spending")}
          points={days.map((day) => ({
            label: String(Number(day.date.slice(8))),
            values: [day.daily, day.travel, day.average],
          }))}
          series={[
            { label: tr("Day to day"), color: colors.daily, kind: "bar" },
            { label: tr("Travel"), color: colors.travel, kind: "bar" },
            {
              label: tr("7-day moving average"),
              color: colors.reference,
              kind: "line",
            },
          ]}
        />
      </ChartPanel>
      <ChartPanel
        title={tr("Weekly spending by group")}
        className="desktop-half"
        empty={!stats.cash}
      >
        <Plot
          label={tr("Weekly spending by group")}
          points={weekly.map((week) => ({
            label: weekLabel(week.start, week.end),
            values: [week.daily, week.travel],
          }))}
          series={[
            { label: tr("Day to day"), color: colors.daily, kind: "bar" },
            { label: tr("Travel"), color: colors.travel, kind: "bar" },
          ]}
        />
      </ChartPanel>
      <ChartPanel
        title={tr("Trip spending")}
        className="desktop-half"
        empty={!tripItems.length}
      >
        <HorizontalBars items={tripItems} />
      </ChartPanel>
      <ChartPanel
        title={tr("Spending by currency (EUR equivalent)")}
        className="desktop-half"
        empty={!stats.cash}
      >
        <HorizontalBars items={currencyItems} />
        <div className="desktop-legend">
          <span>
            <i style={{ background: colors.daily }} />
            {tr("Day to day")}
          </span>
          <span>
            <i style={{ background: colors.travel }} />
            {tr("Travel")}
          </span>
        </div>
      </ChartPanel>
      <ChartPanel
        title={tr("Laundry credit over time")}
        className="desktop-half"
        empty={!hasCard}
      >
        <Plot
          label={tr("Laundry credit over time")}
          currency="CZK"
          points={days.map((day) => ({
            label: String(Number(day.date.slice(8))),
            values: [day.card],
          }))}
          series={[
            { label: tr("Laundry credit"), color: colors.card, kind: "line" },
          ]}
        />
      </ChartPanel>
      {!!earlier?.rows.length && (
        <ChartPanel
          title={tr("Previous month comparison")}
          className="desktop-half"
          empty={!earlier.cash && !stats.cash}
        >
          <Plot
            label={tr("Previous month comparison")}
            points={[
              {
                label: monthLabel(earlierMonth),
                values: [previousDaily, earlier.spent.travel],
              },
              { label: monthLabel(month), values: [daily, stats.spent.travel] },
            ]}
            series={[
              { label: tr("Day to day"), color: colors.daily, kind: "bar" },
              { label: tr("Travel"), color: colors.travel, kind: "bar" },
            ]}
          />
        </ChartPanel>
      )}
    </div>
  );
}

function DesktopMovements({
  rows,
  data,
  month,
  range,
  group,
  filter,
  search,
  setGroup,
  setFilter,
  setSearch,
  setEditor,
  setPendingDelete,
  monthControl,
  periodFilter,
}: Props) {
  const totals = movementSummary(rows, range?.days ?? periodDays(data, month));
  const entries = [
    ...rows,
    ...movementAdjustments({ data, month, range, group, filter, search }),
  ];
  return (
    <div className="desktop-grid">
      <section
        className="pocket-panel desktop-full desktop-filters"
        aria-label={tr("Search and filters")}
      >
        {monthControl}
        <div className="desktop-period">{periodFilter}</div>
        <label className="field">
          <span>{tr("Group")}</span>
          <select
            value={group}
            onChange={(event) => {
              setGroup(event.target.value);
              setFilter("all");
            }}
          >
            <option value="all">{tr("All groups")}</option>
            <option value="daily">{tr("Day to day")}</option>
            <option value="travel">{tr("Travel")}</option>
          </select>
        </label>
        <label className="field">
          <span>{tr("Category")}</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">{tr("All categories")}</option>
            {categories
              .filter(
                (category) =>
                  group === "all" ||
                  (group === "travel"
                    ? category.id === "travel"
                    : category.id !== "travel"),
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {tr(category.name)}
                </option>
              ))}
          </select>
        </label>
        <label className="pocket-search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label={tr("Search transactions")}
            placeholder={tr("Search transactions")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>
      <section
        className="pocket-panel desktop-full desktop-movement-summary"
        aria-label={tr("Spending totals for filtered transactions")}
      >
        <dl>
          <div>
            <dt>{tr("Total spent")}</dt>
            <dd>{money(totals.total)}</dd>
          </div>
          <div>
            <dt>{tr("Daily average")}</dt>
            <dd>{money(totals.dailyAverage)}</dd>
          </div>
          <div>
            <dt>{tr("Largest expense")}</dt>
            <dd>{money(totals.largest)}</dd>
          </div>
        </dl>
      </section>
      <section
        className="pocket-panel desktop-full"
        aria-label={tr("Transactions")}
      >
        <p className="desktop-empty">
          {trCount("{0} transactions", [entries.length])}
        </p>
        <MovementTable
          rows={entries}
          setEditor={setEditor}
          setPendingDelete={setPendingDelete}
        />
      </section>
    </div>
  );
}

type SortKey = "date" | "category" | "amount" | "eur";
function rowCategory(row: HistoryEntry) {
  if ("delta" in row) return tr("Balance adjustment");
  const category = categories.find((item) => item.id === row.category)!;
  const subcategory = travelTypes.find((item) => item.id === row.travelType);
  return tr(subcategory?.name ?? category.name);
}
const signed = (row: Transaction, cents: number) =>
  row.kind === "income" ? cents : -cents;
const entryCurrency = (row: HistoryEntry) =>
  "delta" in row ? "CZK" : row.currency;
const entryAmount = (row: HistoryEntry) =>
  "delta" in row ? row.delta : signed(row, row.amount);
const entryEur = (row: HistoryEntry) =>
  "delta" in row || row.kind === "wash" ? 0 : signed(row, row.eur);

function MovementTable({
  rows,
  setEditor,
  setPendingDelete,
}: {
  rows: HistoryEntry[];
  setEditor?: (row: Transaction) => void;
  setPendingDelete?: (row: Transaction) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 1 | -1 }>({
    key: "date",
    direction: -1,
  });
  const sortable = !!setEditor;
  const columns: { key: SortKey; title: string }[] = [
    { key: "date", title: tr("Date") },
    { key: "category", title: tr("Category") },
    { key: "amount", title: tr("Original amount") },
    { key: "eur", title: tr("EUR equivalent") },
  ];
  const collator = new Intl.Collator(appLocale());
  const sorted = sortable
    ? [...rows].sort((a, b) => {
        let order;
        switch (sort.key) {
          case "date":
            order = a.date.localeCompare(b.date);
            break;
          case "category":
            order = collator.compare(rowCategory(a), rowCategory(b));
            break;
          case "amount":
            order =
              entryCurrency(a).localeCompare(entryCurrency(b)) ||
              entryAmount(a) - entryAmount(b);
            break;
          case "eur":
            order = entryEur(a) - entryEur(b);
            break;
        }
        return order * sort.direction || historyOrder(a, b);
      })
    : rows;
  if (!rows.length)
    return (
      <p className="desktop-empty">{tr("No transactions in this period.")}</p>
    );
  return (
    <table className="desktop-table">
      <thead>
        <tr>
          {columns.map(({ key, title }) => (
            <th
              scope="col"
              key={key}
              aria-sort={
                sortable && sort.key === key
                  ? sort.direction === 1
                    ? "ascending"
                    : "descending"
                  : undefined
              }
            >
              {sortable ? (
                <button
                  onClick={() =>
                    setSort({
                      key,
                      direction:
                        sort.key === key && sort.direction === 1 ? -1 : 1,
                    })
                  }
                >
                  {title}
                  <ArrowDownUp size={13} aria-hidden="true" />
                </button>
              ) : (
                title
              )}
            </th>
          ))}
          {sortable && <th scope="col" aria-label={tr("Actions")} />}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => {
          const category = rowCategory(row);
          if ("delta" in row)
            return (
              <tr key={row.id}>
                <td>{displayDate(row.date)}</td>
                <td>
                  <strong className="desktop-adjustment-label">
                    <Scale size={16} aria-hidden="true" />
                    {category}
                  </strong>
                </td>
                <td>
                  {row.delta > 0 ? "+" : "−"}
                  {money(Math.abs(row.delta), "CZK")}
                </td>
                <td>{money(0)}</td>
                {sortable && <td />}
              </tr>
            );
          const sign = row.kind === "income" ? "+" : "−";
          return (
            <tr key={`transaction:${row.id}`}>
              <td>
                {displayDate(row.date)}
                {row.time && <small>{displayTime(row.time)}</small>}
              </td>
              <td>
                <strong>{category}</strong>
                {(row.kind !== "expense" || row.note) && (
                  <small>
                    {row.kind !== "expense"
                      ? [transactionKindLabel(row), row.note]
                          .filter(Boolean)
                          .join(" · ")
                      : row.note}
                  </small>
                )}
              </td>
              <td>
                {sign}
                {(row.amount / currencyFactor(row.currency)).toLocaleString(
                  appLocale(),
                  {
                    minimumFractionDigits: currencyDigits(row.currency),
                    maximumFractionDigits: currencyDigits(row.currency),
                  },
                )}{" "}
                <small>{row.currency}</small>
              </td>
              <td>{row.kind === "wash" ? money(0) : sign + money(row.eur)}</td>
              {sortable && (
                <td>
                  <div className="pocket-row-actions">
                    <button
                      onClick={() => setEditor?.(row)}
                      aria-label={tr("Edit {0}", [category])}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setPendingDelete?.(row)}
                      aria-label={tr("Delete {0}", [category])}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
