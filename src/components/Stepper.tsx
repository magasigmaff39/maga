import React from 'react';
import { 
  UserCheck, 
  Activity, 
  GraduationCap, 
  GitCompare, 
  Map, 
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  maxReachedStep: number;
}

// 6 Core Workflow Steps (Starting directly from "01 Профиль", without "Вход")
const STEPS = [
  { 
    appStep: 2, 
    num: '01', 
    title: 'Профиль', 
    desc: 'Анкета и баллы', 
    icon: UserCheck 
  },
  { 
    appStep: 3, 
    num: '02', 
    title: 'Диагностика', 
    desc: 'Оценка шансов', 
    icon: Activity 
  },
  { 
    appStep: 4, 
    num: '03', 
    title: 'Рекомендации', 
    desc: 'Подбор вузов', 
    icon: GraduationCap 
  },
  { 
    appStep: 5, 
    num: '04', 
    title: 'Сравнение', 
    desc: 'Мэтчинг программ', 
    icon: GitCompare 
  },
  { 
    appStep: 6, 
    num: '05', 
    title: 'Маршрут', 
    desc: 'Roadmap зачисления', 
    icon: Map 
  },
  { 
    appStep: 7, 
    num: '06', 
    title: 'Контрольный шаг', 
    desc: 'Действие недели', 
    icon: CheckCircle2 
  },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  maxReachedStep,
}) => {
  // Map app step (2..7) to stepper index (0..5)
  const currentStepperIdx = Math.max(0, Math.min(STEPS.length - 1, currentStep - 2));
  const currentStepData = STEPS[currentStepperIdx] || STEPS[0];
  const progressPct = Math.round(((currentStepperIdx + 1) / STEPS.length) * 100);

  return (
    <div className="w-full border-b border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 select-none">
      
      {/* Progress Line Track across the top border */}
      <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800/80 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        
        {/* Mobile View */}
        <div className="flex sm:hidden items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
              {currentStepData.num}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{currentStepData.title}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                  ({currentStepperIdx + 1}/6)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                {currentStepData.desc}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentStep <= 2}
              onClick={() => onStepClick(currentStep - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              title="Назад"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentStep >= 7 || (currentStep + 1 > maxReachedStep)}
              onClick={() => onStepClick(currentStep + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              title="Вперед"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop View (Interactive 6-step workflow with animations) */}
        <div className="hidden sm:grid sm:grid-cols-6 gap-2 lg:gap-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = step.appStep === currentStep;
            const isCompleted = step.appStep < currentStep || (step.appStep <= maxReachedStep && !isCurrent);
            const isClickable = step.appStep <= maxReachedStep;

            return (
              <button
                key={step.num}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.appStep)}
                className={`group flex items-center gap-3 p-2.5 lg:p-3 rounded-2xl text-left transition-all duration-300 relative overflow-hidden
                  ${isCurrent 
                    ? 'bg-white dark:bg-zinc-900 border border-blue-400/50 dark:border-blue-500/40 shadow-[0_6px_24px_rgba(59,130,246,0.16)] ring-1 ring-blue-500/30 -translate-y-0.5 cursor-default'
                    : isCompleted 
                      ? 'bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-md cursor-pointer' 
                      : 'bg-transparent border border-transparent opacity-40 cursor-not-allowed'
                  }`}
              >
                {/* Active step background ambient light */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                )}

                {/* Step Icon Badge */}
                <div 
                  className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105
                    ${isCurrent 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25' 
                      : isCompleted 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800'
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5] animate-scaleIn" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Title and Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold tracking-wider
                      ${isCurrent 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : isCompleted 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-400 dark:text-zinc-500'}`}
                    >
                      {step.num}
                    </span>

                    {/* Live Ping Beacon on Active Step */}
                    {isCurrent && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                    )}
                  </div>

                  <div className={`text-xs font-bold truncate transition-colors leading-snug mt-0.5
                    ${isCurrent 
                      ? 'text-slate-900 dark:text-white' 
                      : isCompleted 
                        ? 'text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                        : 'text-slate-400 dark:text-zinc-500'}`}
                  >
                    {step.title}
                  </div>

                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate hidden lg:block">
                    {step.desc}
                  </div>
                </div>

              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
