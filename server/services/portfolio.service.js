// Applicant portfolio: achievements, projects, leadership, volunteering… stored per user, scored
// deterministically against the field rubric, and handed to the AI evaluator for a narrative review.
import crypto from 'node:crypto';
import { getStore, nowIso } from '../db/store.js';
import { badRequest, notFound } from '../utils/errors.js';
import {
  PORTFOLIO_ITEM_TYPES,
  PORTFOLIO_LEVELS,
  PORTFOLIO_RESULTS,
  PORTFOLIO_CRITERIA,
  FIELD_RUBRICS,
  fieldForMajors,
} from '../../shared/data/portfolioRubrics.js';

export const ITEM_TYPES = PORTFOLIO_ITEM_TYPES.map((t) => t.id);
export const LEVELS = PORTFOLIO_LEVELS.map((l) => l.id);
export const RESULTS = PORTFOLIO_RESULTS.map((r) => r.id);
const levelWeight = Object.fromEntries(PORTFOLIO_LEVELS.map((l) => [l.id, l.weight]));
const resultWeight = Object.fromEntries(PORTFOLIO_RESULTS.map((r) => [r.id, r.weight]));

export function toPublicItem(doc) {
  return {
    id: doc.id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    organization: doc.organization || '',
    level: doc.level || null,
    result: doc.result || null,
    role: doc.role || '',
    description: doc.description || '',
    startDate: doc.startDate || null,
    endDate: doc.endDate || null,
    hoursPerWeek: doc.hoursPerWeek ?? null,
    links: Array.isArray(doc.links) ? doc.links : [],
    documentId: doc.documentId || null,
    subjects: Array.isArray(doc.subjects) ? doc.subjects : [],
    olympiadId: doc.olympiadId || null,
    excluded: Boolean(doc.excluded),
    ai: doc.ai && typeof doc.ai === 'object' ? doc.ai : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function sanitize(input, existing = {}) {
  const s = (v, max) => (v === undefined ? undefined : String(v ?? '').trim().slice(0, max));
  const item = {
    type: ITEM_TYPES.includes(input.type) ? input.type : existing.type || 'other',
    title: s(input.title, 160) ?? existing.title,
    organization: s(input.organization, 160) ?? existing.organization ?? '',
    level: input.level === null ? null : LEVELS.includes(input.level) ? input.level : existing.level ?? null,
    result: input.result === null ? null : RESULTS.includes(input.result) ? input.result : existing.result ?? null,
    role: s(input.role, 120) ?? existing.role ?? '',
    description: s(input.description, 2000) ?? existing.description ?? '',
    startDate: input.startDate === undefined ? existing.startDate ?? null : validDate(input.startDate),
    endDate: input.endDate === undefined ? existing.endDate ?? null : validDate(input.endDate),
    hoursPerWeek: input.hoursPerWeek === undefined ? existing.hoursPerWeek ?? null : clampNum(input.hoursPerWeek, 0, 80),
    links: input.links === undefined ? existing.links ?? [] : normalizeLinks(input.links),
    documentId: input.documentId === undefined ? existing.documentId ?? null : input.documentId ? String(input.documentId).slice(0, 80) : null,
    subjects: input.subjects === undefined ? existing.subjects ?? [] : (Array.isArray(input.subjects) ? input.subjects : []).map((x) => String(x).slice(0, 40)).slice(0, 8),
    olympiadId: input.olympiadId === undefined ? existing.olympiadId ?? null : input.olympiadId ? String(input.olympiadId).slice(0, 80) : null,
    // The applicant may leave a weak entry out of the final application (the AI still sees it as context).
    excluded: input.excluded === undefined ? Boolean(existing.excluded) : Boolean(input.excluded),
  };
  if (!item.title) throw badRequest('Укажите название достижения', 'VALIDATION');
  return item;
}

/** Stores the AI verdicts on the items so the list shows them after a reload. */
export async function saveItemRatings(userId, ratings) {
  const store = await getStore();
  const saved = [];
  for (const r of ratings) {
    const doc = await store.get('portfolio_items', r.id);
    if (!doc || doc.userId !== userId) continue;
    const next = await store.update('portfolio_items', r.id, { ai: { score: r.score, verdict: r.verdict, recommendation: r.recommendation, useInEssay: r.useInEssay, field: r.field, evaluatedAt: r.evaluatedAt } });
    if (next) saved.push(toPublicItem(next));
  }
  return saved;
}

function validDate(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}(-\d{2})?$/.test(s) ? s : null;
}
function clampNum(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}
function normalizeLinks(links) {
  return (Array.isArray(links) ? links : [])
    .map((l) => String(l).trim())
    .filter((l) => /^https?:\/\/[^\s]{4,300}$/i.test(l))
    .slice(0, 6);
}

export async function listItems(userId) {
  const store = await getStore();
  const docs = await store.find('portfolio_items', { where: [['userId', '==', userId]], orderBy: [['createdAt', 'desc']] });
  return docs.map(toPublicItem);
}

export async function createItem(userId, input) {
  const store = await getStore();
  const now = nowIso();
  const id = `pf_${crypto.randomUUID()}`;
  const doc = await store.set('portfolio_items', id, { userId, ...sanitize(input), createdAt: now, updatedAt: now });
  return toPublicItem(doc);
}

export async function updateItem(userId, itemId, input) {
  const store = await getStore();
  const doc = await store.get('portfolio_items', itemId);
  if (!doc || doc.userId !== userId) throw notFound('Запись портфолио не найдена', 'PORTFOLIO_NOT_FOUND');
  const next = await store.update('portfolio_items', itemId, { ...sanitize({ ...doc, ...input }, doc), updatedAt: nowIso() });
  return toPublicItem(next);
}

export async function deleteItem(userId, itemId) {
  const store = await getStore();
  const doc = await store.get('portfolio_items', itemId);
  if (!doc || doc.userId !== userId) throw notFound('Запись портфолио не найдена', 'PORTFOLIO_NOT_FOUND');
  await store.remove('portfolio_items', itemId);
}

// ---------------------------------------------------------------------------
// Deterministic scoring — gives the AI hard numbers it must not contradict
// ---------------------------------------------------------------------------

const TYPE_CRITERIA = {
  olympiad: { depth: 1, achievements: 1 },
  competition: { achievements: 0.9, depth: 0.5, initiative: 0.3 },
  project: { depth: 0.8, initiative: 0.9, evidence: 0.3 },
  research: { depth: 1, achievements: 0.4, evidence: 0.3 },
  leadership: { initiative: 1, impact: 0.4 },
  volunteering: { impact: 1, initiative: 0.3 },
  internship: { depth: 0.6, initiative: 0.5, readiness: 0.3 },
  course: { academic: 0.3, readiness: 0.4, depth: 0.2 },
  publication: { depth: 0.6, achievements: 0.5, evidence: 0.5 },
  sport: { initiative: 0.4, impact: 0.2 },
  art: { depth: 0.6, evidence: 0.4 },
  other: { initiative: 0.3 },
};

const COMPETITIVE_TYPES = new Set(['olympiad', 'competition', 'sport', 'art']);

/** 0..1 — how much weight one entry carries. Competitions are judged by level × result, everything else by
 *  duration, intensity, measurable description and proof. */
function itemStrength(item) {
  const measurable = item.description && item.description.length > 80 && /\d/.test(item.description);
  const verifiable = Boolean(item.documentId) || item.links.length > 0;
  let s;
  if (COMPETITIVE_TYPES.has(item.type)) {
    const lvl = item.level ? levelWeight[item.level] || 1 : 1.5;
    const res = item.result ? resultWeight[item.result] || 0.6 : 0.6;
    s = (lvl / 5) * res;
    if (measurable) s += 0.05;
    if (verifiable) s += 0.08;
  } else {
    s = 0.45;
    const months = durationMonths(item);
    s += Math.min(0.25, months / 48); // a year of sustained work ≈ +0.25
    if ((item.hoursPerWeek || 0) >= 3) s += 0.1;
    if (measurable) s += 0.1;
    if (verifiable) s += 0.1;
    if (item.level === 'international' || item.result === 'winner' || item.result === 'gold') s += 0.1;
  }
  return Math.max(0.05, Math.min(1, s));
}

/**
 * Significance of a single entry on the 1–10 scale the applicant sees (deterministic; the AI may
 * move it by ±2 with a written reason). 9–10 = keep and build the essay around it, ≤4 = a candidate
 * to leave out of the final application.
 */
export function scoreItem(item) {
  const strength = itemStrength(item);
  const score = Math.max(1, Math.min(10, Math.round(strength * 10)));
  const reasons = [];
  if (COMPETITIVE_TYPES.has(item.type)) {
    if (!item.level) reasons.push('уровень не указан');
    if (!item.result || item.result === 'participant') reasons.push('только участие — комиссия ждёт результат');
    if (item.level === 'international' || item.level === 'republican') reasons.push('высокий уровень соревнования');
  } else {
    if (durationMonths(item) >= 12) reasons.push('длительная работа (год и больше)');
    if (!(item.description && item.description.length > 80 && /\d/.test(item.description))) reasons.push('нет измеримого описания с цифрами');
  }
  if (!item.documentId && !item.links?.length) reasons.push('нет подтверждения (документ или ссылка)');
  return { score, reasons };
}

export function recommendationForScore(score) {
  return score >= 9 ? 'highlight' : score >= 5 ? 'keep' : 'drop';
}

function durationMonths(item) {
  if (!item.startDate) return 0;
  const end = item.endDate || new Date().toISOString().slice(0, 7);
  return Math.max(0, monthsBetween(item.startDate, end));
}

function monthsBetween(a, b) {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Academic score 0..1 straight from the profile. */
function academicScore(profile) {
  if (!profile) return 0.4;
  const gpa4 = profile.gpaScale === '5.0' ? (Number(profile.gpa) / 5) * 4 : Number(profile.gpa) || 0;
  let s = Math.max(0, Math.min(1, (gpa4 - 2.5) / 1.5)) * 0.6;
  if (profile.hasIelts) s += Math.min(0.2, ((Number(profile.ieltsScore) || 0) - 5) / 10);
  if (profile.hasSat) s += Math.min(0.2, ((Number(profile.satScore) || 0) - 1000) / 3000);
  else if (profile.hasUnt) s += Math.min(0.2, ((Number(profile.untScore) || 0) - 70) / 350);
  return Math.max(0, Math.min(1, s));
}

/**
 * @returns {{ field: string, total: number, criteria: Array<{id, title, score, weight, evidence: string[]}>, spike: string[], gaps: string[] }}
 */
export function scorePortfolio(allItems, profile, fieldId) {
  // Entries the applicant excluded from the final application do not count towards the score.
  const items = (allItems || []).filter((it) => !it.excluded);
  const field = FIELD_RUBRICS[fieldId] || FIELD_RUBRICS[fieldForMajors(profile?.targetMajors)];
  const raw = Object.fromEntries(PORTFOLIO_CRITERIA.map((c) => [c.id, { score: 0, evidence: [] }]));

  for (const item of items) {
    const strength = itemStrength(item);
    for (const [crit, w] of Object.entries(TYPE_CRITERIA[item.type] || TYPE_CRITERIA.other)) {
      raw[crit].score += strength * w;
      if (strength * w >= 0.25) raw[crit].evidence.push(item.title);
    }
  }
  // Saturation: two strong entries ≈ full marks for a criterion.
  const norm = (x) => 1 - Math.exp(-x / 1.0);
  const criteria = PORTFOLIO_CRITERIA.map((c) => {
    let score;
    if (c.id === 'academic') score = academicScore(profile) * 0.7 + norm(raw.academic.score) * 0.3;
    else if (c.id === 'readiness') score = Math.min(1, (profile?.hasIelts ? Math.min(1, ((Number(profile.ieltsScore) || 0) - 4.5) / 3) : 0.15) * 0.7 + norm(raw.readiness.score) * 0.3);
    else score = norm(raw[c.id].score);
    return { id: c.id, title: c.title, score: Math.round(score * 100), weight: field.weights[c.id] ?? c.weight, evidence: raw[c.id].evidence.slice(0, 4) };
  });
  const total = Math.round(criteria.reduce((sum, c) => sum + (c.score / 100) * c.weight, 0) * 100);

  // Spike detection: the subject/type cluster with the most weight.
  const byType = new Map();
  for (const item of items) byType.set(item.type, (byType.get(item.type) || 0) + itemStrength(item));
  const spike = [...byType].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
  const gaps = criteria.filter((c) => c.score < 45).sort((a, b) => b.weight - a.weight).map((c) => c.id);

  return { field: field.id, fieldTitle: field.title, total, criteria, spike, gaps, itemCount: items.length, excludedCount: (allItems || []).length - items.length };
}

export function tierForScore(total) {
  if (total >= 80) return 'exceptional';
  if (total >= 65) return 'strong';
  if (total >= 45) return 'developing';
  return 'early';
}
