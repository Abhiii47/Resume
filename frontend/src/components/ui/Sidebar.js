import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const BookIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export const KanbanIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

export const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const menuItems = [
  { id: 'overview',  label: 'Overview',      icon: HomeIcon,     desc: 'Command Center' },
  { id: 'builder',   label: 'Resume Builder',icon: DocumentIcon, desc: 'Create & Export' },
  { id: 'workspace', label: 'Resume Lab',    icon: SparklesIcon, desc: 'Analyze & Improve' },
  { id: 'tracker',   label: 'Job Tracker',   icon: KanbanIcon,   desc: 'Apps & Hackathons' },
  { id: 'resources', label: 'Resource Hub',  icon: BookIcon,     desc: 'Striver, NeetCode' },
  { id: 'copilot',   label: 'Mentor AI',     icon: SparklesIcon, desc: 'Alex · Your co-pilot' },
  { id: 'profile',   label: 'Profile',       icon: UserIcon,     desc: 'Your account' },
];

/* ── Sidebar inner content ─────────────────────────────────── */
function SidebarContent({ activeTab, setActiveTab, onLogout, onClose }) {
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full border-r-2 border-border bg-card z-20 w-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-6 border-b-2 border-border cursor-pointer group bg-background"
        onClick={() => { setActiveTab('workspace'); onClose?.(); }}
      >
        <div className="w-10 h-10 border-2 border-primary flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
          <DocumentIcon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
        </div>
        <div>
          <span className="text-lg font-black text-foreground block leading-tight uppercase tracking-tight">SmartResume</span>
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">CAREER_HUB_V2</span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground lg:hidden">
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] px-3 pb-3">
          [ MODULES ]
        </p>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => { 
              if (item.id === 'builder') {
                navigate('/builder');
              } else {
                setActiveTab(item.id); 
              }
              onClose?.(); 
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider transition-all border-2 ${
              activeTab === item.id
                ? 'bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_rgba(255,102,0,0.3)]'
                : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground hover:bg-background'
            }`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-primary-foreground' : ''}`} />
            <div className="text-left">
              <span className="block leading-tight">{item.label}</span>
              <span className={`text-[9px] block ${activeTab === item.id ? 'text-primary-foreground/80' : 'text-muted-foreground/60'}`}>{item.desc}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-border bg-background/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider text-destructive border-2 border-transparent hover:border-destructive/30 hover:bg-destructive/5 transition-all"
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          <span>[ LOG_OUT ]</span>
        </button>
      </div>
    </aside>
  );
}

/* ── Main Sidebar export — handles mobile/desktop ──────────── */
export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button — only visible on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-card border-2 border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-40 h-full w-72 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Desktop static sidebar */}
      <div className="hidden lg:flex" style={{ width: '260px', minWidth: '260px' }}>
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
        />
      </div>
    </>
  );
}
