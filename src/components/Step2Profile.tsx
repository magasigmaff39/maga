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
  const [activeTab, setActiveTab] = useState<'basics' | 'tests' | 'goals'>('basics');

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
            Этап 02 • Профиль кандидата
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Параметры академического профиля
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Сведения используются алгоритмическим модулем для расчета пороговых значений и сопоставления с конкурсом.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 self-start sm:self-auto text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('basics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'basics' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            1. Статус и школа
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'tests' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            2. Оценки и экзамены
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${activeTab === 'goals' ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-zinc-400'}`}
          >
            3. Направления и бюджет
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
                <span>Базовые сведения кандидата</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Имя кандидата
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Имя или инициалы"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Возраст
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
                  Текущий уровень обучения
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
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* School Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Тип учебного заведения
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
                      <div className="text-xs font-semibold">{st.label}</div>
                      <div className="text-[10px] text-slate-500">{st.sub}</div>
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
                  <span>Далее: Оценки и экзамены</span>
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
                <span>Академические показатели и сертификаты</span>
              </h3>

              {/* GPA Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">Средний балл успеваемости (GPA)</span>
                    <p className="text-[11px] text-slate-500">Укажите текущий балл по 4-балльной или 5-балльной системе</p>
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
                      5.0 Шкала
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
                    <p className="text-[11px] text-slate-400">Сертификат не загружен</p>
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
                    <p className="text-[11px] text-slate-400">SAT не сдавался</p>
                  )}
                </div>

                {/* UNT */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-600" />
                      ЕНТ (ҰБТ)
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
                        <span>Балл (из 140)</span>
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
                    <p className="text-[11px] text-slate-400">ЕНТ в плане</p>
                  )}
                </div>

              </div>

              {/* Olympiads */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Олимпиадный уровень (Дарын, Республиканская, Жаутыковская, IZhO)
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
                      {ol.label}
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
                  <span>Назад</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('goals')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <span>Далее: Направления и бюджет</span>
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
                <span>Специальности, вузы и финансирование</span>
              </h3>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 mb-2 block">
                  Внеучебные треки (мультивыбор)
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
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Целевые университеты</label>
                  <span className="text-[11px] text-slate-400">Выбрано: {(profile.targetUniversityIds || []).length}</span>
                </div>
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
                    Целевые академические направления
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Выбрано: {profile.targetMajors.length}
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
                        <span className="text-xs font-medium leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Countries / Regions */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Целевые регионы зачисления
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
                            <span>{r.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">{r.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{r.hint}</div>
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
                  <span>Финансовые параметры семьи (в год)</span>
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
                        <span className="text-xs font-bold">{b.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {b.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{b.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advisor Tone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Формат аналитического отчета
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
                      <div className="text-xs">{tone.label}</div>
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
                  <span>Назад</span>
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                >
                  <span>Сформировать диагностику профиля</span>
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
                Сводка профиля
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                Анализ активен
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {profile.name || 'Кандидат'}
              </h4>
              <p className="text-xs text-slate-500">
                {profile.grade === 'grade_11' ? '11 класс' : profile.grade === 'grade_10' ? '10 класс' : '9 класс'} • {profile.schoolType.toUpperCase()}
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
                <span className="text-[10px] text-slate-400 block font-medium">Язык</span>
                <span className="font-bold text-slate-900">
                  {profile.hasIelts ? `IELTS ${profile.ieltsScore}` : 'Не сдан'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Тесты</span>
                <span className="font-bold text-slate-900">
                  {profile.hasSat ? `SAT ${profile.satScore}` : profile.hasUnt ? `ЕНТ ${profile.untScore}` : '—'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Бюджет</span>
                <span className="font-bold text-slate-900 truncate block">
                  {profile.budgetTier === 'grant_only' ? '100% Грант' : profile.budgetTier === 'up_to_5k' ? '< $5k' : '< $15k'}
                </span>
              </div>
            </div>

            {/* Hint alert */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                Все изменения синхронизируются в реальном времени и влияют на расчет рисков и подбор программ.
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
