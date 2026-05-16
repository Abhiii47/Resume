import React from "react";
import { useNavigate } from "react-router-dom";

export default function ResourcesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-black p-10 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black uppercase mb-4">Resources Hub</h1>
      <p className="max-w-2xl text-center text-lg font-medium mb-8">
        (CMS integration pending) Guides, ATS tips, and career roadmaps.
      </p>
      <button onClick={() => navigate("/")} className="neu-btn-primary px-8 py-3">← Back to Home</button>
    </div>
  );
}
