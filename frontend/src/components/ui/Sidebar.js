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
  { id: 'copilot',    label: 'Agent Team',      icon: SparklesIcon, desc: 'Nova & 5 AI specialists' },
  { id: 'overview',   label: 'Overview',        icon: HomeIcon,     desc: 'Stats & Quick Actions' },
  { id: 'builder',    label: 'Resume Builder',  icon: DocumentIcon, desc: 'Create & Export PDF' },
  { id: 'workspace',  label: 'Resume Lab',      icon: ChartIcon,    desc: 'Analyze & Fix Flaws' },
  { id: 'tracker',    label: 'Job Tracker',     icon: KanbanIcon,   desc: 'Discover & Match Jobs' },
  { id: 'resources',  label: 'Learning Hub',    icon: BookIcon,     desc: 'DSA & System Design' },
];

function SidebarContent({ activeTab, setActiveTab, onLogout, onClose }) {
  const navigate = useNavigate();

  return (
    <aside
      className="flex flex-col h-full z-20 w-full brutal-card border-r-0 rounded-none"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 cursor-pointer group border-b-2 border-black"
        onClick={() => { setActiveTab('overview'); onClose?.(); }}
      >
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0 font-black text-sm text-white rounded-lg bg-[hsl(var(--accent-500))] text-white border-2 border-black shadow-[4px_4px_0_#000]"
        >
          SR
        </div>
        <div>
          <span className="text-base font-black text-[#111] block leading-tight" style={{ letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
            SmartResume
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#888' }}>
            Career Hub
          </span>
        </div>
        {onClose && (
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-auto lg:hidden" style={{ color: '#555' }}>
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" style={{ paddingTop: '1rem' }}>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] px-3 pb-2" style={{ color: '#888' }}>
          Navigation
        </p>
        {menuItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'builder') { navigate('/builder'); }
                else { setActiveTab(item.id); }
                onClose?.();
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold transition-all relative rounded-lg mb-1 ${
                active 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <span className="block leading-tight text-[13px]">{item.label}</span>
                <span
                  className={`text-[10px] block ${active ? 'text-primary/70' : 'text-muted-foreground/70'}`}
                >
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t-2 border-black">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
        >
          <LogoutIcon className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center brutal-card text-foreground rounded-lg"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
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
      <div className="hidden lg:flex" style={{ width: '240px', minWidth: '240px' }}>
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
        />
      </div>
    </>
  );
}
