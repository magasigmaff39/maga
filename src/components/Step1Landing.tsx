import React from 'react';
import { 
  ArrowRight, 
  Check, 
  BarChart3, 
  ShieldCheck, 
  CalendarClock, 
  Mail, 
  Database, 
  GraduationCap, 
  Compass, 
  CheckCircle2, 
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { UserAccount } from '../lib/firebase';

interface Step1LandingProps {
  onStartCustom: () => void;
  onOpenAuth: () => void;
  currentUser: UserAccount | null;
}

export const Step1Landing: React.FC<Step1LandingProps> = ({
  onStartCustom,
  onOpenAuth,
  currentUser,
}) => {
  return (
    <div className="space-y-16 py-6">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-8 sm:p-14 lg:p-16 border border-slate-800 shadow-xl overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Messaging & Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Академический навигатор и аудит поступления</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Индивидуальная стратегия поступления в университет
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              Превращаем оценки, результаты тестов и бюджет семьи в пошаговую маршрутную карту: куда поступать, почему этот вариант подходит и что делать на текущей неделе. С прямой доставкой персонального плана на ваш Gmail через Google SMTP.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {currentUser ? (
                <button
                  onClick={onStartCustom}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20 active:scale-[0.99]"
                >
                  <span>Продолжить маршрут ({currentUser.firstName})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenAuth}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20 active:scale-[0.99]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Зарегистрироваться и построить маршрут</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onStartCustom}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    <span>Быстрый просмотр без регистрации</span>
                  </button>
                </>
              )}
            </div>

            {/* Trust pillars */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>База данных на Google Firebase</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Доставка через официальный Google SMTP</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>100% гранты РК, Европы, Азии и США</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Plan Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 space-y-4 backdrop-blur-md shadow-2xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Образец маршрутной карты
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                  Индекс: 94% (Tier 1)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                
                {/* Target University pill */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Nazarbayev University / KAIST</span>
                    <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/60">
                      100% Грант
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    GPA 4.9 • SAT 1510 • IELTS 7.5 перекрывают проходной порог конкурсов.
                  </p>
                </div>

                {/* Next Step pill */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">Фокус недели: Документы и эссе</span>
                    <span className="text-[10px] text-slate-400 font-mono">До 30 ноя</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Запрос рекомендательных писем от учителей STEM + черновик Personal Statement.
                  </p>
                </div>

                {/* SMTP Confirmation note */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Прямая отправка полного регламента на зарегистрированный Gmail</span>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Section: Что мы делаем (What We Do) */}
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Функционал платформы
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Что делает сервис AdmitRoute
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Система устраняет информационный хаос и автоматизирует все этапы подготовки к поступлению в едином прозрачном окне.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1. Академический скоринг
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Алгоритмическое сопоставление среднего балла (GPA), результатов IELTS, SAT, ЕНТ и олимпиадных дипломов с требованиями приемных комиссий. Вычисление объективного индекса готовности.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              2. Аудит 100% грантов и стипендий
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Подбор программ с нулевой стоимостью для семьи: государственные гранты МНВО РК, квоты Назарбаев Университета, KAIST KISS в Корее, Stipendium Hungaricum, Bocconi ISU и Need-Blind колледжи США.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              3. Персональный Roadmap и дедлайны
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Хронологический график контрольных дат, шаблоны официальных писем учителям за рекомендациями, структура Personal Statement и прямая отправка регламента на Gmail через Google SMTP.
            </p>
          </div>

        </div>
      </div>

      {/* Section: Наши ключевые плюсы (Key Advantages) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 shadow-xs">
        
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Наши конкурентные преимущества
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Почему абитуриенты и родители выбирают AdmitRoute
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            В отличие от статичных справочников и обычных текстовых чатов, платформа строит проверяемую стратегию поступления.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-900">Объяснимый подбор без слепых списков</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Каждый рекомендованный университет сопровождается аргументированным заключением: почему этот вариант подходит под ваши баллы, специальность и финансовые критерии.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-900">Интеграция с официальным Google SMTP</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Сформированный персональный план, перечень необходимых документов и график контрольных дедлайнов доставляются прямо на ваш Gmail с возможностью синхронизации с Google Календарем.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-900">Бесплатная база данных на Google Firebase</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Учетные записи абитуриентов, прогресс выполнения задач в чек-листах и персональный паспорт надежно сохраняются в защищенной базе данных Firebase Firestore.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h4 className="text-sm font-bold text-slate-900">Фокус недели: устранение прокрастинации</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Вместо стресса перед сотней дедлайнов система выделяет ровно одну ключевую задачу на текущую рабочую неделю с готовым чек-листом и шаблоном письма.
            </p>
          </div>

        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold">
              Готовы сформировать персональный маршрут зачисления?
            </h3>
            <p className="text-xs text-slate-400">
              Регистрация занимает 1 минуту. Требуется только имя, фамилия, Gmail, возраст и класс.
            </p>
          </div>

          <button
            onClick={currentUser ? onStartCustom : onOpenAuth}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition shrink-0"
          >
            {currentUser ? 'Перейти к анкете профиля' : 'Зарегистрироваться с Gmail'}
          </button>
        </div>

      </div>

    </div>
  );
};
