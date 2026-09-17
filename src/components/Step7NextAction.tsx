import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  RotateCcw, 
  Mail,
  Lightbulb,
  Send
} from 'lucide-react';
import { RoadmapStep } from '../types';

interface Step7NextActionProps {
  currentStepData: {
    stepId: string;
    stepTitle: string;
    taskTitle: string;
    taskId: string;
    category: string;
    deadline: string;
    guidanceTip: string;
    totalTasks: number;
    completedTasks: number;
  };
  activeRoadmapStep?: RoadmapStep;
  onToggleSubtask: (stepId: string, subtaskId: string) => void;
  onBack: () => void;
  onRestart: () => void;
  onOpenEssayModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenEmailModal: () => void;
}

export const Step7NextAction: React.FC<Step7NextActionProps> = ({
  currentStepData,
  activeRoadmapStep,
  onToggleSubtask,
  onBack,
  onRestart,
  onOpenEssayModal,
  onOpenCalendarModal,
  onOpenEmailModal,
}) => {
  const { t, tx } = useI18n();
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [showRecommendationTemplate, setShowRecommendationTemplate] = useState<boolean>(false);

  const teacherEmailTemplate = `Уважаемый(ая) [Имя Отчество учителя],

Пишет Вам [Ваше Имя Фамилия], ученик(ца) [Ваш класс]. 

В этом учебном году я формирую пакет документов для поступления в университет по специальности [Ваше академическое направление]. 

Ваш курс по [Название предмета] сыграл ключевую роль в моем профессиональном самоопределении. Обращаюсь к Вам с просьбой выступить моим академическим рекомендателем и предоставить рекомендательное письмо для приемной комиссии.

Срок предоставления рекомендации: [Дата дедлайна]. 
Я подготовил(а) резюме своих учебных проектов и внеклассных достижений и готов(а) направить их для удобства подготовки письма.

Заранее признателен(на) за уделенное время.

С уважением,
[Ваше Имя Фамилия]
[Контактный телефон / Email]`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(tx(teacherEmailTemplate));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('steps.7.kicker')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('steps.7.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('steps.7.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenEmailModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition border border-blue-200"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('Отправить план на Gmail (Google SMTP)')}</span>
          </button>

          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('steps.7.restart')}</span>
          </button>
        </div>
      </div>

      {/* Hero Focal Card */}
      <div className="rounded-2xl bg-slate-900 text-white p-7 sm:p-9 border border-slate-800 shadow-sm space-y-6">
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">
              {t('Приоритетная задача недели')}
            </span>

            <span className="text-xs text-slate-400 font-mono">
              {t('Контрольный срок')}: {tx(currentStepData.deadline)}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            {tx(currentStepData.stepTitle)}
          </h3>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('Рекомендация по выполнению:')}</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {tx(currentStepData.guidanceTip)}
            </p>
          </div>

          {/* Subtasks with interactive check */}
          {activeRoadmapStep && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {t('Контрольные действия:')}
              </span>
              <div className="space-y-2">
                {activeRoadmapStep.subtasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleSubtask(activeRoadmapStep.id, task.id)}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer select-none
                      ${task.isCompleted 
                        ? 'bg-slate-800/40 border-slate-700 text-slate-400' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition
                        ${task.isCompleted ? 'bg-slate-200 border-slate-200 text-slate-900' : 'border-slate-500 bg-transparent'}`}>
                        {task.isCompleted && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                        {tx(task.title)}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-900">
                      {t(task.isCompleted ? 'Выполнено' : 'Отметить')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Actionable Micro-Tools Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Tool 1: Recommendation Letter Template */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {t('Запрос рекомендательного письма')}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('Деловой шаблон официального обращения к учителю или научному руководителю.')}
            </p>
          </div>

          <button
            onClick={() => setShowRecommendationTemplate(!showRecommendationTemplate)}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>{t(showRecommendationTemplate ? 'Скрыть шаблон' : 'Открыть шаблон письма')}</span>
          </button>
        </div>

        {/* Tool 2: Essay Architect */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {t('Структура мотивационного эссе')}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('Модульный план Personal Statement для зарубежных университетов и NU.')}
            </p>
          </div>

          <button
            onClick={onOpenEssayModal}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('Структура эссе')}</span>
          </button>
        </div>

        {/* Tool 3: Calendar & ICS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {t('Сводный календарь контрольных дат')}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('График дедлайнов приемных кампаний с возможностью экспорта в календарь.')}
            </p>
          </div>

          <button
            onClick={onOpenCalendarModal}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('График дедлайнов')}</span>
          </button>
        </div>

      </div>

      {/* Expandable Teacher Email Template Box */}
      {showRecommendationTemplate && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('Шаблон обращения за академической рекомендацией:')}
            </span>
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{t(copiedTemplate ? 'Скопировано' : 'Копировать')}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {tx(teacherEmailTemplate)}
          </pre>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('steps.7.back')}</span>
        </button>

        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <span>{t('steps.7.next')}</span>
        </button>
      </div>

    </div>
  );
};
