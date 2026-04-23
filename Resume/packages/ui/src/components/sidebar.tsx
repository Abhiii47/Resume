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

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
} & React.ComponentProps<"div">) => {
  const { setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "sticky top-0 h-screen px-4 py-6 flex flex-col bg-[var(--bg-subtle)] border-r border-[var(--border)] w-[260px] min-w-[260px] flex-shrink-0 z-40 shadow-[18px_0_60px_rgba(0,0,0,0.28)]",
        className,
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = () => {
  // Mobile sidebar is disabled for now to focus on PC visibility
  return null;
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  ...props
}: {
  link: { label: string; href: string; icon: React.ReactNode };
  className?: string;
  isActive?: boolean;
  props?: React.ComponentProps<typeof Link>;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mb-1 overflow-hidden",
        isActive
          ? "bg-white/[0.085] text-[var(--fg)] shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.045]",
        className,
      )}
      {...(props as any)}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg border border-white/[0.08] bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-rail"
          className="absolute left-0 z-10 h-5 w-1 rounded-r-full bg-white"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <div
        className={cn(
          "relative z-10 transition-transform duration-300 group-hover:scale-110",
          isActive
            ? "text-[var(--fg)]"
            : "text-[var(--fg-muted)] group-hover:text-[var(--fg)]",
        )}
      >
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="relative z-10 text-sm font-medium whitespace-pre"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
