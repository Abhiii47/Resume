import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import SignupPage from "./pages/SignupPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import ResumeBuilderPage from "./pages/ResumeBuilderPage.js";
import LandingPage from "./pages/LandingPage.js";
import AboutPage from "./pages/AboutPage.js";
import ResourcesPage from "./pages/ResourcesPage.js";
import HowItWorksPage from "./pages/HowItWorksPage.js";
import TemplatesPage from "./pages/TemplatesPage.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import { isAuthenticated } from "./utils";

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Simple component for when the app is mistakenly loaded in an iframe
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
                <ResumeBuilderPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
