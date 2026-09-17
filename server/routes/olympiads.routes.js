// /api/olympiads — catalogue search, personal recommendations, 12-month calendar and AI strategy.
import { Router } from 'express';
import { asyncHandler, notFound } from '../utils/errors.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { searchOlympiads, getOlympiad, recommendOlympiads, buildOlympiadCalendar } from '../services/olympiad.service.js';
import { olympiadAdvice } from '../services/ai.service.js';
import { getProfile } from '../services/auth.service.js';
import { OLYMPIAD_SUBJECTS, OLYMPIAD_CATEGORIES, OLYMPIAD_COUNTS } from '../../shared/data/olympiads.js';
import { pickLang } from './universities.routes.js';

export const olympiadsRouter = Router();

olympiadsRouter.get('/', (req, res) => {
  const q = req.query;
  const items = searchOlympiads({
    q: q.q ? String(q.q) : undefined,
    subject: q.subject ? String(q.subject) : undefined,
    category: q.category ? String(q.category) : undefined,
    level: q.level ? String(q.level) : undefined,
    region: q.region ? String(q.region) : undefined,
    grade: q.grade ? Number(q.grade) : undefined,
    major: q.major ? String(q.major) : undefined,
    online: q.online === undefined ? undefined : q.online === 'true',
    limit: Math.min(200, Number(q.limit) || 200),
  });
  res.json({ total: items.length, items, subjects: OLYMPIAD_SUBJECTS, categories: OLYMPIAD_CATEGORIES, counts: OLYMPIAD_COUNTS });
});

async function resolveProfile(req) {
  if (req.body?.profile && typeof req.body.profile === 'object') return req.body.profile;
  if (req.user) return (await getProfile(req.user.id))?.profile || null;
  return null;
}

/** Deterministic recommendations + calendar (works for guests when a profile is posted). */
olympiadsRouter.post(
  '/recommend',
  asyncHandler(async (req, res) => {
    const profile = await resolveProfile(req);
    const recs = recommendOlympiads(profile, { limit: Math.min(20, Number(req.body?.limit) || 12) });
    res.json({
      items: recs.map((r) => ({ ...r.olympiad, fit: r.fit, reasons: r.reasons, nextActiveInMonths: r.nextActiveInMonths })),
      calendar: buildOlympiadCalendar(recs),
    });
  }),
);

/** AI strategy on top of the recommender. */
olympiadsRouter.post(
  '/advice',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const profile = await resolveProfile(req);
    res.json(await olympiadAdvice({ userId: req.user?.id, profile, language: pickLang(req), uiState: req.body?.uiState, limit: Math.min(10, Number(req.body?.limit) || 8) }));
  }),
);

olympiadsRouter.get('/:id', (req, res) => {
  const o = getOlympiad(req.params.id);
  if (!o) throw notFound('Олимпиада не найдена', 'OLYMPIAD_NOT_FOUND');
  res.json(o);
});
