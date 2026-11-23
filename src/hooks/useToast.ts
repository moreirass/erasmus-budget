import { visualFeedback } from "../visualFeedback";
import { useCallback, useEffect, useState } from "react";
export function useToast() {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const setToast = useCallback((message: string) => {
    setNotice(message ? { message } : null);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => visualFeedback(() => setNotice(null)), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return { toast: notice?.message ?? "", setToast };
}
