import React, { useState, useEffect, useRef } from 'react';

interface Stickman2DGraduateProps {
  onToss?: () => void;
  triggerToss?: boolean;
}

export const Stickman2DGraduate: React.FC<Stickman2DGraduateProps> = ({
  onToss,
  triggerToss,
}) => {
  const [isTossed, setIsTossed] = useState(false);
  const [tossCount, setTossCount] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tossTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger from "Построить маршрут" button
  useEffect(() => {
    if (triggerToss) {
      handleToss();
    }
  }, [triggerToss]);

  const handleToss = () => {
    setIsTossed(true);
    setTossCount(c => c + 1);

    if (onToss) {
      onToss();
    }

    // Reset toss animation after flight completes (1.85 seconds)
    if (tossTimeoutRef.current) {
      clearTimeout(tossTimeoutRef.current);
    }
    tossTimeoutRef.current = setTimeout(() => {
      setIsTossed(false);
    }, 1850);
  };

  // Interactive mouse tracking: character subtly tilts towards cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleToss}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[460px] mx-auto aspect-[498/583] select-none cursor-pointer group flex items-center justify-center"
      title="Нажмите на стикмена, чтобы подбросить колпак!"
      style={{
        perspective: '1000px',
      }}
    >
      {/* Soft ground contact shadow */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full bg-black/40 blur-md pointer-events-none transition-transform duration-500"
        style={{
          transform: isTossed
            ? 'translateX(-50%) scale(0.85)'
            : 'translateX(-50%) scale(1)',
          opacity: isTossed ? 0.25 : 0.45,
        }}
      />

      {/* Main Character Body Container with subtle 3D tilt and floating hover */}
      <div
        className="relative w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `rotateY(${mouseOffset.x * 12}deg) rotateX(${-mouseOffset.y * 8}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 
          1. STICKMAN BODY LAYER:
          Floating animation in idle; celebratory jump when cap is tossed!
        */}
        <div
          className={`relative w-full h-full pointer-events-none transition-all duration-300 ease-out ${
            isTossed ? '-translate-y-6 scale-[1.03]' : 'animate-subtle-float'
          }`}
        >
          <img
            src="/stickman_body.png"
            alt="Выпускник стикмен"
            className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
            draggable={false}
          />

          {/* 
            Interactive Expressive Pupils (Overlaying the eyes):
            When cap flies up, the eyes look up at the cap!
          */}
          <div
            className="absolute transition-all duration-300"
            style={{
              top: '23.8%',
              left: '46.5%',
              width: '10.5%',
              height: '3.2%',
            }}
          >
            {/* Left Eye Pupil */}
            <div
              className="absolute w-2 h-2 rounded-full bg-black transition-all duration-200"
              style={{
                left: '18%',
                top: isTossed ? '0%' : `${35 + mouseOffset.y * 30}%`,
                transform: `translateX(${mouseOffset.x * 2}px)`,
              }}
            />
            {/* Right Eye Pupil */}
            <div
              className="absolute w-2 h-2 rounded-full bg-black transition-all duration-200"
              style={{
                right: '18%',
                top: isTossed ? '0%' : `${35 + mouseOffset.y * 30}%`,
                transform: `translateX(${mouseOffset.x * 2}px)`,
              }}
            />
          </div>
        </div>

        {/* 
          2. GRADUATION CAP LAYER:
          When isTossed is true, the cap shoots UP with a parabolic arc,
          spins 360°, and descends back onto his head with a satisfying spring bounce!
        */}
        <div
          key={tossCount}
          className="absolute inset-0 pointer-events-none"
          style={{
            transformOrigin: '58% 18%',
          }}
        >
          <div
            className={`w-full h-full ${
              isTossed ? 'animate-cap-flight' : 'animate-subtle-float'
            }`}
            style={{
              transformOrigin: '58% 18%',
            }}
          >
            <img
              src="/stickman_cap.png"
              alt="Конфедератка выпускника"
              className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              draggable={false}
            />
          </div>
        </div>

      </div>

      {/* Embedded CSS Animations for Cap Toss & Floating */}
      <style>{`
        @keyframes subtleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-subtle-float {
          animation: subtleFloat 3.2s ease-in-out infinite;
        }

        /* 
          Parabolic 2D Cap Flight:
          - Shoots upward by 170px
          - Rotates smoothly 360°
          - Floats at apex
          - Drops back down onto the head with squash-and-stretch landing!
        */
        @keyframes capFlight {
          0% {
            transform: translate(0px, 0px) rotate(0deg) scale(1);
          }
          15% {
            transform: translate(12px, -90px) rotate(45deg) scale(1.12);
          }
          40% {
            transform: translate(24px, -185px) rotate(190deg) scale(1.2);
          }
          55% {
            transform: translate(18px, -200px) rotate(260deg) scale(1.18);
          }
          75% {
            transform: translate(8px, -90px) rotate(330deg) scale(1.08);
          }
          90% {
            transform: translate(0px, 4px) rotate(360deg) scale(1.05, 0.94);
          }
          96% {
            transform: translate(0px, -2px) rotate(360deg) scale(0.98, 1.02);
          }
          100% {
            transform: translate(0px, 0px) rotate(360deg) scale(1);
          }
        }
        .animate-cap-flight {
          animation: capFlight 1.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
};
