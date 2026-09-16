import React from 'react';
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  Compass,
  CheckCircle2,
  UserPlus,
  FileText,
  MessageCircle,
  Award,
  MailCheck,
  Zap,
} from 'lucide-react';
import { UserAccount } from '../lib/firebase';
import { HeroVisual } from './ui/HeroVisual';

interface Step1LandingProps {
  onStartCustom: () => void;
  onOpenAuth: () => void;
  currentUser: UserAccount | null;
}

const FEATURES = [
  { 
    icon: BarChart3, 
    title: 'Академический скоринг', 
    text: 'GPA, IELTS, SAT, ЕНТ и олимпиады сопоставляются с порогами комиссий. Вы получаете точный индекс готовности, а не случайный каталог вузов.', 
    color: 'blue' 
  },
  { 
    icon: ShieldCheck, 
    title: 'Аудит 100% грантов', 
    text: 'NU, госгранты МНВО, KAIST KISS, Stipendium Hungaricum, Bocconi ISU и Need-Blind колледжи США — в едином фильтре под бюджет вашей семьи.', 
    color: 'emerald' 
  },
  { 
    icon: CalendarClock, 
    title: 'Roadmap до зачисления', 
    text: 'Контрольные даты, конкретный чек-лист недели, структура эссе и дедлайны. Фокусируйтесь на главном действии вместо стресса.', 
    color: 'indigo' 
  },
  { 
    icon: FileText, 
    title: 'Гид по мотивационному эссе', 
    text: 'Четыре ключевых блока Personal Statement, чек-лист типичных ошибок и готовый каркас под NU и ведущие зарубежные вузы.', 
    color: 'violet' 
  },
  { 
    icon: Compass, 
    title: 'Расчет шансов поступления', 
    text: 'По каждому вузу — наглядный статус High / Medium / Boost Needed с прозрачным обоснованием, почему этот вариант подходит именно вам.', 
    color: 'amber' 
  },
  { 
    icon: MailCheck, 
    title: 'Доставка через Google SMTP', 
    text: 'План поступления и проверочные коды доставляются напрямую на ваш личный Gmail с официальных почтовых серверов.', 
    color: 'sky' 
  },
];

export const Step1Landing: React.FC<Step1LandingProps> = ({
  onStartCustom,
  onOpenAuth,
  currentUser,
}) => {
  return (
    <div className="w-full">
      
      {/* 
        HERO SECTION:
        Full-sheet width (на весь лист), without restrictive border/card frames,
        with deep atmospheric dark background and ambient light glows.
      */}
      <section className="relative w-full bg-slate-950 text-white pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-12 xl:px-20 overflow-hidden">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 w-[750px] h-[650px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[600px] h-[550px] bg-indigo-600/12 rounded-full blur-[120px] pointer-events-none" />

        {/* Content Container spanning the page */}
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          
          {/* Left Column: Improved Typography, Messaging, and Actions */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            
            {/* Main Headline (Improved Typography & Gradient) */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] font-black tracking-tight leading-[1.05] text-white">
              Стратегия зачисления,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 mt-1">
                а не хаос дедлайнов
              </span>
            </h1>

            {/* Improved Subtitle */}
            <p className="text-slate-300 dark:text-zinc-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl font-normal">
              Оценки, олимпиады и бюджет семьи за 3 минуты превращаются в выверенный навигатор: <span className="text-white font-semibold">куда поступать на 100% грант</span>, какие реальные шансы и какое действие выполнить на этой неделе.
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={onStartCustom}
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:scale-[0.99] transition cursor-pointer"
                >
                  <span>Продолжить, {currentUser.firstName}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:scale-[0.99] transition cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <span>Построить маршрут</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={onStartCustom}
                    className="inline-flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition cursor-pointer shadow-sm"
                  >
                    <span>Смотреть демо-маршрут</span>
                  </button>
                </>
              )}
            </div>

            {/* Improved Trust Pillars */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Каталог 100% грантов РК, Азии, Европы, США</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Алгоритмический аудит шансов поступления</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Пошаговый Roadmap с дедлайнами и эссе</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Прямая отправка плана на ваш Gmail</span>
              </div>
            </div>

          </div>

          {/* Right Column: Replaced with Live Admission Cockpit & Grant Terminal */}
          <div className="lg:col-span-6 w-full">
            <HeroVisual />
          </div>

        </div>

      </section>

      {/* 
        SECONDARY SECTIONS:
        Structured features and callout below the hero
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        
        {/* Features Grid */}
        <section className="space-y-8">
          <div>
            <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
              Возможности платформы
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Единый навигатор поступления вместо хаоса
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-2xl">
              Диагностика профиля, персональные шансы на грант, пошаговый план и помощь в написании эссе в одной системе.
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
              Готовы построить свой персональный маршрут?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-xl">
              Укажите текущие оценки, целевые страны и бюджет — AdmitRoute сформирует выверенную стратегию зачисления.
            </p>
          </div>
          <button
            type="button"
            onClick={currentUser ? onStartCustom : onOpenAuth}
            className="shrink-0 px-8 py-4 rounded-2xl bg-white text-slate-950 font-extrabold text-sm hover:bg-slate-100 hover:shadow-xl transition cursor-pointer"
          >
            {currentUser ? 'Перейти к анкете →' : 'Зарегистрироваться →'}
          </button>
        </section>

      </div>

    </div>
  );
};
