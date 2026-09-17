import React, { useEffect, useState } from 'react';
import {
  Compass,
  FileText,
  Calendar,
  RotateCcw,
  Mail,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ListChecks,
  FolderOpen,
  Briefcase,
  Trophy,
  LogIn,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { UserAccount } from '../lib/auth';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

interface HeaderProps {
  currentStep: number;
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: 'register' | 'login') => void;
  onLogout: () => void;
  onReset: () => void;
  onOpenEssayModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenEmailModal: () => void;
  onOpenTasksModal: () => void;
  onOpenDocumentsModal: () => void;
  onOpenPortfolioModal: () => void;
  onOpenOlympiadsModal: () => void;
}

/** KK → EN → RU switcher. Declared outside Header so React does not remount it on every render. */
const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, lang, setLang, languages } = useI18n();
  return (
    <div
      className={`flex items-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-0.5 ${compact ? '' : 'ml-1'}`}
      role="group"
      aria-label={t('header.language')}
    >
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          title={l.native}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide transition ${
            lang === l.code ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

const Logo: React.FC<{ onClick: () => void; tagline: string }> = ({ onClick, tagline }) => (
  <button type="button" className="flex items-center gap-2.5 select-none rounded-2xl" onClick={onClick} aria-label="AdmitRoute">
    <div className="relative w-9 h-9 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(15,23,42,0.45)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-transparent dark:from-blue-500/25" />
      <Compass className="relative text-white dark:text-zinc-900 w-4 h-4" />
    </div>
    <div className="text-left">
      <span className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white block leading-none">AdmitRoute</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{tagline}</span>
    </div>
  </button>
);

const ThemeButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="ar-btn p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      title={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}
      aria-label={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

/** Title-page header: brand, anchor navigation and the two entry points (sign up / log in). */
const GuestHeader: React.FC<{ onOpenAuth: HeaderProps['onOpenAuth']; onReset: () => void }> = ({ onOpenAuth, onReset }) => {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = [
    { href: '#features', label: t('landing.nav.features') },
    { href: '#how', label: t('landing.nav.how') },
    { href: '#register', label: t('landing.nav.register') },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <Logo onClick={onReset} tagline={t('header.tagline')} />

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/70 transition"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ThemeButton />
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="ar-btn hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <LogIn className="w-3.5 h-3.5" />
              {t('landing.nav.login')}
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="ar-btn btn-shine hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-[0_10px_24px_-10px_rgba(15,23,42,0.6)]"
            >
              {t('landing.nav.start')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2 animate-fadeIn">
            <div className="sm:hidden flex items-center justify-between px-1 py-1">
              <span className="text-xs text-slate-500">{t('header.language')}</span>
              <LanguageSwitcher compact />
            </div>
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="ar-btn ar-btn-ghost w-full justify-start">
                {n.label}
              </a>
            ))}
            <button type="button" onClick={() => { onOpenAuth('login'); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start">
              <LogIn className="w-4 h-4" /> {t('landing.nav.login')}
            </button>
            <button type="button" onClick={() => { onOpenAuth('register'); setMenuOpen(false); }} className="ar-btn ar-btn-primary w-full">
              <UserPlus className="w-4 h-4" /> {t('landing.cta.register')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onReset,
  onOpenEssayModal,
  onOpenCalendarModal,
  onOpenEmailModal,
  onOpenTasksModal,
  onOpenDocumentsModal,
  onOpenPortfolioModal,
  onOpenOlympiadsModal,
}) => {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentUser) return <GuestHeader onOpenAuth={onOpenAuth} onReset={onReset} />;

  const secondaryBtn =
    'ar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800';

  const tools = [
    { icon: ListChecks, label: t('header.tasks'), onClick: onOpenTasksModal },
    { icon: FolderOpen, label: t('header.documents'), onClick: onOpenDocumentsModal },
    { icon: Briefcase, label: t('header.portfolio'), onClick: onOpenPortfolioModal },
    { icon: Trophy, label: t('header.olympiads'), onClick: onOpenOlympiadsModal },
    { icon: Calendar, label: t('header.deadlines'), onClick: onOpenCalendarModal },
    { icon: FileText, label: t('header.essay'), onClick: onOpenEssayModal },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <Logo onClick={onReset} tagline={t('header.tagline')} />

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="ar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800"
            >
              <Mail className="w-3.5 h-3.5" />
              {t('header.mailPlan')}
            </button>
            {tools.map(({ icon: Icon, label, onClick }) => (
              <button key={label} type="button" onClick={onClick} className={secondaryBtn} title={label}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <ThemeButton />

            <div className="hidden sm:flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs dark:bg-zinc-800 dark:border-zinc-700 shadow-sm">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[11px] font-extrabold">
                    {(currentUser.firstName || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold text-slate-900 dark:text-white max-w-[90px] truncate">{currentUser.firstName}</span>
              </div>
              <button type="button" onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800" title={t('header.logout')}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button type="button" onClick={onReset} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800" title={t('header.reset')}>
              <RotateCcw className="w-4 h-4" />
            </button>

            <button type="button" className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-2 animate-fadeIn">
            <div className="sm:hidden flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                <User className="w-3.5 h-3.5" /> {currentUser.firstName}
              </div>
              <LanguageSwitcher compact />
            </div>
            <button type="button" onClick={() => { onOpenEmailModal(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start"><Mail className="w-4 h-4" /> {t('header.mailPlan')}</button>
            {tools.map(({ icon: Icon, label, onClick }) => (
              <button key={label} type="button" onClick={() => { onClick(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start">
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            <button type="button" onClick={() => { onLogout(); setMenuOpen(false); }} className="ar-btn ar-btn-ghost w-full justify-start text-rose-600">
              <LogOut className="w-4 h-4" /> {t('header.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
