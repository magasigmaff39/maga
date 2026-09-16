import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  AlertCircle,
  Compass,
  ChevronDown
} from 'lucide-react';
import { registerUserInFirebase, loginUserInFirebase, UserAccount } from '../lib/firebase';
import { sendVerificationOtp, verifyOtpCode } from '../utils/emailService';
import { EducationGrade } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

type RegisterSubStep = 'data' | 'otp' | 'password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [registerStep, setRegisterStep] = useState<RegisterSubStep>('data');

  // Registration Fields
  const [name, setName] = useState('Александр');
  const [age, setAge] = useState<number>(16);
  const [grade, setGrade] = useState<EducationGrade>('grade_10');
  const [gmail, setGmail] = useState('student@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification State (strictly user's real email, no preview or bypass)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (registerStep === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [registerStep]);

  if (!isOpen) return null;

  // STEP 1: Validate data and send 6-digit OTP to Gmail via Google SMTP
  const handleSendDataAndRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Укажите ваше имя');
      return;
    }

    if (!gmail.trim() || !gmail.includes('@')) {
      setError('Укажите корректный Gmail адрес');
      return;
    }

    setLoading(true);

    try {
      const resp = await sendVerificationOtp(gmail.trim(), name.trim());
      if (resp.success) {
        setRegisterStep('otp');
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setError(resp.error || 'Ошибка отправки кода на Gmail');
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка подключения к Google SMTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError(null);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
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
      const focusIndex = Math.min(digits.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Введите все 6 цифр проверочного кода из Gmail');
      return;
    }

    setLoading(true);

    try {
      const verifyResp = await verifyOtpCode(gmail, fullCode);
      if (!verifyResp.success) {
        setError(verifyResp.error || 'Неверный 6-значный код подтверждения');
        setLoading(false);
        return;
      }

      setRegisterStep('password');
    } catch (err: any) {
      setError(err?.message || 'Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Set Password and finalize registration
  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Введенные пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || 'Ученик';
      const lastName = parts.slice(1).join(' ') || '';

      const user = await registerUserInFirebase({
        firstName,
        lastName,
        gmail,
        age,
        grade,
        password,
        isEmailVerified: true,
      });

      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения аккаунта на бэкенде');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail || !loginEmail.includes('@')) {
      setError('Укажите ваш email адрес');
      return;
    }

    if (!loginPassword) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);

    try {
      const user = await loginUserInFirebase(loginEmail, loginPassword);
      if (user) {
        onSuccess(user);
        onClose();
      } else {
        setError('Учетная запись не найдена или неверный пароль.');
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const fullCodeLength = otpDigits.filter(d => d !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#09090b] text-white w-full max-w-[440px] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-all">
        
        {/* Top Bar: Logo Branding + [ ЗАКРЫТЬ ] */}
        <div className="pt-6 px-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-zinc-700/80 flex items-center justify-center bg-zinc-900/90 text-white">
              <Compass className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wider text-white uppercase font-sans">
                ADMITROUTE AI
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-0.5">
                ВЕКТОР ПЕРСОНАЛЬНОГО ПОСТУПЛЕНИЯ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[11px] font-mono font-semibold tracking-wider text-zinc-500 hover:text-white transition uppercase pt-1"
          >
            [ ЗАКРЫТЬ ]
          </button>
        </div>

        {/* Tab Switcher: РЕГИСТРАЦИЯ / ВХОД */}
        <div className="px-6 pt-2">
          <div className="flex items-center gap-6 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition relative
                ${mode === 'register' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              РЕГИСТРАЦИЯ
              {mode === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition relative
                ${mode === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              ВХОД
              {mode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Multi-Step Indicator (for Registration) */}
        {mode === 'register' && (
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider pb-3 border-b border-zinc-800/80">
              <span className={registerStep === 'data' ? 'text-white font-extrabold' : 'text-zinc-600'}>
                1. ДАННЫЕ
              </span>
              <span className="text-zinc-700">—</span>
              <span className={registerStep === 'otp' ? 'text-white font-extrabold' : 'text-zinc-600'}>
                2. GMAIL КОД
              </span>
              <span className="text-zinc-700">—</span>
              <span className={registerStep === 'password' ? 'text-white font-extrabold' : 'text-zinc-600'}>
                3. ПАРОЛЬ
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="px-6 pb-6 pt-2">
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE: REGISTRATION */}
          {mode === 'register' && (
            <>
              {/* SUB-STEP 1: ДАННЫЕ */}
              {registerStep === 'data' && (
                <form onSubmit={handleSendDataAndRequestOtp} className="space-y-4">
                  
                  {/* ВАШЕ ИМЯ */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      ВАШЕ ИМЯ:
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Александр"
                      className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>

                  {/* ВОЗРАСТ И КЛАСС / КУРС */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        ВОЗРАСТ:
                      </label>
                      <input
                        type="number"
                        min={13}
                        max={26}
                        required
                        value={age}
                        onChange={e => setAge(parseInt(e.target.value) || 16)}
                        className="w-full bg-[#121216] border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        КЛАСС / КУРС:
                      </label>
                      <div className="relative">
                        <select
                          value={grade}
                          onChange={e => setGrade(e.target.value as EducationGrade)}
                          className="w-full bg-[#121216] border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-zinc-500 transition cursor-pointer pr-10"
                        >
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

                  {/* ВАШ GMAIL АДРЕС */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      ВАШ GMAIL АДРЕС:
                    </label>
                    <input
                      type="email"
                      required
                      value={gmail}
                      onChange={e => setGmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>

                  {/* Кнопка отправки кода */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-zinc-200 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <span>ОТПРАВКА...</span>
                      ) : (
                        <span>ОТПРАВИТЬ КОД НА GMAIL →</span>
                      )}
                    </button>
                  </div>

                </form>
              )}

              {/* SUB-STEP 2: GMAIL КОД */}
              {registerStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      6-ЗНАЧНЫЙ КОД ИЗ ПИСЬМА GMAIL:
                    </label>
                    <p className="text-xs text-zinc-500">
                      Код отправлен на <strong className="text-zinc-200">{gmail}</strong> через Google SMTP.
                    </p>
                  </div>

                  {/* 6 Digit Cells */}
                  <div className="flex justify-between items-center gap-2 my-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className={`w-12 h-14 bg-[#121216] border text-center text-2xl font-mono font-bold rounded-xl transition
                          ${digit 
                            ? 'border-white text-white ring-1 ring-white/20' 
                            : 'border-zinc-800 text-zinc-300 focus:border-zinc-400'}`}
                      />
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || fullCodeLength !== 6}
                      className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-zinc-200 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? 'ПРОВЕРКА КОДА...' : 'ПОДТВЕРДИТЬ КОД →'}
                    </button>
                  </div>

                  {/* Back & Resend */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => { setRegisterStep('data'); setError(null); }}
                      className="text-zinc-500 hover:text-white uppercase font-bold tracking-wider text-[10px] transition"
                    >
                      ← ИЗМЕНИТЬ ДАННЫЕ
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={() => handleSendDataAndRequestOtp({ preventDefault: () => {} } as any)}
                      className="text-zinc-400 hover:text-white disabled:text-zinc-600 font-bold uppercase tracking-wider text-[10px] transition"
                    >
                      {resendCooldown > 0 
                        ? `ПОВТОР ЧЕРЕЗ ${resendCooldown}С` 
                        : 'ОТПРАВИТЬ ЕЩЕ РАЗ'}
                    </button>
                  </div>

                </form>
              )}

              {/* SUB-STEP 3: ПАРОЛЬ */}
              {registerStep === 'password' && (
                <form onSubmit={handleFinalizeRegistration} className="space-y-4">
                  
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300">
                      Gmail <strong>{gmail}</strong> успешно подтвержден!
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      ПРИДУМАЙТЕ ПАРОЛЬ:
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      ПОВТОРИТЕ ПАРОЛЬ:
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Повторите введенный пароль"
                      className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-zinc-200 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? 'СОЗДАНИЕ АККАУНТА...' : 'ЗАВЕРШИТЬ РЕГИСТРАЦИЮ →'}
                    </button>
                  </div>

                </form>
              )}
            </>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  ВАШ GMAIL АДРЕС:
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  ВАШ ПАРОЛЬ:
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Введите ваш пароль"
                  className="w-full bg-[#121216] border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-zinc-200 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? 'ПРОВЕРКА...' : 'ВОЙТИ В ЛИЧНЫЙ КАБИНЕТ →'}
                </button>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-[11px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider transition"
                >
                  Нет аккаунта? Зарегистрироваться →
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
