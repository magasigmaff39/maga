import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Mail, CheckCircle2, AlertCircle, Send, ShieldCheck } from 'lucide-react';
import { sendRoadmapEmail } from '../utils/emailService';
import { mailApi } from '../lib/api';
import { RoadmapStep, University } from '../types';

interface EmailDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  studentName: string;
  readinessScore: number;
  roadmap: RoadmapStep[];
  matchedUnis: University[];
}

export const EmailDeliveryModal: React.FC<EmailDeliveryModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  studentName,
  readinessScore,
  roadmap,
  matchedUnis,
}) => {
  const { t, tx } = useI18n();
  const [email, setEmail] = useState(userEmail || '');
  const [mailConfigured, setMailConfigured] = useState<boolean | null>(null);

  // Ask the backend whether SMTP is configured so the modal can say so up front instead of failing on send.
  useEffect(() => {
    if (!isOpen) return;
    mailApi.status().then((s) => setMailConfigured(s.configured)).catch(() => setMailConfigured(null));
  }, [isOpen]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const resp = await sendRoadmapEmail({
        toEmail: email,
        studentName,
        readinessScore,
        roadmap,
        matchedUnis,
      });

      if (resp.success) {
        setResult({
          success: true,
          message: `Маршрут успешно отправлен на ${email} через официальный почтовый шлюз Google SMTP (smtp.gmail.com).`
        });
      } else {
        setResult({
          success: false,
          message: resp.error || 'Ошибка отправки через Google SMTP.'
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Ошибка соединения со службой Google SMTP'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('Доставка маршрута через Google SMTP')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('Официальный почтовый шлюз Google (smtp.gmail.com:465 SSL)')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          
          {result && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${result.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{result.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('Адрес получателя (Gmail):')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@gmail.com"
              autoComplete="email"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Email Contents Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
            <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
              {t('Содержимое электронного письма:')}
            </span>
            <p>{t('• Полная сводка академического профиля и Индекс готовности (')} {readinessScore}%)</p>
            <p>{t('• Рекомендованные программы и доступные 100% гранты')}</p>
            <p>{t('• Календарная сетка дедлайнов и контрольных сроков подачи')}</p>
            <p>{t('• Первоочередная задача на текущую неделю')}</p>
          </div>

          {mailConfigured === false && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {t('Почтовый шлюз не настроен на сервере. Добавьте GMAIL_USER и GMAIL_APP_PASSWORD в файл .env и перезапустите backend — тогда письма будут доставляться.')}
              </span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t(loading ? 'Отправка через Google SMTP...' : 'Отправить письмо на мой email')}</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              <span>{t('Прямое SSL/TLS соединение с официальным сервером smtp.gmail.com')}</span>
            </span>
          </div>

        </form>

      </div>
    </div>
  );
};
