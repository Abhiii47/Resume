import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── Icons ──────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  copilot:   "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  builder:   "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  workspace: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  tracker:   "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
  resources: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  logout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  menu:      "M4 6h16M4 12h16M4 18h16",
  close:     "M6 18L18 6M6 6l12 12",
};

const NAV_ITEMS = [
  { id: "copilot",   label: "Agent Team",     icon: "copilot",   desc: "Nova & 5 AI specialists" },
  { id: "overview",  label: "Overview",        icon: "overview",  desc: "Stats & Quick Actions" },
  { id: "builder",   label: "Resume Builder",  icon: "builder",   desc: "Create & Export PDF" },
  { id: "workspace", label: "Resume Lab",      icon: "workspace", desc: "Analyze & Fix Flaws" },
  { id: "tracker",   label: "Job Tracker",     icon: "tracker",   desc: "Discover & Match Jobs" },
  { id: "resources", label: "Learning Hub",    icon: "resources", desc: "DSA & System Design" },
];

function SidebarContent({ activeTab, setActiveTab, onLogout, onClose }) {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        className="sidebar-logo"
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && navigate("/")}
      >
        <div className="sidebar-logo-icon">SR</div>
        <div>
          <div className="sidebar-logo-name">SmartResume</div>
          <div className="sidebar-logo-sub">Career Hub</div>
        </div>
        {onClose && (
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: "var(--text-muted)", padding: 4,
            }}
            aria-label="Close menu"
          >
            <Icon d={ICONS.close} size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>

        {NAV_ITEMS.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item${active ? " active" : ""}`}
              onClick={() => {
                if (item.id === "builder") navigate("/builder");
                else setActiveTab(item.id);
                onClose?.();
              }}
              id={`sidebar-${item.id}`}
            >
              <span className="sidebar-item-icon">
                <Icon d={ICONS[item.icon]} size={15} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="sidebar-item-label">{item.label}</div>
                <div className="sidebar-item-desc">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={onLogout}
          id="sidebar-logout"
          style={{ color: "var(--color-error)" }}
        >
          <span className="sidebar-item-icon" style={{ color: "var(--color-error)" }}>
            <Icon d={ICONS.logout} size={15} />
          </span>
          <div className="sidebar-item-label" style={{ color: "var(--color-error)" }}>Log Out</div>
        </button>
      </div>
    </aside>
  );
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        id="sidebar-mobile-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          display: "none",
          position: "fixed", top: 14, left: 16, zIndex: 40,
          width: 40, height: 40,
          background: "#fff",
          border: "var(--border-brutal)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-brutal)",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-secondary)",
        }}
      >
        <Icon d={ICONS.menu} size={18} />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(28,25,23,0.35)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        display: "none",
        position: "fixed", top: 0, left: 0, zIndex: 40,
        height: "100%", width: 260,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: open ? "var(--shadow-brutal-xl)" : "none",
      }} className="sidebar-mobile-drawer">
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* Desktop */}
      <div className="sidebar-desktop">
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
        />
      </div>

      <style>{`
        .sidebar-desktop { display: flex; }
        .sidebar-mobile-drawer { display: none; }
        @media (max-width: 1024px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-drawer { display: block !important; }
          #sidebar-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
