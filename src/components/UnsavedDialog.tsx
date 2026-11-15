import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { tr } from "../i18n";
import { Modal } from "./Primitives";

/** A presentation-only guard. Successful save handlers call close directly. */
export function UnsavedDialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: (markDirty: (dirty: boolean) => void) => ReactNode;
}) {
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const markDirty = useCallback((changed: boolean) => {
    if (changed) setDirty(true);
  }, []);
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
      <Modal title={title} close={() => (dirty ? setDiscard(true) : close())}>
        <div
          onChangeCapture={(event) => {
            if (
              (event.target as HTMLElement).getAttribute("role") !== "combobox"
            )
              markDirty(true);
          }}
        >
          {children(markDirty)}
        </div>
      </Modal>
      {discard && (
        <Modal
          title={tr("Discard unsaved changes?")}
          close={() => setDiscard(false)}
        >
          <div className="notice warning">
            <AlertTriangle size={20} aria-hidden="true" />
            <p>
              {tr(
                "Your changes have not been saved. Keep editing or discard them.",
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
