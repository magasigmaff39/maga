import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Compass, ChevronDown, Loader2, X } from 'lucide-react';
import { registerUserInFirebase, loginUserInFirebase, UserAccount } from '../lib/firebase';
import { sendVerificationOtp, verifyOtpCode } from '../utils/emailService';
import { EducationGrade } from '../types';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

type RegisterSubStep = 'data' | 'otp';

const inputClass =
  'w-full bg-zinc-900/80 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 transition';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { notify } = useToast();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [registerStep, setRegisterStep] = useState<RegisterSubStep>('data');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number>(16);
  const [grade, setGrade] = useState<EducationGrade>('grade_10');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (registerStep === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [registerStep]);

  if (!isOpen) return null;

  const validateData = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Укажите имя';
    if (!lastName.trim()) next.lastName = 'Укажите фамилию';
    if (!gmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) next.gmail = 'Корректный email';
    if (!password || password.length < 6) next.password = 'Минимум 6 символов';
    if (password !== confirmPassword) next.confirmPassword = 'Пароли не совпадают';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSendDataAndRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateData()) return;

    setLoading(true);
    try {
      const resp = await sendVerificationOtp(gmail.trim(), `${firstName} ${lastName}`.trim());
      if (resp.success) {
        setRegisterStep('otp');
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        notify('Код отправлен на Gmail', 'success');
      } else {
        setError(resp.error || 'Ошибка отправки кода на Gmail');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения к SMTP');
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
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
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

  const finalizeAccount = async () => {
    const user = await registerUserInFirebase({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gmail,
      age,
      grade,
      password,
      isEmailVerified: true,
    });
    notify('Аккаунт создан. Переходим к анкете', 'success');
    onSuccess(user);
    onClose();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Введите все 6 цифр проверочного кода');
      return;
    }

    setLoading(true);
    try {
      const verifyResp = await verifyOtpCode(gmail, fullCode);
      if (!verifyResp.success) {
        setError(verifyResp.error || 'Неверный код подтверждения');
        setLoading(false);
        return;
      }
      await finalizeAccount();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.includes('@') || !loginPassword) {
      setError('Укажите email и пароль');
      return;
    }
    setLoading(true);
    try {
      const user = await loginUserInFirebase(loginEmail, loginPassword);
      if (user) {
        notify(`С возвращением, ${user.firstName}`, 'success');
        onSuccess(user);
        onClose();
      } else {
        setError('Учетная запись не найдена или неверный пароль.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const fullCodeLength = otpDigits.filter((d) => d !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 text-white w-full max-w-[460px] max-h-[92vh] overflow-y-auto rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="pt-6 px-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-zinc-700 flex items-center justify-center bg-zinc-900">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">AdmitRoute</h3>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mt-0.5">Регистрация абитуриента</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-6 border-b border-zinc-800">
            {(['register', 'login'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative ${mode === m ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {m === 'register' ? 'Регистрация' : 'Вход'}
                {mode === m && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        {mode === 'register' && (
          <div className="px-6 pt-5">
            <div className="grid grid-cols-2 gap-2">
              {['Данные и пароль', 'Код Gmail'].map((label, i) => {
                const active = registerStep === (i === 0 ? 'data' : 'otp');
                const done = registerStep === 'otp' && i === 0;
                return (
                  <div key={label} className={`rounded-xl px-3 py-2 text-[11px] font-semibold border ${active || done ? 'border-blue-500/40 bg-blue-500/10 text-blue-100' : 'border-zinc-800 text-zinc-500'}`}>
                    {i + 1}. {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 pb-6 pt-4">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && registerStep === 'data' && (
            <form onSubmit={handleSendDataAndRequestOtp} className="space-y-3.5" autoComplete="on">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Имя</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Алихан" autoComplete="given-name" className={inputClass} />
                  {fieldErrors.firstName && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Фамилия</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Сериков" autoComplete="family-name" className={inputClass} />
                  {fieldErrors.lastName && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Возраст</label>
                  <input type="number" min={13} max={26} required value={age} onChange={(e) => setAge(parseInt(e.target.value) || 16)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Класс</label>
                  <div className="relative">
                    <select value={grade} onChange={(e) => setGrade(e.target.value as EducationGrade)} className={`${inputClass} appearance-none pr-10`}>
                      <option value="grade_9">9 класс</option>
                      <option value="grade_10">10 класс</option>
                      <option value="grade_11">11 класс</option>
                      <option value="college">Колледж</option>
                      <option value="gap_year">Gap Year</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Gmail</label>
                <input type="email" required value={gmail} onChange={(e) => setGmail(e.target.value)} placeholder="student@gmail.com" autoComplete="username" name="username" className={inputClass} />
                {fieldErrors.gmail && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.gmail}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Пароль</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" autoComplete="new-password" name="new-password" className={inputClass} />
                {fieldErrors.password && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Повтор пароля</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" autoComplete="new-password" className={inputClass} />
                {fieldErrors.confirmPassword && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Отправка...</> : 'Отправить код на Gmail →'}
              </button>
            </form>
          )}

          {mode === 'register' && registerStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Код отправлен на <strong className="text-zinc-100">{gmail}</strong>. После подтверждения откроется анкета.
              </p>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    className={`w-full aspect-square max-h-14 bg-zinc-900 border text-center text-xl font-bold rounded-xl
                      ${digit ? 'border-blue-400 text-white' : 'border-zinc-800 text-zinc-300'}`}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading || fullCodeLength !== 6} className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase disabled:opacity-50">
                {loading ? 'Проверка...' : 'Подтвердить и начать анкету →'}
              </button>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <button type="button" onClick={() => { setRegisterStep('data'); setError(null); }} className="text-zinc-500 hover:text-white font-bold uppercase">
                  ← Изменить данные
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleSendDataAndRequestOtp({ preventDefault: () => undefined } as React.FormEvent)}
                  className="text-zinc-400 hover:text-white disabled:text-zinc-600 font-bold uppercase"
                >
                  {resendCooldown > 0 ? `Повтор через ${resendCooldown}с` : 'Отправить ещё раз'}
                </button>
              </div>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="on">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Gmail</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="student@gmail.com" autoComplete="username" className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Пароль</label>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Ваш пароль" autoComplete="current-password" className={inputClass} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase disabled:opacity-50">
                {loading ? 'Проверка...' : 'Войти в кабинет →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
