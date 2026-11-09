import { ChevronLeft, ChevronRight } from "lucide-react";
import { appLocale, tr } from "../i18n";
import { currentPeriod, monthLabel, type Data } from "../model";
import type { usePeriod } from "../hooks/usePeriod";
type PeriodControlsProps = Pick<
  ReturnType<typeof usePeriod>,
  | "month"
  | "week"
  | "setWeek"
  | "group"
  | "setGroup"
  | "monthList"
  | "weekList"
  | "isFuture"
  | "changeMonth"
> & {
  data: Data;
  view: string;
  setView: (view: string) => void;
  setFilter: (filter: string) => void;
};
export function PeriodControls({
  data,
  month,
  week,
  setWeek,
  group,
  setGroup,
  monthList,
  weekList,
  isFuture,
  changeMonth,
  view,
  setView,
  setFilter,
}: PeriodControlsProps) {
  return (
    <div className="period-bar">
      <div className="month-picker">
        <button
          className="icon-button"
          aria-label={tr("Previous month")}
          disabled={month === monthList[0]}
          onClick={() => changeMonth(monthList[monthList.indexOf(month) - 1])}
        >
          <ChevronLeft size={18} />
        </button>
        <select
          aria-label={tr("Selected month")}
          value={month}
          onChange={(e) => changeMonth(e.target.value)}
        >
          {monthList.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label={tr("Next month")}
          disabled={month === monthList.at(-1)}
          onClick={() => changeMonth(monthList[monthList.indexOf(month) + 1])}
        >
          <ChevronRight size={18} />
        </button>
        {isFuture && <span className="pill">{tr("Plan preview")}</span>}
      </div>
      <div className="period-right">
        <select
          aria-label={tr("Budget group")}
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setFilter("all");
          }}
        >
          <option value="all">{tr("Both budgets")}</option>
          <option value="daily">{tr("Day to day")}</option>
          <option value="travel">{tr("Travel & tourism")}</option>
        </select>
        {view === "week" && (
          <select
            aria-label={tr("Selected week")}
            value={Math.min(week, weekList.length - 1)}
            onChange={(e) => setWeek(Number(e.target.value))}
          >
            {weekList.map((w, i) => (
              <option key={w.start} value={i}>
                {w.start.slice(8)}–{w.end.slice(8)}{" "}
                {new Date(month + "-15").toLocaleDateString(appLocale(), {
                  month: "short",
                })}
              </option>
            ))}
          </select>
        )}
        <div className="segmented">
          <button
            className={view === "month" ? "selected" : ""}
            onClick={() => setView("month")}
          >
            {tr("Month")}{" "}
          </button>
          <button
            className={view === "week" ? "selected" : ""}
            onClick={() => {
              setView("week");
              const p = currentPeriod(data);
              if (month === p.month) setWeek(p.week);
            }}
          >
            {tr("Week")}{" "}
          </button>
        </div>
      </div>
    </div>
  );
}
