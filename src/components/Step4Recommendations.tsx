import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Coins, 
  ExternalLink, 
  GitCompare, 
  Calendar,
  Building,
  Check
} from 'lucide-react';
import { University, FitTier, TargetRegion } from '../types';

interface Step4RecommendationsProps {
  universities: University[];
  selectedForCompare: string[];
  onToggleCompare: (uniId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Recommendations: React.FC<Step4RecommendationsProps> = ({
  universities,
  selectedForCompare,
  onToggleCompare,
  onNext,
  onBack,
}) => {
  const [activeTierFilter, setActiveTierFilter] = useState<'all' | FitTier>('all');
  const [activeRegionFilter, setActiveRegionFilter] = useState<'all' | TargetRegion>('all');

  const filteredUnis = universities.filter(uni => {
    if (activeTierFilter !== 'all' && uni.fitTier !== activeTierFilter) return false;
    if (activeRegionFilter !== 'all' && uni.region !== activeRegionFilter) return false;
    return true;
  });

  const getTierBadge = (tier: FitTier) => {
    if (tier === 'Dream') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          Амбициозный (Dream)
        </span>
      );
    }
    if (tier === 'Target') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          Целевой (Target)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        Базовый (Safety)
      </span>
    );
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Этап 04 • Рекомендованные университеты
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Релевантные программы и учебные заведения
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Распределение по категориям конкурса с детализацией стипендиального финансирования.
          </p>
        </div>

        {/* Compare count pill */}
        <div className="self-start sm:self-auto flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            Выбрано к сопоставлению: <strong className="text-slate-900">{selectedForCompare.length}</strong>
          </div>
          {selectedForCompare.length >= 2 && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Перейти к сравнению ({selectedForCompare.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar: Tiers & Regions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Tier Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="text-slate-400 mr-1 text-[11px]">Эшелон конкурса:</span>
          {[
            { id: 'all', label: `Все (${universities.length})` },
            { id: 'Dream', label: 'Амбициозные (Dream)' },
            { id: 'Target', label: 'Целевые (Target)' },
            { id: 'Safety', label: 'Базовые (Safety)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTierFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-xl transition ${activeTierFilter === t.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Region Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="text-slate-400 mr-1 text-[11px]">Регион:</span>
          {[
            { id: 'all', label: 'Все' },
            { id: 'kazakhstan', label: 'Казахстан' },
            { id: 'europe', label: 'Европа' },
            { id: 'asia', label: 'Азия' },
            { id: 'usa_canada', label: 'США / Канада' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRegionFilter(r.id as any)}
              className={`px-3 py-1.5 rounded-xl transition ${activeRegionFilter === r.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

      </div>

      {/* University Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUnis.map((uni) => {
          const isCompared = selectedForCompare.includes(uni.id);

          return (
            <div
              key={uni.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:border-slate-400
                ${isCompared ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'}`}
            >
              <div className="p-6 space-y-4">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                      <Building className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {uni.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        {uni.nativeName} • {uni.city}, {uni.country}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {uni.matchScore}% Match
                    </div>
                  </div>
                </div>

                {/* Badges bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {getTierBadge(uni.fitTier)}
                  {uni.nationalRank && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      {uni.nationalRank}
                    </span>
                  )}
                  {uni.hasFullGrantOrScholarship && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-600" />
                      <span>100% Грант</span>
                    </span>
                  )}
                </div>

                {/* Human-language "Why it fits" Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 space-y-1.5">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Обоснование соответствия профилю:
                  </div>
                  <p className="leading-relaxed font-normal text-slate-700">
                    {uni.whyItFits}
                  </p>
                </div>

                {/* Financial & Academic Requirements Row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Финансирование</span>
                    <span className="font-semibold text-slate-800 truncate block text-[11px]" title={uni.scholarshipName}>
                      {uni.scholarshipName}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Пороговые баллы</span>
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      IELTS {uni.minIelts}+ {uni.minSat ? `• SAT ${uni.minSat}+` : uni.minUnt ? `• ЕНТ ${uni.minUnt}+` : ''}
                    </span>
                  </div>
                </div>

                {/* Deadlines notice */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Срок подачи: <strong className="text-slate-800">{uni.regularDeadline}</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Приемная кампания 2026/2027
                  </span>
                </div>

              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <a
                  href={uni.officialPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  <span>Официальный портал</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => onToggleCompare(uni.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition
                    ${isCompared 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>{isCompared ? 'В сравнении' : 'Добавить к сравнению'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к диагностике</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
        >
          <span>Перейти к сравнению вариантов</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
