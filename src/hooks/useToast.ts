import { useState, useCallback } from "react";

export function useToast(defaultDuration = 4000) {
  const [message, setMessage] = useState("");

  const showToast = useCallback((msg: string, duration = defaultDuration) => {
    setMessage(msg);
    if (duration > 0) {
      setTimeout(() => setMessage(""), duration);
    }
  }, [defaultDuration]);

  const showSuccess = useCallback((msg: string, duration?: number) => {
    showToast(`✅ ${msg}`, duration);
  }, [showToast]);

  const showError = useCallback((msg: string, duration?: number) => {
    showToast(`❌ ${msg}`, duration);
  }, [showToast]);

  const clearToast = useCallback(() => {
    setMessage("");
  }, []);

  return {
    message,
    showToast,
    showSuccess,
    showError,
    clearToast
  };
}
