"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10 flex items-center justify-center">
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
        ) : (
          <Moon className="h-4 w-4 text-zinc-500 group-hover:text-black transition-colors" />
        )}
      </div>
      
      {/* Visual Feedback - Blueprint style */}
      <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    </button>
  );
}
