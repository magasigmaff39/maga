import React, { useState } from 'react';
import { X, Copy, Check, FileText, Lightbulb } from 'lucide-react';
import { ApplicantProfile } from '../types';

interface EssayArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ApplicantProfile;
}

export const EssayArchitectModal: React.FC<EssayArchitectModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [activePart, setActivePart] = useState<number>(1);
  const [hookText, setHookText] = useState<string>('Проблема или личный опыт, послуживший импульсом к выбору направления...');
  const [academicText, setAcademicText] = useState<string>('Учебные проекты, олимпиадный опыт и исследовательская деятельность...');
  const [whyUniText, setWhyUniText] = useState<string>('Конкретные лаборатории, кафедры, исследовательские инициативы целевого университета...');
  const [futureText, setFutureText] = useState<string>('Профессиональные цели после завершения бакалавриата...');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const fullEssayOutline = `# Структура мотивационного письма (Personal Statement)
Кандидат: ${profile.name || 'Абитуриент'}
Направление: ${profile.targetMajors.join(', ')}

## 1. Вводная часть и мотивационный импульс (The Hook)
${hookText}

## 2. Академический путь и проектная деятельность (The Academic Journey)
${academicText}

## 3. Обоснование выбора университета (Why This University)
${whyUniText}

## 4. Видение будущей профессиональной траектории (Future Vision & Impact)
${futureText}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullEssayOutline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Модульная структура мотивационного письма
              </h3>
              <p className="text-[11px] text-slate-500">
                Академический регламент составления Personal Statement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100 text-xs font-semibold text-center whitespace-nowrap hide-scrollbar">
          {[
            { id: 1, label: '1. Импульс' },
            { id: 2, label: '2. Проекты' },
            { id: 3, label: '3. Выбор вуза' },
            { id: 4, label: '4. Перспективы' },
          ].map((part) => (
            <button
              key={part.id}
              onClick={() => setActivePart(part.id)}
              className={`py-3 px-4 min-w-[120px] sm:min-w-0 sm:flex-1 transition border-b-2
                ${activePart === part.id ? 'border-slate-900 bg-white text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {part.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activePart === 1 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <Lightbulb className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Методическое указание:</strong> Избегайте шаблонных формулировок. Опишите конкретную проблему, аналитический кейс или задачу, которая инициировала ваш интерес к направлению.
                </span>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Вводный контекст и мотивационный импульс:
              </label>
              <textarea
                rows={5}
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          )}

          {activePart === 2 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <Lightbulb className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Методическое указание:</strong> Приведите 1-2 подтвержденных проекта или олимпиадных кейса. Опишите поставленную цель, примененный метод и измеримый результат.
                </span>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Академический бэкграунд и проектная деятельность:
              </label>
              <textarea
                rows={5}
                value={academicText}
                onChange={(e) => setAcademicText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          )}

          {activePart === 3 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <Lightbulb className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Методическое указание:</strong> Укажите конкретные кафедры, лаборатории или академические программы выбранного университета.
                </span>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Обоснование соответствия профилю университета:
              </label>
              <textarea
                rows={5}
                value={whyUniText}
                onChange={(e) => setWhyUniText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          )}

          {activePart === 4 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <Lightbulb className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Методическое указание:</strong> Сформулируйте профессиональные цели и вклад в развитие индустрии после завершения обучения.
                </span>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Профессиональные перспективы и прикладной импакт:
              </label>
              <textarea
                rows={5}
                value={futureText}
                onChange={(e) => setFutureText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Скопировано в буфер' : 'Скопировать структуру эссе'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
