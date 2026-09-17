import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Trophy, Loader2, Sparkles, Search, ExternalLink, CalendarPlus, Briefcase, Globe, MapPin, Wifi, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ApplicantProfile, Olympiad, OlympiadAdvice, PortfolioItemInput } from '../types';
import { olympiadsApi, tasksApi, ApiError } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../context/ToastContext';
import { Markdown } from './ui/Markdown';
import { useProgressCaptions } from '../hooks/useProgressCaptions';

interface OlympiadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  profile: ApplicantProfile;
  onAddToPortfolio: (draft: Partial<PortfolioItemInput>) => void;
}

type Tab = 'forYou' | 'catalog' | 'strategy';

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_KK = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'];

export const OlympiadsModal: React.FC<OlympiadsModalProps> = ({ isOpen, onClose, isAuthenticated, onOpenAuth, profile, onAddToPortfolio }) => {
  const { t, lang } = useI18n();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>('forYou');
  const [catalog, setCatalog] = useState<Olympiad[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; label: string }[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [recommended, setRecommended] = useState<Olympiad[]>([]);
  const [calendar, setCalendar] = useState<{ month: string; items: { id: string; shortName: string; phase: string; url: string }[] }[]>([]);
  const [advice, setAdvice] = useState<OlympiadAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [advising, setAdvising] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const monthNames = lang === 'en' ? MONTHS_EN : lang === 'kk' ? MONTHS_KK : MONTHS_RU;

  const adviceCaption = useProgressCaptions(advising, [t('progress.reading'), t('progress.olympiads'), t('progress.plan'), t('progress.finishing')]);

  const describeError = useCallback(
    (err: unknown) => (err instanceof ApiError ? (err.code === 'NETWORK' ? t('common.backendOffline') : err.message) : err instanceof Error ? err.message : t('common.error')),
    [t],
  );

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    Promise.all([olympiadsApi.list(), olympiadsApi.recommend(profile, 14)])
      .then(([list, rec]) => {
        setCatalog(list.items);
        setSubjects(list.subjects);
        setCategories(list.categories);
        setRecommended(rec.items);
        setCalendar(rec.calendar);
      })
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, [isOpen, profile, describeError]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return catalog.filter((o) => {
      if (subject && !o.subjects.includes(subject)) return false;
      if (category && o.category !== category) return false;
      if (region && o.region !== region) return false;
      if (onlineOnly && !o.online) return false;
      if (query && !`${o.name} ${o.shortName} ${o.nameEn} ${o.organizer} ${o.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [catalog, q, subject, category, region, onlineOnly]);

  if (!isOpen) return null;

  const runAdvice = async () => {
    setAdvising(true);
    setError(null);
    try {
      setAdvice(await olympiadsApi.advice(profile, lang, 8));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setAdvising(false);
    }
  };

  const addRegistrationTask = async (o: Olympiad) => {
    if (!isAuthenticated) {
      notify(t('common.loginRequired'), 'info');
      onOpenAuth();
      return;
    }
    try {
      const nextMonth = nextActiveDate(o.monthsActive);
      await tasksApi.create({ title: `${t('olympiads.registerFor')} ${o.shortName}`, description: `${o.timeline.registration}. ${o.officialUrl}`, category: 'olympiad', dueDate: nextMonth, source: 'olympiads' });
      notify(t('olympiads.taskAdded'), 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const toPortfolio = (o: Olympiad) => {
    if (!isAuthenticated) {
      notify(t('common.loginRequired'), 'info');
      onOpenAuth();
      return;
    }
    onAddToPortfolio({
      type: o.category === 'olympiad' ? 'olympiad' : 'competition',
      title: o.shortName,
      organization: o.organizer,
      level: o.level === 'international' ? 'international' : o.level === 'republican' ? 'republican' : o.level === 'regional' ? 'regional' : o.level === 'city' ? 'city' : 'school',
      subjects: o.subjects,
      olympiadId: o.id,
      links: [o.officialUrl],
    });
  };

  const recognitionBar = (o: Olympiad) => {
    const regions = profile.targetRegions?.length ? profile.targetRegions : ['kazakhstan', 'usa_canada', 'europe', 'asia'];
    const map: Record<string, keyof Olympiad['recognition']> = { kazakhstan: 'kazakhstan', usa_canada: 'usa', europe: 'europe', asia: 'asia' };
    return (
      <div className="flex flex-wrap gap-1.5">
        {regions.map((r) => {
          const v = o.recognition[map[r]];
          return (
            <span key={r} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600">
              {t(`region.${r}`)} <span className="font-bold text-slate-900">{'●'.repeat(v)}<span className="text-slate-300">{'●'.repeat(5 - v)}</span></span>
            </span>
          );
        })}
      </div>
    );
  };

  const Card = ({ o, showFit }: { o: Olympiad; showFit?: boolean }) => {
    const open = expanded === o.id;
    return (
      <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-semibold">{categories[o.category] || o.category}</span>
              <span className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-600 font-semibold">{t(`olympiads.level.${o.level}`)}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                {o.online ? <Wifi className="w-3 h-3" /> : o.region === 'kazakhstan' ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {t(`olympiads.region.${o.region}`)}
              </span>
              <span className="text-[10px] text-slate-400">{t('olympiads.grades')} {o.grades[0]}–{o.grades[o.grades.length - 1]}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm leading-snug">{o.shortName}</div>
            <div className="text-[11px] text-slate-500">{o.organizer}</div>
          </div>
          {showFit && o.fit !== undefined && (
            <div className="text-right shrink-0">
              <div className="text-xl font-extrabold text-slate-900 leading-none">{o.fit}<span className="text-[10px] text-slate-400">%</span></div>
              <div className="text-[10px] text-slate-500">{t('olympiads.fit')}</div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-700 mt-2 leading-relaxed">{o.description}</p>
        {showFit && o.reasons?.length ? (
          <ul className="mt-1.5 space-y-0.5">
            {o.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="text-[11px] text-emerald-800 flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{r}</li>
            ))}
          </ul>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-400 uppercase font-semibold">{t('olympiads.registration')}</div><div className="text-slate-800">{o.timeline.registration}</div></div>
          <div className="p-2 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-400 uppercase font-semibold">{t('olympiads.finals')}</div><div className="text-slate-800">{o.timeline.finals}</div></div>
          <div className="p-2 rounded-lg bg-slate-50"><div className="text-[10px] text-slate-400 uppercase font-semibold">{t('olympiads.cost')}</div><div className="text-slate-800">{o.cost}</div></div>
        </div>

        <div className="mt-2.5">{recognitionBar(o)}</div>

        {open && (
          <div className="mt-3 space-y-2 text-[11px] border-t border-slate-100 pt-2.5">
            <div><span className="font-semibold text-slate-800">{t('olympiads.eligibility')}:</span> {o.eligibility}</div>
            <div><span className="font-semibold text-slate-800">{t('olympiads.stages')}:</span> {o.timeline.stages}</div>
            <div>
              <div className="font-semibold text-slate-800 mb-0.5">{t('olympiads.benefits')}</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">{o.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-900"><span className="font-semibold">{t('olympiads.tips')}:</span> {o.tips}</div>
            <div className="text-slate-500">{t('olympiads.difficulty')}: {'★'.repeat(o.difficulty)}<span className="text-slate-300">{'★'.repeat(5 - o.difficulty)}</span> · {t('olympiads.format')}: {t(`olympiads.fmt.${o.format}`)} · {o.languages.join('/')}</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <a href={o.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"><ExternalLink className="w-3 h-3" /> {t('olympiads.site')}</a>
          <button type="button" onClick={() => addRegistrationTask(o)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50"><CalendarPlus className="w-3 h-3" /> {t('olympiads.addTask')}</button>
          <button type="button" onClick={() => toPortfolio(o)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50"><Briefcase className="w-3 h-3" /> {t('olympiads.addPortfolio')}</button>
          <button type="button" onClick={() => setExpanded(open ? null : o.id)} className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900">
            {open ? <>{t('common.hide')} <ChevronUp className="w-3 h-3" /></> : <>{t('common.details')} <ChevronDown className="w-3 h-3" /></>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0"><Trophy className="w-4 h-4" /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">{t('olympiads.title')}</h3>
              <p className="text-[11px] text-slate-500 truncate">{t('olympiads.subtitle')} · {catalog.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
              {(['forYou', 'catalog', 'strategy'] as Tab[]).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${tab === k ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t(`olympiads.tab.${k}`)}</button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100" aria-label={t('common.close')}><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="md:hidden px-6 pt-3 flex gap-2">
          {(['forYou', 'catalog', 'strategy'] as Tab[]).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border ${tab === k ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-600 border-slate-200'}`}>{t(`olympiads.tab.${k}`)}</button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}
          {loading && <div className="flex items-center gap-2 text-slate-500 justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>}

          {tab === 'forYou' && !loading && (
            <>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">{t('olympiads.calendarTitle')}</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {calendar.map((m) => {
                    const mi = Number(m.month.slice(5)) - 1;
                    return (
                      <div key={m.month} className={`rounded-lg p-1.5 border text-center ${m.items.length ? 'bg-white border-slate-200' : 'bg-transparent border-dashed border-slate-200'}`}>
                        <div className="text-[10px] font-bold text-slate-700 uppercase">{monthNames[mi]}</div>
                        <div className="mt-1 space-y-0.5">
                          {m.items.slice(0, 3).map((it) => (
                            <a key={it.id} href={it.url} target="_blank" rel="noreferrer" title={it.shortName} className={`block truncate text-[9px] rounded px-1 py-0.5 ${it.phase === 'registration' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{it.shortName}</a>
                          ))}
                          {m.items.length > 3 && <div className="text-[9px] text-slate-400">+{m.items.length - 3}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> {t('olympiads.phaseRegistration')}</span><span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> {t('olympiads.phaseActive')}</span></div>
              </div>
              <div className="text-[11px] text-slate-500">{t('olympiads.forYouHint')}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{recommended.map((o) => <Card key={o.id} o={o} showFit />)}</div>
            </>
          )}

          {tab === 'catalog' && !loading && (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('olympiads.search')} className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"><option value="">{t('olympiads.allSubjects')}</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"><option value="">{t('olympiads.allCategories')}</option>{Object.entries(categories).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"><option value="">{t('olympiads.allRegions')}</option>{['kazakhstan', 'cis', 'international', 'online'].map((r) => <option key={r} value={r}>{t(`olympiads.region.${r}`)}</option>)}</select>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 px-2"><input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="rounded" /> {t('olympiads.onlineOnly')}</label>
              </div>
              <div className="text-[11px] text-slate-500">{t('olympiads.found')}: <strong className="text-slate-900">{filtered.length}</strong></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{filtered.map((o) => <Card key={o.id} o={o} />)}</div>
            </>
          )}

          {tab === 'strategy' && !loading && (
            <>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <p className="text-slate-600 leading-relaxed">{t('olympiads.strategyIntro')}</p>
                <button type="button" onClick={runAdvice} disabled={advising} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {advising ? <><Loader2 className="w-4 h-4 animate-spin" /> {adviceCaption || t('ai.analyze.running')}</> : <><Sparkles className="w-4 h-4" /> {t('olympiads.buildStrategy')}</>}
                </button>
              </div>
              {advice && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white"><Markdown text={advice.summary} /></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {advice.picks.map((p, i) => (
                      <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 text-sm">{i + 1}. <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.name}</a></div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold shrink-0">{p.targetResult}</span>
                        </div>
                        <p className="text-[11px] text-slate-700">{p.why}</p>
                        <p className="text-[11px] text-slate-600"><span className="font-semibold">{t('olympiads.whenToRegister')}:</span> {p.whenToRegister}</p>
                        <p className="text-[11px] text-slate-600"><span className="font-semibold">{t('olympiads.prepPlan')}:</span> {p.prepPlan}</p>
                        {(() => {
                          const o = catalog.find((x) => x.id === p.id);
                          return o ? (
                            <div className="flex gap-2 pt-1">
                              <button type="button" onClick={() => addRegistrationTask(o)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50"><CalendarPlus className="w-3 h-3" /> {t('olympiads.addTask')}</button>
                              <button type="button" onClick={() => toPortfolio(o)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50"><Briefcase className="w-3 h-3" /> {t('olympiads.addPortfolio')}</button>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                  {advice.yearPlan && <div className="p-4 rounded-2xl border border-slate-200 bg-white"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">{t('olympiads.yearPlan')}</div><Markdown text={advice.yearPlan} compact /></div>}
                  {advice.warnings?.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200"><div className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mb-1">{t('olympiads.warnings')}</div><ul className="list-disc pl-4 text-amber-900 space-y-0.5">{advice.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
                  )}
                  <div className="text-[10px] text-slate-400">{advice.model}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function nextActiveDate(months: number[]): string | null {
  if (!months?.length) return null;
  const now = new Date();
  const cur = now.getMonth() + 1;
  let best = 13;
  for (const m of months) {
    const d = (m - cur + 12) % 12;
    if (d < best) best = d;
  }
  const target = new Date(now.getFullYear(), now.getMonth() + best, 15);
  return target.toISOString().slice(0, 10);
}
