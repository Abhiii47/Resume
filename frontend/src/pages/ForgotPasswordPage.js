import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { updateMetaTags } from "../utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({ title: "Forgot Password — SmartResume" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.msg);
    } catch (err) {
      setMessage("If your email is registered, you will receive a reset link shortly.");
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
                Reset Password
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {message ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  {message}
                </div>
                <button onClick={() => navigate("/login")} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 46 }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                
                <button type="button" onClick={() => navigate("/login")} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
