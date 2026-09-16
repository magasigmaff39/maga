import React, { useState } from 'react';
import { Compass, FileText, Calendar, RotateCcw, Map, User, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { UserAccount } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentStep: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onReset: () => void;
  onOpenEssayModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenEmailModal: () => void;
  onGoToRoadmap?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onReset,
  onOpenEssayModal,
  onOpenCalendarModal,
  onOpenEmailModal,
  onGoToRoadmap,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenPlan = () => {
    if (onGoToRoadmap) {
      onGoToRoadmap();
    } else {
      onOpenEmailModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <button type="button" className="flex items-center gap-2.5 select-none rounded-2xl cursor-pointer" onClick={onReset}>
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-[0_6px_18px_rgba(15,23,42,0.12)]">
              <Compass className="text-white dark:text-zinc-900 w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white block leading-none">
                AdmitRoute
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Admission OS</span>
            </div>
          </button>

          {/* Tools available ONLY after registration / for authenticated users */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 animate-fadeIn">
              <button
                type="button"
                onClick={handleOpenPlan}
                className="ar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800 cursor-pointer"
                title="Интерактивный план поступления на сайте"
              >
                <Map className="w-3.5 h-3.5" />
                План на сайте
              </button>
              <button
                type="button"
                onClick={onOpenCalendarModal}
                className="ar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                Дедлайны
              </button>
              <button
                type="button"
                onClick={onOpenEssayModal}
                className="ar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Эссе
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="ar-btn p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs dark:bg-zinc-800 dark:border-zinc-700 shadow-sm">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-900 dark:text-white max-w-[100px] truncate">
                    {currentUser.firstName}
                  </span>
                </div>
                <button type="button" onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer" title="Выйти">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="ar-btn hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Войти
              </button>
            )}

            <button type="button" onClick={onReset} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer" title="Сбросить">
              <RotateCcw className="w-4 h-4" />
            </button>

            <button type="button" className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-2 animate-fadeIn">
            {currentUser && (
              <>
                <button type="button" onClick={() => { handleOpenPlan(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start">План на сайте</button>
                <button type="button" onClick={() => { onOpenCalendarModal(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start">Дедлайны</button>
                <button type="button" onClick={() => { onOpenEssayModal(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start">Гид по эссе</button>
              </>
            )}
            {!currentUser && (
              <button type="button" onClick={() => { onOpenAuth(); setMenuOpen(false); }} className="ar-btn ar-btn-primary w-full">Войти / Регистрация</button>
            )}
            {currentUser && (
              <button type="button" onClick={() => { onLogout(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start text-rose-600">Выйти</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
