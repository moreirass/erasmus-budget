import { useEffect, useState } from "react";
import {
  currentPeriod,
  months,
  weeks,
  summary,
  planFor,
  today,
  type Data,
} from "../model";
export function usePeriod(
  data: Data,
  workspaceId: string | undefined,
  view: string,
) {
  const [month, setMonth] = useState(() => currentPeriod(data).month);
  const [week, setWeek] = useState(() => currentPeriod(data).week);
  const [group, setGroup] = useState("all");
  useEffect(() => {
    const reset = () => {
      if (document.visibilityState === "hidden") return;
      const p = currentPeriod(data);
      setMonth(p.month);
      setWeek(p.week);
    };
    reset();
    let date = today();
    const timer = setInterval(() => {
      if (today() !== date) {
        date = today();
        reset();
      }
    }, 30000);
    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [
    data.settings.start,
    data.settings.end,
    data.settings.firstDay,
    workspaceId,
  ]);
  const monthList = months(data.settings.start, data.settings.end),
    weekList = weeks(month, data),
    range =
      view === "week"
        ? weekList[Math.min(week, weekList.length - 1)]
        : undefined;
  const stats = summary(data, month, range),
    plan = planFor(data, month),
    isFuture = month > today().slice(0, 7);
  function changeMonth(m: string) {
    setMonth(m);
    const p = currentPeriod(data);
    setWeek(m === p.month ? p.week : 0);
  }
  const groupCash = (s: ReturnType<typeof summary>) =>
    group === "travel"
      ? s.spent.travel
      : group === "daily"
        ? s.cash - s.spent.travel
        : s.cash;
  return {
    month,
    week,
    setWeek,
    group,
    setGroup,
    monthList,
    weekList,
    range,
    stats,
    plan,
    isFuture,
    changeMonth,
    groupCash,
  };
}
