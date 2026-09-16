import React from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Languages, 
  Trophy, 
  Coins, 
  FileText
} from 'lucide-react';
import { ApplicantProfile, DiagnosticResult } from '../types';

interface Step3DiagnosticProps {
  profile: ApplicantProfile;
  diagnostic: DiagnosticResult;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Diagnostic: React.FC<Step3DiagnosticProps> = ({
  profile,
  diagnostic,
  onNext,
  onBack,
}) => {
  const { readiness, strengths, bottlenecks, strategicAdvice, recommendedCategoryFocus } = diagnostic;

  return (
    <div className="space-y-8 py-4">
      
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Этап 03 • Аналитическая диагностика
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Оценка готовности и профиль конкурентоспособности
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Расчет индекса шансов поступления на основе сопоставления академических данных с критериями отбора.
          </p>
        </div>

        <div className="self-start sm:self-auto px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
          Фокус стратегии: {recommendedCategoryFocus}
        </div>
      </div>

      {/* Main Readiness Gauge + 4 Breakdown Pillars */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          {/* Main Score Box */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-xs shrink-0">
              <span className="text-2xl sm:text-3xl font-black font-mono">
                {readiness.overall}%
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Индекс
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {readiness.overall >= 80 ? 'Высокая конкурентоспособность' : readiness.overall >= 65 ? 'Сбалансированный профиль' : 'Требуется академическое усиление'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {readiness.overall >= 80 ? 'Tier 1' : readiness.overall >= 65 ? 'Tier 2' : 'Foundation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Сводная оценка сопоставляет текущий GPA ({profile.gpa}), языковые сертификаты, олимпиадные результаты и финансовые параметры.
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-36 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Статус</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {profile.grade === 'grade_11' ? '11 класс' : '10 класс'}
              </span>
            </div>
            <div className="flex-1 md:w-36 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Набор</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {profile.targetYear}
              </span>
            </div>
          </div>

        </div>

        {/* 4 Pillars Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                Академический
              </span>
              <span className="font-mono font-bold text-slate-900">{readiness.academic}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                style={{ width: `${readiness.academic}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500">
              GPA {profile.gpa} • {profile.hasSat ? `SAT ${profile.satScore}` : profile.hasUnt ? `ЕНТ ${profile.untScore}` : 'Тесты в процессе'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-slate-600" />
                Языковой уровень
              </span>
              <span className="font-mono font-bold text-slate-900">{readiness.language}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                style={{ width: `${readiness.language}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {profile.hasIelts ? `IELTS ${profile.ieltsScore} Band` : 'Сертификат отсутствует'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-slate-600" />
                Портфолио и конкурсы
              </span>
              <span className="font-mono font-bold text-slate-900">{readiness.portfolio}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                style={{ width: `${readiness.portfolio}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {profile.olympiadLevel !== 'none' ? `Олимпиада: ${profile.olympiadLevel}` : 'Базовое портфолио'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-600" />
                Финансовый баланс
              </span>
              <span className="font-mono font-bold text-slate-900">{readiness.financialFeasibility}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                style={{ width: `${readiness.financialFeasibility}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {profile.budgetTier === 'grant_only' ? '100% Гранты и стипендии' : 'Частичное софинансирование'}
            </p>
          </div>

        </div>

      </div>

      {/* Strengths & Bottlenecks Dual Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Strengths */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3>Конкурентные преимущества профиля</h3>
          </div>

          <div className="space-y-3">
            {strengths.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bottlenecks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3>Зоны риска и ограничения</h3>
          </div>

          <div className="space-y-3">
            {bottlenecks.map((item, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {item.severity === 'high' ? 'Критично' : 'Внимание'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
                <div className="pt-1 text-[11px] font-medium text-slate-800 flex items-start gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900">Регламент:</span>
                  <span>{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Strategic Advisor Note */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Экспертное заключение по профилю</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
          {strategicAdvice}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к анкете</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
        >
          <span>Перейти к рекомендациям программ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
