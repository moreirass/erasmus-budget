import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  syncAction,
  uploadedEnvelope,
  resolveEnvelope,
  type Envelope,
} from "./sync.ts";
import { freshData, makeTransaction } from "./model.ts";
const initial = (): Envelope => ({
  data: freshData(),
  revision: 1,
  dirty: false,
  stamp: "original",
});
it("detects different phone and PC edits and preserves both until an explicit choice", () => {
  const pc = initial(),
    phone = initial();
  pc.dirty = phone.dirty = true;
  pc.stamp = "pc";
  phone.stamp = "phone";
  pc.data.transactions = [
    makeTransaction({
      id: "pc-entry",
      date: pc.data.settings.start + "-09",
      kind: "expense",
      category: "snacks",
      currency: "EUR",
      amount: 500,
      rate: 1,
      note: "PC",
    }),
  ];
  phone.data.transactions = [
    { ...pc.data.transactions[0], id: "phone-entry", note: "Phone" },
  ];
  assert.equal(syncAction(pc, 1), "upload");
  const uploaded = uploadedEnvelope(pc, pc, 2, 1000);
  assert.equal(uploaded.dirty, false);
  assert.equal(uploaded.lastSyncedAt, 1000);
  assert.equal(syncAction(phone, uploaded.revision), "conflict");
  assert.equal(phone.data.transactions[0].id, "phone-entry");
  assert.equal(uploaded.data.transactions[0].id, "pc-entry");
  const local = resolveEnvelope(phone, uploaded, "local");
  assert.equal(local.revision, 2);
  assert.equal(local.dirty, true);
  assert.equal(local.data.transactions[0].id, "phone-entry");
  assert.equal(syncAction(local, 2), "upload");
  const remote = resolveEnvelope(phone, uploaded, "remote");
  assert.equal(remote.dirty, false);
  assert.equal(remote.data.transactions[0].id, "pc-entry");
  assert.equal(syncAction(initial(), 2), "download");
});
it("keeps changes made during upload dirty and rejects invalid server revisions", () => {
  const before = initial();
  before.dirty = true;
  const latest = { ...before, stamp: "new-edit" };
  const next = uploadedEnvelope(latest, before, 2, 1234);
  assert.equal(next.dirty, true);
  assert.equal(next.stamp, "new-edit");
  assert.equal(next.revision, 2);
  assert.throws(() => uploadedEnvelope(latest, before, 1), /revision/);
});
it("server compare-and-swap guards concurrent writers, including first uploads", () => {
  const sql = readFileSync("supabase/schema.sql", "utf8");
  assert.match(sql, /revision=expected_revision/);
  assert.match(sql, /on conflict \(user_id\) do nothing/);
  assert.match(sql, /if next_revision is null then raise exception/);
});
