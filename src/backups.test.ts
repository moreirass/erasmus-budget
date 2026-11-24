import { it } from "node:test";
import assert from "node:assert/strict";
import { freshData, validateData } from "./model.ts";
it("keeps backups containing the legacy reminder interval compatible", () => {
  const d = freshData();
  assert.doesNotThrow(() => validateData(d));
  d.settings.backupDays = 0;
  assert.throws(() => validateData(d), /backup interval/);
  d.settings.backupDays = 30;
  assert.equal(validateData(d).settings.backupDays, 30);
});
