import {
  syncAction,
  uploadedEnvelope,
  resolveEnvelope,
  type Envelope,
} from "./sync";
import { createClient, type User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import { freshData, validateData, type Data } from "./model";
const env = import.meta.env;
export const cloud =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : null;
const key = (scope: string) => "pocket-v1:" + scope;
function read(scope: string): Envelope {
  const raw = localStorage.getItem(key(scope));
  if (!raw) return { data: freshData(), revision: 0, dirty: false, stamp: "" };
  const e = JSON.parse(raw) as Envelope;
  const migrated = e.data.layoutVersion !== 2;
  if (migrated) localStorage.setItem(key(scope) + ":before-two-budgets", raw);
  e.data = validateData(e.data);
  if (migrated) {
    e.dirty = true;
    e.stamp = crypto.randomUUID();
    localStorage.setItem(key(scope), JSON.stringify(e));
  }
  if (!Number.isInteger(e.revision) || e.revision < 0)
    throw new Error("Invalid local sync revision.");
  return e;
}
export function useBudget() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(!cloud),
    [scope, setScope] = useState("guest");
  const activeScope = useRef(scope);
  activeScope.current = user?.id ?? "guest";
  const [error, setError] = useState(""),
    [envelope, setEnvelope] = useState<Envelope>(() => {
      try {
        return read("guest");
      } catch {
        return {
          data: freshData(),
          revision: 0,
          dirty: false,
          stamp: "corrupt",
        };
      }
    });
  const [status, setStatus] = useState("Local only"),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState<Envelope | null>(null);
  useEffect(() => {
    if (!cloud) return;
    cloud.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const next = user?.id ?? "guest";
    setScope(next);
    setBusy(false);
    setConflict(null);
    setStatus(user ? "Ready to sync" : "Local only");
    try {
      setEnvelope(read(next));
      setError("");
    } catch {
      setError(
        "Saved data could not be read. Export the recovery file before restoring a backup.",
      );
      setEnvelope({
        data: freshData(),
        revision: 0,
        dirty: false,
        stamp: "corrupt",
      });
    }
  }, [user?.id]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(scope)) {
        try {
          setEnvelope(read(scope));
          setStatus("Updated from another tab");
        } catch {
          setError("Another tab wrote invalid data.");
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [scope]);
  function save(next: Envelope) {
    localStorage.setItem(key(scope), JSON.stringify(next));
    setEnvelope(next);
  }
  function update(data: Data) {
    if (envelope.stamp === "corrupt")
      throw new Error("Recover or restore your saved data first.");
    const latest = read(scope);
    if (latest.stamp !== envelope.stamp) {
      setEnvelope(latest);
      throw new Error("Another tab changed your data. Please try again.");
    }
    save({
      ...envelope,
      data: validateData(data),
      dirty: true,
      stamp: crypto.randomUUID(),
    });
    setStatus(user ? "Saved locally · sync pending" : "Saved on this device");
  }
  function restore(data: Data) {
    data = validateData(data);
    if (envelope.stamp === "corrupt")
      localStorage.setItem(
        key(scope) + ":recovery",
        localStorage.getItem(key(scope)) ?? "",
      );
    save({ ...envelope, data, dirty: true, stamp: crypto.randomUUID() });
  }
  async function sync() {
    if (!cloud || !user || busy) return;
    setBusy(true);
    setError("");
    setStatus("Syncing…");
    try {
      const before = read(scope);
      const { data: row, error } = await cloud
        .from("budget_documents")
        .select("payload,revision")
        .eq("user_id", user.id)
        .maybeSingle();
      if (activeScope.current !== scope) return;
      if (error) throw error;
      const remote: Envelope = {
        data: row ? validateData(row.payload) : freshData(),
        revision: row?.revision ?? 0,
        dirty: !!row && row.payload.layoutVersion !== 2,
        stamp: crypto.randomUUID(),
        lastSyncedAt: Date.now(),
      };
      if (read(scope).stamp !== before.stamp)
        throw new Error("Local data changed while syncing. Sync again.");
      if (syncAction(before, remote.revision) === "conflict") {
        localStorage.setItem(
          key(scope) + ":conflict",
          JSON.stringify({ local: before, remote }),
        );
        setConflict(remote);
        setStatus("Changes on both devices");
        return;
      }
      if (syncAction(before, remote.revision) === "upload") {
        const { data: revision, error: writeError } = await cloud.rpc(
          "save_budget",
          { expected_revision: before.revision, document: before.data },
        );
        if (activeScope.current !== scope) return;
        if (writeError) throw writeError;
        const latest = read(scope);
        save(uploadedEnvelope(latest, before, Number(revision)));
        setStatus(
          latest.stamp === before.stamp
            ? "Synced just now"
            : "New local changes · sync again",
        );
      } else {
        save(remote);
        setStatus("Synced just now");
      }
    } catch (e) {
      if (activeScope.current !== scope) return;
      setError(
        e instanceof Error
          ? e.message
          : String((e as { message?: string }).message ?? e),
      );
      setStatus("Not synced · local data kept");
    } finally {
      setBusy(false);
    }
  }
  function resolveConflict(choice: "local" | "remote") {
    if (!conflict) return;
    save(resolveEnvelope(read(scope), conflict, choice));
    setConflict(null);
    setStatus(
      choice === "local"
        ? "Local version kept · press Sync to upload"
        : "Cloud version loaded",
    );
  }
  return {
    data: envelope.data,
    user,
    ready: ready && scope === (user?.id ?? "guest"),
    update,
    restore,
    sync,
    status,
    busy,
    error,
    setError,
    conflict,
    resolveConflict,
    dismissConflict: () => setConflict(null),
    lastSyncedAt: envelope.lastSyncedAt,
    corrupt: envelope.stamp === "corrupt",
    recovery: () => localStorage.getItem(key(scope)) ?? "",
    dirty: envelope.dirty,
  };
}
