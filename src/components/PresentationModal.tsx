import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Target, 
  Layers, 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const buildSlides = (t: (key: string) => string) => [
  {
    number: 1,
    title: 'AdmitRoute AI (Вектор Поступления)',
    subtitle: 'AI-сервис построения персонального маршрута поступления в университеты',
    category: 'Титульный слайд • LOCUSCASE2',
    content: (
      <div className="space-y-6 text-center max-w-2xl mx-auto py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
          <span>{t('Официальный кейс 02 • Код сабмита: LOCUSCASE2')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          AdmitRoute <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
          {t('«Превращаем профиль, оценки и бюджет абитуриента в понятный маршрут: куда поступать, почему это подходит и что делать прямо сейчас».')}
        </p>
        <div className="pt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-semibold text-slate-700">
            {t('🎯 1 Полный путь от анкеты до плана')}
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-semibold text-slate-700">
            {t('💎 Сильный UX/UI и дизайн-система')}
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-semibold text-slate-700">
            {t('💰 Фокус на 100% гранты (РК и Мир)')}
          </div>
        </div>
      </div>
    )
  },
  {
    number: 2,
    title: 'Проблема: Лабиринт поступления и информационный шум',
    subtitle: 'Абитуриенту нужен маршрут, а не еще один список из 100 университетов',
    category: 'Проблема',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">1</div>
          <h4 className="font-extrabold text-rose-950 text-sm">{t('Информационный хаос')}</h4>
          <p className="text-xs text-rose-900 leading-relaxed">
            {t('Требования, дедлайны и правила разбросаны по десяткам разрозненных сайтов. Школьник тратит недели на поиск, но не понимает, кому верить.')}
          </p>
        </div>

        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">2</div>
          <h4 className="font-extrabold text-amber-950 text-sm">{t('Слепые рекомендации')}</h4>
          <p className="text-xs text-amber-900 leading-relaxed">
            {t('Существующие каталоги выдают безликие списки вузов без объяснения причин. Нет ответа на вопрос: «Почему этот вариант подходит именно мне с моим GPA и $0 бюджета?»')}
          </p>
        </div>

        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">3</div>
          <h4 className="font-extrabold text-indigo-950 text-sm">{t('Паралич действия')}</h4>
          <p className="text-xs text-indigo-900 leading-relaxed">
            {t('Десятки предстоящих экзаменов и документов вызывают стресс и прокрастинацию. Абитуриент не знает, какое действие предпринять на текущей неделе.')}
          </p>
        </div>
      </div>
    )
  },
  {
    number: 3,
    title: 'Наше решение: AdmitRoute AI',
    subtitle: 'Персональный AI-навигатор со сквозным 7-шаговым маршрутом',
    category: 'Решение',
    content: (
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xl">🧭</span>
            <h4 className="font-bold text-sm text-slate-900">{t('Интеллектуальная диагностика')}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('Мгновенный расчет индекса готовности (Readiness Index), определение сильных сторон (Superpowers) и выявление критических узких мест (Bottlenecks).')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xl">🎯</span>
            <h4 className="font-bold text-sm text-slate-900">{t('Объяснимый подбор (Explainable AI)')}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('Разбивка на эшелоны: Dream, Target и Safety. Человеческое обоснование каждого выбора с учетом точных баллов и финансовой стратегии.')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xl">🗺️</span>
            <h4 className="font-bold text-sm text-slate-900">{t('Динамический Roadmap')}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('Хронологический таймлайн с фильтрами по экзаменам, документам, эссе и дедлайнам с сохранением прогресса в реальном времени.')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xl">⚡</span>
            <h4 className="font-bold text-sm text-slate-900">{t('Один четкий шаг прямо сейчас')}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('Фокус недели: интерактивный чеклист, готовый шаблон письма учителю за рекомендацией и конструктор структуры эссе.')}
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    number: 4,
    title: 'Пользовательский путь (The 7-Step Journey)',
    subtitle: 'Сквозной и непрерывный сценарий без тупиков и лишних кликов',
    category: 'UX/UI & Архитектура',
    content: (
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '1. Вход', desc: 'Ценность и тест-пресеты' },
            { step: '2. Профиль', desc: 'Умная анкета за 2 мин' },
            { step: '3. Диагностика', desc: 'Паспорт и готовность' },
            { step: '4. Подбор', desc: 'Dream / Target / Safety' },
            { step: '5. Сравнение', desc: 'Сравнение 2+ вузов' },
            { step: '6. Roadmap', desc: 'Персональный план' },
            { step: '7. Действие', desc: 'Шаг недели + шаблоны' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-center space-y-1">
              <span className="w-6 h-6 mx-auto rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                {i + 1}
              </span>
              <div className="font-extrabold text-indigo-950 text-xs">{s.step}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-900 block">{t('✨ UX/UI достижения:')}</span>
          <p>{t('• Пользователь на каждом экране четко понимает текущее положение, предыдущие действия и следующий шаг.')}</p>
          <p>{t('• Полная адаптивность под экраны мобильных устройств и планшетов.')}</p>
          <p>{t('• Мгновенная реактивность: при изменении бюджета или баллов весь маршрут синхронно перестраивается.')}</p>
        </div>
      </div>
    )
  },
  {
    number: 5,
    title: 'AI Diagnostic Engine & Explainable Matching',
    subtitle: 'Прозрачные алгоритмы вместо галлюцинаций и скрытых черных ящиков',
    category: 'Технологии & Алгоритмы',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>{t('Формула готовности (Readiness Index)')}</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            {t('Взвешенный многофакторный скоринг:')}
          </p>
          <div className="p-3 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 leading-normal border border-slate-200">
            Readiness = (Academic × 0.35) + (Language × 0.25) + (Portfolio × 0.25) + (Financial × 0.15)
          </div>
          <p className="text-slate-500">
            {t('Исключает завышенные ожидания и честно предупреждает о дефиците баллов до подачи документов.')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{t('Персонализированные объяснения')}</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            {t('Для каждого рекомендованного университета динамически формируется блок «Почему подходит именно вам», сопоставляющий бюджет семьи ($0 / грант), результаты SAT/IELTS/ЕНТ и олимпиадные дипломы.')}
          </p>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200 text-[11px]">
            {t('«Подходит, так как ваш GPA 3.9 и IELTS 7.5 полностью закрывают академический порог, а бюджет $0 компенсируется 100% стипендией KISS / грантом МНВО РК».')}
          </div>
        </div>
      </div>
    )
  },
  {
    number: 6,
    title: 'Технический стек и надежность данных',
    subtitle: 'Быстрый, легкий и отказоустойчивый веб-сервис',
    category: 'Архитектура',
    content: (
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <span className="font-mono font-black text-indigo-700 text-base">React 18</span>
            <div className="text-slate-500 text-[11px]">{t('Компонентная модель')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <span className="font-mono font-black text-blue-700 text-base">TypeScript</span>
            <div className="text-slate-500 text-[11px]">{t('100% строгая типизация')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <span className="font-mono font-black text-cyan-700 text-base">Vite + Tailwind</span>
            <div className="text-slate-500 text-[11px]">{t('Мгновенная скорость и UI')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <span className="font-mono font-black text-emerald-700 text-base">Local State</span>
            <div className="text-slate-500 text-[11px]">{t('Сохранение прогресса')}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="font-bold text-slate-900 block">{t('Верифицированная база данных приемных комиссий 2026/2027:')}</span>
          <p className="text-slate-600 leading-relaxed">
            {t('Включает актуальные данные ведущих вузов РК (Nazarbayev University, AITU, KIMEP, SDU), Европы (Constructor/Jacobs, Bocconi, PoliTo, Stipendium Hungaricum), Азии (KAIST, HKUST) и США (Need-Blind Amherst, NYUAD).')}
          </p>
        </div>
      </div>
    )
  },
  {
    number: 7,
    title: 'Преимущества перед аналогами и потенциал развития',
    subtitle: 'Отличие от безликих чатов и каталогов',
    category: 'Бизнес и Масштабирование',
    content: (
      <div className="space-y-4 py-2 text-xs">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold text-slate-600">{t('Критерий')}</th>
                <th className="p-3 font-bold text-slate-400">{t('Обычные каталоги вузов')}</th>
                <th className="p-3 font-bold text-slate-400">{t('Обычный AI-чат (ChatGPT)')}</th>
                <th className="p-3 font-extrabold text-indigo-700 bg-indigo-50/50">AdmitRoute AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-800">{t('Формат результата')}</td>
                <td className="p-3 text-slate-500">{t('Простыня ссылок')}</td>
                <td className="p-3 text-slate-500">{t('Длинная стена текста')}</td>
                <td className="p-3 font-bold text-indigo-700 bg-indigo-50/20">{t('Интерактивный 7-шаговый маршрут')}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">{t('Объяснение «Почему подходит»')}</td>
                <td className="p-3 text-slate-500">{t('Отсутствует')}</td>
                <td className="p-3 text-slate-500">{t('Часто абстрактное / вымышленное')}</td>
                <td className="p-3 font-bold text-emerald-700 bg-indigo-50/20">{t('Точный расчет по баллам и грантам')}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">{t('Действие на эту неделю')}</td>
                <td className="p-3 text-slate-500">{t('Нет')}</td>
                <td className="p-3 text-slate-500">{t('Общие советы')}</td>
                <td className="p-3 font-bold text-indigo-700 bg-indigo-50/20">{t('Шаг #1 + чеклист + шаблоны писем')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-slate-500 text-center italic">
          {t('Потенциал B2B партнерств со школами (НИШ, БИЛ) и профориентационными центрами Центральной Азии.')}
        </p>
      </div>
    )
  },
  {
    number: 8,
    title: 'Итоги проекта и готовность к внедрению',
    subtitle: 'LOCUS Startup Hackathon 2026 • Кейс 02',
    category: 'Финал & Сабмит',
    content: (
      <div className="space-y-6 text-center max-w-xl mx-auto py-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {t('Кейс 02 полностью реализован!')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('Создан самостоятельный работающий веб-сервис с авторской дизайн-системой, полным 7-шаговым пользовательским сценарием, высокой реактивностью и готовыми инструментами для абитуриента.')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-900 space-y-1">
          <div>{t('Код участия кейса:')}<strong className="font-mono text-indigo-700">LOCUSCASE2</strong></div>
          <div>{t('Платформа подачи:')}<strong className="font-mono text-indigo-700">aistartify.com</strong></div>
        </div>
      </div>
    )
  }
];

export const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const SLIDES = buildSlides(t);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex((prev) => Math.min(SLIDES.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSlide = SLIDES[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
              Слайд {currentSlide.number} из {SLIDES.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              {t(currentSlide.category)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t(currentSlide.title)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t(currentSlide.subtitle)}
            </p>
          </div>

          <div className="py-2">
            {currentSlide.content}
          </div>
        </div>

        {/* Slide Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === currentSlideIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                title={`Слайд ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(SLIDES.length - 1, prev + 1))}
              disabled={currentSlideIndex === SLIDES.length - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
