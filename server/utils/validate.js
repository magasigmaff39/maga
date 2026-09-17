// Tiny request validation helpers — no external schema library needed for this API surface.
import { badRequest } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function requireString(value, field, { min = 1, max = 5000 } = {}) {
  if (typeof value !== 'string') throw badRequest(`Поле «${field}» обязательно`, 'VALIDATION', { field });
  const trimmed = value.trim();
  if (trimmed.length < min) throw badRequest(`Поле «${field}» слишком короткое`, 'VALIDATION', { field, min });
  if (trimmed.length > max) throw badRequest(`Поле «${field}» слишком длинное (макс. ${max})`, 'VALIDATION', { field, max });
  return trimmed;
}

export function optionalString(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, field, { min: 0, ...opts });
}

export function requireEmail(value) {
  const email = requireString(value, 'email', { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw badRequest('Укажите корректный email', 'INVALID_EMAIL', { field: 'email' });
  return email;
}

export function requireEnum(value, field, allowed, fallback) {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) return fallback;
  if (!allowed.includes(value)) {
    throw badRequest(`Недопустимое значение поля «${field}»`, 'VALIDATION', { field, allowed });
  }
  return value;
}

export function optionalNumber(value, field, { min = -Infinity, max = Infinity, fallback } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) throw badRequest(`Поле «${field}» должно быть числом`, 'VALIDATION', { field });
  if (n < min || n > max) throw badRequest(`Поле «${field}» вне диапазона ${min}–${max}`, 'VALIDATION', { field, min, max });
  return n;
}

/** ISO date (YYYY-MM-DD) or null. */
export function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    throw badRequest(`Поле «${field}» должно быть датой в формате ГГГГ-ММ-ДД`, 'VALIDATION', { field });
  }
  return s;
}

export function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest(`Поле «${field}» должно быть объектом`, 'VALIDATION', { field });
  }
  return value;
}
