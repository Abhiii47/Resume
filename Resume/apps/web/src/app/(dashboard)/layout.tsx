"use client";

import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";
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
  cn,
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
  Activity,
} from "lucide-react";
import { useSession, signOut } from "@repo/core/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { useEffect } from "react"; // Removed duplicate useSession import

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
  { title: "Diagnostic", href: "/dashboard/diagnostic", icon: Activity },
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
    className: "bg-[var(--fg)] text-[var(--bg)] border-[var(--border)]",
  },
  PREMIUM: {
    label: "Elite",
    icon: Crown,
    className: "bg-[var(--fg)] text-[var(--bg)] border-[var(--border)]",
  },
};

function PlanBadge({ plan }: { plan: "FREE" | "EARLY_BIRD" | "PREMIUM" }) {
  const config = planConfig[plan] ?? planConfig.FREE;
  return (
    <span
      className="index-label text-[8px] border border-[var(--border)] px-1.5 py-0.5 rounded-sm bg-[var(--bg-muted)] text-[var(--fg)]"
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
      <SidebarBody className="w-64 border-r border-[var(--border)] p-0 bg-[var(--bg)]/80 backdrop-blur-3xl">
        <div className="p-8 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[var(--fg)] border-2 border-[var(--fg)] flex items-center justify-center shadow-[4px_4px_0_0_var(--accent)]">
              <Zap className="h-6 w-6 text-[var(--bg)] fill-[var(--bg)]" />
            </div>
            <span className="font-black text-xl text-[var(--fg)] tracking-tighter italic uppercase">
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
                  label: item.title,
                  href: item.href,
                  icon: <item.icon className={cn("h-5 w-5", isActive ? "text-[var(--bg)]" : "text-[var(--fg-muted)]")} />,
                }}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-all duration-200 border-2 border-transparent",
                  isActive 
                    ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] shadow-[6px_6px_0_0_var(--accent)]" 
                    : "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] hover:border-[var(--fg)]"
                )}
              />
            );
          })}
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-[var(--border)] space-y-4">
          <div className="p-6 bg-[var(--bg)] border-2 border-[var(--fg)] group transition-all offset-card shadow-none">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-[var(--fg)] shadow-[4px_4px_0_0_var(--fg-subtle)]">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-[var(--fg)] text-sm text-[var(--bg)] font-black">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[var(--fg)] truncate leading-none mb-1.5">
                  {session?.user?.name || "User"}
                </p>
                <PlanBadge plan={plan} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="h-4 w-px bg-[var(--border)]" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                  }}
                  className="h-8 px-2 text-[var(--fg-muted)] hover:text-red-500 hover:bg-red-500/5 transition-colors text-[10px] font-black uppercase italic"
                >
                  Terminate
                </Button>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[9px] font-mono text-[var(--fg-subtle)] uppercase">Core_v2.0.4</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-500 uppercase">Operational</span>
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
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login');
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="relative h-12 w-12 border-4 border-[var(--fg)] flex items-center justify-center">
           <div className="absolute inset-0 border-t-4 border-[var(--accent)] animate-spin" />
           <Zap className="h-5 w-5 text-[var(--fg)]" />
        </div>
      </div>
    );
  }

  const pathname = usePathname();

  return (
    <SWRConfig value={{ fetcher }}>
      <div className="flex min-h-screen bg-[var(--bg)] selection:bg-[var(--accent)] selection:text-[var(--bg)] font-sans">
        <SidebarContent />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[var(--bg)] relative">
          {/* Professional Page Grain / Grid Overlay */}
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] grayscale invert dark:invert-0 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="px-6 py-8 md:px-12 lg:px-16 max-w-7xl mx-auto min-h-full relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="page-enter"
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin h-8 w-8 border-4 border-[var(--fg)] border-t-[var(--accent)]" />
                  </div>
                }>
                  {children}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SWRConfig>
  );
}
