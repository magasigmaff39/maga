import React from 'react';
import {
  ArrowRight,
  ListChecks,
  FolderOpen,
  Briefcase,
  Trophy,
  Calendar,
  FileText,
  Mail,
  Sparkles,
  Target,
  CheckCircle2,
  UserCheck,
  Activity,
  GraduationCap,
  GitCompare,
  Map,
  Check,
  Lock,
} from 'lucide-react';
import { UserAccount } from '../lib/auth';
import { ApplicantProfile, DiagnosticResult, RoadmapStep } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface Step1HomeProps {
  currentUser: UserAccount;
  profile: ApplicantProfile;
  diagnostic: DiagnosticResult;
  roadmap: RoadmapStep[];
  maxReachedStep: number;
  nextAction: { stepTitle: string; taskTitle: string; deadline?: string };
  onGoToStep: (step: number) => void;
  onOpenTasksModal: () => void;
  onOpenDocumentsModal: () => void;
  onOpenPortfolioModal: () => void;
  onOpenOlympiadsModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenEssayModal: () => void;
  onOpenEmailModal: () => void;
}

const ROUTE_ICONS = [UserCheck, Activity, GraduationCap, GitCompare, Map, CheckCircle2];

const Ring: React.FC<{ value: number }> = ({ value }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} strokeWidth="8" fill="none" stroke="rgba(255,255,255,0.12)" />
        <circle
          cx="40"
          cy="40"
          r={r}
          strokeWidth="8"
          fill="none"
          stroke="url(#homeRing)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
        <defs>
          <linearGradient id="homeRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-white tabular-nums leading-none">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

export const Step1Home: React.FC<Step1HomeProps> = ({
  currentUser,
  profile,
  diagnostic,
  roadmap,
  maxReachedStep,
  nextAction,
  onGoToStep,
  onOpenTasksModal,
  onOpenDocumentsModal,
  onOpenPortfolioModal,
  onOpenOlympiadsModal,
  onOpenCalendarModal,
  onOpenEssayModal,
  onOpenEmailModal,
}) => {
  const { t, tx } = useI18n();

  const total = roadmap.reduce((n, s) => n + s.subtasks.length, 0);
  const done = roadmap.reduce((n, s) => n + s.subtasks.filter((x) => x.isCompleted).length, 0);
  const routeProgress = ((maxReachedStep - 1) / 6) * 100;
  const continueStep = Math.max(2, Math.min(7, maxReachedStep));

  const tools = [
    { icon: ListChecks, title: t('header.tasks'), text: t('home.tool.tasks'), onClick: onOpenTasksModal, tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
    { icon: FolderOpen, title: t('header.documents'), text: t('home.tool.documents'), onClick: onOpenDocumentsModal, tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
    { icon: Briefcase, title: t('header.portfolio'), text: t('home.tool.portfolio'), onClick: onOpenPortfolioModal, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
    { icon: Trophy, title: t('header.olympiads'), text: t('home.tool.olympiads'), onClick: onOpenOlympiadsModal, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
    { icon: Calendar, title: t('header.deadlines'), text: t('home.tool.deadlines'), onClick: onOpenCalendarModal, tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-300' },
    { icon: FileText, title: t('header.essay'), text: t('home.tool.essay'), onClick: onOpenEssayModal, tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' },
    { icon: Mail, title: t('header.mailPlan'), text: t('home.tool.mail'), onClick: onOpenEmailModal, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
  ];

  return (
    <div className="space-y-8 py-2 sm:py-4">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white border border-slate-800 p-6 sm:p-10 animate-fadeInUp">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-28 -right-16 w-[420px] h-[420px] rounded-full bg-blue-600/30 blur-[110px]" />
          <div className="absolute -bottom-32 -left-16 w-[380px] h-[380px] rounded-full bg-indigo-600/25 blur-[100px]" />
        </div>
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
              <Sparkles className="w-3.5 h-3.5" /> {t('home.kicker')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {t('home.welcome')}, {currentUser.firstName}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">{t('home.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => onGoToStep(continueStep)}
                className="btn-shine group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-white text-slate-950 hover:-translate-y-0.5 transition"
              >
                {maxReachedStep > 2 ? t('home.continue') : t('home.startProfile')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <Target className="w-4 h-4 text-blue-300" />
                {t('home.progress')}: <span className="font-bold text-white">{t('home.stepOf', { n: maxReachedStep })}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1 rounded-2xl bg-white/[0.05] border border-white/10 p-4 flex flex-col items-center justify-center text-center">
              <Ring value={diagnostic.readiness.overall} />
              <p className="text-[11px] text-slate-400 mt-2">{t('home.readiness')}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 flex flex-col justify-between sm:col-span-1 col-span-3">
              <p className="text-[11px] text-slate-400">{t('home.targets')}</p>
              <p className="text-3xl font-extrabold tabular-nums">{profile.targetUniversityIds?.length || 0}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 flex flex-col justify-between sm:col-span-1 col-span-3">
              <p className="text-[11px] text-slate-400">{t('home.tasksDone')}</p>
              <p className="text-3xl font-extrabold tabular-nums">
                {done}
                <span className="text-base text-slate-500">/{total}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Route + next step */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="ar-card p-6 lg:col-span-8 animate-fadeInUp-delay-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('home.route')}</h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tabular-nums">{Math.round(routeProgress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-6">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700" style={{ width: `${Math.max(4, routeProgress)}%` }} />
          </div>
          <ol className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {ROUTE_ICONS.map((Icon, i) => {
              const step = i + 2;
              const reached = step <= maxReachedStep;
              const doneStep = step < maxReachedStep;
              return (
                <li key={step}>
                  <button
                    type="button"
                    disabled={!reached}
                    onClick={() => reached && onGoToStep(step)}
                    className={`w-full text-left rounded-2xl border p-3 transition ${
                      reached
                        ? 'border-slate-200 dark:border-zinc-700 hover:border-blue-400 hover:-translate-y-0.5 bg-white dark:bg-zinc-900'
                        : 'border-dashed border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                        doneStep ? 'bg-blue-600 text-white' : reached ? 'bg-slate-950 text-white dark:bg-white dark:text-zinc-900' : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'
                      }`}
                    >
                      {doneStep ? <Check className="w-4 h-4" /> : reached ? <Icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 tabular-nums">0{step}</span>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">{t(`step.${step}`)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="ar-card p-6 lg:col-span-4 animate-fadeInUp-delay-2 flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400 mb-2">{t('home.next')}</p>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">{tx(nextAction.taskTitle)}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{tx(nextAction.stepTitle)}</p>
          {nextAction.deadline && (
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 mt-3 inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {nextAction.deadline}
            </p>
          )}
          <button type="button" onClick={() => onGoToStep(7)} disabled={maxReachedStep < 7} className="ar-btn ar-btn-ghost mt-auto w-full justify-between disabled:opacity-50 disabled:cursor-not-allowed">
            {t('step.7')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Tools */}
      <section className="space-y-4 animate-fadeInUp-delay-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('home.tools')}</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{t('home.tools.sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map(({ icon: Icon, title, text, onClick, tone }) => (
            <button
              key={title}
              type="button"
              onClick={onClick}
              className="feature-card ar-card text-left p-5 hover:-translate-y-1 hover:shadow-lg transition duration-300 group"
            >
              <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center mb-3 group-hover:scale-105 transition`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{text}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
