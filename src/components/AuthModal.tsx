import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Compass, ChevronDown, Loader2, X, KeyRound, Eye, EyeOff, Check, ArrowRight, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { registerUser, loginUser, loginWithGoogle, canUseGoogle, UserAccount } from '../lib/auth';
import { authApi, ApiError, type AuthConfig } from '../lib/api';
import { EducationGrade } from '../types';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n/I18nContext';

export type AuthMode = 'register' | 'login';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: UserAccount, isNew?: boolean) => void;
}

type RegisterSubStep = 'data' | 'otp';

const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5';
const errorClass = 'text-[11px] text-rose-500 mt-1';

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.7 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.8c-.3 2.1-1.7 5.3-4.8 7.4l7.4 5.7c4.4-4.1 7.1-10.1 7.1-16.7z" />
    <path fill="#FBBC05" d="M10.4 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.4-8.5 2.4-6.3 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  name?: string;
  showLabel: string;
  hideLabel: string;
}> = ({ value, onChange, placeholder, autoComplete, name, showLabel, hideLabel }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        name={name}
        className="ar-input pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
        aria-label={show ? hideLabel : showLabel}
        title={show ? hideLabel : showLabel}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'register', onClose, onSuccess }) => {
  const { notify } = useToast();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [registerStep, setRegisterStep] = useState<RegisterSubStep>('data');
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number>(16);
  const [grade, setGrade] = useState<EducationGrade>('grade_10');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync the requested tab every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError(null);
    setFieldErrors({});
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    authApi
      .config()
      .then(setAuthConfig)
      .catch(() => setAuthConfig({ googleSignIn: canUseGoogle(), otpRequired: false, otpDevMode: true, firebaseProjectId: null }));
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (registerStep === 'otp' && otpInputRefs.current[0]) setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
  }, [registerStep]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const googleAvailable = canUseGoogle() && (authConfig?.googleSignIn ?? true);
  const otpRequired = authConfig?.otpRequired ?? false;

  const describeError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) return err.code === 'NETWORK' ? t('common.backendOffline') : err.message;
    return err instanceof Error ? err.message : fallback;
  };

  const validateData = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('auth.err.firstName');
    if (!lastName.trim()) next.lastName = t('auth.err.lastName');
    if (!gmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) next.gmail = t('auth.err.email');
    if (!password || password.length < 6) next.password = t('auth.err.password');
    if (password !== confirmPassword) next.confirmPassword = t('auth.err.mismatch');
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const finalizeAccount = async () => {
    const user = await registerUser({ firstName: firstName.trim(), lastName: lastName.trim(), gmail, age, grade, password, preferredLanguage: lang });
    notify(t('auth.toast.created'), 'success');
    onSuccess(user, true);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateData()) return;
    setLoading(true);
    try {
      if (!otpRequired) {
        await finalizeAccount();
        return;
      }
      const resp = await authApi.sendOtp(gmail.trim(), `${firstName} ${lastName}`.trim());
      setRegisterStep('otp');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setDevCode(resp.devCode || null);
      notify(t('auth.toast.codeSent'), 'success');
    } catch (err: unknown) {
      setError(describeError(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError(null);
    if (char && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length > 0) {
      const digits = pasted.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      otpInputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setError(t('auth.err.code6'));
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(gmail, fullCode);
      await finalizeAccount();
    } catch (err: unknown) {
      setError(describeError(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.includes('@') || !loginPassword) {
      setError(t('auth.err.email'));
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(loginEmail, loginPassword);
      notify(`${t('auth.toast.welcome')}, ${user.firstName}`, 'success');
      onSuccess(user, false);
      onClose();
    } catch (err: unknown) {
      setError(describeError(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { user, isNew } = await loginWithGoogle(lang);
      notify(isNew ? t('auth.toast.created') : `${t('auth.toast.welcome')}, ${user.firstName}`, 'success');
      onSuccess(user, isNew);
      onClose();
    } catch (err: unknown) {
      setError(describeError(err, t('common.error')));
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError(null);
    setFieldErrors({});
  };

  const fullCodeLength = otpDigits.filter((d) => d !== '').length;

  const GoogleButton = (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={googleLoading || loading}
      className="ar-btn w-full py-3 rounded-xl bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800 disabled:opacity-50 text-sm font-semibold gap-2.5 shadow-sm"
    >
      {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark />}
      {googleLoading ? t('auth.checking') : t('auth.google')}
    </button>
  );

  const Divider = (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold">
      <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
      {t('auth.orEmail')}
      <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
    </div>
  );

  const primaryBtn =
    'ar-btn btn-shine w-full py-3.5 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_12px_28px_-10px_rgba(15,23,42,0.6)] hover:-translate-y-0.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'register' ? t('auth.registration') : t('auth.login')}
    >
      <div className="relative w-full max-w-[960px] max-h-[94vh] grid grid-cols-1 md:grid-cols-12 rounded-[28px] overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] shadow-[0_40px_120px_-30px_rgba(2,6,23,0.6)] animate-fadeInUp">
        {/* Brand panel */}
        <aside className="hidden md:flex md:col-span-5 relative flex-col justify-between bg-slate-950 text-white p-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -left-20 w-[360px] h-[360px] rounded-full bg-blue-600/35 blur-[100px]" />
            <div className="absolute -bottom-28 -right-16 w-[320px] h-[320px] rounded-full bg-indigo-600/30 blur-[100px]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight leading-none">AdmitRoute</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold mt-1">{t('header.tagline')}</p>
            </div>
          </div>

          <div className="relative space-y-5">
            <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{t('auth.hero.title')}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{t('auth.hero.text')}</p>
            <ul className="space-y-2.5">
              {[t('auth.hero.b1'), t('auth.hero.b2'), t('auth.hero.b3')].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-300" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> {t('auth.terms')}
          </p>
        </aside>

        {/* Form panel */}
        <div className="md:col-span-7 overflow-y-auto max-h-[94vh]">
          <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="md:hidden flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center">
                  <Compass className="w-4 h-4 text-white dark:text-zinc-900" />
                </div>
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">AdmitRoute</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {mode === 'register' ? t('auth.registration') : t('auth.welcomeBack')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{mode === 'register' ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800 shrink-0" aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented switch */}
          <div className="px-5 sm:px-8">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              {(['register', 'login'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold tracking-wide transition ${
                    mode === m ? 'bg-white text-slate-950 shadow-sm dark:bg-zinc-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                  aria-pressed={mode === m}
                >
                  {m === 'register' ? t('auth.register') : t('auth.login')}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-5 space-y-4">
            {googleAvailable && registerStep === 'data' && (
              <>
                {GoogleButton}
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed -mt-1">{t('auth.googleHint')}</p>
                {Divider}
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'register' && otpRequired && (
              <ol className="grid grid-cols-2 gap-2">
                {[t('auth.step.data'), t('auth.step.code')].map((label, i) => {
                  const active = registerStep === (i === 0 ? 'data' : 'otp');
                  const done = registerStep === 'otp' && i === 0;
                  return (
                    <li
                      key={label}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold border ${
                        active || done
                          ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100'
                          : 'border-slate-200 text-slate-400 dark:border-zinc-800 dark:text-zinc-500'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600/15 text-blue-700 dark:text-blue-200' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                        {done ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ol>
            )}

            {mode === 'register' && registerStep === 'data' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" autoComplete="on" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('auth.firstName')}</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Алихан" autoComplete="given-name" className="ar-input" />
                    {fieldErrors.firstName && <p className={errorClass}>{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{t('auth.lastName')}</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Сериков" autoComplete="family-name" className="ar-input" />
                    {fieldErrors.lastName && <p className={errorClass}>{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('auth.age')}</label>
                    <input type="number" min={13} max={26} required value={age} onChange={(e) => setAge(parseInt(e.target.value) || 16)} className="ar-input" />
                  </div>
                  <div>
                    <label className={labelClass}>{t('auth.grade')}</label>
                    <div className="relative">
                      <select value={grade} onChange={(e) => setGrade(e.target.value as EducationGrade)} className="ar-input appearance-none pr-10">
                        <option value="grade_9">{t('auth.grade.9')}</option>
                        <option value="grade_10">{t('auth.grade.10')}</option>
                        <option value="grade_11">{t('auth.grade.11')}</option>
                        <option value="college">{t('auth.grade.college')}</option>
                        <option value="gap_year">{t('auth.grade.gap')}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" required value={gmail} onChange={(e) => setGmail(e.target.value)} placeholder="student@gmail.com" autoComplete="username" name="username" className="ar-input pl-10" />
                  </div>
                  {fieldErrors.gmail && <p className={errorClass}>{fieldErrors.gmail}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('auth.password')}</label>
                    <PasswordInput value={password} onChange={setPassword} placeholder={t('auth.passwordHint')} autoComplete="new-password" name="new-password" showLabel={t('auth.showPassword')} hideLabel={t('auth.hidePassword')} />
                    {fieldErrors.password && <p className={errorClass}>{fieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{t('auth.confirmPassword')}</label>
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder={t('auth.confirmHint')} autoComplete="new-password" showLabel={t('auth.showPassword')} hideLabel={t('auth.hidePassword')} />
                    {fieldErrors.confirmPassword && <p className={errorClass}>{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>

                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('auth.sending')}
                    </>
                  ) : (
                    <>
                      {otpRequired ? t('auth.sendCode').replace(/\s*→\s*$/, '') : t('auth.createAccount').replace(/\s*→\s*$/, '')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-1">
                  {t('auth.haveAccount')}{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    {t('auth.login')}
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && registerStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-zinc-300">
                  {t('auth.codeSentTo')} <strong className="text-slate-950 dark:text-white">{gmail}</strong>. {t('auth.codeAfter')}
                </p>
                {devCode && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-100 text-xs flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {t('auth.devCode')} <strong className="font-mono text-base tracking-widest">{devCode}</strong>
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`${t('auth.step.code')} ${index + 1}`}
                      className={`w-full aspect-square max-h-14 rounded-xl border text-center text-xl font-bold bg-[var(--surface-raised)] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-[var(--ring)] ${
                        digit ? 'border-blue-500 text-slate-950 dark:text-white' : 'border-[var(--line)] text-slate-500'
                      }`}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading || fullCodeLength !== 6} className={primaryBtn}>
                  {loading ? t('auth.checking') : t('auth.confirmAndStart').replace(/\s*→\s*$/, '')}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('data');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-950 dark:hover:text-white font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t('auth.changeData').replace(/^←\s*/, '')}
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleRegisterSubmit({ preventDefault: () => undefined } as React.FormEvent)}
                    className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 disabled:no-underline font-semibold tabular-nums"
                  >
                    {resendCooldown > 0 ? `${t('auth.resendIn')} ${resendCooldown}с` : t('auth.resend')}
                  </button>
                </div>
              </form>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="on" noValidate>
                <div>
                  <label className={labelClass}>{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="student@gmail.com" autoComplete="username" className="ar-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('auth.password')}</label>
                  <PasswordInput value={loginPassword} onChange={setLoginPassword} placeholder={t('auth.yourPassword')} autoComplete="current-password" showLabel={t('auth.showPassword')} hideLabel={t('auth.hidePassword')} />
                </div>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('auth.checking')}
                    </>
                  ) : (
                    <>
                      {t('auth.loginButton').replace(/\s*→\s*$/, '')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-1">
                  {t('auth.noAccount')}{' '}
                  <button type="button" onClick={() => switchMode('register')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    {t('auth.register')}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
