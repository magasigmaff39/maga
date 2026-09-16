import React from 'react';
import { Compass, FileText, Calendar, RotateCcw, Mail, User, LogOut } from 'lucide-react';
import { UserAccount } from '../lib/firebase';

interface HeaderProps {
  currentStep: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onReset: () => void;
  onOpenEssayModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenEmailModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onReset,
  onOpenEssayModal,
  onOpenCalendarModal,
  onOpenEmailModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Clean Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={onReset}>
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                AdmitRoute
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Google SMTP Button */}
            <button
              onClick={onOpenEmailModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
              title="Отправить персональную маршрутную карту через официальный Google SMTP"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Google SMTP</span>
              <span className="sm:hidden">Почта</span>
            </button>

            <button
              onClick={onOpenCalendarModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Календарь контрольных дат"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Дедлайны</span>
            </button>

            <button
              onClick={onOpenEssayModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Структура мотивационного письма"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Эссе</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* User Auth State / Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-slate-900 max-w-[100px] truncate">
                    {currentUser.firstName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({currentUser.grade.replace('grade_', '')} кл)
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                  title="Выйти из учетной записи"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Войти / Регистрация</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Сбросить введенные данные"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
