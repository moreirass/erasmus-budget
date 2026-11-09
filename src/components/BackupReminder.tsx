import { useEffect, useState } from "react";
import { backupDue, parseBackup, type BackupRecord } from "../backups";
import { tr, appLocale } from "../i18n";
import type { Data } from "../model";
export function BackupReminder({
  data,
  scope,
  exportJSON,
  save,
  settings = false,
}: {
  data: Data;
  scope: string;
  exportJSON: () => void;
  save: (d: Data) => boolean;
  settings?: boolean;
}) {
  const [clock, setClock] = useState(Date.now());
  const key = "pocket-backups:" + scope;
  const read = () => {
    try {
      return parseBackup(localStorage.getItem(key));
    } catch {
      return { since: Date.now() };
    }
  };
  const [record, setRecord] = useState<BackupRecord>(read);
  useEffect(() => {
    const update = () => {
      setClock(Date.now());
      setRecord(read());
    };
    const initial = read();
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch {}
    setRecord(initial);
    const timer = setInterval(update, 60000);
    window.addEventListener("pocket-export", update);
    window.addEventListener("focus", update);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pocket-export", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("storage", update);
    };
  }, [key]);
  const overdue = backupDue(record, data.settings.backupDays ?? 7, clock);
  if (!settings && !overdue) return null;
  return (
    <div className="notice" role="status">
      <div>
        {overdue && <p>{tr("Time to export a backup.")}</p>}
        {settings && (
          <>
            <p>
              {record.lastExport
                ? tr("Last export: {0}", [
                    new Date(record.lastExport).toLocaleString(appLocale()),
                  ])
                : tr("No export recorded on this device.")}
            </p>
            <label>
              {tr("Backup reminder interval (days)")}
              <input
                type="number"
                min="1"
                max="365"
                value={data.settings.backupDays ?? 7}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isInteger(value) && value >= 1 && value <= 365)
                    save({
                      ...data,
                      settings: { ...data.settings, backupDays: value },
                    });
                }}
              />
            </label>
          </>
        )}
      </div>
      <button onClick={exportJSON}>{tr("Full JSON backup")}</button>
    </div>
  );
}
export function recordExport(scope: string) {
  try {
    const key = "pocket-backups:" + scope;
    const b = parseBackup(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...b, lastExport: Date.now() }));
  } catch {
    /* Downloads still work if storage is unavailable. */
  }
  window.dispatchEvent(new Event("pocket-export"));
}
