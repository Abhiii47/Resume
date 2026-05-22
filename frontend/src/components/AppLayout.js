import React from "react";

export default function AppLayout({ left, right }) {
  return (
    <div className="app-shell">
      <section className="hero-copy">{left}</section>
      <section className="hero-preview">
        <div className="hero-orbit" />
        <div className="hero-preview-card">{right}</div>
      </section>
    </div>
  );
}
