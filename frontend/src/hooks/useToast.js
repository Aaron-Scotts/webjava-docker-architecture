import { useCallback, useState } from "react";

export function useToast(timeoutMs = 3200) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, variant = "success") => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, timeoutMs);
  }, [timeoutMs]);

  return { toasts, showToast };
}
