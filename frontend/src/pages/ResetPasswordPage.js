import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { updateMetaTags } from "../utils";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({ title: "Set New Password — SmartResume" });
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password. The link might have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page grid-lines">
      <div className="auth-bg-blob auth-bg-blob-1" />
      <div className="auth-bg-blob auth-bg-blob-2" />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div className="nav-logo-icon">SR</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>SmartResume</span>
          </div>

          <div className="auth-card">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 6 }}>
                Set New Password
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Choose a strong, unique password for your account.
              </p>
            </div>

            {success ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  Password has been reset successfully! You can now log in with your new password.
                </div>
                <button onClick={() => navigate("/login")} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field"
                    disabled={!token}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field"
                    disabled={!token}
                  />
                </div>

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: 20 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !token} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 46 }}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
