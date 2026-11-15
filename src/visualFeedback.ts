import { flushSync } from "react-dom";
/** Optional browser transition; bookkeeping and persistence stay synchronous. */
export function visualFeedback(update: () => void) {
  if (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    typeof document.startViewTransition === "function"
  ) {
    document.startViewTransition(() => flushSync(update));
  } else update();
}
