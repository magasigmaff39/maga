// /api/universities — searchable knowledge base + per-university news/social analysis + chance estimates.
import { Router } from 'express';
import { asyncHandler, notFound } from '../utils/errors.js';
import { requireObject } from '../utils/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { UNIVERSITY_DATABASE, UNIVERSITY_BY_ID, UNIVERSITY_COUNTS } from '../../shared/data/universities/index.js';
import { UNIVERSAL_LIKES, UNIVERSAL_DISLIKES, COMMON_INCONVENIENCES, DOCUMENT_CHECKLIST, PREP_PLANS, ADMISSIONS_CALENDAR } from '../../shared/data/admissionsKnowledge.js';
import { estimateWithProjections, estimateForAll } from '../../shared/logic/chance.js';
import { analyzeUniversityNews, analyzeUniversitySocial } from '../services/ai.service.js';
import { getUniversityNews } from '../services/news.service.js';
import { getSocialSignals } from '../services/social.service.js';

export const universitiesRouter = Router();

/** Compact list item — the full record is fetched on demand. */
const toListItem = (u) => ({
  id: u.id,
  name: u.name,
  shortName: u.shortName,
  nativeName: u.nativeName,
  city: u.city,
  country: u.country,
  flag: u.flag,
  region: u.region,
  type: u.type,
  worldRank: u.worldRank,
  nationalRank: u.nationalRank,
  tuitionUSDPerYear: u.tuitionUSDPerYear,
  hasFullGrantOrScholarship: u.hasFullGrantOrScholarship,
  scholarshipName: u.scholarshipName,
  minGpa: u.minGpa,
  minIelts: u.minIelts,
  minSat: u.minSat,
  minUnt: u.minUnt,
  acceptanceRate: u.acceptanceRate,
  regularDeadline: u.regularDeadline,
  earlyDeadline: u.earlyDeadline,
  supportedMajors: u.supportedMajors,
  testPolicy: u.admissions?.testPolicy,
  safety: u.campus?.neighborhoodSafety,
  links: u.links,
});

universitiesRouter.get('/', (req, res) => {
  const { q, region, major, grant, maxTuition, testPolicy, minSafety, sort = 'name', limit, full } = req.query;
  let list = UNIVERSITY_DATABASE;

  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter((u) => [u.name, u.shortName, u.nativeName, u.city, u.country, ...(u.flagshipPrograms || [])].some((s) => String(s).toLowerCase().includes(needle)));
  }
  if (region) list = list.filter((u) => String(region).split(',').includes(u.region));
  if (major) list = list.filter((u) => String(major).split(',').some((m) => u.supportedMajors.includes(m)));
  if (grant === 'true' || grant === '1') list = list.filter((u) => u.hasFullGrantOrScholarship);
  if (maxTuition) list = list.filter((u) => u.tuitionUSDPerYear <= Number(maxTuition));
  if (testPolicy) list = list.filter((u) => u.admissions?.testPolicy === testPolicy);
  if (minSafety) list = list.filter((u) => (u.campus?.neighborhoodSafety || 0) >= Number(minSafety));

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    tuition: (a, b) => a.tuitionUSDPerYear - b.tuitionUSDPerYear,
    acceptance: (a, b) => parseFloat(b.acceptanceRate) - parseFloat(a.acceptanceRate),
    safety: (a, b) => (b.campus?.neighborhoodSafety || 0) - (a.campus?.neighborhoodSafety || 0),
  };
  list = [...list].sort(sorters[sort] || sorters.name);
  if (limit) list = list.slice(0, Number(limit));

  res.json({ total: list.length, counts: UNIVERSITY_COUNTS, items: full === 'true' ? list : list.map(toListItem) });
});

universitiesRouter.get('/meta/knowledge', (_req, res) => {
  res.json({ likes: UNIVERSAL_LIKES, dislikes: UNIVERSAL_DISLIKES, inconveniences: COMMON_INCONVENIENCES, documents: DOCUMENT_CHECKLIST, prepPlans: PREP_PLANS, calendar: ADMISSIONS_CALENDAR });
});

universitiesRouter.get('/meta/counts', (_req, res) => res.json(UNIVERSITY_COUNTS));

/** Chance estimates for the whole base (or a subset) given a profile in the body. */
universitiesRouter.post(
  '/chance',
  asyncHandler(async (req, res) => {
    const profile = requireObject(req.body?.profile, 'profile');
    const ids = Array.isArray(req.body?.universityIds) ? req.body.universityIds : null;
    const pool = ids ? ids.map((id) => UNIVERSITY_BY_ID.get(id)).filter(Boolean) : UNIVERSITY_DATABASE;
    res.json({ items: estimateForAll(profile, pool) });
  }),
);

function loadUni(req) {
  const u = UNIVERSITY_BY_ID.get(req.params.id);
  if (!u) throw notFound('Университет не найден', 'UNI_NOT_FOUND');
  return u;
}

universitiesRouter.get('/:id', (req, res) => {
  res.json(loadUni(req));
});

universitiesRouter.post(
  '/:id/chance',
  asyncHandler(async (req, res) => {
    const u = loadUni(req);
    res.json(estimateWithProjections(requireObject(req.body?.profile, 'profile'), u));
  }),
);

universitiesRouter.get(
  '/:id/news',
  asyncHandler(async (req, res) => {
    res.json(await getUniversityNews(loadUni(req)));
  }),
);

universitiesRouter.get(
  '/:id/news/analysis',
  aiLimiter,
  asyncHandler(async (req, res) => {
    res.json(await analyzeUniversityNews(loadUni(req), { language: pickLang(req) }));
  }),
);

universitiesRouter.get(
  '/:id/social',
  asyncHandler(async (req, res) => {
    res.json(await getSocialSignals(loadUni(req)));
  }),
);

universitiesRouter.get(
  '/:id/social/analysis',
  aiLimiter,
  asyncHandler(async (req, res) => {
    res.json(await analyzeUniversitySocial(loadUni(req), { language: pickLang(req) }));
  }),
);

export function pickLang(req) {
  const l = String(req.query?.lang || req.body?.language || req.headers['x-app-language'] || 'ru');
  return ['kk', 'en', 'ru'].includes(l) ? l : 'ru';
}
