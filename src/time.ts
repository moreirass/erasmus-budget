import { appLocale, tr } from "./i18n.ts";
export const currentTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
export function displayTime(time?: string) {
  return time
    ? new Intl.DateTimeFormat(appLocale(), {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date("2000-01-01T" + time + ":00"))
    : tr("Time not recorded");
}
