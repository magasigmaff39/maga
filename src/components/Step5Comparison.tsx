import React, { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ArrowRight, ArrowLeft, Coins, Check, AlertCircle, Calendar, GraduationCap, Building, ShieldCheck, Briefcase, Sparkles, Loader2, ListPlus, ExternalLink, Percent, Thermometer } from 'lucide-react';
import type { ApplicantProfile, TaskCategory, University, UniversityComparison } from '../types';
import { aiApi, tasksApi, ApiError } from '../lib/api';
import { estimateWithProjections } from '../../shared/logic/chance.js';
import { useToast } from '../context/ToastContext';
import { Markdown } from './ui/Markdown';
import { useProgressCaptions } from '../hooks/useProgressCaptions';

interface Step5ComparisonProps {
  allUniversities: University[];
  selectedIds: string[];
  onToggleUni: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  profile: ApplicantProfile;
  isAuthenticated: boolean;
}

export const Step5Comparison: React.FC<Step5ComparisonProps> = ({ allUniversities, selectedIds, onToggleUni, onNext, onBack, profile, isAuthenticated }) => {
  const { t, tx, lang } = useI18n();
  const { notify } = useToast();
  const comparedUnis = allUniversities.filter((u) => selectedIds.includes(u.id));
  const activeUnis = comparedUnis.length >= 2 ? comparedUnis : allUniversities.slice(0, 3);

  const [comparison, setComparison] = useState<UniversityComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chances = useMemo(() => Object.fromEntries(activeUnis.map((u) => [u.id, estimateWithProjections(profile, u)])), [activeUnis, profile]);

  const compareCaption = useProgressCaptions(comparing, [t('progress.reading'), t('progress.universities'), t('progress.chances'), t('progress.finishing')]);

  const describeError = (err: unknown) => (err instanceof ApiError ? (err.code === 'NETWORK' ? t('common.backendOffline') : err.message) : t('common.error'));

  const runComparison = async () => {
    setComparing(true);
    setError(null);
    try {
      setComparison(await aiApi.compare(activeUnis.map((u) => u.id), profile, lang));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setComparing(false);
    }
  };

  const addSteps = async () => {
    if (!comparison?.nextSteps?.length) return;
    if (!isAuthenticated) {
      notify(t('common.loginRequired'), 'info');
      return;
    }
    try {
      const res = await tasksApi.bulkCreate(comparison.nextSteps.map((s) => ({ title: s.title.slice(0, 200), category: (s.category || 'application') as TaskCategory, dueDate: /^\d{4}-\d{2}/.test(s.deadline) ? s.deadline.slice(0, 10) : null, source: 'comparison' })));
      notify(`${t('ai.analyze.addTasks')}: ${res.created.length}`, 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const rowHead = (icon: React.ReactNode, label: string) => (
    <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-slate-50/50">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </td>
  );

  const rankOf = (id: string) => comparison?.ranking.find((r) => r.id === id);

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('steps.5.kicker')}</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('steps.5.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('steps.5.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-slate-400 mr-1">{t('compare.pick')}:</span>
          {allUniversities.slice(0, 6).map((u) => {
            const isSelected = activeUnis.some((a) => a.id === u.id);
            return (
              <button key={u.id} onClick={() => onToggleUni(u.id)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <span>{u.shortName}</span>
                <span className="text-[10px] opacity-70">{isSelected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI verdict */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> {t('compare.aiTitle')}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('compare.aiHint')}</p>
          </div>
          <button type="button" onClick={runComparison} disabled={comparing || activeUnis.length < 2} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50">
            {comparing ? <><Loader2 className="w-4 h-4 animate-spin" /> {compareCaption || t('ai.analyze.running')}</> : <><Sparkles className="w-4 h-4" /> {comparison ? t('common.retry') : t('compare.run')}</>}
          </button>
        </div>
        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
        {comparison && (
          <div className="mt-4 space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200"><Markdown text={comparison.verdict} /></div>
            {comparison.ranking.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {comparison.ranking.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900">#{r.rank} {r.name}</div>
                      <div className="text-right shrink-0"><div className="text-sm font-extrabold">{r.score}</div>{r.chance !== null && <div className="text-[10px] text-slate-500">{t('ai.analyze.chance')} {r.chance}%</div>}</div>
                    </div>
                    <p className="text-slate-700">{r.summary}</p>
                    {r.pros?.length > 0 && <ul className="list-disc pl-4 text-emerald-800 space-y-0.5">{r.pros.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                    {r.cons?.length > 0 && <ul className="list-disc pl-4 text-rose-800 space-y-0.5">{r.cons.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                    {r.bestFor && <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-700">{t('compare.bestFor')}:</span> {r.bestFor}</p>}
                  </div>
                ))}
              </div>
            )}
            {comparison.matrixHighlights?.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">{t('compare.highlights')}</div>
                <ul className="space-y-1">
                  {comparison.matrixHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /><span><strong className="text-slate-900">{h.criterion}:</strong> {allUniversities.find((u) => u.id === h.winnerId)?.shortName || h.winnerId} — {h.note}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {comparison.strategy && <div className="p-3 rounded-xl bg-white border border-slate-200"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{t('compare.strategy')}</div><Markdown text={comparison.strategy} compact /></div>}
              {comparison.risks?.length > 0 && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200"><div className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mb-1">{t('ai.analyze.risks')}</div><ul className="list-disc pl-4 text-amber-900 space-y-0.5">{comparison.risks.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
            </div>
            {comparison.nextSteps?.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-1"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{t('ai.analyze.nextSteps')}</div><button type="button" onClick={addSteps} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:underline"><ListPlus className="w-3 h-3" /> {t('ai.analyze.addTasks')}</button></div>
                <ul className="space-y-1">{comparison.nextSteps.map((s, i) => <li key={i} className="flex justify-between gap-2 text-slate-700"><span>{s.title}</span><span className="text-[10px] text-slate-400 shrink-0">{s.deadline}</span></li>)}</ul>
              </div>
            )}
            <div className="text-[10px] text-slate-400">{comparison.model}</div>
          </div>
        )}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 sm:p-5 w-1/4 text-xs font-bold uppercase text-slate-400 tracking-wider">{t('compare.criterion')}</th>
              {activeUnis.map((uni) => {
                const r = rankOf(uni.id);
                return (
                  <th key={uni.id} className="p-4 sm:p-5 text-slate-900 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">{uni.city}</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{uni.matchScore}% Match</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base leading-tight text-slate-900">{uni.shortName}</h4>
                        <p className="text-xs text-slate-500 font-normal">{uni.country}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{uni.fitTier} Tier</span>
                        {r && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">AI #{r.rank}</span>}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<Percent className="w-4 h-4 text-slate-500" />, t('compare.row.chance'))}
              {activeUnis.map((uni) => {
                const c = chances[uni.id];
                return (
                  <td key={uni.id} className="p-4 sm:p-5">
                    <div className="flex items-end gap-2"><span className="text-2xl font-extrabold text-slate-900 leading-none">{c.probability}%</span><span className="text-[11px] text-slate-500 mb-0.5">{c.tier}</span></div>
                    <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden"><div className="h-full bg-slate-900 rounded-full" style={{ width: `${c.probability}%` }} /></div>
                    <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600">{c.factors.slice(0, 3).map((f, i) => <li key={i} className={f.impact >= 0 ? 'text-emerald-800' : 'text-rose-800'}>{f.impact >= 0 ? '+' : ''}{f.impact} · {f.note}</li>)}</ul>
                  </td>
                );
              })}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<Coins className="w-4 h-4 text-slate-500" />, t('compare.row.finance'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1">
                  <div className="font-bold text-slate-900 text-xs">{uni.hasFullGrantOrScholarship ? t('compare.fullFunding') : `$${uni.tuitionUSDPerYear.toLocaleString()} / ${t('compare.perYear')}`}</div>
                  <div className="text-[11px] text-slate-500">{t('compare.living')}: ${uni.livingCostUSDPerYear.toLocaleString()} / {t('compare.perYear')}</div>
                  <div className="text-slate-800 font-medium">{tx(uni.scholarshipName)}</div>
                  <div className="text-slate-500 text-[11px] leading-relaxed">{tx(uni.scholarshipDescription)}</div>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<GraduationCap className="w-4 h-4 text-slate-500" />, t('compare.row.thresholds'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">GPA:</span><span className="font-bold text-slate-800">{uni.minGpa} / 4.0</span></div>
                  <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">IELTS:</span><span className="font-bold text-slate-900">{uni.minIelts}+</span></div>
                  {uni.minSat && <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">SAT:</span><span className="font-bold text-slate-900">{uni.minSat}+</span></div>}
                  {uni.minUnt && <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">ЕНТ:</span><span className="font-bold text-slate-900">{uni.minUnt}+</span></div>}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100"><span className="text-slate-500">{t('compare.acceptance')}:</span><span className="font-mono font-bold text-slate-700">{uni.acceptanceRate}</span></div>
                  {uni.admissions?.testPolicy && <div className="text-[11px] text-slate-500">{tx(uni.admissions.testPolicy)}</div>}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<ShieldCheck className="w-4 h-4 text-slate-500" />, t('compare.row.life'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1.5 text-[11px]">
                  {uni.campus && <div className="flex items-center justify-between"><span className="text-slate-500">{t('compare.safety')}:</span><span className="font-bold text-slate-900">{uni.campus.neighborhoodSafety}/10</span></div>}
                  {uni.stats?.internationalShare !== undefined && <div className="flex items-center justify-between"><span className="text-slate-500">{t('compare.intl')}:</span><span className="font-bold text-slate-900">{uni.stats.internationalShare}</span></div>}
                  {uni.stats?.graduateEmployment !== undefined && <div className="flex items-center justify-between"><span className="text-slate-500">{t('compare.employment')}:</span><span className="font-bold text-slate-900">{uni.stats.graduateEmployment}</span></div>}
                  {uni.environment && <div className="flex items-start gap-1.5 text-slate-600 pt-1 border-t border-slate-100"><Thermometer className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" /><span>{tx(uni.environment.climate.split(':')[0])}</span></div>}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<Calendar className="w-4 h-4 text-slate-500" />, t('compare.row.deadlines'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5 space-y-1">
                  {uni.earlyDeadline && <div><span className="text-[10px] uppercase font-semibold text-slate-400 block">Early:</span><span className="font-semibold text-slate-800">{tx(uni.earlyDeadline)}</span></div>}
                  <div><span className="text-[10px] uppercase font-semibold text-slate-400 block">{t('compare.regularRound')}:</span><span className="font-bold text-slate-900">{tx(uni.regularDeadline)}</span></div>
                  <a href={uni.officialPortalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline pt-1"><ExternalLink className="w-3 h-3" /> {t('common.officialPortal')}</a>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<Briefcase className="w-4 h-4 text-slate-500" />, t('compare.row.programs'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5"><div className="flex flex-wrap gap-1">{uni.flagshipPrograms.slice(0, 5).map((p) => <span key={p} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">{p}</span>)}</div></td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<Building className="w-4 h-4 text-slate-500" />, t('compare.row.advantages'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5"><ul className="space-y-1.5">{uni.advantages.map((adv, i) => <li key={i} className="flex items-start gap-1.5 text-slate-700 leading-snug"><Check className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" /><span>{tx(adv)}</span></li>)}</ul></td>
              ))}
            </tr>

            <tr className="hover:bg-slate-50/50 transition">
              {rowHead(<AlertCircle className="w-4 h-4 text-slate-500" />, t('compare.row.cautions'))}
              {activeUnis.map((uni) => (
                <td key={uni.id} className="p-4 sm:p-5"><ul className="space-y-1.5">{uni.cautions.map((c, i) => <li key={i} className="flex items-start gap-1.5 text-slate-600 leading-snug"><span className="text-slate-400 shrink-0 font-bold">•</span><span>{tx(c)}</span></li>)}</ul></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /><span>{t('steps.5.back')}</span></button>
        <button type="button" onClick={onNext} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition"><span>{t('steps.5.next')}</span><ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
