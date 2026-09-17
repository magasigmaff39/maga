import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Languages, 
  Trophy, 
  DollarSign, 
  Compass, 
  Check, 
  Info,
  Code2,
  Cpu,
  BarChart2,
  Building2,
  Activity,
  Scale,
  Palette,
  Binary
} from 'lucide-react';
import { 
  ApplicantProfile, 
  EducationGrade, 
  IntendedMajor, 
  TargetRegion, 
  BudgetTier, 
  AdvisorTone 
} from '../types';
import { UNIVERSITY_DATABASE } from '../data/universities';
import { pickTargetUniversities } from '../../shared/logic/match.js';
import { Wand2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { HeartPulse, Wrench, FlaskConical, BookOpen, School, Languages as LanguagesIcon } from 'lucide-react';

const EXTRA_CHIPS = [
  { id: 'olympiad', label: 'Олимпиады' },
  { id: 'hackathon', label: 'Хакатоны' },
  { id: 'research', label: 'Исследования' },
  { id: 'volunteer', label: 'Волонтёрство' },
  { id: 'startup', label: 'Стартап / клуб' },
  { id: 'debate', label: 'Дебаты / MUN' },
  { id: 'sport', label: 'Спорт' },
  { id: 'media', label: 'Медиа / дизайн' },
  { id: 'internship', label: 'Стажировка' },
];

interface Step2ProfileProps {
  profile: ApplicantProfile;
  onChangeProfile: (updated: ApplicantProfile) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAJORS_LIST: { id: IntendedMajor; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'cs_ai', label: 'Computer Science & AI', icon: Cpu },
  { id: 'software_eng', label: 'Software Engineering', icon: Code2 },
  { id: 'data_science', label: 'Data Science & Analytics', icon: Binary },
  { id: 'robotics', label: 'Робототехника и мехатроника', icon: Cpu },
  { id: 'business_finance', label: 'Бизнес и финансы', icon: BarChart2 },
  { id: 'economics', label: 'Экономика и анализ данных', icon: Building2 },
  { id: 'medicine_bio', label: 'Биоинженерия и медицина', icon: Activity },
  { id: 'international_law', label: 'Международное право', icon: Scale },
  { id: 'media_design', label: 'Цифровой дизайн и медиа', icon: Palette },
  { id: 'engineering', label: 'Инженерия (мех., электро, строительство, нефтегаз)', icon: Wrench },
  { id: 'natural_sciences', label: 'Естественные науки (физика, химия, биология)', icon: FlaskConical },
  { id: 'humanities', label: 'Гуманитарные и социальные науки', icon: BookOpen },
  { id: 'education', label: 'Педагогика и образование', icon: School },
  { id: 'linguistics', label: 'Лингвистика и перевод', icon: LanguagesIcon },
];

const REGIONS_LIST: { id: TargetRegion; label: string; code: string; hint: string }[] = [
  { id: 'kazakhstan', label: 'Казахстан', code: 'KZ', hint: 'Госгранты МНВО, NU, AITU, KIMEP, SDU' },
  { id: 'europe', label: 'Европа', code: 'EU', hint: 'Германия, Италия, Венгрия, Бельгия' },
  { id: 'asia', label: 'Азия', code: 'ASIA', hint: 'Южная Корея (KAIST), Гонконг, Сингапур' },
  { id: 'usa_canada', label: 'Северная Америка', code: 'USA/CA', hint: 'Need-Blind институты, академические гранты' },
];

export const Step2Profile: React.FC<Step2ProfileProps> = ({
  profile,
  onChangeProfile,
  onNext,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'tests' | 'goals' | 'personal'>('basics');
  const { t, tx } = useI18n();

  const updateField = <K extends keyof ApplicantProfile>(key: K, value: ApplicantProfile[K]) => {
    onChangeProfile({
      ...profile,
      [key]: value,
    });
  };

  const toggleMajor = (majorId: IntendedMajor) => {
    const current = profile.targetMajors;
    if (current.includes(majorId)) {
      if (current.length > 1) {
        updateField('targetMajors', current.filter(m => m !== majorId));
      }
    } else {
      updateField('targetMajors', [...current, majorId]);
    }
  };

  const toggleExtra = (id: string) => {
    const current = profile.extracurriculars || [];
    updateField(
      'extracurriculars',
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const toggleUniversity = (id: string) => {
    const current = profile.targetUniversityIds || [];
    if (current.includes(id)) {
      updateField('targetUniversityIds', current.filter((x) => x !== id));
    } else {
      updateField('targetUniversityIds', [...current, id]);
    }
  };

  const toggleRegion = (regionId: TargetRegion) => {
    const current = profile.targetRegions;
    if (current.includes(regionId)) {
      if (current.length > 1) {
        updateField('targetRegions', current.filter(r => r !== regionId));
      }
    } else {
      updateField('targetRegions', [...current, regionId]);
    }
  };

  return (
    <div className="space-y-8 py-4 text-slate-900 dark:text-zinc-100">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('steps.2.kicker')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('steps.2.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('steps.2.subtitle')}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 self-start sm:self-auto text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('basics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'basics' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            {t('1. Статус и школа')}
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'tests' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            {t('2. Оценки и экзамены')}
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'goals' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            {t('3. Направления и бюджет')}
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'personal' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            4. {t('profile.tab.personal')}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Real-time Profile Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Basics */}
          {activeTab === 'basics' && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-5 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>{t('Базовые сведения кандидата')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t('Имя кандидата')}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder={t('Имя или инициалы')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t('Возраст')}
                  </label>
                  <input
                    type="number"
                    min={14}
                    max={24}
                    value={profile.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value) || 17)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Grade selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('Текущий уровень обучения')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'grade_9', label: '9 класс' },
                    { id: 'grade_10', label: '10 класс' },
                    { id: 'grade_11', label: '11 класс' },
                    { id: 'college', label: 'Колледж' },
                    { id: 'gap_year', label: 'Gap Year' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => updateField('grade', g.id as EducationGrade)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${profile.grade === g.id ? 'bg-slate-900 text-white border-slate-900 shadow-md -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      {t(g.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* School Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('Тип учебного заведения')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'nis', label: 'НИШ (NIS)', sub: '12-летняя программа' },
                    { id: 'bil', label: 'БИЛ / Лицей', sub: 'Углубленная программа' },
                    { id: 'rfms', label: 'РФМШ / СУНЦ', sub: 'Физмат специализация' },
                    { id: 'gymnasium', label: 'Гимназия', sub: 'Профильные классы' },
                    { id: 'standard', label: 'Общеобразовательная', sub: 'Стандартная 11-летка' },
                    { id: 'international', label: 'Международная', sub: 'IB / Cambridge A-Level' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateField('schoolType', st.id as ApplicantProfile['schoolType'])}
                      className={`p-3 rounded-xl text-left border transition-all duration-200 ${profile.schoolType === st.id ? 'bg-slate-100 border-slate-900 text-slate-900 font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="text-xs font-semibold">{t(st.label)}</div>
                      <div className="text-[10px] text-slate-500">{t(st.sub)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Tab Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <span>{t('Далее: Оценки и экзамены')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Tests & Academics */}
          {activeTab === 'tests' && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span>{t('Академические показатели и сертификаты')}</span>
              </h3>

              {/* GPA Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{t('Средний балл успеваемости (GPA)')}</span>
                    <p className="text-[11px] text-slate-500">{t('Укажите текущий балл по 4-балльной или 5-балльной системе')}</p>
                  </div>
                  <div className="flex bg-white rounded-lg p-0.5 border border-slate-300 text-xs">
                    <button
                      type="button"
                      onClick={() => { updateField('gpaScale', '4.0'); updateField('gpa', 3.8); }}
                      className={`px-2 py-0.5 rounded font-medium ${profile.gpaScale === '4.0' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                    >
                      4.0 Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => { updateField('gpaScale', '5.0'); updateField('gpa', 4.8); }}
                      className={`px-2 py-0.5 rounded font-medium ${profile.gpaScale === '5.0' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                    >
                      {t('5.0 Шкала')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={profile.gpaScale === '4.0' ? 2.5 : 3.0}
                    max={profile.gpaScale === '4.0' ? 4.0 : 5.0}
                    step={0.05}
                    value={profile.gpa}
                    onChange={(e) => updateField('gpa', parseFloat(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 min-w-[64px] text-center font-mono">
                    {profile.gpa.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Standardized Tests: IELTS, SAT, UNT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* IELTS */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-slate-600" />
                      IELTS / TOEFL
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.hasIelts}
                      onChange={(e) => updateField('hasIelts', e.target.checked)}
                      className="rounded accent-slate-900"
                    />
                  </div>
                  {profile.hasIelts ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Overall Band</span>
                        <span className="font-bold text-slate-900">{profile.ieltsScore || 6.5}</span>
                      </div>
                      <input
                        type="range"
                        min={5.0}
                        max={9.0}
                        step={0.5}
                        value={profile.ieltsScore || 6.5}
                        onChange={(e) => updateField('ieltsScore', parseFloat(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">{t('Сертификат не загружен')}</p>
                  )}
                </div>

                {/* SAT */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                      Digital SAT
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.hasSat}
                      onChange={(e) => updateField('hasSat', e.target.checked)}
                      className="rounded accent-slate-900"
                    />
                  </div>
                  {profile.hasSat ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Total Score</span>
                        <span className="font-bold text-slate-900">{profile.satScore || 1400}</span>
                      </div>
                      <input
                        type="range"
                        min={1000}
                        max={1600}
                        step={10}
                        value={profile.satScore || 1400}
                        onChange={(e) => updateField('satScore', parseInt(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">{t('SAT не сдавался')}</p>
                  )}
                </div>

                {/* UNT */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-600" />
                      {t('ЕНТ (ҰБТ)')}
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.hasUnt}
                      onChange={(e) => updateField('hasUnt', e.target.checked)}
                      className="rounded accent-slate-900"
                    />
                  </div>
                  {profile.hasUnt ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>{t('Балл (из 140)')}</span>
                        <span className="font-bold text-slate-900">{profile.untScore || 110}</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={140}
                        step={1}
                        value={profile.untScore || 110}
                        onChange={(e) => updateField('untScore', parseInt(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">{t('ЕНТ в плане')}</p>
                  )}
                </div>

              </div>

              {/* Olympiads */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('Олимпиадный уровень (Дарын, Республиканская, Жаутыковская, IZhO)')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'Без наград' },
                    { id: 'school', label: 'Школьный' },
                    { id: 'city', label: 'Город / Область' },
                    { id: 'republican', label: 'Республиканский' },
                    { id: 'international', label: 'Международный' },
                  ].map((ol) => (
                    <button
                      key={ol.id}
                      type="button"
                      onClick={() => updateField('olympiadLevel', ol.id as ApplicantProfile['olympiadLevel'])}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${profile.olympiadLevel === ol.id ? 'bg-slate-900 text-white border-slate-900 shadow-md -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      {t(ol.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('basics')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('goals')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <span>{t('Далее: Направления и бюджет')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* Section 3: Goals & Budget */}
          {activeTab === 'goals' && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-600" />
                <span>{t('Специальности, вузы и финансирование')}</span>
              </h3>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 mb-2 block">
                  {t('Внеучебные треки (мультивыбор)')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXTRA_CHIPS.map((chip) => {
                    const on = (profile.extracurriculars || []).includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleExtra(chip.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${on ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900' : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}
                      >
                        {t(chip.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">{t('Целевые университеты')}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{t('Выбрано')}: {(profile.targetUniversityIds || []).length}</span>
                    {(profile.targetUniversityIds || []).length > 0 && (
                      <button type="button" onClick={() => updateField('targetUniversityIds', [])} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        {t('profile.targets.clear')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => updateField('targetUniversityIds', pickTargetUniversities(profile, UNIVERSITY_DATABASE, { limit: 5 }).map((u) => u.id))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800"
                    >
                      <Wand2 className="w-3 h-3" /> {t('profile.targets.auto')}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{t('profile.targets.hint')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {UNIVERSITY_DATABASE.map((uni) => {
                    const on = (profile.targetUniversityIds || []).includes(uni.id);
                    return (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => toggleUniversity(uni.id)}
                        className={`p-3 rounded-xl text-left border transition ${on ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900 shadow-md' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}
                      >
                        <div className="text-xs font-bold leading-tight">{uni.shortName}</div>
                        <div className={`text-[10px] mt-0.5 ${on ? 'text-slate-300 dark:text-zinc-500' : 'text-slate-500'}`}>{uni.city}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intended Majors Multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700">
                    {t('Целевые академические направления')}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {t('Выбрано')}: {profile.targetMajors.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MAJORS_LIST.map((m) => {
                    const isSelected = profile.targetMajors.includes(m.id);
                    const IconComponent = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMajor(m.id)}
                        className={`p-2.5 rounded-xl text-left border flex items-center gap-2.5 transition-all duration-200 ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.1)] -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium leading-tight">{t(m.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Countries / Regions */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('Целевые регионы зачисления')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REGIONS_LIST.map((r) => {
                    const isSelected = profile.targetRegions.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRegion(r.id)}
                        className={`p-3 rounded-xl text-left border flex items-start justify-between transition-all duration-200 ${isSelected ? 'bg-slate-50 border-slate-900 text-slate-900 ring-1 ring-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{t(r.label)}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">{r.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{t(r.hint)}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Tiers */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-600" />
                  <span>{t('Финансовые параметры семьи (в год)')}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'grant_only', label: 'Только 100% грант ($0 / год)', desc: 'Госгранты РК, KAIST, Hungaricum, Need-Blind', badge: 'Без расходов' },
                    { id: 'up_to_5k', label: 'До $5,000 / год', desc: 'SDU, AITU, политехи Италии с региональной стипендией', badge: 'Базовый' },
                    { id: 'up_to_15k', label: 'До $15,000 / год', desc: 'KIMEP, Constructor Uni, Bocconi (ISU)', badge: 'Оптимум' },
                    { id: 'above_25k', label: 'Свыше $25,000 / год', desc: 'Широкий выбор программ Европы, США и Великобритании', badge: 'Полный' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateField('budgetTier', b.id as BudgetTier)}
                      className={`p-3 rounded-xl text-left border transition-all duration-200 ${profile.budgetTier === b.id ? 'bg-slate-100 border-slate-900 text-slate-950 font-medium shadow-[0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{t(b.label)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {t(b.badge)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{t(b.desc)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advisor Tone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('Формат аналитического отчета')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'strategic', label: 'Стратегический', sub: 'Фокус на шансы и риски' },
                    { id: 'academic', label: 'Академический', sub: 'Упор на профильные предметы' },
                    { id: 'supportive', label: 'Пошаговый', sub: 'Подробный регламент' },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => updateField('advisorTone', tone.id as AdvisorTone)}
                      className={`p-2.5 rounded-xl text-left border transition-all duration-200 ${profile.advisorTone === tone.id ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-md -translate-y-0.5' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="text-xs">{t(tone.label)}</div>
                      <div className={`text-[10px] ${profile.advisorTone === tone.id ? 'text-slate-300' : 'text-slate-400'}`}>{tone.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>{t('profile.tab.personal')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                  >
                    <span>{t('steps.2.next')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Section 4: Personal context for the AI advisor (health, allergies, diet, climate, career) */}
          {activeTab === 'personal' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <HeartPulse className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">{t('profile.tab.personal')}</h3>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{t('profile.personalHint')}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.careerGoal')}</label>
                  <input
                    type="text"
                    value={profile.careerGoal || ''}
                    onChange={(e) => updateField('careerGoal', e.target.value)}
                    placeholder={t('profile.careerGoalPh')}
                    className="ar-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.allergies')}</label>
                    <input type="text" value={profile.allergies || ''} onChange={(e) => updateField('allergies', e.target.value)} placeholder={t('profile.allergiesPh')} className="ar-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.diet')}</label>
                    <input type="text" value={profile.dietaryNeeds || ''} onChange={(e) => updateField('dietaryNeeds', e.target.value)} placeholder={t('profile.dietPh')} className="ar-input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.health')}</label>
                  <input type="text" value={profile.healthNotes || ''} onChange={(e) => updateField('healthNotes', e.target.value)} placeholder={t('profile.healthPh')} className="ar-input" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.climate')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['any', 'warm', 'cold', 'mild'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('climatePreference', c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${(profile.climatePreference || 'any') === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                        >
                          {t(`profile.climate.${c}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.city')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['any', 'megacity', 'mid_city', 'campus_town'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('cityPreference', c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${(profile.cityPreference || 'any') === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                        >
                          {t(`profile.city.${c}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('profile.notes')}</label>
                  <textarea
                    value={profile.personalNotes || ''}
                    onChange={(e) => updateField('personalNotes', e.target.value)}
                    placeholder={t('profile.notesPh')}
                    rows={4}
                    className="ar-input"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('goals')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                >
                  <span>{t('steps.2.next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Live Real-time Profile Preview Card */}
        <div className="space-y-4">
          <div className="sticky top-20 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                {t('Сводка профиля')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                {t('Анализ активен')}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {profile.name || t('Кандидат')}
              </h4>
              <p className="text-xs text-slate-500">
                {t(profile.grade === 'grade_11' ? '11 класс' : profile.grade === 'grade_10' ? '10 класс' : '9 класс')} • {profile.schoolType.toUpperCase()}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">GPA</span>
                <span className="font-bold text-slate-900">{profile.gpa.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 ml-1">({profile.gpaScale})</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">{t('Язык')}</span>
                <span className="font-bold text-slate-900">
                  {profile.hasIelts ? `IELTS ${profile.ieltsScore}` : t('Не сдан')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">{t('Тесты')}</span>
                <span className="font-bold text-slate-900">
                  {profile.hasSat ? `SAT ${profile.satScore}` : profile.hasUnt ? `ЕНТ ${profile.untScore}` : '—'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">{t('Бюджет')}</span>
                <span className="font-bold text-slate-900 truncate block">
                  {profile.budgetTier === 'grant_only' ? t('100% Грант') : profile.budgetTier === 'up_to_5k' ? '< $5k' : '< $15k'}
                </span>
              </div>
            </div>

            {/* Hint alert */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {t('Все изменения синхронизируются в реальном времени и влияют на расчет рисков и подбор программ.')}
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
