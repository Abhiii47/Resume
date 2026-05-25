import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = isAuthenticated();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { label: "How it Works", path: "/how-it-works" },
    { label: "Templates",    path: "/templates" },
    { label: "Resources",    path: "/resources" },
    { label: "About",        path: "/about" },
  ];

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`} role="navigation">
        <div className="navbar-inner">
          {/* Logo */}
          <div className="nav-logo" onClick={() => navigate("/")} role="link" tabIndex={0}
            onKeyDown={e => e.key === "Enter" && navigate("/")}>
            <div className="nav-logo-icon">SR</div>
            <span className="nav-logo-text">SmartResume</span>
          </div>

          {/* Desktop Links */}
          <ul className="nav-links" role="list">
            {links.map(link => (
              <li key={link.path}>
                <button
                  className={`nav-link${location.pathname === link.path ? " active" : ""}`}
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            {authed ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/dashboard")}
                id="navbar-dashboard-btn"
              >
                Dashboard →
              </button>
            ) : (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate("/login")}
                  id="navbar-login-btn"
                  style={{ display: "none" }}
                >
                  Log in
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate("/login")}
                  id="navbar-login-btn-desktop"
                >
                  Log in
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/signup")}
                  id="navbar-signup-btn"
                >
                  Get Started Free
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              id="navbar-mobile-menu-btn"
              style={{ display: "none" }}
            >
              {mobileOpen ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 98,
              background: "rgba(28,25,23,0.3)",
              backdropFilter: "blur(2px)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 64, left: 0, right: 0,
              zIndex: 99,
              background: "#fff",
              borderBottom: "var(--border-brutal)",
              padding: "16px 20px 24px",
              boxShadow: "var(--shadow-brutal-lg)",
              animation: "float-up-in 0.2s ease",
            }}
          >
            {links.map(link => (
              <button
                key={link.path}
                className={`nav-link${location.pathname === link.path ? " active" : ""}`}
                onClick={() => navigate(link.path)}
                style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 4, padding: "10px 14px" }}
              >
                {link.label}
              </button>
            ))}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {authed ? (
                <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard →
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => navigate("/login")}>
                    Log in
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate("/signup")}>
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed navbar */}
      <div style={{ height: 64 }} />

      <style>{`
        @media (max-width: 768px) {
          #navbar-login-btn-desktop { display: none !important; }
          #navbar-signup-btn { display: none !important; }
          #navbar-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
