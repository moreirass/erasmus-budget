import { visualFeedback } from "../visualFeedback";
import { AlertCircle, X } from "lucide-react";
import { useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { tr } from "../i18n";

export function Modal({
  title,
  children,
  close,
  transactionSheet = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  transactionSheet?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current!;
    const field = dialog.querySelector<HTMLInputElement>(
      "[data-dialog-autofocus]",
    );
    field?.setAttribute("autofocus", "");
    dialog.showModal();
    if (field && document.activeElement !== field)
      field.focus({ preventScroll: true });

    const restoreFocus = () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
    const viewport = window.visualViewport;
    if (!transactionSheet || !viewport) return restoreFocus;
    const placeSheet = () => {
      if (viewport.scale !== 1) return;
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      dialog.style.setProperty(
        "--sheet-viewport-height",
        `${viewport.height}px`,
      );
      dialog.style.setProperty("--sheet-bottom-inset", `${inset}px`);
    };
    placeSheet();
    viewport.addEventListener("resize", placeSheet);
    viewport.addEventListener("scroll", placeSheet);
    return () => {
      viewport.removeEventListener("resize", placeSheet);
      viewport.removeEventListener("scroll", placeSheet);
      restoreFocus();
    };
  }, [transactionSheet]);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        visualFeedback(close);
      }}
      aria-labelledby={titleId}
      className={transactionSheet ? "transaction-sheet" : undefined}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={() => visualFeedback(close)}
          aria-label={tr("Close")}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true">
        ↗
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      <AlertCircle size={20} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
