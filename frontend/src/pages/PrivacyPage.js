import React from "react";
import Navbar from "../components/Navbar";
import { useScrollReveal } from "../utils";

export default function PrivacyPage() {
  useScrollReveal();

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
        <h1 className="text-display sr" style={{ marginBottom: 20 }}>Privacy Policy</h1>
        <div className="card sr sr-delay-1" style={{ padding: "32px", fontSize: "15px", lineHeight: "1.7", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: 16 }}><strong>Effective Date:</strong> May 2026</p>
          <p style={{ marginBottom: 24 }}>At SmartResume, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered resume analysis services.</p>
          
          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Information We Collect</h2>
          <p style={{ marginBottom: 16 }}><strong>Personal Data:</strong> We may collect personally identifiable information, such as your name, email address, and authentication credentials when you register for an account.</p>
          <p style={{ marginBottom: 16 }}><strong>Resume Data:</strong> When you upload a resume or input professional history, we process and store this data to provide AI-driven insights, formatting, and recommendations. This includes employment history, education, and skills.</p>
          <p style={{ marginBottom: 16 }}><strong>Usage Data:</strong> We automatically collect information about your interaction with our services, such as IP addresses, browser types, and usage patterns to improve our application.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>To provide, operate, and maintain our services.</li>
            <li style={{ marginBottom: "8px" }}>To analyze your resume using AI models and generate actionable feedback.</li>
            <li style={{ marginBottom: "8px" }}>To improve, personalize, and expand our services.</li>
            <li style={{ marginBottom: "8px" }}>To communicate with you, including sending product updates or password reset emails.</li>
            <li style={{ marginBottom: "8px" }}>To detect and prevent fraudulent or unauthorized activities.</li>
          </ul>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Third-Party AI Processing</h2>
          <p style={{ marginBottom: 16 }}>To provide advanced resume analysis and interview coaching, we utilize third-party Large Language Models (LLMs). Your resume text and prompts may be securely transmitted to these partners for processing. We ensure our LLM partners do not use your personal data to train their public models.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Data Security</h2>
          <p style={{ marginBottom: 16 }}>We implement industry-standard security measures, including HTTPS encryption and secure password hashing, to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Your Privacy Rights</h2>
          <p style={{ marginBottom: 16 }}>Depending on your location, you may have the right to access, update, or delete your personal information. You can manage your profile settings within the dashboard or contact us directly to request the deletion of your account and associated resume data.</p>
          
          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Contact Us</h2>
          <p style={{ marginBottom: 16 }}>If you have questions or comments about this Privacy Policy, please contact us at privacy@smartresume.com.</p>
        </div>
      </div>
    </div>
  );
}
