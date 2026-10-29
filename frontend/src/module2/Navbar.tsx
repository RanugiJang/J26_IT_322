import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDoctorModal: () => void;
  onOpenAssessment: () => void;
  onOpenArchitectureModal: () => void;
  backendOnline?: boolean;
  hasPatient?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDoctorModal,
  onOpenAssessment,
  hasPatient = false,
}) => {
  const allTabs = [
    { id: 'intake', label: 'Health Profile', icon: '🩺', alwaysEnabled: true },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', alwaysEnabled: false },
    { id: 'exercise', label: 'Daily Movement', icon: '🏃', alwaysEnabled: false },
    { id: 'diet', label: 'Heart Nutrition', icon: '🥥', alwaysEnabled: false },
    { id: 'sleep-stress', label: 'Sleep & Calm', icon: '🌙', alwaysEnabled: false },
    { id: 'smoking', label: 'Smoke-Free', icon: '🚭', alwaysEnabled: false },
  ];

  const tabs = allTabs.filter((t) => t.alwaysEnabled || hasPatient);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Healthcare Platform Brand (like ClyHealth in screenshot) */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/20 text-xl font-bold">
            🫀
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg">
                CardioLoop
              </span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-100">
                Heart Prehab
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
              Daily pre-surgery conditioning &amp; wellness guide
            </p>
          </div>
        </div>

        {/* Center Pill Segmented Nav (Identical to ClyHealth in screenshot) */}
        <nav className="hidden lg:flex items-center space-x-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/70 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Profile (like in screenshot) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Notifications Bell */}
          <button
            onClick={onOpenDoctorModal}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
            title="Health alerts & doctor reminders"
          >
            <span className="text-sm">🔔</span>
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
          </button>

          {/* New Patient / Update Profile button */}
          <button
            onClick={onOpenAssessment}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            <span>🩺</span>
            <span className="hidden sm:inline">{hasPatient ? 'Update Profile' : 'Enter Details'}</span>
            <span className="sm:hidden">Profile</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-200/80 px-3 py-2 space-x-1.5 bg-slate-50/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center space-x-1 rounded-xl px-3 py-1 text-xs font-medium ${activeTab === tab.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 bg-white border border-slate-200/80'
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
