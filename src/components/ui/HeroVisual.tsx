import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-[520px] mx-auto lg:ml-auto">
      <div className="absolute -inset-8 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative ar-card p-4 sm:p-5 animate-float">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Admission cockpit</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Профиль • 2027 intake</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
            Live match
          </span>
        </div>

        <svg viewBox="0 0 420 220" className="w-full h-auto mb-4" aria-hidden>
          <defs>
            <linearGradient id="heroFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="420" height="220" rx="20" fill="url(#heroFill)" />
          <path d="M24 168 C 80 150, 110 90, 168 96 C 230 102, 250 150, 310 132 C 350 120, 372 88, 396 72" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="168" cy="96" r="6" fill="#fff" />
          <circle cx="310" cy="132" r="6" fill="#818cf8" />
          <circle cx="396" cy="72" r="7" fill="#34d399" className="animate-pulse-soft" />
          <text x="24" y="36" fill="currentColor" className="fill-slate-700 dark:fill-zinc-200" fontSize="13" fontFamily="Plus Jakarta Sans" fontWeight="700">Readiness index</text>
          <text x="24" y="62" fill="currentColor" className="fill-slate-500 dark:fill-zinc-400" fontSize="11" fontFamily="Inter">GPA · IELTS · SAT · Grants</text>
        </svg>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-3 bg-slate-50/80 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">NU · 94%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">High · 100% grant</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-3 bg-slate-50/80 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">KAIST · 88%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Medium · KISS aid</p>
          </div>
        </div>
      </div>

      <div className="absolute -left-3 sm:-left-8 top-16 rounded-2xl border border-white/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">GPA 4.9 · IELTS 7.5</p>
          <p className="text-[11px] text-slate-500">Target band reached</p>
        </div>
      </div>
    </div>
  );
};
