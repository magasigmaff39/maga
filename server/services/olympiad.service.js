// Olympiad & competition catalogue: search, filters and a deterministic recommender that ranks
// competitions for a specific applicant (subjects, grade, target majors/regions, current level).
import { OLYMPIAD_DATABASE, OLYMPIAD_BY_ID, OLYMPIAD_SUBJECTS } from '../../shared/data/olympiads.js';

const SUBJECT_ALIASES = {
  math: ['матем', 'math', 'математика', 'алгебра', 'геометр'],
  physics: ['физ', 'physics'],
  informatics: ['информат', 'програм', 'informatics', 'computer', 'it', 'cs', 'coding'],
  chemistry: ['хим', 'chem'],
  biology: ['биол', 'bio'],
  astronomy: ['астроном', 'astro'],
  economics: ['эконом', 'econom', 'финанс', 'business', 'бизнес'],
  geography: ['геогр', 'geograph'],
  history: ['истор', 'history', 'право', 'law'],
  linguistics: ['лингв', 'linguist', 'язык', 'language', 'казахск', 'русск'],
  english: ['англ', 'english'],
  essay: ['эссе', 'essay', 'литерат', 'writing'],
  debate: ['дебат', 'debate', 'speaking', 'mun'],
  robotics: ['робот', 'robot'],
  research: ['исслед', 'research', 'проект', 'science'],
  entrepreneurship: ['предприним', 'startup', 'стартап', 'entrepreneur'],
  design: ['дизайн', 'design', 'медиа', 'media', 'video', 'видео'],
};

/** Map free-form school subject names ("Математика", "Physics") to catalogue subject ids. */
export function normalizeSubjects(names = []) {
  const out = new Set();
  for (const raw of names) {
    const s = String(raw || '').toLowerCase();
    for (const [id, aliases] of Object.entries(SUBJECT_ALIASES)) {
      if (aliases.some((a) => s.includes(a))) out.add(id);
    }
  }
  return [...out];
}

const GRADE_TO_NUMBER = { grade_9: 9, grade_10: 10, grade_11: 11, college: 12, gap_year: 12 };
const LEVEL_RANK = { none: 0, school: 1, city: 2, republican: 4, international: 5 };
const OLY_LEVEL_RANK = { school: 1, city: 2, regional: 3, republican: 4, international: 5 };
const REGION_KEY = { kazakhstan: 'kazakhstan', usa_canada: 'usa', europe: 'europe', asia: 'asia' };

export function searchOlympiads({ q, subject, category, level, region, grade, major, online, limit = 100 } = {}) {
  const query = (q || '').toLowerCase().trim();
  return OLYMPIAD_DATABASE.filter((o) => {
    if (subject && !o.subjects.includes(subject)) return false;
    if (category && o.category !== category) return false;
    if (level && o.level !== level) return false;
    if (region && o.region !== region) return false;
    if (grade && !o.grades.includes(Number(grade))) return false;
    if (major && !o.majors.includes(major)) return false;
    if (online !== undefined && online !== null && o.online !== online) return false;
    if (query) {
      const hay = `${o.name} ${o.shortName} ${o.nameEn} ${o.organizer} ${o.description} ${o.subjects.join(' ')}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  }).slice(0, limit);
}

export function getOlympiad(id) {
  return OLYMPIAD_BY_ID.get(id) || null;
}

/**
 * Rank competitions for an applicant. Returns items with `fit` (0-100), `reasons`, and the next
 * relevant month so the frontend can build a calendar.
 */
export function recommendOlympiads(profile, { limit = 12, now = new Date() } = {}) {
  const gradeNum = GRADE_TO_NUMBER[profile?.grade] || 11;
  const subjects = new Set(normalizeSubjects(profile?.profileSubjects || []));
  const majors = new Set(profile?.targetMajors || []);
  const regions = (profile?.targetRegions || []).map((r) => REGION_KEY[r]).filter(Boolean);
  const currentLevel = LEVEL_RANK[profile?.olympiadLevel] ?? 0;
  const month = now.getMonth() + 1;

  const scored = OLYMPIAD_DATABASE.map((o) => {
    let fit = 10;
    const reasons = [];
    if (!o.grades.includes(gradeNum) && !(gradeNum >= 12 && o.grades.includes(11))) return null; // not eligible by grade

    const subjHits = o.subjects.filter((s) => subjects.has(s));
    if (subjHits.length) {
      fit += 20;
      reasons.push(`Совпадает с профильными предметами: ${subjHits.map(labelSubject).join(', ')}`);
    }
    const majorHits = o.majors.filter((m) => majors.has(m));
    if (majorHits.length) {
      fit += 15;
      reasons.push('Прямо относится к выбранному направлению обучения');
    }
    if (regions.length) {
      const rec = Math.max(...regions.map((r) => o.recognition[r] || 0));
      fit += rec * 3;
      if (rec >= 4) reasons.push(`Высоко ценится приёмными комиссиями целевого региона (${rec}/5)`);
    } else {
      fit += Math.max(...Object.values(o.recognition)) * 2;
    }
    // Level progression: recommend one step above current, penalise huge jumps and steps back.
    const oRank = OLY_LEVEL_RANK[o.level] || 3;
    const delta = oRank - currentLevel;
    if (delta === 1 || delta === 0) {
      fit += 10;
      reasons.push('Следующая логичная ступень относительно текущего уровня');
    } else if (delta >= 3 && o.category === 'olympiad' && !o.online) {
      fit -= 15;
      reasons.push('Требует нескольких лет подготовки — планируйте как долгосрочную цель');
    }
    if (o.online || o.region === 'online') {
      fit += 3;
      reasons.push('Доступно онлайн — не зависит от школы и города');
    }
    if (o.cost.startsWith('бесплатно') || o.cost.startsWith('за счёт')) fit += 2;
    if (profile?.budgetTier === 'grant_only' && o.benefits.some((b) => /грант/i.test(b))) {
      fit += 6;
      reasons.push('Победа даёт грант — важно при бюджете «только грант»');
    }
    // Timing: how soon the next active month is.
    const nextIn = nextActiveMonth(o.monthsActive, month);
    if (nextIn <= 1) {
      fit += 5;
      reasons.push('Сезон открыт сейчас — регистрируйтесь в этом месяце');
    } else if (nextIn <= 3) fit += 2;

    return { olympiad: o, fit: Math.max(5, Math.min(98, Math.round(fit))), reasons: reasons.slice(0, 4), nextActiveInMonths: nextIn };
  }).filter(Boolean);

  scored.sort((a, b) => b.fit - a.fit || a.nextActiveInMonths - b.nextActiveInMonths);
  return scored.slice(0, limit);
}

function nextActiveMonth(months, current) {
  if (!months?.length) return 12;
  let best = 12;
  for (const m of months) {
    const d = (m - current + 12) % 12;
    if (d < best) best = d;
  }
  return best;
}

function labelSubject(id) {
  return OLYMPIAD_SUBJECTS.find((s) => s.id === id)?.label || id;
}

/** 12-month plan: which competitions to register for in which month. */
export function buildOlympiadCalendar(recommendations, { now = new Date() } = {}) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const byMonth = new Map();
  for (let i = 0; i < 12; i++) {
    const m = ((month - 1 + i) % 12) + 1;
    const y = year + Math.floor((month - 1 + i) / 12);
    byMonth.set(`${y}-${String(m).padStart(2, '0')}`, []);
  }
  for (const rec of recommendations) {
    const o = rec.olympiad;
    for (const key of byMonth.keys()) {
      const m = Number(key.slice(5));
      if (o.monthsActive.includes(m) && !byMonth.get(key).some((x) => x.id === o.id)) {
        const isFirst = !o.monthsActive.includes(((m - 2 + 12) % 12) + 1);
        byMonth.get(key).push({ id: o.id, shortName: o.shortName, phase: isFirst ? 'registration' : 'active', url: o.officialUrl });
      }
    }
  }
  return [...byMonth].map(([month, items]) => ({ month, items }));
}
