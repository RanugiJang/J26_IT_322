import React, { useState } from 'react';
import { Module2Dashboard } from './module2';

export function App() {
  const [activeModule, setActiveModule] = useState<'module1' | 'module2' | 'module3' | 'module4'>('module2');

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Multi-Module Navigation Bar for Team Integration */}
      <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              J26
            </span>
            <span className="font-bold text-white text-sm tracking-wide">Research IT_322</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 text-xs hidden md:inline font-medium">Cardiovascular Prehab & AI Platform</span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveModule('module1')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeModule === 'module1'
                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Module 1: Risk
          </button>
          <button
            onClick={() => setActiveModule('module2')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeModule === 'module2'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>Module 2: Prehab Lifestyle & Motion</span>
          </button>
          <button
            onClick={() => setActiveModule('module3')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeModule === 'module3'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Module 3: ECG
          </button>
          <button
            onClick={() => setActiveModule('module4')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeModule === 'module4'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Module 4: Post-Op
          </button>
        </div>
      </header>

      {/* Module Content View */}
      <main className="flex-1 w-full">
        {activeModule === 'module2' ? (
          <Module2Dashboard />
        ) : (
          <div className="max-w-3xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
              {activeModule === 'module1' ? '📈' : activeModule === 'module3' ? '🫀' : '🏥'}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {activeModule === 'module1' && 'Module 1: Explainable CVD Risk Prediction'}
              {activeModule === 'module3' && 'Module 3: ECG & Cardiac Rhythm Monitoring'}
              {activeModule === 'module4' && 'Module 4: Post-Operative Outcomes & Rehabilitation'}
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
              This module slot is ready for integration. When your group members merge their code into{' '}
              <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                src/{activeModule}
              </code>
              , their dashboard will mount here without any merge conflicts.
            </p>
            <button
              onClick={() => setActiveModule('module2')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-emerald-950"
            >
              Open Module 2 Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

