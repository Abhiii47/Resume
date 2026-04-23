"use client";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import React from "react";

export function BackgroundLines({
  children,
  className,
  lineCount = 8,
}: {
  children: React.ReactNode;
  className?: string;
  lineCount?: number;
}) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const y = ((i + 1) / (lineCount + 1)) * 100;
          const delay = i * 0.3;
          return (
            <motion.path
              key={i}
              d={`M -10 ${y} Q 25 ${y - 6}, 50 ${y} T 110 ${y}`}
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 3 + i * 0.4, delay, ease: "easeInOut" },
                opacity: { duration: 0.5, delay },
              }}
            />
          );
        })}
      </svg>
      {children}
    </div>
  );
}
