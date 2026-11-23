import { ChevronLeft, ChevronRight } from "lucide-react";
import { appLocale, tr } from "../i18n";
import { monthLabel } from "../model";
import type { usePeriod } from "../hooks/usePeriod";

type Period = ReturnType<typeof usePeriod>;

export function weekLabel(start: string, end: string) {
  const first = Number(start.slice(8));
  const last = Number(end.slice(8));
  const month = new Intl.DateTimeFormat(appLocale(), { month: "short" })
    .format(new Date(end + "T12:00:00"))
    .replace(/\.$/, "");
  return `${first === last ? first : `${first}–${last}`} ${month}`;
}

export function PeriodControls({
  month,
  monthList,
  changeMonth,
  compact = false,
}: Pick<Period, "month" | "monthList" | "changeMonth"> & {
  compact?: boolean;
}) {
  const index = monthList.indexOf(month);
  return (
    <div
      className={
        compact ? "pocket-month pocket-month-standalone" : "pocket-month"
      }
    >
      {compact && (
        <button
          aria-label={tr("Previous month")}
          disabled={index <= 0}
          onClick={() => changeMonth(monthList[index - 1])}
        >
          <ChevronLeft size={17} />
        </button>
      )}
      <select
        aria-label={tr("Month")}
        value={month}
        onChange={(event) => changeMonth(event.target.value)}
      >
        {monthList.map((item) => (
          <option value={item} key={item}>
            {monthLabel(item)}
          </option>
        ))}
      </select>
      {compact && (
        <button
          aria-label={tr("Next month")}
          disabled={index >= monthList.length - 1}
          onClick={() => changeMonth(monthList[index + 1])}
        >
          <ChevronRight size={17} />
        </button>
      )}
    </div>
  );
}

export function PeriodFilter({
  week,
  setWeek,
  weekList,
  view,
  setView,
}: Pick<Period, "week" | "setWeek" | "weekList"> & {
  view: string;
  setView: (view: string) => void;
}) {
  return (
    <>
      <div
        className="segmented period-toggle"
        role="group"
        aria-label={tr("Period")}
      >
        <button
          type="button"
          aria-pressed={view === "month"}
          className={view === "month" ? "selected" : ""}
          onClick={() => setView("month")}
        >
          {tr("Month")}
        </button>
        <button
          type="button"
          aria-pressed={view === "week"}
          className={view === "week" ? "selected" : ""}
          onClick={() => setView("week")}
        >
          {tr("Week")}
        </button>
      </div>
      {view === "week" && (
        <label className="field">
          <span>{tr("Week")}</span>
          <select
            value={Math.min(week, weekList.length - 1)}
            onChange={(event) => setWeek(Number(event.target.value))}
          >
            {weekList.map((item, i) => (
              <option key={item.start} value={i}>
                {weekLabel(item.start, item.end)}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
