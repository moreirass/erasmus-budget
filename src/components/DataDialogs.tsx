import { Cloud, Download, Wallet } from "lucide-react";
import { Modal } from "./Primitives";
import { tr, trCount } from "../i18n";
import type { BudgetStore } from "../hooks/types";
import type { useDataTransfer } from "../hooks/useDataTransfer";
type DataDialogsProps = Pick<
  ReturnType<typeof useDataTransfer>,
  | "pendingImport"
  | "setPendingImport"
  | "exportJSON"
  | "confirmImport"
  | "exportBothVersions"
  | "exportCloudVersion"
> & { store: BudgetStore };
export function DataDialogs({
  store,
  pendingImport,
  setPendingImport,
  exportJSON,
  confirmImport,
  exportBothVersions,
  exportCloudVersion,
}: DataDialogsProps) {
  const { data } = store;
  return (
    <>
      {pendingImport && (
        <Modal
          title={tr(pendingImport.type)}
          close={() => setPendingImport(null)}
        >
          <p>
            {trCount("{0} transactions in the resulting workspace.", [
              pendingImport.data.transactions.length,
            ])}
          </p>
          <p className="help">
            {tr(
              "JSON replaces the full workspace, including plans and balances. CSV keeps current settings and merges transactions. Download a backup first if you want to preserve the current version.",
            )}{" "}
          </p>
          <div className="button-pair">
            <button onClick={exportJSON}>
              <Download size={16} /> {tr("Back up current")}{" "}
            </button>
            <button className="primary" onClick={confirmImport}>
              {tr("Confirm import")}{" "}
            </button>
          </div>
        </Modal>
      )}
      {store.conflict && (
        <Modal
          title={tr("Two versions need your choice")}
          close={store.dismissConflict}
        >
          <div className="conflict-banner">
            <Cloud size={23} />
            <div>
              <span className="tiny">{tr("ACTION REQUIRED")}</span>
              <h3>{tr("Sync conflict")}</h3>
              <p>
                {tr(
                  "This document changed on this device and in the cloud. Choose which version to keep.",
                )}{" "}
              </p>
            </div>
          </div>
          <p className="help">
            {tr(
              "Local: {0} records. Cloud: {1} records. Both versions are retained in a local recovery snapshot. Export both if you need to combine them manually.",
              [
                data.transactions.length,
                store.conflict.data.transactions.length,
              ],
            )}
          </p>
          <div className="export-buttons">
            <button onClick={exportBothVersions}>
              {tr("Export both versions")}
            </button>
            <button onClick={exportJSON}>{tr("Export local JSON")}</button>
            <button onClick={exportCloudVersion}>
              {tr("Export cloud JSON")}{" "}
            </button>
          </div>
          <div className="button-pair">
            <button onClick={() => store.resolveConflict("remote")}>
              <Cloud size={18} /> {tr("Use cloud version")}{" "}
              <small>
                {trCount("{0} transactions", [
                  store.conflict.data.transactions.length,
                ])}
              </small>
            </button>
            <button
              className="primary"
              onClick={() => store.resolveConflict("local")}
            >
              <Wallet size={18} /> {tr("Keep local version")}{" "}
              <small>
                {trCount("{0} transactions · sync later", [
                  data.transactions.length,
                ])}
              </small>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
