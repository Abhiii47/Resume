import React from "react";
import Navbar from "../components/Navbar";
import { useScrollReveal } from "../utils";

export default function TermsPage() {
  useScrollReveal();

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
        <h1 className="text-display sr" style={{ marginBottom: 20 }}>Terms of Service</h1>
        <div className="card sr sr-delay-1" style={{ padding: "32px", fontSize: "15px", lineHeight: "1.7", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: 16 }}><strong>Effective Date:</strong> May 2026</p>
          <p style={{ marginBottom: 24 }}>Welcome to SmartResume. By accessing or using our website and services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>
          
          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Agreement to Terms</h2>
          <p style={{ marginBottom: 16 }}>These Terms of Service constitute a legally binding agreement made between you and SmartResume concerning your access to and use of our platform. If you do not agree with all of these terms, you are prohibited from using the service.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. User Accounts</h2>
          <p style={{ marginBottom: 16 }}>To access certain features, you must register for an account. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine it is inappropriate or objectionable.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. AI Generation and Content</h2>
          <p style={{ marginBottom: 16 }}>SmartResume utilizes artificial intelligence to generate resume feedback, cover letters, and interview tips. While we strive for high quality, we do not guarantee the accuracy, reliability, or completeness of AI-generated content. You are solely responsible for reviewing and verifying any content before using it in professional applications.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Prohibited Activities</h2>
          <p style={{ marginBottom: 16 }}>You may not access or use the service for any purpose other than that for which we make the service available. Prohibited activities include attempting to bypass security measures, scraping or data mining, uploading malicious software, or using the service to generate illegal or harmful content.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Intellectual Property</h2>
          <p style={{ marginBottom: 16 }}>The platform, including its original code, designs, and functionality, are owned by SmartResume and are protected by copyright and trademark laws. You retain full ownership of the resume data and original content you upload to the platform.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Limitation of Liability</h2>
          <p style={{ marginBottom: 16 }}>SmartResume and its affiliates shall not be liable for any indirect, consequential, or incidental damages arising from your use of the platform, including but not limited to loss of employment opportunities resulting from AI feedback or service downtime.</p>

          <h2 style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>7. Modifications</h2>
          <p style={{ marginBottom: 16 }}>We may update these Terms from time to time. The updated version will be indicated by a new "Effective Date," and the revised Terms will be effective immediately. Your continued use of the platform represents your acceptance of the changes.</p>
        </div>
      </div>
    </div>
  );
}
