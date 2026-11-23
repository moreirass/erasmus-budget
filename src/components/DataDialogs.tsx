import { BusyButton } from "./Feedback";
import {
  AlertTriangle,
  Cloud,
  Download,
  FileCheck2,
  Wallet,
} from "lucide-react";
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
          <div className="record-summary import-summary">
            <FileCheck2 size={24} aria-hidden="true" />
            <p>
              {trCount("{0} transactions in the resulting workspace.", [
                pendingImport.data.transactions.length,
              ])}
            </p>
          </div>
          <p className="help">
            {tr(
              "JSON replaces the full workspace, including plans and balances. CSV merges transactions and updates laundry prices when included. Download a backup first if you want to preserve the current version.",
            )}{" "}
          </p>
          <div className="button-pair dialog-actions">
            <BusyButton onClick={exportJSON}>
              <Download size={16} /> {tr("Back up current")}{" "}
            </BusyButton>
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
            <AlertTriangle size={23} aria-hidden="true" />
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
          <div className="conflict-counts">
            <div>
              <span>{tr("Local workspace")}</span>
              <strong>
                {trCount("{0} transactions", [data.transactions.length])}
              </strong>
            </div>
            <div>
              <span>{tr("Cloud version")}</span>
              <strong>
                {trCount("{0} transactions", [
                  store.conflict.data.transactions.length,
                ])}
              </strong>
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
          <div className="export-buttons conflict-exports">
            <BusyButton onClick={exportBothVersions}>
              {tr("Export both versions")}
            </BusyButton>
            <BusyButton onClick={exportJSON}>
              {tr("Export local JSON")}
            </BusyButton>
            <BusyButton onClick={exportCloudVersion}>
              {tr("Export cloud JSON")}{" "}
            </BusyButton>
          </div>
          <div className="button-pair">
            <button onClick={() => store.resolveConflict("remote")}>
              <Cloud size={20} /> {tr("Use cloud version")}{" "}
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
              <Wallet size={20} /> {tr("Keep local version")}{" "}
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
