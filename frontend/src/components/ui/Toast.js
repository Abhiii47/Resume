import React, { useState, useEffect, useCallback, useRef } from "react";

/* ── Toast Store (singleton) ─────────────────────────────── */
let _listeners = [];
let _id = 0;

export const toast = {
  show: (message, type = "info", duration = 4000) => {
    const id = ++_id;
    _listeners.forEach(fn => fn({ id, message, type, duration }));
    return id;
  },
  success: (msg, dur) => toast.show(msg, "success", dur),
  error:   (msg, dur) => toast.show(msg, "error",   dur || 5000),
  warning: (msg, dur) => toast.show(msg, "warning", dur),
  info:    (msg, dur) => toast.show(msg, "info",    dur),
};

/* confirm() replacement — returns a Promise<boolean> */
export function confirm(message, confirmLabel = "Confirm", cancelLabel = "Cancel") {
  return new Promise(resolve => {
    const id = ++_id;
    _listeners.forEach(fn => fn({ id, message, type: "confirm", resolve, confirmLabel, cancelLabel }));
  });
}

/* ── colours per type ──────────────────────────────────────── */
const TYPE_STYLES = {
  success: { bg: "#16A34A", border: "#15803D", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )},
  error: { bg: "#DC2626", border: "#B91C1C", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )},
  warning: { bg: "hsl(24,100%,50%)", border: "#c2410c", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )},
  info: { bg: "#2563EB", border: "#1D4ED8", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  confirm: { bg: "#111", border: "#333", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
};

/* ── Single Toast item ─────────────────────────────────────── */
function ToastItem({ item, onRemove }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const s = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  useEffect(() => {
    // mount → slide in
    requestAnimationFrame(() => setVisible(true));
    if (item.type !== "confirm") {
      timerRef.current = setTimeout(() => dismiss(), item.duration);
    }
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(item.id), 300);
  };

  const handleConfirm = (val) => {
    item.resolve(val);
    dismiss();
  };

  return (
    <div
      style={{
        background: s.bg,
        border: `2px solid ${s.border}`,
        boxShadow: "4px 4px 0px #000",
        color: "#fff",
        minWidth: "280px",
        maxWidth: "420px",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.28s cubic-bezier(.22,1,.36,1), opacity 0.28s ease",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {s.icon}
        <p style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.4, fontFamily: "Inter, sans-serif" }}>
          {item.message}
        </p>
        {item.type !== "confirm" && (
          <button
            onClick={dismiss}
            style={{ marginLeft: "auto", opacity: 0.7, cursor: "pointer", background: "none", border: "none", color: "#fff", padding: 0 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {item.type === "confirm" && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleConfirm(true)}
            style={{
              flex: 1, padding: "6px 0", background: "#fff", color: "#111",
              border: "2px solid #000", fontWeight: 700, fontSize: "0.8rem",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            {item.confirmLabel}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            style={{
              flex: 1, padding: "6px 0", background: "transparent", color: "#fff",
              border: "2px solid rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.8rem",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            {item.cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Toast Container ───────────────────────────────────────── */
export function ToastContainer() {
  const [items, setItems] = useState([]);

  const addItem = useCallback((item) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  useEffect(() => {
    _listeners.push(addItem);
    return () => { _listeners = _listeners.filter(fn => fn !== addItem); };
  }, [addItem]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {items.map(item => (
        <div key={item.id} style={{ pointerEvents: "all" }}>
          <ToastItem item={item} onRemove={removeItem} />
        </div>
      ))}
    </div>
  );
}
