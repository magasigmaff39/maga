import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Briefcase,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Sparkles,
  Link2,
  FileText,
  ListPlus,
  AlertTriangle,
  Trophy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  EyeOff,
  Eye,
  Star,
  Quote,
  BadgeCheck,
  ArrowRight,
  Wand2,
  ListChecks,
  Target,
} from 'lucide-react';
import type {
  ApplicantProfile,
  PortfolioEvaluation,
  PortfolioFieldId,
  PortfolioItem,
  PortfolioItemInput,
  PortfolioItemType,
  PortfolioLevel,
  PortfolioRecommendation,
  PortfolioResult,
  PortfolioScore,
  TaskCategory,
  UploadedDocument,
} from '../types';
import { portfolioApi, tasksApi, documentsApi, ApiError, type PortfolioMeta } from '../lib/api';
import { UNIVERSITY_DATABASE } from '../data/universities';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../context/ToastContext';
import { Markdown } from './ui/Markdown';
import { useProgressCaptions } from '../hooks/useProgressCaptions';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  profile: ApplicantProfile;
  selectedForCompare: string[];
  /** Prefill the form (e.g. from the olympiad catalogue) */
  draft?: Partial<PortfolioItemInput> | null;
  onDraftConsumed?: () => void;
}

type Tab = 'items' | 'evaluate';

const emptyForm = (): PortfolioItemInput => ({
  title: '',
  type: 'olympiad',
  organization: '',
  level: null,
  result: null,
  role: '',
  description: '',
  startDate: null,
  endDate: null,
  hoursPerWeek: null,
  links: [],
  documentId: null,
});

const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1';
const panelCls = 'rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)]';
const softPanelCls = 'rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)]';

/** Colour scale for the 1–10 significance score. */
const scoreTone = (score: number) =>
  score >= 9
    ? { chip: 'bg-emerald-500 text-white', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900', bar: 'bg-emerald-500' }
    : score >= 5
      ? { chip: 'bg-blue-600 text-white', soft: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900', bar: 'bg-blue-500' }
      : { chip: 'bg-amber-500 text-white', soft: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900', bar: 'bg-amber-500' };

const recTone = (rec: PortfolioRecommendation) =>
  rec === 'highlight'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900'
    : rec === 'keep'
      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900'
      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900';

const ScoreRing = ({ value, size = 88 }: { value: number; size?: number }) => {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0" role="img" aria-label={`${value}/100`}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="8" fill="none" className="ring-track" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#pfRing)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <defs>
        <linearGradient id="pfRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size / 4.2} fontWeight="800" className="fill-slate-900 dark:fill-white">
        {value}
      </text>
    </svg>
  );
};

const Bar = ({ value, computed }: { value: number; computed?: number }) => (
  <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
    <div className="absolute inset-y-0 left-0 rounded-full bg-slate-900 dark:bg-white transition-all duration-500" style={{ width: `${Math.max(2, value)}%` }} />
    {computed !== undefined && <div className="absolute inset-y-0 w-0.5 bg-blue-500" style={{ left: `${computed}%` }} title={`${computed}`} />}
  </div>
);

/** 1–10 pill with ten dots. */
const ScoreChip: React.FC<{ score: number; label: string; muted?: boolean }> = ({ score, label, muted = false }) => {
  const tone = scoreTone(score);
  return (
    <div className={`flex items-center gap-2 ${muted ? 'opacity-70' : ''}`} title={label}>
      <span className={`inline-flex items-center justify-center min-w-[2.6rem] px-2 py-1 rounded-lg text-sm font-extrabold tabular-nums ${muted ? 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-100' : tone.chip}`}>
        {score}
        <span className="text-[10px] font-semibold opacity-80 ml-0.5">/10</span>
      </span>
      <span className="hidden sm:flex items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < score ? (muted ? 'bg-slate-400 dark:bg-zinc-500' : tone.bar) : 'bg-slate-200 dark:bg-zinc-800'}`} />
        ))}
      </span>
    </div>
  );
};

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ isOpen, onClose, isAuthenticated, onOpenAuth, profile, selectedForCompare, draft, onDraftConsumed }) => {
  const { t, tx, lang } = useI18n();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>('items');
  const [meta, setMeta] = useState<PortfolioMeta | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [score, setScore] = useState<PortfolioScore | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PortfolioItemInput>(emptyForm());
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [field, setField] = useState<PortfolioFieldId | ''>('');
  const [targetIds, setTargetIds] = useState<string[]>([]);
  // Default: the engine picks the universities from the applicant's preferences; a manual list is opt-in.
  const [manualTargets, setManualTargets] = useState(false);
  const [evaluation, setEvaluation] = useState<PortfolioEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const evalCaption = useProgressCaptions(evaluating, [t('progress.reading'), t('progress.rubric'), t('progress.universities'), t('progress.plan'), t('progress.finishing')]);

  const describeError = useCallback(
    (err: unknown) => (err instanceof ApiError ? (err.code === 'NETWORK' ? t('common.backendOffline') : err.message) : err instanceof Error ? err.message : t('common.error')),
    [t],
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [m, list, docs] = await Promise.all([meta ? Promise.resolve(meta) : portfolioApi.meta(), portfolioApi.list(field || undefined), documentsApi.list().catch(() => ({ items: [] }))]);
      setMeta(m);
      setItems(list.items);
      setScore(list.score);
      setDocuments(docs.items);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, describeError, field, meta]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  useEffect(() => {
    if (isOpen && !targetIds.length) {
      const initial = Array.from(new Set([...(profile.targetUniversityIds || []), ...selectedForCompare])).slice(0, 6);
      setTargetIds(initial);
    }
  }, [isOpen, profile.targetUniversityIds, selectedForCompare, targetIds.length]);

  useEffect(() => {
    if (isOpen && draft) {
      setForm({ ...emptyForm(), ...draft, title: draft.title || '' });
      setEditingId(null);
      setFormOpen(true);
      setTab('items');
      onDraftConsumed?.();
    }
  }, [isOpen, draft, onDraftConsumed]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const typeLabel = (id: string) => meta?.types.find((x) => x.id === id)?.label || id;
  const levelLabel = (id: string | null) => (id ? meta?.levels.find((x) => x.id === id)?.label || id : '');
  const resultLabel = (id: string | null) => (id && id !== 'none' ? meta?.results.find((x) => x.id === id)?.label || id : '');

  const activeItems = useMemo(() => items.filter((it) => !it.excluded), [items]);
  const ratedCount = useMemo(() => items.filter((it) => it.ai).length, [items]);

  const sortedForList = useMemo(() => {
    const val = (it: PortfolioItem) => it.ai?.score ?? it.preScore ?? 0;
    return [...items].sort((a, b) => Number(a.excluded) - Number(b.excluded) || val(b) - val(a));
  }, [items]);

  if (!isOpen) return null;

  const startEdit = (it: PortfolioItem) => {
    setEditingId(it.id);
    const { ai: _ai, preScore: _pre, ...rest } = it;
    void _ai;
    void _pre;
    setForm({ ...rest });
    setMoreOpen(Boolean(it.organization || it.role || it.startDate || it.endDate || it.hoursPerWeek || it.links.length || it.documentId));
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      if (editingId) await portfolioApi.update(editingId, form);
      else await portfolioApi.create(form);
      setForm(emptyForm());
      setEditingId(null);
      setFormOpen(false);
      setMoreOpen(false);
      await load();
      notify(t('portfolio.saved'), 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (it: PortfolioItem) => {
    try {
      await portfolioApi.remove(it.id);
      await load();
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const toggleExcluded = async (it: PortfolioItem) => {
    setTogglingId(it.id);
    try {
      const next = await portfolioApi.update(it.id, { excluded: !it.excluded });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...next, preScore: x.preScore } : x)));
      // Score changes with the application set.
      const list = await portfolioApi.list(field || undefined);
      setItems(list.items);
      setScore(list.score);
    } catch (err) {
      notify(describeError(err), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const addLink = () => {
    const v = linkInput.trim();
    if (!/^https?:\/\//i.test(v)) return;
    setForm((f) => ({ ...f, links: [...(f.links || []), v].slice(0, 6) }));
    setLinkInput('');
  };

  const runEvaluation = async () => {
    setEvaluating(true);
    setEvalError(null);
    setTab('evaluate');
    try {
      const res = await portfolioApi.evaluate({ field: field || undefined, universityIds: manualTargets ? targetIds : [], profile, language: lang });
      setEvaluation(res);
      // Verdicts are persisted on the entries — refresh so the list shows them too.
      const list = await portfolioApi.list(field || undefined);
      setItems(list.items);
      setScore(list.score);
    } catch (err) {
      setEvalError(describeError(err));
    } finally {
      setEvaluating(false);
    }
  };

  const addPlanToTasks = async () => {
    if (!evaluation?.actionPlan?.length) return;
    try {
      const res = await tasksApi.bulkCreate(
        evaluation.actionPlan.map((a) => ({ title: a.title.slice(0, 200), description: a.why, category: (a.category || 'portfolio') as TaskCategory, dueDate: /^\d{4}-\d{2}/.test(a.deadline) ? a.deadline.slice(0, 10) : null, source: 'portfolio-eval' })),
      );
      notify(`${t('ai.analyze.addTasks')}: ${res.created.length}`, 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const tierCls = (tier: string) =>
    tier === 'exceptional'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900'
      : tier === 'strong'
        ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900'
        : tier === 'developing'
          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900'
          : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';

  const evaluatedItems = evaluation ? [...evaluation.items].sort((a, b) => b.score - a.score) : [];

  const TabSwitch = ({ className = '' }: { className?: string }) => (
    <div className={`grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 ${className}`}>
      {(['items', 'evaluate'] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setTab(k)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition inline-flex items-center justify-center gap-1.5 ${
            tab === k ? 'bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
          aria-pressed={tab === k}
        >
          {k === 'evaluate' && <Sparkles className="w-3.5 h-3.5" />}
          {t(`portfolio.tab.${k}`)}
          {k === 'items' && items.length > 0 && <span className="text-[10px] font-semibold opacity-60">{items.length}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('portfolio.title')}
    >
      <div className="w-full max-w-5xl max-h-[94vh] rounded-[28px] overflow-hidden flex flex-col bg-[var(--surface-raised)] border border-[var(--line)] shadow-[0_40px_120px_-30px_rgba(2,6,23,0.6)] animate-fadeInUp">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">{t('portfolio.title')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{t('portfolio.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TabSwitch className="hidden sm:grid" />
            <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800" aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="sm:hidden px-5 pt-3">
          <TabSwitch />
        </div>

        {!isAuthenticated ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-zinc-300">{t('common.loginRequired')}</p>
            <button type="button" onClick={onOpenAuth} className="ar-btn ar-btn-primary">
              {t('header.login')}
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* ============================================================ ITEMS */}
            {tab === 'items' && (
              <>
                {/* Summary strip */}
                <div className={`${softPanelCls} p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center`}>
                  {score && <ScoreRing value={score.total} />}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">{t('portfolio.scoreTitle')}</span>
                      {score?.tier && <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tierCls(score.tier)}`}>{t(`portfolio.tier.${score.tier}`)}</span>}
                      {score && <span className="text-[11px] text-slate-500 dark:text-zinc-400">{score.fieldTitle}</span>}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{t('portfolio.itemsHint')}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span>
                        {t('portfolio.count')}: <strong className="text-slate-900 dark:text-white">{activeItems.length}</strong>
                        {items.length - activeItems.length > 0 && <span> · {items.length - activeItems.length} {t('portfolio.excludedCount')}</span>}
                      </span>
                      <span>
                        {t('portfolio.aiScore')}: <strong className="text-slate-900 dark:text-white">{ratedCount}/{items.length}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm());
                        setMoreOpen(false);
                        setFormOpen((v) => !v);
                      }}
                      className="ar-btn ar-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t('portfolio.add')}
                    </button>
                    <button
                      type="button"
                      onClick={runEvaluation}
                      disabled={evaluating || !items.length}
                      className="ar-btn ar-btn-ghost inline-flex items-center gap-1.5 px-4 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-500" />} {t('portfolio.evaluateNow')}
                    </button>
                  </div>
                </div>

                {/* Quick-add form (doc §7: name · level · result · short description) */}
                {formOpen && (
                  <form onSubmit={save} className={`${panelCls} p-4 sm:p-5 space-y-3.5 animate-fadeIn`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{editingId ? t('common.edit') : t('portfolio.add')}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">{t('portfolio.quickHint')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>{t('portfolio.f.title')}</label>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('portfolio.f.titlePh')} className="ar-input" required maxLength={160} autoFocus />
                      </div>
                      <div>
                        <label className={labelCls}>{t('portfolio.f.type')}</label>
                        <div className="relative">
                          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PortfolioItemType })} className="ar-input appearance-none pr-8">
                            {(meta?.types || []).map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>{t('portfolio.f.level')}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(meta?.levels || []).map((x) => {
                            const on = form.level === x.id;
                            return (
                              <button
                                key={x.id}
                                type="button"
                                onClick={() => setForm({ ...form, level: on ? null : (x.id as PortfolioLevel) })}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                  on ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-zinc-900 dark:border-white' : 'border-[var(--line)] text-slate-600 dark:text-zinc-300 hover:border-slate-400'
                                }`}
                              >
                                {x.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t('portfolio.f.result')}</label>
                        <div className="relative">
                          <select value={form.result || ''} onChange={(e) => setForm({ ...form, result: (e.target.value || null) as PortfolioResult | null })} className="ar-input appearance-none pr-8">
                            <option value="">—</option>
                            {(meta?.results || []).map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>{t('portfolio.f.description')}</label>
                      <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t('portfolio.f.descriptionPh')} className="ar-input resize-y" maxLength={2000} />
                    </div>

                    <button type="button" onClick={() => setMoreOpen((v) => !v)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {moreOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {moreOpen ? t('portfolio.less') : t('portfolio.more')}
                    </button>

                    {moreOpen && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <label className={labelCls}>{t('portfolio.f.organization')}</label>
                            <input value={form.organization || ''} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="РФМШ, Astana Hub, MIT…" className="ar-input" maxLength={160} />
                          </div>
                          <div>
                            <label className={labelCls}>{t('portfolio.f.role')}</label>
                            <input value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={t('portfolio.f.rolePh')} className="ar-input" maxLength={120} />
                          </div>
                          <div>
                            <label className={labelCls}>{t('portfolio.f.start')}</label>
                            <input type="month" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value || null })} className="ar-input" />
                          </div>
                          <div>
                            <label className={labelCls}>{t('portfolio.f.end')}</label>
                            <input type="month" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} className="ar-input" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>{t('portfolio.f.hours')}</label>
                            <input type="number" min={0} max={80} value={form.hoursPerWeek ?? ''} onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value === '' ? null : Number(e.target.value) })} className="ar-input" />
                          </div>
                          <div>
                            <label className={labelCls}>{t('portfolio.f.links')}</label>
                            <div className="flex gap-2">
                              <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://github.com/…" className="ar-input" />
                              <button type="button" onClick={addLink} className="px-3 rounded-xl border border-[var(--line)] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800" aria-label={t('common.add')}>
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {!!form.links?.length && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {form.links.map((l) => (
                                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-700 dark:text-zinc-200 max-w-full">
                                    <span className="truncate max-w-[180px]">{l.replace(/^https?:\/\//, '')}</span>
                                    <button type="button" onClick={() => setForm({ ...form, links: form.links!.filter((x) => x !== l) })} className="text-slate-400 hover:text-rose-600">
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className={labelCls}>{t('portfolio.f.document')}</label>
                            <select value={form.documentId || ''} onChange={(e) => setForm({ ...form, documentId: e.target.value || null })} className="ar-input">
                              <option value="">{t('portfolio.f.noDocument')}</option>
                              {documents.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.originalName}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">{t('portfolio.f.documentHint')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormOpen(false);
                          setEditingId(null);
                        }}
                        className="ar-btn ar-btn-ghost px-4 py-2 text-xs"
                      >
                        {t('common.cancel')}
                      </button>
                      <button type="submit" disabled={saving || !form.title?.trim()} className="ar-btn ar-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} {editingId ? t('common.save') : t('portfolio.add')}
                      </button>
                    </div>
                  </form>
                )}

                {/* List */}
                {loading && !items.length ? (
                  <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
                  </div>
                ) : !items.length ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[var(--line-strong)] text-center text-slate-500 dark:text-zinc-400 space-y-2">
                    <Trophy className="w-7 h-7 mx-auto text-slate-300 dark:text-zinc-600" />
                    <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{t('portfolio.emptyTitle')}</p>
                    <p className="max-w-md mx-auto">{t('portfolio.emptyHint')}</p>
                    {!formOpen && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(emptyForm());
                          setFormOpen(true);
                        }}
                        className="ar-btn ar-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t('portfolio.add')}
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {sortedForList.map((it) => {
                      const scoreValue = it.ai?.score ?? it.preScore ?? null;
                      const rec = it.ai?.recommendation;
                      return (
                        <li key={it.id} className={`${panelCls} p-4 transition ${it.excluded ? 'opacity-60' : 'hover:border-slate-400 dark:hover:border-zinc-600'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{typeLabel(it.type)}</span>
                                {it.excluded && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    <EyeOff className="w-3 h-3" /> {t('portfolio.excludedBadge')}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 ${it.excluded ? 'line-through decoration-slate-400' : ''}`}>{it.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{[it.organization, levelLabel(it.level), resultLabel(it.result), it.role].filter(Boolean).join(' · ')}</p>
                              {it.description && <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed line-clamp-2">{it.description}</p>}

                              {it.ai ? (
                                <div className="mt-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)] p-3 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                      <Sparkles className="w-3 h-3 text-blue-500" /> {t('portfolio.conclusion')}
                                    </span>
                                    {rec && <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${recTone(rec)}`}>{t(`portfolio.rec.${rec}`)}</span>}
                                    {it.ai.useInEssay && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-violet-200 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900">
                                        <Quote className="w-3 h-3" /> {t('portfolio.useInEssay')}
                                      </span>
                                    )}
                                  </div>
                                  {it.ai.verdict && <p className="text-[11px] text-slate-700 dark:text-zinc-200 leading-relaxed">{it.ai.verdict}</p>}
                                </div>
                              ) : (
                                <p className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500 inline-flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> {t('portfolio.notEvaluated')}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-500 dark:text-zinc-400">
                                {(it.startDate || it.endDate) && (
                                  <span>
                                    {it.startDate || '?'} – {it.endDate || t('portfolio.present')}
                                  </span>
                                )}
                                {it.hoursPerWeek ? (
                                  <span>
                                    {it.hoursPerWeek} {t('common.hoursPerWeek')}
                                  </span>
                                ) : null}
                                {it.documentId && (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                    <FileText className="w-3 h-3" /> {t('portfolio.hasProof')}
                                  </span>
                                )}
                                {it.links.slice(0, 2).map((l) => (
                                  <a key={l} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline">
                                    <ExternalLink className="w-3 h-3" /> {l.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                  </a>
                                ))}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                              {scoreValue !== null && (
                                <div className="text-right">
                                  <ScoreChip score={scoreValue} label={it.ai ? t('portfolio.aiScore') : t('portfolio.preScore')} muted={!it.ai || it.excluded} />
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{it.ai ? t('portfolio.aiScore') : t('portfolio.preScore')}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExcluded(it)}
                                  disabled={togglingId === it.id}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                                  title={it.excluded ? t('portfolio.include') : t('portfolio.exclude')}
                                >
                                  {togglingId === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : it.excluded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  <span className="hidden md:inline">{it.excluded ? t('portfolio.include') : t('portfolio.exclude')}</span>
                                </button>
                                <button type="button" onClick={() => startEdit(it)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800" title={t('common.edit')}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => remove(it)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title={t('common.delete')}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {/* ============================================================ EVALUATE */}
            {tab === 'evaluate' && (
              <>
                <div className={`${softPanelCls} p-4 sm:p-5 space-y-3`}>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">{t('portfolio.evalIntro')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t('portfolio.evalField')}</label>
                      <div className="relative">
                        <select value={field} onChange={(e) => setField(e.target.value as PortfolioFieldId | '')} className="ar-input appearance-none pr-8">
                          <option value="">{t('portfolio.evalFieldAuto')}</option>
                          {(meta?.fields || []).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>{t('portfolio.evalTargets')}</label>
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-400/15 flex items-center justify-center shrink-0">
                            <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-slate-900 dark:text-white">{manualTargets ? t('portfolio.targets.manualTitle') : t('portfolio.targets.autoTitle')}</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{manualTargets ? t('portfolio.targets.manualHint') : t('portfolio.targets.autoHint')}</p>
                          </div>
                        </div>
                        {manualTargets && (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl border border-[var(--line)] animate-fadeIn">
                            {UNIVERSITY_DATABASE.filter((u) => targetIds.includes(u.id) || (profile.targetRegions || []).includes(u.region))
                              .slice(0, 40)
                              .map((u) => {
                                const on = targetIds.includes(u.id);
                                return (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => setTargetIds((prev) => (on ? prev.filter((x) => x !== u.id) : prev.length >= 6 ? prev : [...prev, u.id]))}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition ${
                                      on ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-zinc-900 dark:border-white' : 'text-slate-600 dark:text-zinc-300 border-[var(--line)] hover:border-slate-400'
                                    }`}
                                  >
                                    {u.shortName}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        <button type="button" onClick={() => setManualTargets((v) => !v)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                          {manualTargets ? <Wand2 className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                          {manualTargets ? t('portfolio.targets.useAuto') : `${t('portfolio.targets.useManual')} (${targetIds.length}/6)`}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={runEvaluation} disabled={evaluating || !items.length} className="ar-btn ar-btn-primary btn-shine w-full py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                    {evaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {evalCaption || t('portfolio.evaluating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> {t('portfolio.evaluate')}
                      </>
                    )}
                  </button>
                  {!items.length && <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('portfolio.needItems')}</p>}
                  {evalError && <p className="text-rose-600 dark:text-rose-300">{evalError}</p>}
                </div>

                {evaluation && (
                  <div className="space-y-3 animate-fadeIn">
                    {/* Overall verdict */}
                    <div className={`${panelCls} p-4 sm:p-5 flex flex-col sm:flex-row gap-4`}>
                      <ScoreRing value={evaluation.overallScore} size={104} />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tierCls(evaluation.tier)}`}>{t(`portfolio.tier.${evaluation.tier}`)}</span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">{evaluation.fieldTitle}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto">{evaluation.model}</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">{evaluation.headline}</div>
                        <Markdown text={evaluation.summary} compact />
                      </div>
                    </div>

                    {/* Universities the engine picked from the preferences (doc §11) */}
                    {evaluation.targetsAuto && evaluation.targets.length > 0 && (
                      <div className={`${panelCls} p-4 sm:p-5`}>
                        <div className="flex items-start gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-400/15 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">{t('portfolio.targets.chosenTitle')}</div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t('portfolio.targets.chosenHint')}</p>
                          </div>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {evaluation.targets.map((u) => (
                            <li key={u.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[12px] font-extrabold text-slate-900 dark:text-white truncate">{u.shortName || u.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{u.name}</p>
                                </div>
                                {u.tier && (
                                  <span
                                    className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                      u.tier === 'Safety'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900'
                                        : u.tier === 'Dream'
                                          ? 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900'
                                          : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900'
                                    }`}
                                  >
                                    {t(`portfolio.targets.tier.${u.tier}`)}
                                  </span>
                                )}
                              </div>
                              {(u.fit !== undefined || u.probability !== undefined) && (
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 dark:text-zinc-400">
                                  {u.fit !== undefined && (
                                    <span>
                                      {t('portfolio.targets.fit')} <strong className="text-slate-900 dark:text-white">{u.fit}%</strong>
                                    </span>
                                  )}
                                  {u.probability !== undefined && (
                                    <span>
                                      {t('ai.analyze.chance')} <strong className="text-slate-900 dark:text-white">{u.probability}%</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                              {u.reasons?.length ? <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1.5">{u.reasons.map((r) => tx(r)).join(' · ')}</p> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Per-activity 1–10 (doc §15) */}
                    {evaluatedItems.length > 0 && (
                      <div className={`${panelCls} p-4 sm:p-5`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-amber-500" /> {t('portfolio.itemsTitle')}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t('portfolio.itemsHint')}</p>
                          </div>
                          <button type="button" onClick={() => setTab('items')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            {t('portfolio.tab.items')} <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <ol className="space-y-2">
                          {evaluatedItems.map((r, idx) => {
                            const it = items.find((x) => x.id === r.id);
                            const tone = scoreTone(r.score);
                            return (
                              <li key={r.id} className={`rounded-xl border p-3 ${tone.soft}`}>
                                <div className="flex items-start gap-3">
                                  <span className="w-6 h-6 rounded-full bg-white/70 dark:bg-black/20 text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">{idx + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-extrabold">{r.title}</span>
                                      {it && <span className="text-[10px] opacity-70">{typeLabel(it.type)}</span>}
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${recTone(r.recommendation)} bg-white/60 dark:bg-black/20`}>{t(`portfolio.rec.${r.recommendation}`)}</span>
                                      {r.useInEssay && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold opacity-90">
                                          <Quote className="w-3 h-3" /> {t('portfolio.useInEssay')}
                                        </span>
                                      )}
                                      {it?.excluded && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold opacity-80">
                                          <EyeOff className="w-3 h-3" /> {t('portfolio.excludedBadge')}
                                        </span>
                                      )}
                                    </div>
                                    {r.verdict && <p className="text-[11px] leading-relaxed mt-1 opacity-90">{r.verdict}</p>}
                                    {it && r.recommendation === 'drop' && !it.excluded && (
                                      <button type="button" onClick={() => toggleExcluded(it)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold hover:underline">
                                        <EyeOff className="w-3 h-3" /> {t('portfolio.exclude')}
                                      </button>
                                    )}
                                  </div>
                                  <ScoreChip score={r.score} label={t('portfolio.aiScore')} />
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}

                    <div className={`${panelCls} p-4 sm:p-5 space-y-2.5`}>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400">{t('portfolio.byCriteria')}</div>
                      {evaluation.criteria.map((c) => (
                        <div key={c.id}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-slate-800 dark:text-zinc-100 font-semibold">
                              {t(`portfolio.criteria.${c.id}`)} <span className="text-slate-400 font-normal">· {t('portfolio.weight')} {Math.round(c.weight * 100)}%</span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{c.score}</span>
                          </div>
                          <Bar value={c.score} computed={c.computed} />
                          {c.comment && <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">{c.comment}</p>}
                        </div>
                      ))}
                    </div>

                    {evaluation.perUniversity?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {evaluation.perUniversity.map((u) => (
                          <div key={u.id} className={`${panelCls} p-3 space-y-1.5`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                              <div className="text-right shrink-0">
                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                  {u.fit}
                                  <span className="text-[10px] text-slate-400"> / 100</span>
                                </div>
                                {u.chance !== null && (
                                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                                    {t('ai.analyze.chance')} {u.chance}%
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-zinc-200">{u.verdict}</p>
                            {u.whatTheyValue && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                <span className="font-semibold text-slate-700 dark:text-zinc-200">{t('portfolio.whatTheyValue')}:</span> {u.whatTheyValue}
                              </p>
                            )}
                            {u.gaps?.length > 0 && (
                              <ul className="list-disc pl-4 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                                {u.gaps.map((g, i) => (
                                  <li key={i}>{g}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {evaluation.strengths?.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-200 mb-1 inline-flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" /> {t('ai.essay.strengths')}
                          </div>
                          <ul className="list-disc pl-4 text-emerald-900 dark:text-emerald-100 space-y-0.5">
                            {evaluation.strengths.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluation.gaps?.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-200 mb-1">{t('portfolio.gaps')}</div>
                          <ul className="list-disc pl-4 text-amber-900 dark:text-amber-100 space-y-0.5">
                            {evaluation.gaps.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {evaluation.fieldAdvice && (
                      <div className={`${panelCls} p-3`}>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400 mb-1">{t('portfolio.fieldAdvice')}</div>
                        <Markdown text={evaluation.fieldAdvice} compact />
                      </div>
                    )}

                    {evaluation.actionPlan?.length > 0 && (
                      <div className={`${panelCls} p-3`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400">{t('portfolio.actionPlan')}</div>
                          <button type="button" onClick={addPlanToTasks} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 hover:underline">
                            <ListPlus className="w-3 h-3" /> {t('ai.analyze.addTasks')}
                          </button>
                        </div>
                        <ul className="space-y-1.5">
                          {evaluation.actionPlan.map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.priority === 'high' ? 'bg-rose-500' : a.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-white">{a.title}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0">{a.deadline}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-zinc-300">{a.why}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.suggestedCompetitions?.length > 0 && (
                      <div className={`${panelCls} p-3`}>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400 mb-1.5">{t('portfolio.suggestedCompetitions')}</div>
                        <ul className="space-y-1">
                          {evaluation.suggestedCompetitions.map((c) => (
                            <li key={c.id} className="text-slate-700 dark:text-zinc-200">
                              <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">
                                {c.name}
                              </a>{' '}
                              — {c.why}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(evaluation.essayAngles?.length > 0 || evaluation.redFlags?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {evaluation.essayAngles?.length > 0 && (
                          <div className={`${panelCls} p-3`}>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400 mb-1">{t('portfolio.essayAngles')}</div>
                            <ul className="list-disc pl-4 text-slate-700 dark:text-zinc-200 space-y-0.5">
                              {evaluation.essayAngles.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.redFlags?.length > 0 && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-rose-800 dark:text-rose-200 mb-1">{t('ai.analyze.redFlags')}</div>
                            <ul className="list-disc pl-4 text-rose-900 dark:text-rose-100 space-y-0.5">
                              {evaluation.redFlags.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!evaluation && !evaluating && ratedCount > 0 && (
                  <div className={`${panelCls} p-4 sm:p-5`}>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white inline-flex items-center gap-1.5 mb-1">
                      <Star className="w-4 h-4 text-amber-500" /> {t('portfolio.itemsTitle')}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">{t('portfolio.lastVerdicts')}</p>
                    <ol className="space-y-2">
                      {sortedForList
                        .filter((it) => it.ai)
                        .map((it) => (
                          <li key={it.id} className={`rounded-xl border p-3 ${scoreTone(it.ai!.score).soft} ${it.excluded ? 'opacity-60' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-extrabold">{it.title}</span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${recTone(it.ai!.recommendation)} bg-white/60 dark:bg-black/20`}>{t(`portfolio.rec.${it.ai!.recommendation}`)}</span>
                                </div>
                                {it.ai!.verdict && <p className="text-[11px] leading-relaxed mt-1 opacity-90">{it.ai!.verdict}</p>}
                              </div>
                              <ScoreChip score={it.ai!.score} label={t('portfolio.aiScore')} />
                            </div>
                          </li>
                        ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
