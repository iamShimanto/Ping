import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persist
}

type Listener = (toasts: ToastItem[]) => void;

// ─── Internal store (no React state — works outside components) ───────────────

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function add(item: Omit<ToastItem, "id">): string {
  const id = genId();
  toasts = [{ ...item, id }, ...toasts];
  notify();
  return id;
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function update(id: string, patch: Partial<Omit<ToastItem, "id">>) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
  notify();
}

export const toast = {
  success: (message: string, title?: string, duration = 4000) =>
    add({ type: "success", message, title, duration }),
  error: (message: string, title?: string, duration = 5000) =>
    add({ type: "error", message, title, duration }),
  warning: (message: string, title?: string, duration = 4500) =>
    add({ type: "warning", message, title, duration }),
  info: (message: string, title?: string, duration = 4000) =>
    add({ type: "info", message, title, duration }),
  loading: (message: string, title?: string) =>
    add({ type: "loading", message, title, duration: 0 }),
  dismiss: remove,
  // Useful for async flows: show loading → resolve to success/error
  promise: async <T,>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string },
  ): Promise<T> => {
    const id = add({ type: "loading", message: msgs.loading, duration: 0 });
    try {
      const result = await promise;
      update(id, { type: "success", message: msgs.success, duration: 4000 });
      setTimeout(() => remove(id), 4000);
      return result;
    } catch (err) {
      update(id, { type: "error", message: msgs.error, duration: 5000 });
      setTimeout(() => remove(id), 5000);
      throw err;
    }
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
};

const styles: Record<ToastType, { bar: string; icon: string; iconBg: string }> = {
  success: {
    bar: "bg-emerald-500",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  error: {
    bar: "bg-red-500",
    icon: "text-red-600",
    iconBg: "bg-red-50",
  },
  warning: {
    bar: "bg-amber-400",
    icon: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  info: {
    bar: "bg-blue-500",
    icon: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  loading: {
    bar: "bg-gray-400",
    icon: "text-gray-500",
    iconBg: "bg-gray-50",
  },
};

// ─── Single toast item component ──────────────────────────────────────────────

const ToastCard: React.FC<{ item: ToastItem }> = ({ item }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => remove(item.id), 300);
  };

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true));

    if (item.duration && item.duration > 0) {
      timerRef.current = setTimeout(dismiss, item.duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.duration]);

  const s = styles[item.type];

  return (
    <div
      className={[
        "relative flex items-start gap-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-4 pr-10",
        "transition-all duration-300 ease-out",
        visible && !exiting
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8",
      ].join(" ")}
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${s.iconBg} ${s.icon} ml-1`}>
        {icons[item.type]}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        {item.title && (
          <p className="text-sm font-semibold text-gray-800 leading-tight">{item.title}</p>
        )}
        <p className={`text-sm text-gray-600 leading-snug ${item.title ? "mt-0.5" : ""}`}>
          {item.message}
        </p>
      </div>

      {/* Close button */}
      {item.type !== "loading" && (
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Progress bar (only for timed toasts) */}
      {item.duration && item.duration > 0 ? (
        <div
          className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-30`}
          style={{
            width: "100%",
            animation: `toast-shrink ${item.duration}ms linear forwards`,
          }}
        />
      ) : null}
    </div>
  );
};

// ─── Container ────────────────────────────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  return createPortal(
    <>
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} />
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
};
