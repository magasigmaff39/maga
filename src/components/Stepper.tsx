import React from 'react';
import { 
  FileText, 
  UserCheck, 
  Activity, 
  GraduationCap, 
  GitCompare, 
  Map, 
  CheckCircle2,
  Check 
} from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  maxReachedStep: number;
}

const STEPS = [
  { index: 1, title: 'Вход', icon: FileText },
  { index: 2, title: 'Профиль', icon: UserCheck },
  { index: 3, title: 'Диагностика', icon: Activity },
  { index: 4, title: 'Рекомендации', icon: GraduationCap },
  { index: 5, title: 'Сравнение', icon: GitCompare },
  { index: 6, title: 'Маршрут', icon: Map },
  { index: 7, title: 'Контрольный шаг', icon: CheckCircle2 },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  maxReachedStep,
}) => {
  return (
    <div className="w-full border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile View */}
        <div className="flex sm:hidden items-center justify-between text-xs">
          <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center justify-center text-[11px] shadow-sm">
              {currentStep}
            </span>
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              {STEPS[currentStep - 1]?.title}
            </span>
            <span className="text-slate-400">
              ({currentStep}/7)
            </span>
          </div>
          <div className="w-24 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-slate-900 dark:bg-white h-full rounded-full transition-all"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:grid sm:grid-cols-7 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.index === currentStep;
            const isCompleted = step.index < currentStep || step.index <= maxReachedStep;
            const isClickable = step.index <= maxReachedStep;

            return (
              <button
                key={step.index}
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.index)}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition relative
                  ${isCurrent 
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-950 dark:text-white font-semibold shadow-sm'
                    : isCompleted 
                      ? 'hover:bg-slate-50 text-slate-600 cursor-pointer' 
                      : 'opacity-40 cursor-not-allowed text-slate-400'
                  }`}
              >
                <div 
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold
                    ${isCurrent 
                      ? 'bg-slate-900 text-white' 
                      : isCompleted 
                        ? 'bg-slate-200 text-slate-700' 
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 overflow-hidden">
                  <div className="text-[10px] text-slate-400 font-medium">
                    0{step.index}
                  </div>
                  <p className="text-xs font-semibold truncate leading-tight">
                    {step.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
