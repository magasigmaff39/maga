import React, { useLayoutEffect, useRef } from 'react';
import { Check, Sparkles, CalendarClock, TrendingUp } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Animated "admission route" for the title page: a path is drawn through five milestones while a
 * traveller moves along it; floating glass cards preview what the cabinet computes after sign-up.
 */
const NODES = [
  { x: 48, y: 352, key: 'landing.route.n1' },
  { x: 170, y: 300, key: 'landing.route.n2' },
  { x: 280, y: 220, key: 'landing.route.n3' },
  { x: 390, y: 170, key: 'landing.route.n4' },
  { x: 512, y: 70, key: 'landing.route.n5' },
];

const PATH =
  'M48 352 C 100 352, 120 300, 170 300 C 220 300, 230 220, 280 220 C 330 220, 340 170, 390 170 C 440 170, 470 70, 512 70';

const CYCLE = 9; // seconds — keep in sync with .route-path / .route-node in index.css

export const HeroRoute: React.FC = () => {
  const { t } = useI18n();
  const pathRef = useRef<SVGPathElement | null>(null);

  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    try {
      el.style.setProperty('--len', String(Math.ceil(el.getTotalLength())));
    } catch {
      /* very old engines */
    }
  }, []);

  return (
    <div className="relative w-full max-w-[600px] mx-auto lg:ml-auto select-none">
      <div className="absolute -inset-10 bg-gradient-to-tr from-blue-500/25 via-indigo-500/10 to-cyan-400/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative glass rounded-[28px] p-4 sm:p-5 sm:pb-14">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">AdmitRoute</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t('landing.route.title')}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            {t('landing.route.live')}
          </span>
        </div>

        <svg viewBox="0 0 560 420" className="w-full h-auto" role="img" aria-label={t('landing.route.title')}>
          <defs>
            <linearGradient id="routeStroke" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="routeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* area under the route */}
          <path d={`${PATH} L 512 420 L 48 420 Z`} fill="url(#routeGlow)" />

          {/* faint track + animated route */}
          <path d={PATH} className="stroke-slate-300/70 dark:stroke-white/10" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 10" />
          <path ref={pathRef} d={PATH} className="route-path" stroke="url(#routeStroke)" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#softGlow)" />

          {/* milestones */}
          {NODES.map((n, i) => {
            const delay = `${(i * (CYCLE * 0.7)) / (NODES.length - 1)}s`;
            const last = i === NODES.length - 1;
            return (
              <g key={n.key}>
                <circle cx={n.x} cy={n.y} r="7" className="fill-white dark:fill-zinc-900 stroke-slate-300 dark:stroke-white/20" strokeWidth="2" />
                <g className="route-node" style={{ animationDelay: delay }}>
                  <circle cx={n.x} cy={n.y} r="16" className="route-node-ping" style={{ animationDelay: delay }} fill={last ? '#34d399' : '#3b82f6'} opacity="0.25" />
                  <circle cx={n.x} cy={n.y} r="8" fill={last ? '#10b981' : '#2563eb'} />
                  <circle cx={n.x} cy={n.y} r="3" fill="#fff" />
                </g>
                <text
                  x={n.x}
                  y={n.y + (i % 2 === 0 ? 30 : -18)}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-zinc-300"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, Inter, sans-serif"
                >
                  {t(n.key)}
                </text>
              </g>
            );
          })}

          {/* traveller */}
          <g>
            <circle r="9" fill="#fff" opacity="0.9" filter="url(#softGlow)">
              <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" path={PATH} keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.85;1" dur={`${CYCLE}s`} repeatCount="indefinite" />
            </circle>
            <circle r="4.5" fill="#2563eb">
              <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" path={PATH} keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.85;1" dur={`${CYCLE}s`} repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-1">
          {[
            { label: 'GPA', value: '4.8', tone: 'text-blue-600 dark:text-blue-300' },
            { label: 'IELTS', value: '7.5', tone: 'text-indigo-600 dark:text-indigo-300' },
            { label: 'SAT', value: '1450', tone: 'text-cyan-600 dark:text-cyan-300' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{s.label}</p>
              <p className={`text-lg font-extrabold leading-tight ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* floating previews */}
      <div className="absolute -left-2 sm:-left-10 top-[21%] glass rounded-2xl px-3.5 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '-2s' }}>
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-400/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-none mb-1">{t('landing.card.readiness')}</p>
          <div className="flex items-end gap-1.5">
            <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">78%</span>
            <span className="flex items-end gap-[3px] h-4">
              {[40, 65, 50, 80, 100].map((h, i) => (
                <span key={i} className="w-[4px] rounded-sm bg-blue-500/70 animate-bar" style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 sm:-right-8 top-[54%] glass rounded-2xl px-3.5 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '-4.5s' }}>
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-300" />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-none mb-1">{t('landing.card.deadline')} · KAIST</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">41 {t('landing.card.days')}</p>
        </div>
      </div>

      <div className="absolute -bottom-3 left-8 glass rounded-2xl px-3.5 py-3 hidden sm:flex items-center gap-3 animate-float whitespace-nowrap" style={{ animationDelay: '-1s' }}>
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">Nazarbayev University · 94%</p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-none flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" /> {t('landing.card.match')} · 100% grant
          </p>
        </div>
      </div>
    </div>
  );
};
