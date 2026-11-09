import { useState } from "react";
import { currentPeriod, type Data } from "../model";
// Keep this hook mounted in App so navigation does not reset the plan form's selection.
export function useSettings(data: Data) {
  const [planMonth, setPlanMonth] = useState(() => currentPeriod(data).month);
  const [planScope, setPlanScope] = useState<"month" | "following">("month");
  const selectedPlanMonth =
    planMonth < data.settings.start
      ? data.settings.start
      : planMonth > data.settings.end
        ? data.settings.end
        : planMonth;
  const [settingsSection, setSettingsSection] = useState("plan");
  return {
    selectedPlanMonth,
    setPlanMonth,
    planScope,
    setPlanScope,
    settingsSection,
    setSettingsSection,
  };
}
