import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LayoutDashboard, UserCheck, Activity, GraduationCap, GitCompare, Map, CheckCircle2, Check, Lock } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  maxReachedStep: number;
}

const STEP_ICONS = [LayoutDashboard, UserCheck, Activity, GraduationCap, GitCompare, Map, CheckCircle2];
const TOTAL = STEP_ICONS.length;

export const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick, maxReachedStep }) => {
  const { t } = useI18n();
  const steps = STEP_ICONS.map((icon, i) => ({ index: i + 1, title: t(`step.${i + 1}`), icon }));
  const progress = Math.round(((currentStep - 1) / (TOTAL - 1)) * 100);

  return (
    <div className="w-full border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile */}
        <div className="flex sm:hidden items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center justify-center text-[11px] shadow-sm shrink-0">
              {currentStep}
            </span>
            <span className="font-semibold text-slate-800 dark:text-zinc-100 truncate">{steps[currentStep - 1]?.title}</span>
            <span className="text-slate-400 shrink-0">
              {currentStep}/{TOTAL}
            </span>
          </div>
          <div className="w-24 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(6, (currentStep / TOTAL) * 100)}%` }} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block relative">
          {/* connector track */}
          <div className="absolute left-[7%] right-[7%] top-[18px] h-0.5 bg-slate-200 dark:bg-zinc-800 rounded-full" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>

          <ol className="relative grid grid-cols-7 gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCurrent = step.index === currentStep;
              const isDone = step.index < currentStep;
              const isClickable = step.index <= maxReachedStep;
              const isLocked = !isClickable;

              return (
                <li key={step.index} className="flex flex-col items-center text-center">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onStepClick(step.index)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`group flex flex-col items-center gap-2 px-2 py-0.5 rounded-xl transition ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    title={step.title}
                  >
                    <span
                      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-300 ring-4 ring-[var(--bg)] ${
                        isCurrent
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-zinc-900 shadow-[0_10px_24px_-8px_rgba(37,99,235,0.6)] scale-105'
                          : isDone
                            ? 'bg-blue-600 text-white'
                            : isLocked
                              ? 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500'
                              : 'bg-white text-slate-600 border border-slate-200 group-hover:border-slate-400 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
                      {isCurrent && <span className="absolute -inset-1 rounded-2xl border-2 border-blue-500/40 animate-pulse-soft" aria-hidden />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold tabular-nums text-slate-400 dark:text-zinc-500">0{step.index}</span>
                      <span
                        className={`block text-xs font-semibold truncate max-w-[9rem] leading-tight ${
                          isCurrent ? 'text-slate-950 dark:text-white' : isLocked ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {step.title}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};
