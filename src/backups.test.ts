import { it } from "node:test";
import assert from "node:assert/strict";
import { parseBackup, backupDue } from "./backups.ts";
import { freshData, validateData } from "./model.ts";
it("starts the reminder clock on first use and resets it after export", () => {
  const now = 1000000000,
    record = parseBackup(null, now);
  assert.equal(backupDue(record, 7, now), false);
  assert.equal(backupDue(record, 7, now + 7 * 86400000), true);
  assert.equal(
    backupDue(
      { ...record, lastExport: now + 7 * 86400000 },
      7,
      now + 8 * 86400000,
    ),
    false,
  );
  assert.equal(backupDue(record, 2, now + 2 * 86400000), true);
  assert.deepEqual(parseBackup('{"since":-1}', now), record);
});
it("keeps old settings compatible and validates reminder intervals", () => {
  const d = freshData();
  assert.doesNotThrow(() => validateData(d));
  d.settings.backupDays = 0;
  assert.throws(() => validateData(d), /backup interval/);
  d.settings.backupDays = 30;
  assert.equal(validateData(d).settings.backupDays, 30);
});
