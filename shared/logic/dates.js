// Parses the human-readable Russian deadline strings stored in the knowledge base
// ("01 ноября 2026 (ED)", "13–20 июля 2027 (грант)", "15 января 2027") into real dates.
// Shared by the frontend calendar (.ics export) and the backend task generator.
const MONTHS = {
  январ: 0, феврал: 1, март: 2, апрел: 3, ма: 4, июн: 5, июл: 6, август: 7, сентябр: 8, октябр: 9, ноябр: 10, декабр: 11,
};

/** @returns {Date | null} */
export function parseRuDeadline(text) {
  if (!text) return null;
  // "13–20 июля 2027" → the last day of a range is the hard deadline
  const m = /(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s+([а-яё]+)\s+(\d{4})/i.exec(text);
  if (!m) return null;
  const day = Number(m[2] || m[1]);
  const word = m[3].toLowerCase();
  // "ма" must not swallow "март"
  const key = Object.keys(MONTHS).find((k) => word.startsWith(k) && (k !== 'ма' || !word.startsWith('март')));
  if (key === undefined) return null;
  const d = new Date(Date.UTC(Number(m[4]), MONTHS[key], day));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO date (YYYY-MM-DD) or null. */
export function parseRuDeadlineIso(text) {
  const d = parseRuDeadline(text);
  return d ? d.toISOString().slice(0, 10) : null;
}

export const toIcsDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
