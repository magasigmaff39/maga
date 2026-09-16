import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Award, RefreshCw } from 'lucide-react';

interface StickmenGraduatesProps {
  onToss?: () => void;
  triggerToss?: boolean;
}

interface GraduateData {
  id: number;
  name: string;
  uni: string;
  flag: string;
  color: string;
  sashColor: string;
  cx: number;
  heightOffset: number;
  tossDeltaX: number;
  tossDeltaY: number;
  tossRotate: number;
}

const GRADUATES: GraduateData[] = [
  {
    id: 1,
    name: 'Айдос',
    uni: 'NU (100% Грант)',
    flag: '🇰🇿',
    color: '#60a5fa',
    sashColor: '#3b82f6',
    cx: 80,
    heightOffset: 0,
    tossDeltaX: -45,
    tossDeltaY: -190,
    tossRotate: -140
  },
  {
    id: 2,
    name: 'Данияр',
    uni: 'KAIST (KISS Aid)',
    flag: '🇰🇷',
    color: '#38bdf8',
    sashColor: '#0284c7',
    cx: 165,
    heightOffset: 8,
    tossDeltaX: -20,
    tossDeltaY: -230,
    tossRotate: -75
  },
  {
    id: 3,
    name: 'Магжан',
    uni: 'Target Offer',
    flag: '🎓',
    color: '#fbbf24',
    sashColor: '#f59e0b',
    cx: 250,
    heightOffset: 12,
    tossDeltaX: 0,
    tossDeltaY: -260,
    tossRotate: 180
  },
  {
    id: 4,
    name: 'Амина',
    uni: 'Constructor Uni',
    flag: '🇩🇪',
    color: '#a855f7',
    sashColor: '#9333ea',
    cx: 335,
    heightOffset: 4,
    tossDeltaX: 25,
    tossDeltaY: -220,
    tossRotate: 85
  },
  {
    id: 5,
    name: 'Санжар',
    uni: 'Need-Blind USA',
    flag: '🇺🇸',
    color: '#34d399',
    sashColor: '#10b981',
    cx: 420,
    heightOffset: -2,
    tossDeltaX: 50,
    tossDeltaY: -195,
    tossRotate: 150
  }
];

export const StickmenGraduates: React.FC<StickmenGraduatesProps> = ({ onToss, triggerToss }) => {
  const [isTossed, setIsTossed] = useState(false);

  // Trigger from outside if prop changes
  useEffect(() => {
    if (triggerToss) {
      handleTossCaps();
    }
  }, [triggerToss]);

  const handleTossCaps = () => {
    setIsTossed(true);

    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#3b82f6', '#60a5fa', '#fbbf24', '#34d399', '#a855f7', '#ffffff'],
        disableForReducedMotion: true
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.6, y: 0.6 }
        });
      }, 200);
    } catch {
      // safe fallback
    }

    if (onToss) {
      onToss();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTossed(false);
  };

  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      
      {/* Ambient background glows */}
      <div className="absolute -top-12 -right-6 w-96 h-96 bg-blue-600/18 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-6 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Stage Card */}
      <div 
        onClick={handleTossCaps}
        className="relative bg-slate-900/80 dark:bg-zinc-950/85 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-slate-700/90 cursor-pointer group"
      >
        
        {/* Top Header of Stage */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
              5 ВЫПУСКНИКОВ С 100% ГРАНТОМ
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isTossed ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-slate-300 transition"
                title="Сбросить колпаки"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Вернуть</span>
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-blue-400 transition flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Нажмите, чтобы подбросить колпаки</span>
              </span>
            )}
          </div>
        </div>

        {/* SVG Canvas for the 5 Minimalist Stickmen Graduates */}
        <div className="relative w-full aspect-[500/320] overflow-visible">
          <svg
            viewBox="0 0 500 320"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Ground Glow Line */}
              <linearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Stage Ground Line */}
            <line x1="20" y1="260" x2="480" y2="260" stroke="url(#groundGrad)" strokeWidth="2" strokeDasharray="4 4" />

            {/* Render Each Graduate */}
            {GRADUATES.map((g) => {
              const headY = 135 - g.heightOffset;
              const bodyBottom = headY + 70;
              const legEndY = 258;

              return (
                <g key={g.id} className="transition-all duration-300">
                  
                  {/* Subtle Glow beneath each graduate */}
                  <circle cx={g.cx} cy="260" r="18" fill={g.color} opacity="0.12" />

                  {/* Body Line */}
                  <line
                    x1={g.cx}
                    y1={headY + 16}
                    x2={g.cx}
                    y2={bodyBottom}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Graduation Gown / Academic Sash (V-shape around neck/torso) */}
                  <path
                    d={`M ${g.cx - 10} ${headY + 24} L ${g.cx} ${headY + 46} L ${g.cx + 10} ${headY + 24}`}
                    stroke={g.sashColor}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Legs */}
                  <line
                    x1={g.cx}
                    y1={bodyBottom}
                    x2={g.cx - 14}
                    y2={legEndY}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={g.cx}
                    y1={bodyBottom}
                    x2={g.cx + 14}
                    y2={legEndY}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Shoes */}
                  <ellipse cx={g.cx - 16} cy={legEndY} rx="4" ry="2" fill="#94a3b8" />
                  <ellipse cx={g.cx + 16} cy={legEndY} rx="4" ry="2" fill="#94a3b8" />

                  {/* Arms (Dynamic: Celebrate and raise up \o/ when isTossed!) */}
                  {isTossed ? (
                    // Celebratory Raised Arms in Triumph \o/
                    <g className="transition-all duration-500 ease-out">
                      <line
                        x1={g.cx}
                        y1={headY + 24}
                        x2={g.cx - 24}
                        y2={headY - 14}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={g.cx}
                        y1={headY + 24}
                        x2={g.cx + 24}
                        y2={headY - 14}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Diploma Scroll in Left Hand */}
                      <rect
                        x={g.cx - 30}
                        y={headY - 26}
                        width="6"
                        height="14"
                        rx="2"
                        transform={`rotate(-25 ${g.cx - 27} ${headY - 19})`}
                        fill="#fef08a"
                        stroke="#eab308"
                        strokeWidth="1"
                      />
                    </g>
                  ) : (
                    // Regular Ready Posture (holding diploma or standing proudly)
                    <g className="transition-all duration-500 ease-out">
                      <line
                        x1={g.cx}
                        y1={headY + 24}
                        x2={g.cx - 18}
                        y2={headY + 48}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={g.cx}
                        y1={headY + 24}
                        x2={g.cx + 18}
                        y2={headY + 48}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Diploma Scroll */}
                      <rect
                        x={g.cx - 22}
                        y={headY + 42}
                        width="6"
                        height="12"
                        rx="2"
                        transform={`rotate(15 ${g.cx - 19} ${headY + 48})`}
                        fill="#fef08a"
                        stroke="#eab308"
                        strokeWidth="1"
                      />
                    </g>
                  )}

                  {/* Head (Minimalist Circle) */}
                  <circle
                    cx={g.cx}
                    cy={headY}
                    r="15"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />

                  {/* Happy Eyes (Minimalist dots) */}
                  <circle cx={g.cx - 4} cy={headY - 1} r="1.5" fill="#ffffff" />
                  <circle cx={g.cx + 4} cy={headY - 1} r="1.5" fill="#ffffff" />
                  
                  {/* Subtle Smile */}
                  <path
                    d={`M ${g.cx - 4} ${headY + 4} Q ${g.cx} ${headY + 8} ${g.cx + 4} ${headY + 4}`}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* 
                    GRADUATION CAP (MORTARBOARD) WITH FLYING PHYSICS:
                    When isTossed is true, the cap shoots upwards into the air with rotation!
                  */}
                  <g
                    style={{
                      transform: isTossed
                        ? `translate(${g.tossDeltaX}px, ${g.tossDeltaY}px) rotate(${g.tossRotate}deg)`
                        : 'translate(0px, 0px) rotate(0deg)',
                      transformOrigin: `${g.cx}px ${headY - 16}px`,
                      transition: 'transform 900ms cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                    }}
                  >
                    {/* Cap Skull Base */}
                    <path
                      d={`M ${g.cx - 10} ${headY - 14} Q ${g.cx} ${headY - 10} ${g.cx + 10} ${headY - 14} L ${g.cx + 8} ${headY - 9} Q ${g.cx} ${headY - 6} ${g.cx - 8} ${headY - 9} Z`}
                      fill="#1e293b"
                    />

                    {/* Mortarboard Diamond Top */}
                    <polygon
                      points={`${g.cx - 24},${headY - 18} ${g.cx},${headY - 26} ${g.cx + 24},${headY - 18} ${g.cx},${headY - 10}`}
                      fill="#1e1b4b"
                      stroke="#818cf8"
                      strokeWidth="2"
                    />

                    {/* Cap Button */}
                    <circle cx={g.cx} cy={headY - 18} r="2" fill="#fbbf24" />

                    {/* Gold Tassel Ribbon */}
                    <line
                      x1={g.cx}
                      y1={headY - 18}
                      x2={g.cx + 15}
                      y2={headY - 6}
                      stroke="#fbbf24"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx={g.cx + 15} cy={headY - 6} r="1.5" fill="#f59e0b" />
                  </g>

                  {/* University & Flag Badge under each Graduate */}
                  <g transform={`translate(${g.cx}, 285)`}>
                    <text
                      textAnchor="middle"
                      fontSize="14"
                      y="-4"
                    >
                      {g.flag}
                    </text>
                    <text
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#94a3b8"
                      y="10"
                      className="tracking-tight uppercase font-sans"
                    >
                      {g.name}
                    </text>
                  </g>

                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Banner of the Visual */}
        <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">
              {isTossed ? '🎉 Мечты стали зачислением!' : 'Цель: 100% Грант и Зачисление'}
            </span>
          </div>
          <span className="text-[11px] text-blue-400 font-mono">
            {isTossed ? 'ВЫПУСК 2027' : 'Кликните для броска колпаков ↑'}
          </span>
        </div>

      </div>

    </div>
  );
};
