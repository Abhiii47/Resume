import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import SignupPage from "./pages/SignupPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import LandingPage from "./pages/LandingPage.js";
import AboutPage from "./pages/AboutPage.js";
import ResourcesPage from "./pages/ResourcesPage.js";
import HowItWorksPage from "./pages/HowItWorksPage.js";
import TemplatesPage from "./pages/TemplatesPage.js";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js";
import ResetPasswordPage from "./pages/ResetPasswordPage.js";
import PrivacyPage from "./pages/PrivacyPage.js";
import TermsPage from "./pages/TermsPage.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import { isAuthenticated } from "./utils";

// Lazy-load the heavy ResumeBuilder (≈100 KB) — only downloaded on /builder
const ResumeBuilderPage = lazy(() => import("./pages/ResumeBuilderPage.js"));

// ── Protected Route — preserves the intended destination after login ──────────
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  return children;
};

// ── 404 Page ─────────────────────────────────────────────────────────────────
const NotFoundPage = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page, #fafaf9)",
      fontFamily: "var(--font-display, sans-serif)",
      gap: 24,
      padding: 32,
    }}
  >
    <div
      style={{
        fontSize: "6rem",
        fontWeight: 900,
        lineHeight: 1,
        color: "var(--text-primary, #1c1917)",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      404
    </div>
    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary, #1c1917)" }}>
      Page not found
    </h1>
    <p style={{ color: "var(--text-secondary, #78716c)", fontSize: 15 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <a
      href="/"
      className="btn btn-primary"
      style={{
        textDecoration: "none",
        padding: "12px 28px",
        fontWeight: 800,
        background: "var(--accent, #d97706)",
        color: "#fff",
        border: "2px solid #1c1917",
        boxShadow: "3px 3px 0 #1c1917",
        display: "inline-block",
      }}
    >
      Back to Home →
    </a>
  </div>
);

// ── Simple component for when the app is mistakenly loaded in an iframe ───────
const IframeFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-400 font-mono text-xs">
    [BLOCKED_IFRAME_CONTEXT]
  </div>
);

export default function App() {
  let isIframe = false;
  try {
    isIframe = window.self !== window.top;
  } catch (e) /* eslint-disable-line no-unused-vars */ {
    // Cross-origin throws DOMException, meaning it is an iframe
    isIframe = true;
  }

  if (isIframe) {
    return <IframeFallback />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={
                    <div
                      style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--bg-page, #fafaf9)",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 700,
                        color: "var(--text-secondary, #78716c)",
                        fontSize: 14,
                      }}
                    >
                      Loading Resume Builder…
                    </div>
                  }
                >
                  <ResumeBuilderPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
