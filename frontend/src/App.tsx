import React, { useState } from 'react';
import { Module2Dashboard } from './components/module2/Module2Dashboard';
import { Module3Dashboard } from './components/module3';

type ActiveModule = 'module2' | 'module3';

export function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('module2');

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100">
      {/* Module Switcher Bar */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-lg shadow-lg shadow-rose-900/40">🫀</span>
            <span className="font-extrabold tracking-tight text-white text-sm hidden sm:block">CardioCare AI</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">J26-IT-322</span>
          </div>
          <nav className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              id="tab-module2"
              onClick={() => setActiveModule('module2')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeModule === 'module2'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🏃</span>
              <span>Module 2 — Lifestyle Coach</span>
            </button>
            <button
              id="tab-module3"
              onClick={() => setActiveModule('module3')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeModule === 'module3'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🫀</span>
              <span>Module 3 — ECG Screening</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Module Content */}
      {activeModule === 'module2' && <Module2Dashboard />}
      {activeModule === 'module3' && <Module3Dashboard />}
    </div>
  );
}

export default App;

