import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ENV } from "@/config/env";

type ToastType = "success" | "info" | "warn" | "error";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  timeout?: number; // ms
};

type NotifyFn = {
  (message: string, opts?: Partial<Toast>): void;
  success: (message: string, opts?: Partial<Toast>) => void;
  info: (message: string, opts?: Partial<Toast>) => void;
  warn: (message: string, opts?: Partial<Toast>) => void;
  error: (message: string, opts?: Partial<Toast>) => void;
};

const NotificationsContext = createContext<{ notify: NotifyFn } | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const DEFAULT_TTL = ENV.NOTIFICATION_TIMEOUT_MS;
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    const ttl = t.timeout ?? DEFAULT_TTL;
    if (ttl > 0) {
      setTimeout(() => remove(t.id), ttl);
    }
  }, [remove, DEFAULT_TTL]);

  const baseNotify = useCallback<NotifyFn>(
    ((message: string, opts?: Partial<Toast>) => {
      const id = Math.random().toString(36).slice(2);
      push({ id, type: opts?.type ?? "info", message, timeout: opts?.timeout });
    }) as NotifyFn,
    [push]
  );

  baseNotify.success = (message, opts) => baseNotify(message, { ...opts, type: "success" });
  baseNotify.info = (message, opts) => baseNotify(message, { ...opts, type: "info" });
  baseNotify.warn = (message, opts) => baseNotify(message, { ...opts, type: "warn" });
  baseNotify.error = (message, opts) => baseNotify(message, { ...opts, type: "error" });

  const value = useMemo(() => ({ notify: baseNotify }), [baseNotify]);

  // Register the global notifier for non-React modules
  React.useEffect(() => {
    setGlobalNotify(baseNotify);
  }, [baseNotify]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "max-w-sm w-[320px] rounded-lg shadow-lg ring-1 ring-black/5 px-4 py-3 text-sm",
              "bg-white flex items-start gap-3",
              t.type === "success" && "border-l-4 border-green-500",
              t.type === "info" && "border-l-4 border-blue-500",
              t.type === "warn" && "border-l-4 border-yellow-500",
              t.type === "error" && "border-l-4 border-red-500",
            ].filter(Boolean).join(" ")}
            role="status"
            aria-live="polite"
          >
            <span className={[
              "mt-0.5 inline-block w-2 h-2 rounded-full",
              t.type === "success" && "bg-green-500",
              t.type === "info" && "bg-blue-500",
              t.type === "warn" && "bg-yellow-500",
              t.type === "error" && "bg-red-500",
            ].filter(Boolean).join(" ")} />
            <div className="flex-1">{t.message}</div>
            <button
              className="text-text-muted hover:text-text-primary transition"
              onClick={() => remove(t.id)}
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotify must be used within NotificationsProvider");
  return ctx.notify;
}

// ===== Global notifier for non-React code (like apiClient.ts) =====
let globalNotify: NotifyFn | null = null;

export function setGlobalNotify(fn: NotifyFn) {
  globalNotify = fn;
}

export function notifyGlobal(type: ToastType, message: string, opts?: Partial<Toast>) {
  if (globalNotify) {
    globalNotify(message, { ...opts, type });
  } else {
    console.warn("notifyGlobal called before NotificationsProvider mounted");
  }
}
