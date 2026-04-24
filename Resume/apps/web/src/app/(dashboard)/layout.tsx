"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui";
import {
  Brain,
  Map,
  FileText,
  Briefcase,
  FileCheck,
  Settings,
  Zap,
  Sparkles,
  Crown,
  CreditCard,
} from "lucide-react";
import { useSession, signOut } from "@repo/core/client";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Zap },
  { title: "Resumes", href: "/dashboard/resume", icon: FileText },
  { title: "Analysis", href: "/dashboard/analysis", icon: Brain },
  { title: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { title: "Applications", href: "/dashboard/applications", icon: FileCheck },
  { title: "Roadmap", href: "/dashboard/roadmap", icon: Map },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const planConfig = {
  FREE: {
    label: "Basic",
    icon: Zap,
    className: "bg-white/5 text-zinc-500 border-white/5",
  },
  EARLY_BIRD: {
    label: "Early Bird",
    icon: Sparkles,
    className: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  PREMIUM: {
    label: "Elite",
    icon: Crown,
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
};

function PlanBadge({ plan }: { plan: "FREE" | "EARLY_BIRD" | "PREMIUM" }) {
  const config = planConfig[plan] ?? planConfig.FREE;
  return (
    <span
      className="index-label text-[8px] border border-white/10 px-1.5 py-0.5 rounded-sm bg-white/5"
    >
      {config.label}
    </span>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(true);

  // Fetch billing to show plan badge — cached by SWR
  const { data: billingData } = useSWR("/api/billing");
  const plan: "FREE" | "EARLY_BIRD" | "PREMIUM" = billingData?.billing?.plan ?? "FREE";

  return (
    <Sidebar open={open} setOpen={setOpen} animate={false}>
      <SidebarBody className="w-64 border-r border-[var(--border)] p-0 bg-[var(--bg-subtle)]/80 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-white flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-black fill-black" />
            </div>
            <span className="font-black text-lg text-[var(--fg)] tracking-tighter italic uppercase">
              CareerAI
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <SidebarLink
                key={item.href}
                link={{
                  label: `${(idx + 1).toString().padStart(2, '0')} / ${item.title.toUpperCase()}`,
                  href: item.href,
                  icon: <item.icon className="h-3.5 w-3.5" />,
                }}
                className={isActive ? "text-[var(--fg)]" : "index-label hover:text-[var(--fg)] transition-colors"}
                isActive={isActive}
              />
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-6 border-t border-white/5">
          <div className="p-4 bg-white/[0.02] blueprint-border group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8 rounded-none border border-white/10">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-500 font-mono">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="index-label text-white truncate leading-none mb-1">
                  {session?.user?.name || "User"}
                </p>
                <PlanBadge plan={plan} />
              </div>
            <div className="flex items-center justify-between gap-3 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                }}
                className="h-8 w-8 p-0 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--border-muted)] rounded-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7"
                  />
                </svg>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SWRConfig value={{ fetcher }}>
      <div className="flex min-h-screen bg-[var(--bg)] selection:bg-[var(--fg)] selection:text-[var(--bg)] font-sans">
        <SidebarContent />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[var(--bg)] relative">
          <div className="pointer-events-none fixed inset-y-0 right-0 w-px bg-[var(--border)]" />
          <div className="pointer-events-none absolute inset-0 bg-dot opacity-[0.05]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[size:100px_100px]" />

          <div className="px-5 py-6 md:px-8 lg:px-10 max-w-7xl mx-auto min-h-full relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="page-enter"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SWRConfig>
  );
}
