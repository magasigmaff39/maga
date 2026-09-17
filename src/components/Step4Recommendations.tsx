import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Coins, 
  ExternalLink, 
  GitCompare, 
  Calendar,
  Building,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OddsBadge } from './ui/OddsBadge';
import { ApplicantProfile, FitTier, TargetRegion, University } from '../types';
import { UniversityDetails } from './UniversityDetails';
import { useI18n } from '../i18n/I18nContext';

interface Step4RecommendationsProps {
  universities: University[];
  profile: ApplicantProfile;
  selectedForCompare: string[];
  onToggleCompare: (uniId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Recommendations: React.FC<Step4RecommendationsProps> = ({
  universities,
  profile,
  selectedForCompare,
  onToggleCompare,
  onNext,
  onBack,
}) => {
  const [activeTierFilter, setActiveTierFilter] = useState<'all' | FitTier>('all');
  const [activeRegionFilter, setActiveRegionFilter] = useState<'all' | TargetRegion>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const { t, tx } = useI18n();

  const filteredUnis = universities.filter(uni => {
    if (activeTierFilter !== 'all' && uni.fitTier !== activeTierFilter) return false;
    if (activeRegionFilter !== 'all' && uni.region !== activeRegionFilter) return false;
    return true;
  });

  const getTierBadge = (tier: FitTier) => {
    if (tier === 'Dream') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          {t('uni.tier.Dream')}
        </span>
      );
    }
    if (tier === 'Target') {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          {t('uni.tier.Target')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        {t('uni.tier.Safety')}
      </span>
    );
  };

  const shownUnis = filteredUnis.slice(0, visibleCount);

  return (
    <div className="space-y-8 py-4">
      
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('steps.4.kicker')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('steps.4.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('steps.4.subtitle')}
          </p>
        </div>

        {/* Compare count pill */}
        <div className="self-start sm:self-auto flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            {t('steps.4.selected')} <strong className="text-slate-900">{selectedForCompare.length}</strong>
          </div>
          {selectedForCompare.length >= 2 && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{t('steps.4.compare')} ({selectedForCompare.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar: Tiers & Regions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
        
        {/* Tier Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span className="text-slate-400 mr-1 text-[11px]">{t('steps.4.tierFilter')}</span>
          {[
            { id: 'all', label: `${t('steps.4.all')} (${universities.length})` },
            { id: 'Dream', label: t('uni.tier.Dream') },
            { id: 'Target', label: t('uni.tier.Target') },
            { id: 'Safety', label: t('uni.tier.Safety') },
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
          <span className="text-slate-400 mr-1 text-[11px]">{t('steps.4.regionFilter')}</span>
          {[
            { id: 'all', label: t('steps.4.all') },
            { id: 'kazakhstan', label: t('region.kazakhstan') },
            { id: 'europe', label: t('region.europe') },
            { id: 'asia', label: t('region.asia') },
            { id: 'usa_canada', label: t('region.usa_canada') },
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
        {shownUnis.map((uni) => {
          const isCompared = selectedForCompare.includes(uni.id);
          const isExpanded = expandedId === uni.id;

          return (
            <div
              key={uni.id}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-zinc-600 ${isExpanded ? 'lg:col-span-2' : ''}
                ${isCompared ? 'border-slate-900 ring-1 ring-slate-900 dark:border-white dark:ring-white shadow-[0_4px_12px_rgba(15,23,42,0.1)]' : 'border-slate-200 dark:border-zinc-800 shadow-xs'}`}
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

                  <div className="text-right shrink-0 space-y-1.5">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">
                      {uni.matchScore}% Match
                    </div>
                    <OddsBadge score={uni.matchScore} />
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
                      <span>{t('100% Грант')}</span>
                    </span>
                  )}
                  {uni.campus && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200" title={t('uni.safety')}>
                      🛡 {uni.campus.neighborhoodSafety}/10
                    </span>
                  )}
                </div>

                {/* Human-language "Why it fits" Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 space-y-1.5">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    {t('Обоснование соответствия профилю:')}
                  </div>
                  <p className="leading-relaxed font-normal text-slate-700">
                    {tx(uni.whyItFits)}
                  </p>
                </div>

                {/* Financial & Academic Requirements Row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">{t('Финансирование')}</span>
                    <span className="font-semibold text-slate-800 truncate block text-[11px]" title={tx(uni.scholarshipName)}>
                      {tx(uni.scholarshipName)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">{t('Пороговые баллы')}</span>
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      IELTS {uni.minIelts}+ {uni.minSat ? `• SAT ${uni.minSat}+` : uni.minUnt ? `• ЕНТ ${uni.minUnt}+` : ''}
                    </span>
                  </div>
                </div>

                {/* Deadlines notice */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('Срок подачи')}: <strong className="text-slate-800">{tx(uni.regularDeadline)}</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t('Приемная кампания 2026/2027')}
                  </span>
                </div>

              </div>

              {/* Extended knowledge base: links, safety, equipment, projects, chance, AI news/social */}
              {isExpanded && <UniversityDetails uni={uni} profile={profile} />}

              {/* Bottom Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <a
                    href={uni.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                  >
                    <span>{t('common.officialPortal')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : uni.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                  >
                    {isExpanded ? t('common.hide') : t('common.details')}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={() => onToggleCompare(uni.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition
                    ${isCompared 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>{t(isCompared ? 'В сравнении' : 'Добавить к сравнению')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUnis.length > visibleCount && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 12)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <ChevronDown className="w-4 h-4" />
            +{filteredUnis.length - visibleCount}
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('steps.4.back')}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"
        >
          <span>{t('steps.4.next')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
