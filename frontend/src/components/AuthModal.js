import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { gsap } from "gsap";
import { API_BASE, setAuthToken } from "../utils";

export default function AuthModal({ isOpen, onClose, initialView = "login" }) {
    const [view, setView] = useState(initialView);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const overlayRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            if (overlayRef.current && modalRef.current) {
                gsap.set(overlayRef.current, { opacity: 0 });
                gsap.set(modalRef.current, { y: 24, opacity: 0, scale: 0.96 });
                gsap.to(overlayRef.current, { opacity: 1, duration: 0.25, ease: "power2.out" });
                gsap.to(modalRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)", delay: 0.05 });
            }
        }
    }, [isOpen]);

    const handleClose = () => {
        if (overlayRef.current && modalRef.current) {
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, ease: "power2.in" });
            gsap.to(modalRef.current, { y: 12, opacity: 0, scale: 0.97, duration: 0.18, ease: "power2.in", onComplete: onClose });
        } else { onClose(); }
    };

    useEffect(() => {
        setView(initialView); setError(""); setEmail(""); setPassword(""); setUsername("");
    }, [initialView, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            if (view === "login") {
                const params = new URLSearchParams();
                params.append("username", email); params.append("password", password);
                const { data } = await axios.post(`${API_BASE}/login`, params, {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });
                setAuthToken(data.access_token); navigate("/dashboard"); handleClose();
            } else {
                const fd = new FormData();
                fd.append("email", email); fd.append("username", username); fd.append("password", password);
                const { data } = await axios.post(`${API_BASE}/signup`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (data.success) {
                    const params = new URLSearchParams();
                    params.append("username", email); params.append("password", password);
                    const { data: ld } = await axios.post(`${API_BASE}/login`, params, {
                        headers: { "Content-Type": "application/x-www-form-urlencoded" }
                    });
                    setAuthToken(ld.access_token); navigate("/dashboard"); handleClose();
                }
            }
        } catch (err) {
            const d = err?.response?.data?.detail;
            setError(typeof d === "string" ? d : "Authentication failed. Please try again.");
            if (modalRef.current) {
                gsap.fromTo(modalRef.current, { x: -6 },
                    { x: 6, duration: 0.06, repeat: 5, yoyo: true, ease: "sine.inOut", onComplete: () => gsap.set(modalRef.current, { x: 0 }) }
                );
            }
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
            {/* Backdrop */}
            <div
                ref={overlayRef}
                style={{
                    position: "absolute", inset: 0,
                    background: "rgba(28,25,23,0.35)",
                    backdropFilter: "blur(2px)",
                    WebkitBackdropFilter: "blur(2px)",
                }}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="modal-card"
                style={{ position: "relative", zIndex: 1 }}
            >
                {/* Close */}
                <button
                    onClick={handleClose}
                    id="auth-modal-close"
                    style={{
                        position: "absolute", top: 16, right: 16,
                        width: 28, height: 28, borderRadius: "var(--radius-sm)",
                        background: "var(--bg-surface)",
                        border: "var(--border-brutal)",
                        boxShadow: "2px 2px 0px var(--text-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "var(--text-primary)",
                        fontSize: 12,
                    }}
                >✕</button>

                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                    <div className="nav-logo-icon" style={{ width: 30, height: 30, fontSize: 11 }}>SR</div>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text-primary)" }}>SmartResume</span>
                </div>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{
                        fontFamily: "var(--font-display)", fontWeight: 800,
                        fontSize: "1.4rem", letterSpacing: "-0.03em",
                        color: "var(--text-primary)", marginBottom: 4,
                    }}>
                        {view === "login" ? "Welcome back" : "Create an account"}
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {view === "login"
                            ? "Enter your credentials to sign in"
                            : "Fill in the details below to get started"}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {view === "signup" && (
                        <div style={{ marginBottom: 14 }}>
                            <label className="input-label">Username</label>
                            <input
                                id="modal-username"
                                type="text" value={username}
                                onChange={e => setUsername(e.target.value)}
                                required className="input-field"
                                placeholder="johndoe"
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                        <label className="input-label">Email</label>
                        <input
                            id="modal-email"
                            type="email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            required className="input-field"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label className="input-label">Password</label>
                        <input
                            id="modal-password"
                            type="password" value={password}
                            onChange={e => setPassword(e.target.value)}
                            required minLength={6}
                            className="input-field"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <button
                        id="modal-submit-btn"
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 14 }}
                    >
                        {loading ? "Loading…" : view === "login" ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="divider" style={{ margin: "20px 0 16px" }} />
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                    {view === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setView(view === "login" ? "signup" : "login")}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--accent)", fontWeight: 700, fontSize: 13,
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        {view === "login" ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </div>
    );
}
