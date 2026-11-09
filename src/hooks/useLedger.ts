import { useEffect, useState } from "react";
import { rememberEntry, consumeAddShortcut } from "../quickEntry";
import { tr, kindLabel } from "../i18n";
import {
  categories,
  crossedLimits,
  transactionOrder,
  travelTypes,
  type Data,
  type Transaction,
  type summary,
} from "../model";
import type { BudgetStore } from "./types";
export function useLedger(
  store: BudgetStore,
  setToast: (message: string) => void,
  stats: ReturnType<typeof summary>,
  group: string,
) {
  const { data, update } = store;
  const [editor, setEditor] = useState<Transaction | "new" | null>(null);
  const [editorKind, setEditorKind] = useState<Transaction["kind"]>("expense");
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [removed, setRemoved] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    setRemoved(null);
    setPendingDelete(null);
    setEditor(null);
  }, [store.user?.id]);
  useEffect(() => {
    if (!store.ready) return;
    const shortcut = consumeAddShortcut(location.href);
    if (shortcut.open) {
      setEditorKind("expense");
      setEditor("new");
      history.replaceState(history.state, "", shortcut.url);
    }
  }, [store.ready, store.user?.id]);
  function commit(d: Data, message = "Saved") {
    try {
      update(d);
      let notice = "";
      if (
        d.transactions.some(
          (t) =>
            t.kind === "expense" &&
            !data.transactions.some(
              (old) =>
                old.id === t.id &&
                old.eur === t.eur &&
                old.category === t.category &&
                old.date === t.date,
            ),
        )
      ) {
        const key = "pocket-limit-alerts:" + (store.user?.id ?? "guest");
        try {
          const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
          const seen: string[] = Array.isArray(raw)
            ? raw.filter((x) => typeof x === "string")
            : [];
          const alerts = [
            ...new Set(
              d.transactions
                .filter((t) => t.kind === "expense")
                .map((t) => t.date.slice(0, 7)),
            ),
          ].flatMap((m) => crossedLimits(data, d, m, seen));
          if (alerts.length) {
            localStorage.setItem(
              key,
              JSON.stringify([...seen, ...alerts.map((a) => a.key)]),
            );
            notice = alerts
              .map((a) =>
                tr("{0}: {1}% of monthly limit reached", [
                  tr(categories.find((c) => c.id === a.category)!.name),
                  a.threshold,
                ]),
              )
              .join(" · ");
          }
        } catch {
          /* Saving the entry takes priority over notification storage. */
        }
      }
      setToast(notice || message);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    }
  }
  function openNew(kind: Transaction["kind"] = "expense") {
    setEditorKind(kind);
    setEditor("new");
  }
  const rows = stats.rows
    .filter(
      (t) =>
        (group === "all" ||
          (group === "travel"
            ? t.category === "travel"
            : t.category !== "travel")) &&
        (filter === "all" || t.category === filter) &&
        `${t.note} ${t.category} ${t.kind} ${tr(categories.find((c) => c.id === t.category)!.name)} ${kindLabel(t.kind)} ${tr(travelTypes.find((c) => c.id === t.travelType)?.name ?? "")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(transactionOrder);
  function saveTransaction(t: Transaction) {
    if (
      commit(
        {
          ...data,
          transactions: [...data.transactions.filter((x) => x.id !== t.id), t],
        },
        "Transaction saved",
      )
    ) {
      rememberEntry(t, editor === "new" ? "new" : "edit");
      setEditor(null);
    }
  }
  function deleteTransaction() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    if (
      commit(
        {
          ...data,
          transactions: data.transactions.filter((t) => t.id !== item.id),
        },
        "Transaction deleted",
      )
    ) {
      setRemoved(item);
      setPendingDelete(null);
    }
  }
  function undoDelete() {
    if (!removed) return;
    if (data.transactions.some((t) => t.id === removed.id)) {
      setToast("This transaction already exists.");
      return;
    }
    if (
      commit(
        { ...data, transactions: [...data.transactions, removed] },
        "Deletion undone",
      )
    )
      setRemoved(null);
  }
  return {
    editor,
    setEditor,
    editorKind,
    pendingDelete,
    setPendingDelete,
    removed,
    setRemoved,
    search,
    setSearch,
    filter,
    setFilter,
    rows,
    commit,
    openNew,
    saveTransaction,
    deleteTransaction,
    undoDelete,
  };
}
