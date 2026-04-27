"use client";

import React, { useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "../lib/utils";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof motion.div>) => {
  const { setOpen, open, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "sticky top-0 h-screen px-4 py-6 flex flex-col bg-[var(--bg-subtle)] border-r border-[var(--border)] flex-shrink-0 z-40 shadow-[18px_0_60px_rgba(0,0,0,0.28)]",
        className,
      )}
      animate={{
        width: animate ? (open ? "260px" : "80px") : "260px",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = (_props: React.ComponentProps<typeof motion.div>) => {
  // Mobile sidebar is disabled for now to focus on PC visibility
  return null;
};

interface SidebarLinkProps extends Omit<
  React.ComponentProps<typeof Link>,
  "href" | "className"
> {
  link: { label: string; href: string; icon: React.ReactNode };
  className?: string;
  isActive?: boolean;
}

export const SidebarLink = ({
  link,
  className,
  isActive,
  ...rest
}: SidebarLinkProps) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-1.5 overflow-hidden",
        isActive
          ? "text-[var(--fg)] shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.045]",
        className,
      )}
      {...rest}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl border border-white/[0.12] bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-glow"
          className="absolute inset-0 bg-white/[0.02] blur-xl"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-rail"
          className="absolute left-0 z-20 h-5 w-1 rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <div
        className={cn(
          "relative z-10 transition-all duration-300 group-hover:scale-110 flex-shrink-0",
          isActive
            ? "text-[var(--fg)]"
            : "text-[var(--fg-muted)] group-hover:text-[var(--fg)]",
        )}
      >
        {link.icon}
      </div>
      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          x: animate ? (open ? 0 : -10) : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          "relative z-10 text-sm font-medium whitespace-pre",
          !open && animate && "pointer-events-none",
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
