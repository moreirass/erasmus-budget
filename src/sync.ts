import type { Data } from "./model.ts";
export type Envelope = {
  data: Data;
  revision: number;
  dirty: boolean;
  stamp: string;
  lastSyncedAt?: number;
};
export function syncAction(local: Envelope, remoteRevision: number) {
  return local.dirty
    ? remoteRevision !== local.revision
      ? "conflict"
      : "upload"
    : "download";
}
export function uploadedEnvelope(
  latest: Envelope,
  before: Envelope,
  revision: number,
  now = Date.now(),
): Envelope {
  if (!Number.isSafeInteger(revision) || revision <= before.revision)
    throw new Error("Invalid cloud revision.");
  return {
    ...latest,
    revision,
    dirty: latest.stamp !== before.stamp,
    lastSyncedAt: now,
  };
}
export function resolveEnvelope(
  local: Envelope,
  remote: Envelope,
  choice: "local" | "remote",
): Envelope {
  return choice === "remote"
    ? { ...remote, stamp: crypto.randomUUID() }
    : {
        ...local,
        revision: remote.revision,
        dirty: true,
        stamp: crypto.randomUUID(),
      };
}
