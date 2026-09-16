import React from 'react';
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  Compass,
  CheckCircle2,
  UserPlus,
  Sparkles,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { UserAccount } from '../lib/firebase';
import { HeroVisual } from './ui/HeroVisual';

interface Step1LandingProps {
  onStartCustom: () => void;
  onOpenAuth: () => void;
  currentUser: UserAccount | null;
}

const FEATURES = [
  { icon: BarChart3, title: 'Академический скоринг', text: 'GPA, IELTS, SAT, ЕНТ и олимпиады сопоставляются с порогами приемных комиссий. Вы получаете индекс готовности, а не «список вузов из интернета».', color: 'blue' },
  { icon: ShieldCheck, title: 'Аудит 100% грантов', text: 'NU, госгранты МНВО, KAIST KISS, Hungaricum, Bocconi ISU и Need-Blind колледжи США — в одном отборе под ваш бюджет.', color: 'emerald' },
  { icon: CalendarClock, title: 'Roadmap до зачисления', text: 'Контрольные даты, чек-лист недели, структура эссе и отправка плана на Gmail. Один фокус вместо хаоса дедлайнов.', color: 'indigo' },
  { icon: FileText, title: 'Гид по мотивационному эссе', text: 'Четыре блока Personal Statement, чек-лист ошибок и копируемый каркас под NU и зарубежные вузы.', color: 'violet' },
  { icon: Compass, title: 'Шансы поступления', text: 'По каждому вузу — статус High / Medium / Boost Needed и понятное обоснование, почему профиль подходит.', color: 'amber' },
  { icon: MessageCircle, title: 'Бесплатный AI-консультант', text: 'Чат по грантам, тестам и эссе. Подключается к Gemini API или работает в офлайн-режиме подсказок.', color: 'sky' },
];

export const Step1Landing: React.FC<Step1LandingProps> = ({
  onStartCustom,
  onOpenAuth,
  currentUser,
}) => {
  return (
    <div className="space-y-14 sm:space-y-16 py-4 sm:py-6">
      <section className="relative rounded-[28px] sm:rounded-[32px] bg-slate-950 text-white p-6 sm:p-12 lg:p-16 border border-slate-800 overflow-hidden animate-fadeInUp">
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              AdmitRoute · навигатор поступления
            </div>

            <h1 className="text-[2rem] sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08]">
              Стратегия зачисления,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                а не хаос дедлайнов
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-lg leading-relaxed max-w-xl">
              Оценки, олимпиады и бюджет семьи превращаются в персональный маршрут: куда подавать, какие шансы и что сделать на этой неделе.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {currentUser ? (
                <button
                  type="button"
                  onClick={onStartCustom}
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.18)] transition"
                >
                  Продолжить, {currentUser.firstName}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold bg-white text-slate-900 hover:-translate-y-0.5 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Создать профиль
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                  <button
                    type="button"
                    onClick={onStartCustom}
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                  >
                    Смотреть демо
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 font-medium">
              {['Алгоритмический мэтчинг', 'Поиск 100% грантов', 'Roadmap до зачисления'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 hidden sm:block">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Возможности платформы</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Почему AdmitRoute выглядит как продукт, а не лендинг</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-2xl">Единое окно: диагностика профиля, шансы, план действий и инструменты подачи.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="ar-card p-6 hover:-translate-y-1 hover:shadow-lg transition duration-300 group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition">
                  <Icon className="w-5 h-5 text-slate-700 dark:text-zinc-200 group-hover:text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{f.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ar-card p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Готовы собрать маршрут за 8 минут?</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Имя, фамилия, Gmail — дальше код из письма и анкета абитуриента.</p>
        </div>
        <button
          type="button"
          onClick={currentUser ? onStartCustom : onOpenAuth}
          className="ar-btn ar-btn-primary shrink-0 px-6 py-3"
        >
          {currentUser ? 'К анкете профиля' : 'Зарегистрироваться'}
        </button>
      </section>
    </div>
  );
};
