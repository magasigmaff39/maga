import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Calendar, Download, Filter, ExternalLink, Building } from 'lucide-react';
import { UNIVERSITY_DATABASE } from '../data/universities';
import { parseRuDeadline, toIcsDate, daysUntil } from '../utils/dates';

interface DeadlineCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeadlineCalendarModal: React.FC<DeadlineCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, tx } = useI18n();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  if (!isOpen) return null;

  const events = UNIVERSITY_DATABASE.flatMap(uni => {
    const list = [];
    if (uni.earlyDeadline) {
      list.push({
        id: `${uni.id}-early`,
        uniName: uni.name,
        shortName: uni.shortName,
        type: 'Ранний прием (Early Round)',
        deadline: uni.earlyDeadline,
        country: uni.country,
        region: uni.region,
        portalUrl: uni.officialPortalUrl,
        isEarly: true,
      });
    }
    list.push({
      id: `${uni.id}-regular`,
      uniName: uni.name,
      shortName: uni.shortName,
      type: 'Основной раунд / Грантовый конкурс',
      deadline: uni.regularDeadline,
      country: uni.country,
      region: uni.region,
      portalUrl: uni.officialPortalUrl,
      isEarly: false,
    });
    return list;
  });

  const filteredEvents = events
    .map((ev) => ({ ...ev, date: parseRuDeadline(ev.deadline) }))
    .filter((ev) => (selectedRegion === 'all' ? true : ev.region === selectedRegion))
    .sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));

  const generateIcsFile = () => {
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AdmitRoute//Admission Deadlines//RU\r\nCALSCALE:GREGORIAN\r\n`;

    filteredEvents.forEach(ev => {
      if (!ev.date) return; // skip deadlines without a parseable date (e.g. "rolling")
      const start = toIcsDate(ev.date);
      const end = toIcsDate(new Date(ev.date.getTime() + 86_400_000));
      const uid = `${ev.id}@admitroute`;
      icsContent += `BEGIN:VEVENT\r\nUID:${uid}\r\nSUMMARY:${ev.shortName} — ${tx(ev.type)}\r\nDESCRIPTION:Срок подачи в ${ev.uniName}: ${tx(ev.deadline)}. Портал: ${ev.portalUrl}\r\nURL:${ev.portalUrl}\r\nSTATUS:CONFIRMED\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\nBEGIN:VALARM\r\nTRIGGER:-P7D\r\nACTION:DISPLAY\r\nDESCRIPTION:Через неделю дедлайн ${ev.shortName}\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
    });

    icsContent += `END:VCALENDAR\r\n`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'admit_deadlines.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('Календарный регламент контрольных сроков')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('Сроки ранней и регулярной подачи в университеты')}
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

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex overflow-x-auto gap-1 text-xs whitespace-nowrap hide-scrollbar pb-1 sm:pb-0 items-center max-w-full">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            {[
              { id: 'all', label: 'Все юрисдикции' },
              { id: 'kazakhstan', label: 'Казахстан' },
              { id: 'europe', label: 'Европа' },
              { id: 'asia', label: 'Азия' },
              { id: 'usa_canada', label: 'США / Канада' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0
                  ${selectedRegion === r.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {t(r.label)}
              </button>
            ))}
          </div>

          <button
            onClick={generateIcsFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('Экспорт в iCal (.ics)')}</span>
          </button>
        </div>

        {/* List of Deadlines */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {filteredEvents.map(ev => (
            <div
              key={ev.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{ev.uniName}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {tx(ev.type)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{ev.country}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <div className="text-right">
                  <span className="font-bold text-slate-900 block text-xs">{tx(ev.deadline)}</span>
                  {(() => {
                    const left = daysUntil(ev.date);
                    if (left === null) return <span className="text-[10px] text-slate-400">{t('Официальный срок')}</span>;
                    if (left < 0) return <span className="text-[10px] text-slate-400">{t('Прошёл')}</span>;
                    return <span className={`text-[10px] font-semibold ${left <= 30 ? 'text-rose-600' : left <= 90 ? 'text-amber-600' : 'text-slate-400'}`}>{t('через')} {left} дн.</span>;
                  })()}
                </div>

                <a
                  href={ev.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                  title={t('Портал подачи')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
          >
            {t('Закрыть')}
          </button>
        </div>

      </div>
    </div>
  );
};
