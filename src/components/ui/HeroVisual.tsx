import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Send, 
  Award, 
  Calendar, 
  GraduationCap, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface UniItem {
  id: string;
  flag: string;
  name: string;
  country: string;
  program: string;
  matchScore: number;
  aidType: string;
  deadline: string;
  criteria: string;
  statusColor: string;
  badgeBg: string;
}

const LIVE_MATCHES: UniItem[] = [
  {
    id: 'nu',
    flag: '🇰🇿',
    name: 'Nazarbayev University',
    country: 'Казахстан',
    program: 'Computer Science & AI',
    matchScore: 96,
    aidType: '100% Госгрант / Талант',
    deadline: '15 марта',
    criteria: 'IELTS 7.0+ · SAT 1420',
    statusColor: 'from-emerald-500 to-teal-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'kaist',
    flag: '🇰🇷',
    name: 'KAIST University',
    country: 'Южная Корея',
    program: 'School of Computing',
    matchScore: 89,
    aidType: 'KISS Scholarship (100% + стипендия)',
    deadline: '15 января',
    criteria: 'STEM олимпиады · GPA 4.8+',
    statusColor: 'from-blue-500 to-cyan-400',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  {
    id: 'constructor',
    flag: '🇩🇪',
    name: 'Constructor University',
    country: 'Германия',
    program: 'Software & Data Science',
    matchScore: 84,
    aidType: 'Merit Grant €8,000 / год',
    deadline: '1 июня',
    criteria: 'IELTS 6.5+ · Мотивационное эссе',
    statusColor: 'from-indigo-500 to-sky-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'us_needblind',
    flag: '🇺🇸',
    name: 'Need-Blind US Colleges',
    country: 'США (Harvard, MIT, Princeton)',
    program: 'Full Need-Based Aid',
    matchScore: 78,
    aidType: '100% Financial Aid (всё включено)',
    deadline: '1 ноября (Early)',
    criteria: 'SAT 1500+ · Портфолио лидерства',
    statusColor: 'from-violet-500 to-purple-400',
    badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/30'
  }
];

export const HeroVisual: React.FC = () => {
  const [selectedUni, setSelectedUni] = useState<string>('nu');

  const activeUni = LIVE_MATCHES.find(u => u.id === selectedUni) || LIVE_MATCHES[0];

  return (
    <div className="relative w-full max-w-[580px] mx-auto lg:ml-auto">
      
      {/* Ambient background glows */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Top-Left Badge: AI-Architect */}
      <div className="absolute -top-4 sm:-top-6 -left-3 sm:-left-6 z-20 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-float pointer-events-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">AI-Architect</div>
          <div className="text-xs font-bold text-white">Эссе оценено на 9.4 / 10</div>
        </div>
      </div>

      {/* Main Terminal / Cockpit Card */}
      <div className="relative bg-slate-950/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300">
        
        {/* Cockpit Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              LIVE DIAGNOSTIC ENGINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Цель: 100% Грант
            </span>
          </div>
        </div>

        {/* Candidate Profile Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              AR
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Абитуриент: 11 класс</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">STEM / IT</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                GPA 4.9 · IELTS 7.5 · SAT 1440 · Олимпиады
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-black text-emerald-400 tracking-tight">94%</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Готовность</div>
          </div>
        </div>

        {/* Universities List Stream */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Рекомендованные вузы</span>
            <span>Шанс на грант</span>
          </div>

          {LIVE_MATCHES.map((uni) => {
            const isSelected = uni.id === selectedUni;
            return (
              <button
                key={uni.id}
                type="button"
                onClick={() => setSelectedUni(uni.id)}
                className={`w-full text-left rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer flex flex-col gap-2
                  ${isSelected
                    ? 'bg-slate-900/95 border-blue-500/60 shadow-lg ring-1 ring-blue-500/20'
                    : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/70 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{uni.flag}</span>
                    <div>
                      <div className="text-xs font-extrabold text-white leading-tight flex items-center gap-1.5">
                        {uni.name}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400">{uni.program}</div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div className="text-xs font-black text-white font-mono">{uni.matchScore}%</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${uni.badgeBg}`}>
                      {uni.matchScore >= 85 ? 'High' : 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${uni.statusColor} transition-all duration-500`}
                    style={{ width: `${uni.matchScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span className="font-semibold text-emerald-400">{uni.aidType}</span>
                  <span className="text-slate-400">Дедлайн: {uni.deadline}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Uni Focus Card: Action of the week */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 border border-blue-900/40 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Фокус недели для {activeUni.name}
            </div>
            <div className="text-xs font-bold text-white truncate">
              Подготовить черновик Personal Statement ({activeUni.criteria})
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
        </div>

      </div>

      {/* Floating Bottom-Right Badge: Google SMTP Delivery */}
      <div className="absolute -bottom-4 sm:-bottom-5 -right-2 sm:-right-4 z-20 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-float delay-150 pointer-events-none">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Google SMTP Live</div>
          <div className="text-xs font-bold text-white">План зачисления отправлен на Gmail</div>
        </div>
      </div>

    </div>
  );
};
