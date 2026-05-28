import React, { useState, useEffect } from "react";
import api from "../lib/api";

export default function ProfileTab() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    headline: "",
    avatar_url: "",
    education: { university: "", degree: "", graduation_year: "" },
    skills: "",
    target_role: "",
    experience_level: "Entry-level (0-2 years)",
    github_url: "",
    portfolio_url: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/profile");
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        headline: data.headline || "",
        avatar_url: data.avatar_url || "",
        education: data.education || { university: "", degree: "", graduation_year: "" },
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        target_role: data.target_role || "",
        experience_level: data.experience_level || "Entry-level (0-2 years)",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      });
    } catch (err) {
      if (err.response?.status !== 404) {
        setError("Failed to load profile details.");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["university", "degree", "graduation_year"].includes(name)) {
      setFormData(prev => ({ ...prev, education: { ...prev.education, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const skillsArray = formData.skills
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        ...formData,
        skills: skillsArray
      };

      await api.post("/profile", payload);
      setSuccess("Profile updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyItems: "center", padding: 60, width: "100%", justifyContent: "center" }}>
        <div className="loading-dots">
          <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
        </div>
      </div>
    );
  }

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
            My Profile
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 500 }}>
            Update your professional details to personalize your AI career agent's advice and resume suggestions.
          </p>
        </div>

        {/* Form Container */}
        <div style={{
          background: "#fff",
          border: "var(--border-brutal)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-brutal)",
          padding: "32px",
        }}>
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

          <form onSubmit={handleSubmit}>
            
            <div className="section-label" style={{ marginBottom: 20 }}>
              <span className="section-label-text">The Basics</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">First Name</label>
                <input required name="first_name" value={formData.first_name} onChange={handleChange} className="input-field" placeholder="Jane" />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input required name="last_name" value={formData.last_name} onChange={handleChange} className="input-field" placeholder="Doe" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Professional Headline</label>
              <input required name="headline" value={formData.headline} onChange={handleChange} className="input-field" placeholder="e.g. Computer Science Student at MIT" />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label className="input-label">Avatar URL (Optional)</label>
              <input name="avatar_url" value={formData.avatar_url} onChange={handleChange} className="input-field" placeholder="https://example.com/avatar.png" />
            </div>

            <div className="section-label" style={{ marginBottom: 20 }}>
              <span className="section-label-text">Education</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">University / College</label>
              <input required name="university" value={formData.education.university} onChange={handleChange} className="input-field" placeholder="e.g. Stanford University" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 32 }}>
              <div>
                <label className="input-label">Degree & Major</label>
                <input required name="degree" value={formData.education.degree} onChange={handleChange} className="input-field" placeholder="e.g. B.S. Computer Science" />
              </div>
              <div>
                <label className="input-label">Graduation Year</label>
                <input required name="graduation_year" type="number" min="1950" max="2035" value={formData.education.graduation_year} onChange={handleChange} className="input-field" placeholder="e.g. 2025" />
              </div>
            </div>

            <div className="section-label" style={{ marginBottom: 20 }}>
              <span className="section-label-text">Skills & Goals</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="input-label">Target Role</label>
                <input required name="target_role" value={formData.target_role} onChange={handleChange} className="input-field" placeholder="e.g. Frontend Engineer" />
              </div>
              <div>
                <label className="input-label">Experience Level</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange} className="input-field">
                  <option>Student / Internship</option>
                  <option>Entry-level (0-2 years)</option>
                  <option>Mid-level (2-5 years)</option>
                  <option>Senior (5+ years)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label className="input-label">Top Skills (Comma Separated)</label>
              <textarea required name="skills" value={formData.skills} onChange={handleChange} className="input-field" style={{ minHeight: 80, resize: "vertical" }} placeholder="e.g. React, Python, PostgreSQL, Data Structures" />
            </div>

            <div className="section-label" style={{ marginBottom: 20 }}>
              <span className="section-label-text">Links</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <div>
                <label className="input-label">GitHub URL (Optional)</label>
                <input name="github_url" type="url" value={formData.github_url} onChange={handleChange} className="input-field" placeholder="https://github.com/username" />
              </div>
              <div>
                <label className="input-label">Portfolio / LinkedIn (Optional)</label>
                <input name="portfolio_url" type="url" value={formData.portfolio_url} onChange={handleChange} className="input-field" placeholder="https://linkedin.com/in/username" />
              </div>
            </div>

            <div className="divider" style={{ margin: "24px 0" }} />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "200px", justifyContent: "center" }}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
