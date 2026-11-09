export type BackupRecord = { since: number; lastExport?: number };
export function parseBackup(
  raw: string | null,
  now = Date.now(),
): BackupRecord {
  try {
    const b = JSON.parse(raw ?? "null");
    if (
      b &&
      Number.isFinite(b.since) &&
      b.since > 0 &&
      b.since <= now &&
      (b.lastExport === undefined ||
        (Number.isFinite(b.lastExport) &&
          b.lastExport > 0 &&
          b.lastExport <= now))
    )
      return b;
  } catch {
    /* Start tracking now. */
  }
  return { since: now };
}
export function backupDue(record: BackupRecord, days = 7, now = Date.now()) {
  return now - (record.lastExport ?? record.since) >= days * 86400000;
}
