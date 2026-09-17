import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  FileText,
  Compass,
  MessageCircle,
  Sparkles,
  UserPlus,
  LogIn,
  Lock,
  GraduationCap,
  School,
  BookOpen,
  UserCircle2,
  Activity,
  Building2,
  GitCompare,
  Map as MapIcon,
  Flag,
  Mail,
  KeyRound,
  Check,
  Globe2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useRevealObserver, useCountUp } from '../../hooks/useReveal';
import { UNIVERSITY_DATABASE, UNIVERSITY_COUNTS } from '../../data/universities';
import { HeroRoute } from './HeroRoute';

interface LandingPageProps {
  onRegister: () => void;
  onLogin: () => void;
}

const FEATURES = [
  { icon: BarChart3, key: 'f1', tone: 'from-blue-500 to-indigo-500', soft: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
  { icon: ShieldCheck, key: 'f2', tone: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
  { icon: CalendarClock, key: 'f3', tone: 'from-indigo-500 to-violet-500', soft: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' },
  { icon: FileText, key: 'f4', tone: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
  { icon: Compass, key: 'f5', tone: 'from-amber-500 to-orange-500', soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
  { icon: MessageCircle, key: 'f6', tone: 'from-sky-500 to-cyan-500', soft: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
];

const HOW_STEPS = [
  { icon: UserCircle2, key: '1' },
  { icon: Activity, key: '2' },
  { icon: Building2, key: '3' },
  { icon: GitCompare, key: '4' },
  { icon: MapIcon, key: '5' },
  { icon: Flag, key: '6' },
];

const REG_STEPS = [
  { icon: UserCircle2, key: '1' },
  { icon: Mail, key: '2' },
  { icon: KeyRound, key: '3' },
  { icon: Lock, key: '4' },
];

const MARQUEE_IDS = ['nu', 'kaist', 'mit', 'stanford', 'aitu', 'harvard', 'kbtu', 'nus', 'kimep', 'yale', 'sdu', 'hkust', 'princeton', 'snu', 'columbia', 'utokyo', 'caltech', 'tsinghua', 'nyuad', 'duke'];

const Stat: React.FC<{ value: number; suffix?: string; label: string }> = ({ value, suffix = '', label }) => {
  const { ref, value: v } = useCountUp(value);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="reveal text-center sm:text-left">
      <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
        {v}
        <span className="text-gradient">{suffix}</span>
      </p>
      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">{label}</p>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onRegister, onLogin }) => {
  const { t } = useI18n();
  const root = useRevealObserver<HTMLDivElement>();

  const byId = new Map(UNIVERSITY_DATABASE.map((u) => [u.id, u]));
  const marquee = MARQUEE_IDS.map((id) => byId.get(id)).filter(Boolean) as typeof UNIVERSITY_DATABASE;
  const marqueeItems = marquee.length ? marquee : UNIVERSITY_DATABASE.slice(0, 20);

  return (
    <div ref={root} className="relative">
      {/* ------------------------------------------------------------ HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="aurora" aria-hidden>
          <span className="a" />
          <span className="b" />
          <span className="c" />
        </div>
        <div className="absolute inset-0 landing-grid pointer-events-none" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center flex-1">
            <div className="lg:col-span-6 space-y-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-semibold text-slate-700 dark:text-zinc-200 animate-fadeInUp">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {t('landing.badge')}
              </div>

              <h1 className="text-[2.35rem] leading-[1.05] sm:text-5xl lg:text-[3.15rem] xl:text-[3.9rem] font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white animate-fadeInUp-delay-1 [text-wrap:balance]">
                {t('landing.title1')}
                <span className="block text-gradient pb-1">{t('landing.title2')}</span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-zinc-300 max-w-xl animate-fadeInUp-delay-2">
                {t('landing.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 animate-fadeInUp-delay-3">
                <button
                  type="button"
                  onClick={onRegister}
                  className="btn-shine group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('landing.cta.register')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold glass text-slate-800 dark:text-zinc-100 hover:-translate-y-0.5 transition"
                >
                  <LogIn className="w-4 h-4" />
                  {t('landing.cta.login')}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-zinc-400 animate-fadeInUp-delay-3">
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{t('landing.hero.free')}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{t('landing.hero.gmail')}</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" />{t('landing.hero.minute')}</span>
              </div>
            </div>

            <div className="lg:col-span-6 animate-fadeInUp-delay-2 pt-6 pb-8 sm:pb-4 lg:pt-0">
              <HeroRoute />
            </div>
          </div>

          <a
            href="#features"
            className="mx-auto mt-10 sm:mt-14 inline-flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition"
          >
            {t('landing.scroll')}
            <ArrowDown className="w-4 h-4 animate-scroll-hint" />
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------------ MARQUEE */}
      <section className="relative border-y border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-6">
          <span className="hidden sm:inline-flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
            <Globe2 className="w-3.5 h-3.5" /> {t('landing.marquee')}
          </span>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="flex w-max gap-3 animate-marquee">
              {[...marqueeItems, ...marqueeItems].map((u, i) => (
                <span
                  key={`${u.id}-${i}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-zinc-200 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  {u.shortName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          <Stat value={UNIVERSITY_COUNTS.total} label={t('landing.stat.unis')} />
          <Stat value={4} label={t('landing.stat.regions')} />
          <Stat value={100} suffix="%" label={t('landing.stat.grants')} />
          <Stat value={3} label={t('landing.stat.langs')} />
        </div>
      </section>

      {/* ------------------------------------------------------------ FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 scroll-mt-20">
        <div className="max-w-2xl reveal">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.18em] mb-2">{t('landing.capabilities')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">{t('landing.capTitle')}</h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 mt-3">{t('landing.capSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.key}
                className={`feature-card ar-card reveal reveal-d${(i % 3) + 1} p-6 sm:p-7 hover:-translate-y-1 hover:shadow-xl transition duration-300 group`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-2xl ${f.soft} flex items-center justify-center mb-5 transition group-hover:scale-105`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-zinc-600 tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white mb-2">{t(`landing.${f.key}.title`)}</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{t(`landing.${f.key}.text`)}</p>
                <div className={`mt-5 h-1 w-10 rounded-full bg-gradient-to-r ${f.tone} opacity-60 group-hover:w-16 transition-all duration-500`} />
              </article>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ AUDIENCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="ar-card reveal overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/[0.06] via-transparent to-cyan-500/[0.06] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.18em] mb-2">{t('landing.aud.kicker')}</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{t('landing.aud.title')}</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3">{t('landing.aud.subtitle')}</p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: School, key: '1' },
                { icon: BookOpen, key: '2' },
                { icon: GraduationCap, key: '3' },
              ].map(({ icon: Icon, key }, i) => (
                <div key={key} className={`reveal reveal-d${i + 1} rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5`}>
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-300 mb-3" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t(`landing.aud.${key}.title`)}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{t(`landing.aud.${key}.text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 scroll-mt-20">
        <div className="max-w-2xl reveal">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.18em] mb-2">{t('landing.how.kicker')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">{t('landing.how.title')}</h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 mt-3">{t('landing.how.subtitle')}</p>
        </div>

        <div className="relative mt-12">
          <div className="hidden lg:block absolute left-0 right-0 top-[26px] h-px step-line" aria-hidden />
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
            {HOW_STEPS.map(({ icon: Icon, key }, i) => (
              <li key={key} className={`reveal reveal-d${(i % 6) + 1} relative`}>
                <div className="flex lg:flex-col items-start gap-4 lg:gap-5">
                  <div className="relative shrink-0">
                    <div className="w-[52px] h-[52px] rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-[0_12px_30px_-10px_rgba(15,23,42,0.5)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-extrabold flex items-center justify-center ring-4 ring-[var(--bg)]">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t(`landing.how.${key}.title`)}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{t(`landing.how.${key}.text`)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ REGISTRATION CTA */}
      <section id="register" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 scroll-mt-20">
        <div className="reveal relative overflow-hidden rounded-[32px] bg-slate-950 text-white border border-slate-800">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-blue-600/30 blur-[120px]" />
            <div className="absolute -bottom-40 -left-24 w-[460px] h-[460px] rounded-full bg-indigo-600/25 blur-[110px]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 p-7 sm:p-12 lg:p-14 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
                <Lock className="w-3.5 h-3.5" /> {t('landing.reg.kicker')}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.08]">{t('landing.reg.title')}</h2>
              <p className="text-slate-300 text-base leading-relaxed max-w-lg">{t('landing.reg.subtitle')}</p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={onRegister}
                  className="btn-shine group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold bg-white text-slate-950 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.2)] transition"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('landing.reg.cta')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition whitespace-nowrap"
                >
                  {t('landing.reg.haveAccount')} <span className="text-blue-300">{t('landing.reg.login')}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> {t('landing.locked')}
              </p>
            </div>

            <div className="lg:col-span-6">
              <ol className="space-y-3">
                {REG_STEPS.map(({ icon: Icon, key }, i) => (
                  <li key={key} className={`reveal reveal-d${i + 1} flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur px-4 py-3.5 hover:bg-white/[0.07] transition`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-blue-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{t(`landing.reg.${key}.title`)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t(`landing.reg.${key}.text`)}</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-600 tabular-nums">0{i + 1}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FOOTER */}
      <footer className="border-t border-slate-200/70 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center">
                <Compass className="w-4 h-4 text-white dark:text-slate-950" />
              </div>
              <div>
                <p className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">AdmitRoute</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mt-1">{t('header.tagline')}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">{t('landing.footer.made')}</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <a href="#features" className="text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition">{t('landing.nav.features')}</a>
            <a href="#how" className="text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition">{t('landing.nav.how')}</a>
            <a href="#register" className="text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition">{t('landing.nav.register')}</a>
            <button type="button" onClick={onLogin} className="text-left text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition">{t('landing.nav.login')}</button>
          </nav>

          <div className="md:text-right text-xs text-slate-500 dark:text-zinc-500 space-y-1">
            <p>© {new Date().getFullYear()} AdmitRoute · {t('landing.footer.rights')}</p>
            <p>Қазақша · English · Русский</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
