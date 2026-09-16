import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  Compass,
  CheckCircle2,
  UserPlus,
  FileText,
  Map,
} from 'lucide-react';
import { UserAccount } from '../lib/firebase';
import { StickmenGraduates3D } from './ui/StickmenGraduates3D';

interface Step1LandingProps {
  onStartCustom: () => void;
  onOpenAuth: () => void;
  currentUser: UserAccount | null;
}

const FEATURES = [
  { 
    icon: BarChart3, 
    title: 'Академический скоринг', 
    text: 'Сопоставление GPA, IELTS, SAT, ЕНТ и олимпиадных достижений с актуальными критериями отбора приемных комиссий.', 
    color: 'blue' 
  },
  { 
    icon: ShieldCheck, 
    title: 'Аудит грантовых программ', 
    text: 'Систематизация возможностей 100% финансирования: госгранты РК, NU, KAIST KISS, Stipendium Hungaricum и Need-Blind США.', 
    color: 'emerald' 
  },
  { 
    icon: CalendarClock, 
    title: 'Календарный график зачисления', 
    text: 'Структурированная хронология контрольных сроков подачи документов и приоритетных задач на каждый этап.', 
    color: 'indigo' 
  },
  { 
    icon: FileText, 
    title: 'Структура мотивационного эссе', 
    text: 'Академический регламент подготовки Personal Statement, ключевые смысловые блоки и критерии оценки комиссий.', 
    color: 'violet' 
  },
  { 
    icon: Compass, 
    title: 'Оценка вероятности поступления', 
    text: 'Аналитическая градация High, Medium и Boost с объективным обоснованием требований к профилю кандидата.', 
    color: 'amber' 
  },
  { 
    icon: Map, 
    title: 'Интерактивный маршрут на платформе', 
    text: 'Формирование персонального плана с сохранением прогресса и чек-листами задач непосредственно на сайте.', 
    color: 'sky' 
  },
];

export const Step1Landing: React.FC<Step1LandingProps> = ({
  onStartCustom,
  onOpenAuth,
  currentUser,
}) => {
  const [tossTrigger, setTossTrigger] = useState(false);

  // When clicking "Построить маршрут", stickmen toss caps into the air with confetti!
  const handleBuildRouteClick = () => {
    setTossTrigger(prev => !prev);

    setTimeout(() => {
      if (currentUser) {
        onStartCustom();
      } else {
        onOpenAuth();
      }
    }, 650);
  };

  return (
    <div className="w-full">
      
      {/* 
        HERO SECTION:
        Full-sheet width (на весь лист), without restrictive border/card frames,
        with deep atmospheric dark background.
      */}
      <section className="relative w-full bg-slate-950 text-white pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-12 xl:px-20 overflow-hidden">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 w-[750px] h-[650px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[600px] h-[550px] bg-indigo-600/12 rounded-full blur-[120px] pointer-events-none" />

        {/* Content Container spanning the page */}
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          
          {/* Left Column: Shorter, Professional, Clear Academic Copy */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.9rem] font-black tracking-tight leading-[1.08] text-white">
              Стратегия зачисления
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 mt-1">
                в ведущие университеты
              </span>
            </h1>

            {/* Subtitle: Short, Serious, Professional */}
            <p className="text-slate-300 dark:text-zinc-300 text-base sm:text-lg leading-relaxed max-w-lg font-normal">
              Анализ академического профиля, объективный расчет шансов на 100% грант и пошаговый план подготовки к поступлению.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={handleBuildRouteClick}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:scale-[0.99] transition cursor-pointer"
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{currentUser ? `Продолжить, ${currentUser.firstName}` : 'Построить маршрут'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                type="button"
                onClick={onStartCustom}
                className="inline-flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition cursor-pointer shadow-sm"
              >
                <span>Демо-обзор платформы</span>
              </button>
            </div>

            {/* Key Academic Pillars */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Аудит требований NU, Европы, Азии и США</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Расчет вероятности получения 100% гранта</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Понедельный график подготовки и дедлайнов</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Интерактивный маршрут зачисления на сайте</span>
              </div>
            </div>

          </div>

          {/* 
            Right Column: 5 3D Stickmen Graduates
            Interactive 3D WebGL Scene with 3D cap toss animation, no frame, no extra text, no confetti
          */}
          <div className="lg:col-span-6 w-full flex items-center justify-center relative">
            <StickmenGraduates3D triggerToss={tossTrigger} />
          </div>

        </div>

      </section>

      {/* 
        SECONDARY SECTIONS: Professional System Capabilities
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        
        {/* Features Grid */}
        <section className="space-y-8">
          <div>
            <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
              Возможности системы
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Единая методология поступления
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-2xl">
              Комплексная диагностика профиля, подбор образовательных программ и пошаговое сопровождение подготовки.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="ar-card p-6 sm:p-7 hover:-translate-y-1 hover:shadow-xl transition duration-300 group rounded-3xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition">
                    <Icon className="w-6 h-6 text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 transition" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{f.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="ar-card p-8 sm:p-12 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white border border-slate-800 shadow-2xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Сформировать индивидуальную стратегию поступления
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-xl">
              Укажите текущие оценки, целевые направления и требования к гранту для автоматического расчета маршрута.
            </p>
          </div>
          <button
            type="button"
            onClick={currentUser ? onStartCustom : onOpenAuth}
            className="shrink-0 px-8 py-4 rounded-2xl bg-white text-slate-950 font-extrabold text-sm hover:bg-slate-100 hover:shadow-xl transition cursor-pointer"
          >
            {currentUser ? 'Перейти к анкете →' : 'Начать диагностику →'}
          </button>
        </section>

      </div>

    </div>
  );
};
