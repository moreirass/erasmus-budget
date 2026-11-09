import { useEffect, useRef, useState } from "react";
import { recordExport } from "../components/BackupReminder";
import { tr } from "../i18n";
import { today, validateData, type Data } from "../model";
import { download, importCSV, toCSV } from "../transfer";
import type { BudgetStore } from "./types";
export function useDataTransfer(
  store: BudgetStore,
  setToast: (message: string) => void,
  clearRemoved: () => void,
) {
  const { data } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: Data;
    type: string;
  } | null>(null);
  useEffect(() => {
    setPendingImport(null);
  }, [store.user?.id]);
  async function readFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10000000)
        throw new Error(tr("Please choose a file smaller than 10 MB."));
      const text = await file.text();
      const csv = file.name.toLowerCase().endsWith(".csv");
      const next = csv ? importCSV(text, data) : validateData(JSON.parse(text));
      setPendingImport({
        data: next,
        type: csv ? "Merge CSV transactions" : "Restore full JSON backup",
      });
    } catch (e) {
      setToast((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  const exportJSON = () => {
    download(`pocket-${today()}.json`, JSON.stringify(data, null, 2));
    recordExport(store.user?.id ?? "guest");
  };
  function exportCSV() {
    download(
      "pocket-transactions-" + today() + ".csv",
      toCSV(data),
      "text/csv;charset=utf-8",
    );
    recordExport(store.user?.id ?? "guest");
  }
  function confirmImport() {
    if (!pendingImport) return;
    try {
      store.restore(pendingImport.data);
      clearRemoved();
      setPendingImport(null);
      setToast("Import complete · saved locally");
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  function exportBothVersions() {
    download(
      "pocket-both-versions.json",
      JSON.stringify({ local: data, cloud: store.conflict?.data }, null, 2),
    );
  }
  function exportCloudVersion() {
    download(
      "pocket-cloud-conflict.json",
      JSON.stringify(store.conflict?.data, null, 2),
    );
  }
  return {
    fileRef,
    pendingImport,
    setPendingImport,
    readFile,
    exportJSON,
    exportCSV,
    confirmImport,
    exportBothVersions,
    exportCloudVersion,
  };
}
