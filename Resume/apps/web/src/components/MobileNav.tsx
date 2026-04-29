"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@repo/ui";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const linkVariants = {
    closed: { opacity: 0, x: 20 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + i * 0.1,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  const links = [
    { label: "FEATURES", href: "#features" },
    { label: "PRICING", href: "#pricing" },
    { label: "LOG_IN", href: "/login" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-[var(--bg)]/80 backdrop-blur-md"
          />

          {/* Menu Panel */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 bottom-0 z-[120] w-[85%] max-w-sm bg-[var(--bg)] border-l-4 border-[var(--fg)] flex flex-col p-10"
          >
            <div className="flex items-center justify-between mb-20">
              <span className="index-label bg-[var(--fg)] text-[var(--bg)] px-3 py-1">
                [ MENU_SYSTEM ]
              </span>
              <button
                onClick={onClose}
                className="h-12 w-12 border-2 border-[var(--fg)] flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-8 flex-1">
              {links.map((link, i) => (
                <motion.div
                  key={link.label}
                  custom={i}
                  variants={linkVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="text-4xl font-black tracking-tighter uppercase italic hover:line-through transition-all"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-auto"
            >
              <Link
                href="/signup"
                onClick={onClose}
                className="btn-primary w-full py-6 text-xl flex items-center justify-between px-8"
              >
                START_FREE
                <ArrowRight className="h-6 w-6" />
              </Link>
              
              <div className="mt-8 flex items-center gap-4 opacity-40 index-label text-[10px]">
                <div className="h-px flex-1 bg-[var(--fg)]" />
                SYSTEM_ID: v2.0.4
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
