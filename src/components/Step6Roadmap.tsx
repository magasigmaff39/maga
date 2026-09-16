import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Download, 
  Lightbulb, 
  Filter,
  Mail 
} from 'lucide-react';
import { RoadmapStep } from '../types';

interface Step6RoadmapProps {
  roadmap: RoadmapStep[];
  onToggleSubtask: (stepId: string, subtaskId: string) => void;
  onNext: () => void;
  onBack: () => void;
  onExportRoadmap: () => void;
  onOpenEmailModal: () => void;
}

export const Step6Roadmap: React.FC<Step6RoadmapProps> = ({
  roadmap,
  onToggleSubtask,
  onNext,
  onBack,
  onExportRoadmap,
  onOpenEmailModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allSubtasks = roadmap.flatMap(s => s.subtasks);
  const completedCount = allSubtasks.filter(t => t.isCompleted).length;
  const totalCount = allSubtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredSteps = roadmap.filter(s => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const getCategoryBadge = (category: RoadmapStep['category']) => {
    switch (category) {
      case 'exams':
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">Экзамены</span>;
      case 'documents':
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">Документы</span>;
      case 'essay':
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">Мотивация</span>;
      case 'deadlines':
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">Дедлайн</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">Активность</span>;
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Этап 06 • Календарный регламент
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Индивидуальная маршрутная карта поступления
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Хронологическая последовательность этапов от стандартизированных тестов до подтверждения зачисления.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenEmailModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition border border-blue-200"
            title="Отправить полную маршрутную карту на Gmail"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Отправить на Gmail (Google SMTP)</span>
          </button>

          <button
            onClick={onExportRoadmap}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Экспорт (.txt)</span>
          </button>
        </div>
      </div>

      {/* Progress Card Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900">Прогресс выполнения контрольных точек</span>
            <p className="text-[11px] text-slate-500">Завершено {completedCount} из {totalCount} регламентных действий</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900 font-mono">{progressPercent}%</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-slate-900 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-400 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Фильтр этапов:</span>
        </div>
        {[
          { id: 'all', label: 'Все задачи' },
          { id: 'exams', label: 'Экзамены и тесты' },
          { id: 'documents', label: 'Документы и выписки' },
          { id: 'essay', label: 'Мотивационные эссе' },
          { id: 'deadlines', label: 'Подача и конкурсы' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition
              ${selectedCategory === c.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Timeline Steps */}
      <div className="space-y-4">
        {filteredSteps.map((step, index) => {
          const stepCompleted = step.subtasks.every(t => t.isCompleted);

          return (
            <div
              key={step.id}
              className={`bg-white rounded-2xl border transition-all p-6 shadow-xs space-y-4
                ${stepCompleted ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0
                    ${stepCompleted ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {stepCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      {step.title}
                    </h3>
                    {getCategoryBadge(step.category)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{step.targetDate}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {step.description}
              </p>

              {step.guidanceTip && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{step.guidanceTip}</span>
                </div>
              )}

              {/* Actionable Subtasks */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Контрольные задачи:
                </span>
                <div className="space-y-1.5">
                  {step.subtasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleSubtask(step.id, task.id)}
                      className={`p-3 rounded-xl border transition flex items-center gap-3 cursor-pointer select-none
                        ${task.isCompleted 
                          ? 'bg-slate-50 border-slate-200 text-slate-500 line-through' 
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'}`}
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium leading-tight">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к сравнению</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
        >
          <span>Перейти к первоочередному шагу</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
