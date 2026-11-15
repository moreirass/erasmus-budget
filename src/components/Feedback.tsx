import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { errorMessage, tr } from "../i18n";
export function Skeleton({ label }: { label: string }) {
  return (
    <span role="status" aria-label={label} className="skeleton">
      <span className="sr-only">{label}</span>
    </span>
  );
}
export function BusyButton({
  children,
  onClick,
  busyLabel = "Preparing download…",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  onClick: () => unknown;
  busyLabel?: string;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <>
      <button
        {...props}
        type={props.type ?? "button"}
        className={`busy-button ${props.className ?? ""}`}
        disabled={props.disabled || busy}
        aria-busy={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setMessage("");
          try {
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
            await onClick();
            setMessage(tr("Download requested"));
          } catch (error) {
            setMessage(errorMessage((error as Error).message));
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        <span style={{ visibility: busy ? "hidden" : "visible" }}>
          {children}
        </span>
        <span
          className="busy-label"
          style={{ visibility: busy ? "visible" : "hidden" }}
        >
          {tr(busyLabel)}
        </span>
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
