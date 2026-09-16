import React from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  ArrowLeft, 
  Coins, 
  Check, 
  AlertCircle, 
  Calendar, 
  GraduationCap, 
  Building 
} from 'lucide-react';
import { University } from '../types';

interface Step5ComparisonProps {
  allUniversities: University[];
  selectedIds: string[];
  onToggleUni: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Comparison: React.FC<Step5ComparisonProps> = ({
  allUniversities,
  selectedIds,
  onToggleUni,
  onNext,
  onBack,
}) => {
  const comparedUnis = allUniversities.filter(u => selectedIds.includes(u.id));
  const activeUnis = comparedUnis.length >= 2 
    ? comparedUnis 
    : allUniversities.slice(0, 3);

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Этап 05 • Сравнительный анализ
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Сопоставление университетов по ключевым критериям
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Сравнение финансовой нагрузки, академических порогов, селективности и контрольных дат.
          </p>
        </div>

        {/* Quick swap chips */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-slate-400 mr-1">Выбрать:</span>
          {allUniversities.slice(0, 5).map(u => {
            const isSelected = activeUnis.some(a => a.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => onToggleUni(u.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1
                  ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <span>{u.shortName}</span>
                <span className="text-[10px] opacity-70">{isSelected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid / Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse min-w-[700px]">
          
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 sm:p-5 w-1/4 text-xs font-bold uppercase text-slate-400 tracking-wider">
                Критерий оценки
              </th>
              {activeUnis.map(uni => (
                <th key={uni.id} className="p-4 sm:p-5 text-slate-900 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {uni.city}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {uni.matchScore}% Match
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-tight text-slate-900">
                        {uni.shortName}
                      </h4>
                      <p className="text-xs text-slate-500 font-normal">
                        {uni.country}
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {uni.fitTier} Tier
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            
            {/* Row 1: Finance & Grants */}
            <tr className="hover:bg-slate-50/50 transition">
              <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-slate-500" />
                  <span>Финансирование и гранты</span>
                </div>
              </td>
              {activeUnis.map(uni => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    {uni.hasFullGrantOrScholarship ? '100% покрытие расходов' : `$${uni.tuitionUSDPerYear.toLocaleString()} / год`}
                  </div>
                  <div className="text-slate-800 font-medium">{uni.scholarshipName}</div>
                  <div className="text-slate-500 text-[11px] leading-relaxed">{uni.scholarshipDescription}</div>
                </td>
              ))}
            </tr>

            {/* Row 2: Admission Criteria */}
            <tr className="hover:bg-slate-50/50 transition">
              <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <span>Проходные показатели</span>
                </div>
              </td>
              {activeUnis.map(uni => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Минимальный GPA:</span>
                    <span className="font-bold text-slate-800">{uni.minGpa} / 4.0</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">IELTS:</span>
                    <span className="font-bold text-slate-900">{uni.minIelts}+</span>
                  </div>
                  {uni.minSat && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">SAT:</span>
                      <span className="font-bold text-slate-900">{uni.minSat}+</span>
                    </div>
                  )}
                  {uni.minUnt && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">ЕНТ:</span>
                      <span className="font-bold text-slate-900">{uni.minUnt}+</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Процент зачисления:</span>
                    <span className="font-mono font-bold text-slate-700">{uni.acceptanceRate}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 3: Deadlines */}
            <tr className="hover:bg-slate-50/50 transition">
              <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Сроки подачи заявок</span>
                </div>
              </td>
              {activeUnis.map(uni => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1">
                  {uni.earlyDeadline && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Early Action:</span>
                      <span className="font-semibold text-slate-800">{uni.earlyDeadline}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Основной раунд:</span>
                    <span className="font-bold text-slate-900">{uni.regularDeadline}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row 4: Key Advantages */}
            <tr className="hover:bg-slate-50/50 transition">
              <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  <span>Преимущества</span>
                </div>
              </td>
              {activeUnis.map(uni => (
                <td key={uni.id} className="p-4 sm:p-5">
                  <ul className="space-y-1.5">
                    {uni.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700 leading-snug">
                        <Check className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row 5: Cautions */}
            <tr className="hover:bg-slate-50/50 transition">
              <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <span>Ограничения</span>
                </div>
              </td>
              {activeUnis.map(uni => (
                <td key={uni.id} className="p-4 sm:p-5">
                  <ul className="space-y-1.5">
                    {uni.cautions.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-600 leading-snug">
                        <span className="text-slate-400 shrink-0 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к списку</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
        >
          <span>Сформировать персональный маршрут</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
