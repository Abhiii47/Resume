import React from "react";

// Simple passthrough layout — landing page now manages its own full layout
export default function AppLayout({ children, left, right }) {
  if (children) return <>{children}</>;
  // Legacy prop support
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <section>{left}</section>
      <section>{right}</section>
    </div>
  );
}
