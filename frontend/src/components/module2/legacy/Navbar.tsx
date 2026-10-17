import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDoctorModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenDoctorModal }) => {
  const tabs = [
    { id: 'dashboard', label: 'Daily Coach & DQN', icon: '⚡' },
    { id: 'exercise', label: 'Movement Video AI', icon: '🫀' },
    { id: 'diet', label: 'Sri Lankan Diet', icon: '🥥' },
    { id: 'sleep-stress', label: 'Sleep & Stress', icon: '🌙' },
    { id: 'smoking', label: 'Smoking Taper', icon: '🚭' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Project Info */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-900/40">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white sm:text-lg">CVD PreHab Coach</span>
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                Module 2
              </span>
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 md:inline-flex">
                SDG 3: Good Health
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Project J26-IT-322 • Pre-Surgery Adaptive Cardiac Coaching
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Doctor Escalation & System State */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenDoctorModal}
            className="flex items-center space-x-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            <span>Clinical Flag (1)</span>
          </button>
          
          <div className="hidden sm:flex items-center space-x-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-mono">DQN Loop: Active</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800 px-3 py-2 space-x-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
              activeTab === tab.id
                ? 'bg-rose-500 text-white'
                : 'text-slate-300 bg-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
