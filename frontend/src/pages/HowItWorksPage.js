import React from "react";
import { useNavigate } from "react-router-dom";

export default function HowItWorksPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-black p-10 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black uppercase mb-4">How It Works</h1>
      <p className="max-w-2xl text-center text-lg font-medium mb-8">
        Deep dive into our keyword matching and LLM-powered scoring algorithm.
      </p>
      <button onClick={() => navigate("/")} className="neu-btn-primary px-8 py-3">← Back to Home</button>
    </div>
  );
}
