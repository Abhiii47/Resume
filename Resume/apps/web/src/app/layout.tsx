import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "CareerAI - AI-Powered Career Platform",
  description:
    "Optimize your resume, land more interviews, and build your career roadmap with Gemini-powered AI analysis. The elite toolkit for modern engineers.",
  keywords: ["AI Resume", "Career Coaching", "ATS Optimization", "Interview Prep", "Job Matching"],
  authors: [{ name: "CareerAI Team" }],
  openGraph: {
    title: "CareerAI - AI-Powered Career Platform",
    description: "Land your dream role 3x faster with AI-powered career transformation.",
    url: "https://careerai.app",
    siteName: "CareerAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerAI - AI-Powered Career Platform",
    description: "Land your dream role 3x faster with AI-powered career transformation.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
