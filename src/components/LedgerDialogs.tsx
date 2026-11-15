import { AlertTriangle, CheckCircle2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "./Primitives";
import { TransactionForm } from "./TransactionEditor";
import { displayDate, kindLabel, tr } from "../i18n";
import { money, validateData, type Data, type Transaction } from "../model";
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

function EditorDialog({
  data,
  month,
  fx,
  initial,
  initialKind,
  close,
  save,
}: {
  data: Data;
  month: string;
  fx: ReturnType<typeof useExchangeRates>;
  initial?: Transaction;
  initialKind: Transaction["kind"];
  close: () => void;
  save: (transaction: Transaction) => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  return (
    <>
      <Modal
        title={tr(initial ? "Edit transaction" : "New transaction")}
        close={() => (dirty ? setDiscard(true) : close())}
      >
        <TransactionForm
          data={data}
          month={month}
          initial={initial}
          initialKind={initialKind}
          fx={fx}
          save={save}
          onDirtyChange={setDirty}
        />
      </Modal>
      {discard && (
        <Modal
          title={tr("Discard unsaved changes?")}
          close={() => setDiscard(false)}
        >
          <div className="notice warning">
            <AlertTriangle aria-hidden="true" size={20} />
            <p>
              {tr(
                "This transaction has not been saved. Keep editing or discard your changes.",
              )}
            </p>
          </div>
          <div className="button-pair dialog-actions">
            <button className="primary" onClick={() => setDiscard(false)}>
              {tr("Keep editing")}
            </button>
            <button className="danger" onClick={close}>
              {tr("Discard changes")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

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
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => setDeleteError(""), [pendingDelete?.id]);
  const confirmDelete = () => {
    if (!pendingDelete) return;
    try {
      validateData({
        ...data,
        transactions: data.transactions.filter(
          (t) => t.id !== pendingDelete.id,
        ),
      });
      deleteTransaction();
    } catch (error) {
      setDeleteError((error as Error).message);
    }
  };
  return (
    <>
      {editor && (
        <EditorDialog
          key={editor === "new" ? `new-${editorKind}` : editor.id}
          data={data}
          month={month}
          fx={fx}
          initial={editor === "new" ? undefined : editor}
          initialKind={editorKind}
          close={() => setEditor(null)}
          save={saveTransaction}
        />
      )}
      {pendingDelete && (
        <Modal
          title={tr("Delete transaction?")}
          close={() => setPendingDelete(null)}
        >
          <div className="record-summary">
            <span className="record-summary-icon">
              <Trash2 size={22} aria-hidden="true" />
            </span>
            <div>
              <strong>
                {pendingDelete.note || kindLabel(pendingDelete.kind)}
              </strong>
              <p>
                {displayDate(pendingDelete.date)} ·{" "}
                {kindLabel(pendingDelete.kind)}
              </p>
            </div>
            <strong>
              {money(pendingDelete.amount, pendingDelete.currency)}
            </strong>
          </div>
          <p className="help">
            {tr(
              "You can undo deletion on this device. Card balance validation still applies.",
            )}
          </p>
          {deleteError && (
            <div role="alert" className="notice error">
              <AlertTriangle size={20} aria-hidden="true" />
              <p>{tr(deleteError)}</p>
            </div>
          )}
          <div className="button-pair dialog-actions">
            <button onClick={() => setPendingDelete(null)}>
              {tr("Cancel")}
            </button>
            <button className="danger" onClick={confirmDelete}>
              <Trash2 size={18} aria-hidden="true" />
              {tr("Delete")}
            </button>
          </div>
        </Modal>
      )}
      {removed && (
        <div className="undo-notice" role="status">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>{tr("Transaction deleted.")}</span>
          <button onClick={undoDelete}>{tr("Undo")}</button>
          <button
            className="icon-button"
            aria-label={tr("Dismiss undo option")}
            onClick={() => setRemoved(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
