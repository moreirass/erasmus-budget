import { Modal } from "./Primitives";
import { TransactionForm } from "./TransactionEditor";
import { kindLabel, tr } from "../i18n";
import { money, type Data } from "../model";
import type { useExchangeRates } from "../useExchangeRates";
import type { useLedger } from "../hooks/useLedger";
type LedgerDialogsProps = Pick<
  ReturnType<typeof useLedger>,
  | "editor"
  | "setEditor"
  | "editorKind"
  | "pendingDelete"
  | "setPendingDelete"
  | "removed"
  | "setRemoved"
  | "saveTransaction"
  | "deleteTransaction"
  | "undoDelete"
> & { data: Data; month: string; fx: ReturnType<typeof useExchangeRates> };
export function LedgerDialogs({
  data,
  month,
  fx,
  editor,
  setEditor,
  editorKind,
  pendingDelete,
  setPendingDelete,
  removed,
  setRemoved,
  saveTransaction,
  deleteTransaction,
  undoDelete,
}: LedgerDialogsProps) {
  return (
    <>
      {editor && (
        <Modal
          title={
            editor === "new" ? tr("New transaction") : tr("Edit transaction")
          }
          close={() => setEditor(null)}
        >
          <TransactionForm
            data={data}
            month={month}
            initial={editor === "new" ? undefined : editor}
            initialKind={editorKind}
            fx={fx}
            save={saveTransaction}
          />
        </Modal>
      )}
      {pendingDelete && (
        <Modal
          title={tr("Delete transaction?")}
          close={() => setPendingDelete(null)}
        >
          <p>
            {pendingDelete.note || kindLabel(pendingDelete.kind)} ·{" "}
            {pendingDelete.date} · {money(pendingDelete.eur)}
          </p>
          <p className="help">
            {tr(
              "You can undo deletion on this device. Card balance validation still applies.",
            )}{" "}
          </p>
          <div className="button-pair">
            <button onClick={() => setPendingDelete(null)}>
              {tr("Cancel")}
            </button>
            <button className="primary" onClick={deleteTransaction}>
              {tr("Delete")}{" "}
            </button>
          </div>
        </Modal>
      )}
      {removed && (
        <div className="undo-notice" role="status">
          {tr("Transaction deleted.")}{" "}
          <button onClick={undoDelete}>{tr("Undo")} </button>
          <button
            aria-label={tr("Dismiss undo option")}
            onClick={() => setRemoved(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
