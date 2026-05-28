import React, { useState } from "react";
import api from "../lib/api";

export default function SettingsTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      await api.post(
        "/auth/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        }
      );
      setSuccess("Password successfully changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-surface)", minHeight: "100%", padding: "32px 28px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            letterSpacing: "-0.03em", color: "var(--text-primary)",
            lineHeight: 1.2, marginBottom: 8,
          }}>
            Account Settings
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 500 }}>
            Manage your password, notifications, and security preferences.
          </p>
        </div>

        {/* Change Password Card */}
        <div style={{
          background: "#fff",
          border: "var(--border-brutal)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-brutal)",
          padding: "32px",
          marginBottom: 32,
        }}>
          <div className="section-label" style={{ marginBottom: 20 }}>
            <span className="section-label-text">Security</span>
          </div>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Change Password</h3>

          {success && (
            <div className="alert alert-success" style={{ marginBottom: 24 }}>
              {success}
            </div>
          )}
          
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "200px", justifyContent: "center" }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div style={{
          background: "#fffcfc",
          border: "2px solid #fecdd3",
          borderRadius: "var(--radius-sm)",
          padding: "32px",
        }}>
          <div className="section-label" style={{ marginBottom: 20 }}>
            <span className="section-label-text" style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}>Danger Zone</span>
          </div>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--color-error)" }}>Delete Account</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="btn" style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
