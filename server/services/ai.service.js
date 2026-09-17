// AI advisor. Gemini (large context) is the primary model, Groq the fallback. Every call is grounded in the
// shared knowledge base (77 universities, olympiad catalogue, admissions know-how) and in everything the
// platform knows about the applicant: profile, portfolio, tasks, documents, previous analyses, screen state.
import crypto from 'node:crypto';
import { UNIVERSITY_DATABASE, UNIVERSITY_BY_ID } from '../../shared/data/universities/index.js';
import { UNIVERSAL_LIKES, UNIVERSAL_DISLIKES, COMMON_INCONVENIENCES } from '../../shared/data/admissionsKnowledge.js';
import { OLYMPIAD_DATABASE, OLYMPIAD_BY_ID } from '../../shared/data/olympiads.js';
import { FIELD_RUBRICS, PORTFOLIO_CRITERIA, fieldForMajors } from '../../shared/data/portfolioRubrics.js';
import { estimateWithProjections } from '../../shared/logic/chance.js';
import { pickTargetUniversities } from '../../shared/logic/match.js';
import { complete, completeJson, isLlmConfigured, llmStatus } from './llm.js';
import { geminiStatus, inlineFilePart, GEMINI_READABLE_MIME, isGeminiConfigured } from './gemini.client.js';
import { aiStatus as groqStatus } from './groq.client.js';
import { getUniversityNews, getSectorNews } from './news.service.js';
import { getSocialSignals } from './social.service.js';
import { getStore, nowIso, cacheGet, cacheSet } from '../db/store.js';
import { buildUserContext, renderContext, describeProfile, chanceTable } from './context.service.js';
import { scorePortfolio, tierForScore, scoreItem, recommendationForScore, saveItemRatings } from './portfolio.service.js';
import { recommendOlympiads } from './olympiad.service.js';
import { config } from '../config.js';

export { describeProfile };

import { persona, langName } from './persona.js';
export { persona, langName };

export function aiStatus() {
  return { ...llmStatus(), gemini: geminiStatus(), groq: groqStatus() };
}

function safeInput(input) {
  try {
    const json = JSON.stringify(input ?? null);
    return json.length > 60_000 ? { truncated: true, keys: Object.keys(input || {}) } : JSON.parse(json);
  } catch {
    return null;
  }
}

/** Keep every structured analysis so the advisor (and the user) can refer back to it. */
async function persistAnalysis(userId, kind, input, output) {
  try {
    const store = await getStore();
    const id = `an_${crypto.randomUUID()}`;
    await store.set('ai_analyses', id, { userId: userId || null, kind, input: safeInput(input), output, createdAt: nowIso() });
    return id;
  } catch (err) {
    console.warn('[ai] persistAnalysis failed:', err.message?.slice(0, 100));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Knowledge base rendering
// ---------------------------------------------------------------------------

/** Short fact sheet (~120 tokens). */
export function summarizeUniversityCompact(u) {
  const env = u.environment;
  return [
    `- ${u.name} [${u.id}] — ${u.city}, ${u.country}. Приём ${u.acceptanceRate}; GPA ${u.minGpa}, IELTS ${u.minIelts}${u.minSat ? `, SAT ${u.minSat}` : ''}${u.minUnt ? `, ЕНТ ${u.minUnt}` : ''}; тесты: ${u.admissions?.testPolicy || '—'}.`,
    `  Финансы: $${u.tuitionUSDPerYear}/год; ${u.scholarshipName}. Дедлайн: ${u.regularDeadline}. Сильное: ${u.flagshipPrograms.slice(0, 3).join(', ')}.`,
    `  Район ${u.campus?.neighborhoodSafety ?? '—'}/10. ${env ? `Климат: ${env.climate.split(':')[0]}; аллергены: ${env.allergyNotes.split('.')[0]}.` : ''} Ценят: ${u.admissions?.likes.slice(0, 2).join('; ') || '—'}. Портал: ${u.officialPortalUrl}`,
  ].join('\n');
}

/** Full fact sheet the model can cite without hallucinating. */
export function summarizeUniversity(u, { full = false } = {}) {
  const lines = [
    `### ${u.name} (${u.shortName}) — ${u.city}, ${u.country} [id: ${u.id}]`,
    `Рейтинг: ${u.worldRank || '—'}; ${u.nationalRank || ''}. Тип: ${u.type || '—'}, основан ${u.founded || '—'}.`,
    `Приём: ${u.acceptanceRate}. Пороги: GPA ${u.minGpa}/4.0, IELTS ${u.minIelts}${u.minSat ? `, SAT ${u.minSat}` : ''}${u.minUnt ? `, ЕНТ ${u.minUnt}` : ''}. Политика тестов: ${u.admissions?.testPolicy || '—'}${u.admissions?.interview ? ', есть интервью' : ''}.`,
    `Стоимость: обучение $${u.tuitionUSDPerYear}/год, проживание $${u.livingCostUSDPerYear}/год. Финансирование: ${u.scholarshipName} — ${u.scholarshipDescription}`,
    `Дедлайны: ${u.earlyDeadline ? `ранний ${u.earlyDeadline}; ` : ''}основной ${u.regularDeadline}. Портал: ${u.officialPortalUrl}`,
    `Сильные программы: ${u.flagshipPrograms.join(', ')}.`,
    `Официальные требования: ${(u.admissionRequirements || []).join('; ') || '—'}.`,
    `Документы для подачи: ${(u.requiredDocuments || []).join(', ') || '—'}. Тип помощи: ${u.financialAidType || '—'}.`,
    `Описание: ${u.description || ''}`,
  ];
  if (u.campus) {
    lines.push(`Район/безопасность: ${u.campus.neighborhoodSafety}/10 — ${u.campus.neighborhoodNotes}`);
    lines.push(`Оборудование: ${u.campus.equipment.slice(0, full ? 10 : 4).join('; ')}. Общежитие: ${u.campus.dormitories}`);
    lines.push(`Внутренние проекты: ${u.campus.internalProjects.slice(0, full ? 10 : 4).join('; ')}.`);
  }
  if (u.environment) {
    lines.push(`Климат: ${u.environment.climate}. Аллергены/здоровье: ${u.environment.allergyNotes} Воздух: ${u.environment.airQuality}. Еда: ${u.environment.foodOptions.join(', ')}. Языки обучения: ${u.environment.languagesOfInstruction.join(', ')}.`);
  }
  if (u.admissions) {
    lines.push(`Комиссия ценит: ${u.admissions.likes.slice(0, full ? 10 : 4).join('; ')}. Не любит: ${u.admissions.dislikes.slice(0, full ? 10 : 4).join('; ') || '—'}. Типичные сложности: ${u.admissions.commonPitfalls.slice(0, full ? 10 : 3).join('; ')}.`);
  }
  if (u.stats) {
    lines.push(`Статистика: студентов ${u.stats.totalStudents ?? '—'}, иностранцев ${u.stats.internationalShare ?? '—'}, SAT зачисленных ${u.stats.avgSat ?? '—'}, трудоустройство ${u.stats.graduateEmployment ?? '—'}.`);
  }
  if (u.links) {
    const l = u.links;
    lines.push(`Ссылки: сайт ${l.website}; приём ${l.admissions}${l.instagram ? `; Instagram ${l.instagram}` : ''}${l.youtube ? `; YouTube ${l.youtube}` : ''}${l.telegram ? `; Telegram ${l.telegram}` : ''}`);
  }
  lines.push(`Плюсы: ${u.advantages.join('; ')}. Минусы: ${u.cautions.join('; ')}.`);
  return lines.join('\n');
}

function summarizeOlympiadCompact(o) {
  return `- ${o.shortName} [${o.id}] — ${o.level}, ${o.subjects.join('/')}, классы ${o.grades[0]}–${o.grades[o.grades.length - 1]}, финал: ${o.timeline.finals}; ${o.cost}; ${o.benefits[0]}. ${o.officialUrl}`;
}

/** Pick the universities most relevant to the conversation: mentioned by name, targeted, compared, or best matches. */
export function selectRelevantUniversities(profile, text, { limit = 8, extraIds = [] } = {}) {
  const lower = (text || '').toLowerCase();
  const picked = new Map();
  for (const u of UNIVERSITY_DATABASE) {
    const names = [u.name, u.shortName, u.nativeName, u.id].filter(Boolean).map((s) => s.toLowerCase());
    if (names.some((n) => n.length >= 3 && lower.includes(n))) picked.set(u.id, u);
  }
  for (const id of [...extraIds, ...(profile?.targetUniversityIds || [])]) {
    const u = UNIVERSITY_BY_ID.get(id);
    if (u) picked.set(u.id, u);
  }
  if (picked.size < limit && profile) {
    const scored = UNIVERSITY_DATABASE.filter((u) => !picked.has(u.id))
      .map((u) => ({ u, score: quickMatchScore(profile, u) }))
      .sort((a, b) => b.score - a.score);
    for (const { u } of scored) {
      if (picked.size >= limit) break;
      picked.set(u.id, u);
    }
  }
  return [...picked.values()].slice(0, limit);
}

function quickMatchScore(profile, u) {
  let s = 0;
  if ((u.supportedMajors || []).some((m) => (profile.targetMajors || []).includes(m))) s += 30;
  if ((profile.targetRegions || []).includes(u.region)) s += 25;
  if (profile.budgetTier === 'grant_only' && u.hasFullGrantOrScholarship) s += 20;
  if (profile.budgetTier === 'grant_only' && !u.hasFullGrantOrScholarship) s -= 40;
  const gpa = profile.gpaScale === '5.0' ? (profile.gpa / 5) * 4 : profile.gpa;
  if (gpa >= u.minGpa) s += 10;
  if (profile.hasIelts && profile.ieltsScore >= u.minIelts) s += 8;
  if (profile.hasUnt && u.minUnt) s += 8;
  return s;
}

/** Everything the model may cite. `focus` universities get the full sheet, the rest the compact one. */
export function knowledgeBase({ focusIds = [], includeAllUniversities = true, includeOlympiads = true, universe = null } = {}) {
  const focus = new Set(focusIds);
  const parts = [];
  const pool = Array.isArray(universe) && universe.length ? universe : UNIVERSITY_DATABASE;
  if (focus.size) parts.push(`## Университеты в фокусе (полные данные)\n${[...focus].map((id) => UNIVERSITY_BY_ID.get(id)).filter(Boolean).map((u) => summarizeUniversity(u)).join('\n\n')}`);
  if (includeAllUniversities) {
    parts.push(`## Вся база университетов (${UNIVERSITY_DATABASE.length}) — краткие карточки\n${UNIVERSITY_DATABASE.filter((u) => !focus.has(u.id)).map(summarizeUniversityCompact).join('\n')}`);
  }
  if (includeOlympiads) parts.push(`## Каталог олимпиад и конкурсов (${OLYMPIAD_DATABASE.length})\n${OLYMPIAD_DATABASE.map(summarizeOlympiadCompact).join('\n')}`);
  parts.push(
    `## Что ценят приёмные комиссии\n${UNIVERSAL_LIKES.map((x) => `- ${x.title}: ${x.desc || ''}`).join('\n')}\n\n## Что не любят\n${UNIVERSAL_DISLIKES.map((x) => `- ${x.title}: ${x.desc || ''}`).join('\n')}\n\n## Типичные сложности при поступлении и как их решать\n${COMMON_INCONVENIENCES.map((x) => `- ${x.title}: ${x.fix}`).join('\n')}`,
  );
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Deep applicant analysis → ranked universities (JSON)
// ---------------------------------------------------------------------------

export async function analyzeApplicant({ userId, profile, freeText = '', language = 'ru', limit = 6, uiState }) {
  const ctx = await buildUserContext({ userId, profile, uiState });
  const p = ctx.profile || profile;
  const candidates = UNIVERSITY_DATABASE.map((u) => ({ u, score: quickMatchScore(p, u) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map(({ u }) => u);
  const chances = Object.fromEntries(candidates.map((u) => [u.id, estimateWithProjections(p, u)]));

  const fallback = () => ({
    summary: 'AI недоступен — показаны детерминированные оценки шансов.',
    ranked: candidates.slice(0, limit).map((u) => ({
      id: u.id,
      name: u.name,
      fitScore: chances[u.id].probability,
      chance: chances[u.id].probability,
      tier: chances[u.id].tier,
      reasons: chances[u.id].factors.filter((f) => f.impact > 0).map((f) => f.note),
      risks: chances[u.id].factors.filter((f) => f.impact < 0).map((f) => f.note),
      healthAndLifestyle: u.environment?.allergyNotes || '',
      estimate: chances[u.id],
      links: u.links,
    })),
    redFlags: [],
    nextSteps: [],
    testStrategy: '',
    model: 'offline-rules',
  });
  if (!isLlmConfigured()) return fallback();

  const system = `${persona(language)}
Ты выступаешь как приёмный аналитик. Верни СТРОГО JSON по схеме (все строки — на ${langName(language)} языке):
{
  "summary": string,            // 4–6 предложений: сильные стороны, главный риск, стратегия подачи; упомяни портфолио и документы, если они есть
  "ranked": [                   // ровно ${limit} университетов из списка кандидатов, по убыванию соответствия
    { "id": string, "name": string, "fitScore": number, "chance": number /* не выше расчётного + 5 */, "tier": "Dream"|"Target"|"Safety",
      "reasons": string[] /* 3–4 конкретных причины с фактами из базы */, "risks": string[] /* 1–3 */,
      "healthAndLifestyle": string /* климат, аллергены, питание, город — применительно к этому человеку */ }
  ],
  "redFlags": string[],         // что в профиле/портфолио отпугнёт комиссии и как исправить
  "nextSteps": [{ "title": string, "deadline": string, "category": "sat"|"ielts"|"unt"|"documents"|"essay"|"application"|"olympiad"|"portfolio"|"other" }], // 5–7 задач
  "testStrategy": string        // какие тесты сдавать, в каком порядке, целевые баллы и даты
}`;
  const user = `# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'full', language })}

## Дополнительно от абитуриента
${(freeText || '—').slice(0, 3000)}

## Расчётные шансы (поле chance не должно превышать их более чем на 5 п.п.)
${candidates.map((u) => `- ${u.id}: ${chances[u.id].probability}% (${chances[u.id].tier}); факторы: ${chances[u.id].factors.slice(0, 3).map((f) => f.note).join('; ')}`).join('\n')}

# КАНДИДАТЫ (полные данные)
${candidates.map((u) => summarizeUniversity(u)).join('\n\n')}

# ОБЩИЕ ЗНАНИЯ
${knowledgeBase({ includeAllUniversities: false, includeOlympiads: false })}`;

  const fallbackPrompt = {
    system,
    messages: [{ role: 'user', content: `${describeProfile(p)}\n\n${(freeText || '').slice(0, 800)}\n\nРасчётные шансы:\n${candidates.slice(0, limit + 1).map((u) => `- ${u.id}: ${chances[u.id].probability}% (${chances[u.id].tier})`).join('\n')}\n\nКандидаты:\n${candidates.slice(0, limit + 1).map(summarizeUniversityCompact).join('\n')}` }],
  };

  let data;
  let model = 'offline-rules';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'deep', maxTokens: 6000, temperature: 0.3, fallback: fallbackPrompt });
    data = res.data;
    model = `${res.provider}:${res.model}`;
  } catch (err) {
    console.warn('[ai] analyzeApplicant failed, using fallback:', err.message);
    return fallback();
  }
  if (!data || !Array.isArray(data.ranked)) return fallback();

  const ranked = data.ranked
    .filter((r) => UNIVERSITY_BY_ID.has(r.id))
    .slice(0, limit)
    .map((r) => {
      const u = UNIVERSITY_BY_ID.get(r.id);
      const c = chances[r.id] || estimateWithProjections(p, u);
      return {
        ...r,
        name: u.name,
        chance: Math.min(Number(r.chance) || c.probability, c.probability + 5),
        fitScore: Math.max(0, Math.min(100, Number(r.fitScore) || c.probability)),
        tier: ['Dream', 'Target', 'Safety'].includes(r.tier) ? r.tier : c.tier,
        estimate: c,
        links: u.links,
      };
    });
  const output = { ...data, ranked, model };
  await persistAnalysis(userId, 'applicant', { freeText, language }, output);
  return output;
}

// ---------------------------------------------------------------------------
// Portfolio evaluation for a field and a set of universities (JSON)
// ---------------------------------------------------------------------------

export async function evaluatePortfolio({ userId, profile, field, universityIds = [], language = 'ru', uiState }) {
  const ctx = await buildUserContext({ userId, profile, uiState, withPortfolioScore: false });
  const p = ctx.profile || profile;
  const fieldId = FIELD_RUBRICS[field] ? field : fieldForMajors(p?.targetMajors);
  const rubric = FIELD_RUBRICS[fieldId];
  const computed = scorePortfolio(ctx.portfolio, p, fieldId);
  // Universities come from the request when the applicant insists on a manual list; otherwise the
  // engine picks a balanced safety / target / dream set from their preferences (spec §11).
  const explicit = universityIds.filter((id) => UNIVERSITY_BY_ID.has(id)).slice(0, 6);
  const autoPicked = explicit.length ? [] : pickTargetUniversities(p, UNIVERSITY_DATABASE, { limit: 5 });
  const targets = explicit.length ? explicit : autoPicked.map((u) => u.id);
  const chances = chanceTable(p, targets);
  const olympiadPicks = recommendOlympiads(p, { limit: 8 });

  const base = {
    field: fieldId,
    fieldTitle: rubric.title,
    computed,
    tier: tierForScore(computed.total),
    targetsAuto: !explicit.length,
    targets: targets.map((id) => {
      const picked = autoPicked.find((u) => u.id === id);
      const u = UNIVERSITY_BY_ID.get(id);
      return { id, name: u.name, shortName: u.shortName, ...(picked ? { fit: picked.fit, probability: picked.probability, tier: picked.tier, reasons: picked.reasons } : {}) };
    }),
  };
  // Deterministic 1–10 per entry: the answer when the model is unavailable and the anchor the model must stay near.
  const offlineItems = () => ctx.portfolio.map((it) => {
    const r = scoreItem(it);
    return { id: it.id, title: it.title, score: r.score, verdict: r.reasons.length ? `Расчёт системы: ${r.reasons.join('; ')}.` : 'Расчёт системы по уровню, результату и подтверждениям.', recommendation: recommendationForScore(r.score), useInEssay: r.score >= 8, field: fieldId, evaluatedAt: nowIso() };
  });
  if (!isLlmConfigured()) {
    const items = offlineItems();
    await saveItemRatings(userId, items);
    return { ...base, overallScore: computed.total, headline: 'AI недоступен — показана расчётная оценка.', summary: '', criteria: computed.criteria.map((c) => ({ id: c.id, score: c.score, comment: '' })), perUniversity: [], strengths: [], gaps: computed.gaps, fieldAdvice: rubric.regional.kazakhstan, actionPlan: [], suggestedCompetitions: olympiadPicks.slice(0, 4).map((r) => ({ id: r.olympiad.id, name: r.olympiad.shortName, url: r.olympiad.officialUrl, why: r.reasons[0] || '' })), essayAngles: [], redFlags: [], items, model: 'offline-rules' };
  }

  const system = `${persona(language)}
Ты — ридер приёмной комиссии и тренер по портфолио. Оцени портфолио абитуриента для сферы «${rubric.title}» и для конкретных университетов. Будь честным и конкретным: хвали за реальное, указывай пробелы, предлагай действия с датами.
Верни СТРОГО JSON (все строки — на ${langName(language)} языке):
{
  "overallScore": number,          // 0–100; отклоняйся от расчётной оценки не более чем на 7 пунктов
  "tier": "exceptional"|"strong"|"developing"|"early",
  "headline": string,              // одно предложение — суть
  "summary": string,               // 5–7 предложений: что есть, чего не хватает, как это читает комиссия
  "criteria": [ { "id": "academic"|"depth"|"achievements"|"initiative"|"impact"|"evidence"|"readiness", "score": number, "comment": string } ], // все 7 критериев
  "items": [ { "id": string /* id записи из списка ниже */, "score": number /* 1–10: значимость записи для поступления в целевые вузы; отклоняйся от расчётной не более чем на 2 */, "verdict": string /* 1–2 предложения: как это читает комиссия и что усилить */, "recommendation": "highlight"|"keep"|"drop" /* highlight = 9–10, строить эссе; keep = оставить; drop = можно исключить из заявки */, "useInEssay": boolean } ], // КАЖДАЯ запись портфолио
  "perUniversity": [ { "id": string, "name": string, "fit": number /* 0–100 */, "verdict": string, "whatTheyValue": string, "gaps": string[] } ], // для каждого целевого вуза
  "strengths": string[],           // 3–5, со ссылкой на конкретные записи портфолио
  "gaps": string[],                // 3–6, по приоритету
  "fieldAdvice": string,           // что ждут комиссии этой сферы + региональные нюансы под цели абитуриента
  "actionPlan": [ { "title": string, "why": string, "deadline": string /* YYYY-MM или словами */, "category": "olympiad"|"portfolio"|"essay"|"documents"|"ielts"|"sat"|"unt"|"application"|"other", "priority": "high"|"medium"|"low" } ], // 6–8 шагов
  "suggestedCompetitions": [ { "id": string /* id из каталога */, "why": string } ], // 3–5, только id из каталога
  "essayAngles": string[],         // 2–3 сюжета для Personal Statement из реального опыта абитуриента
  "redFlags": string[]             // что убрать/переформулировать
}`;

  const itemRatings = ctx.portfolio.map((it) => ({ id: it.id, title: it.title, excluded: Boolean(it.excluded), ...scoreItem(it) }));

  const user = `# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'full', language })}

# ЗАПИСИ ПОРТФОЛИО С ID И РАСЧЁТНОЙ ЗНАЧИМОСТЬЮ (1–10)
${itemRatings.length ? itemRatings.map((r) => `- id=${r.id} · «${r.title}» · расчёт ${r.score}/10${r.reasons.length ? ` (${r.reasons.join('; ')})` : ''}${r.excluded ? ' · исключена абитуриентом из заявки' : ''}`).join('\n') : 'нет записей'}

# РАСЧЁТНАЯ ОЦЕНКА (детерминированная)
Итог: ${computed.total}/100 (${tierForScore(computed.total)}). Критерии: ${computed.criteria.map((c) => `${c.id}=${c.score} (вес ${c.weight})`).join(', ')}. Пробелы: ${computed.gaps.join(', ') || 'нет'}. Ярко выраженный профиль: ${computed.spike.join(', ') || 'нет'}.

# РУБРИКА СФЕРЫ «${rubric.title}»
Критерии: ${PORTFOLIO_CRITERIA.map((c) => `${c.id} — ${c.title}: ${c.description}`).join('\n')}
Что комиссии ожидают увидеть: ${rubric.signature.map((s) => `\n- ${s}`).join('')}
Региональные нюансы: США — ${rubric.regional.usa} Европа — ${rubric.regional.europe} Азия — ${rubric.regional.asia} Казахстан — ${rubric.regional.kazakhstan}
Красные флаги: ${rubric.redFlags.join('; ')}
Ориентиры: топ — ${rubric.benchmarks.top}; сильно — ${rubric.benchmarks.strong}; база — ${rubric.benchmarks.baseline}

# ЦЕЛЕВЫЕ УНИВЕРСИТЕТЫ${explicit.length ? '' : ' (подобраны системой по предпочтениям абитуриента: направления, регионы, бюджет, баллы, климат — объясни в verdict, почему каждый подходит именно ему)'}
${targets.length ? targets.map((id) => summarizeUniversity(UNIVERSITY_BY_ID.get(id), { full: true })).join('\n\n') : 'Не выбраны — оцени для типичных вузов целевых регионов.'}
Расчётные шансы: ${chances.map((c) => `${c.name}: ${c.probability}% (${c.tier})`).join('; ') || '—'}

# ПОДХОДЯЩИЕ КОНКУРСЫ (предварительный отбор системы)
${olympiadPicks.map((r) => `${summarizeOlympiadCompact(r.olympiad)}\n  соответствие ${r.fit}%: ${r.reasons.join('; ')}`).join('\n')}

# ОБЩИЕ ЗНАНИЯ
${knowledgeBase({ includeAllUniversities: false, includeOlympiads: false })}`;

  const fallbackPrompt = {
    system,
    messages: [{ role: 'user', content: `${describeProfile(p)}\n\nПортфолио:\n${renderContext({ ...ctx, tasks: [], checklist: [], analyses: [], uiState: null }, { detail: 'compact' }).slice(0, 2500)}\n\nРасчёт: ${computed.total}/100, пробелы ${computed.gaps.join(', ')}.\nЦели: ${targets.map((id) => UNIVERSITY_BY_ID.get(id).name).join(', ')}` }],
  };

  let data = null;
  let model = 'offline-rules';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'deep', maxTokens: 16000, temperature: 0.35, fallback: fallbackPrompt });
    data = res.data;
    model = `${res.provider}:${res.model}`;
    if (res.finishReason === 'MAX_TOKENS') console.warn('[ai] evaluatePortfolio: answer hit the token limit — some sections may be missing');
  } catch (err) {
    console.warn('[ai] evaluatePortfolio failed:', err.message);
  }
  if (!data) {
    const items = offlineItems();
    await saveItemRatings(userId, items);
    return { ...base, overallScore: computed.total, headline: 'Не удалось получить ответ модели — показана расчётная оценка.', summary: '', criteria: computed.criteria.map((c) => ({ id: c.id, score: c.score, comment: '' })), perUniversity: [], strengths: [], gaps: computed.gaps, fieldAdvice: '', actionPlan: [], suggestedCompetitions: [], essayAngles: [], redFlags: [], items, model };
  }

  // Per-entry verdicts: keep the model within ±2 of the deterministic score, fill in anything it skipped.
  const evaluatedAt = nowIso();
  const aiItems = Array.isArray(data.items) ? data.items : [];
  const items = itemRatings.map((r) => {
    const ai = aiItems.find((x) => x && String(x.id) === r.id);
    const raw = Number(ai?.score);
    const score = Number.isFinite(raw) ? Math.max(1, Math.min(10, Math.max(r.score - 2, Math.min(r.score + 2, Math.round(raw))))) : r.score;
    const recommendation = ['highlight', 'keep', 'drop'].includes(ai?.recommendation) ? ai.recommendation : recommendationForScore(score);
    const verdict = typeof ai?.verdict === 'string' && ai.verdict.trim() ? ai.verdict.trim().slice(0, 600) : r.reasons.length ? `Расчёт системы: ${r.reasons.join('; ')}.` : '';
    return { id: r.id, title: r.title, score, verdict, recommendation, useInEssay: typeof ai?.useInEssay === 'boolean' ? ai.useInEssay : score >= 8, field: fieldId, evaluatedAt };
  });
  await saveItemRatings(userId, items);

  const overall = Math.max(computed.total - 7, Math.min(computed.total + 7, Number(data.overallScore) || computed.total));
  const criteria = PORTFOLIO_CRITERIA.map((c) => {
    const ai = (data.criteria || []).find((x) => x.id === c.id);
    const det = computed.criteria.find((x) => x.id === c.id);
    return { id: c.id, title: c.title, score: Math.max(0, Math.min(100, Number(ai?.score) || det.score)), computed: det.score, weight: det.weight, comment: ai?.comment || '', evidence: det.evidence };
  });
  const output = {
    ...base,
    ...data,
    overallScore: Math.round(overall),
    tier: ['exceptional', 'strong', 'developing', 'early'].includes(data.tier) ? data.tier : tierForScore(overall),
    criteria,
    perUniversity: (data.perUniversity || []).filter((x) => UNIVERSITY_BY_ID.has(x.id)).map((x) => ({ ...x, name: UNIVERSITY_BY_ID.get(x.id).name, chance: chances.find((c) => c.id === x.id)?.probability ?? null, links: UNIVERSITY_BY_ID.get(x.id).links })),
    suggestedCompetitions: (data.suggestedCompetitions || [])
      .filter((x) => OLYMPIAD_BY_ID.has(x.id))
      .slice(0, 6)
      .map((x) => ({ id: x.id, name: OLYMPIAD_BY_ID.get(x.id).shortName, url: OLYMPIAD_BY_ID.get(x.id).officialUrl, why: x.why || '' })),
    items,
    model,
    evaluatedAt,
  };
  await persistAnalysis(userId, 'portfolio', { field: fieldId, universityIds: targets, language }, output);
  return output;
}

// ---------------------------------------------------------------------------
// University comparison for this applicant (JSON)
// ---------------------------------------------------------------------------

export async function compareUniversities({ userId, profile, universityIds, language = 'ru', uiState }) {
  const ids = universityIds.filter((id) => UNIVERSITY_BY_ID.has(id)).slice(0, 6);
  const ctx = await buildUserContext({ userId, profile, uiState });
  const p = ctx.profile || profile;
  const chances = chanceTable(p, ids);
  const unis = ids.map((id) => UNIVERSITY_BY_ID.get(id));

  const deterministic = {
    universities: unis.map((u) => {
      const c = chances.find((x) => x.id === u.id);
      const netCost = u.hasFullGrantOrScholarship && p?.budgetTier === 'grant_only' ? 0 : u.tuitionUSDPerYear + u.livingCostUSDPerYear;
      return { id: u.id, name: u.name, chance: c?.probability ?? null, tier: c?.tier ?? null, tuition: u.tuitionUSDPerYear, living: u.livingCostUSDPerYear, estimatedNetCost: netCost, safety: u.campus?.neighborhoodSafety ?? null, deadline: u.regularDeadline, testPolicy: u.admissions?.testPolicy || null, internationalShare: u.stats?.internationalShare ?? null, employment: u.stats?.graduateEmployment ?? null, links: u.links };
    }),
  };
  if (!isLlmConfigured() || ids.length < 2) return { ...deterministic, verdict: '', ranking: [], matrixHighlights: [], strategy: '', risks: [], nextSteps: [], model: 'offline-rules' };

  const system = `${persona(language)}
Сравни университеты именно для этого абитуриента (не абстрактно). Верни СТРОГО JSON (строки — на ${langName(language)} языке):
{
  "verdict": string,                 // 3–5 предложений: какой вариант оптимален и почему, с оговорками
  "ranking": [ { "id": string, "name": string, "rank": number, "score": number /* 0–100 соответствие человеку */, "summary": string, "pros": string[], "cons": string[], "bestFor": string } ],
  "matrixHighlights": [ { "criterion": string, "winnerId": string, "note": string } ],   // 5–7 критериев: шансы, стоимость после стипендии, карьера по профессии, безопасность, климат/здоровье, язык/адаптация, дедлайны
  "strategy": string,                // в каком порядке и по каким раундам подавать (Early/Regular, госгрант, запасные варианты)
  "risks": string[],
  "nextSteps": [ { "title": string, "deadline": string, "category": "sat"|"ielts"|"unt"|"documents"|"essay"|"application"|"olympiad"|"portfolio"|"other" } ]
}`;
  const user = `# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'full', language })}

# РАСЧЁТНЫЕ ШАНСЫ (не завышать)
${chances.map((c) => `- ${c.name} [${c.id}]: ${c.probability}% (${c.tier}); ${c.factors.join('; ')}`).join('\n')}

# СРАВНИВАЕМЫЕ УНИВЕРСИТЕТЫ (полные данные)
${unis.map((u) => summarizeUniversity(u, { full: true })).join('\n\n')}

# ОБЩИЕ ЗНАНИЯ
${knowledgeBase({ includeAllUniversities: false, includeOlympiads: false })}`;
  const fallbackPrompt = { system, messages: [{ role: 'user', content: `${describeProfile(p)}\n\nШансы: ${chances.map((c) => `${c.id} ${c.probability}%`).join(', ')}\n\n${unis.map(summarizeUniversityCompact).join('\n')}` }] };

  let data = null;
  let model = 'offline-rules';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'deep', maxTokens: 5000, temperature: 0.3, fallback: fallbackPrompt });
    data = res.data;
    model = `${res.provider}:${res.model}`;
  } catch (err) {
    console.warn('[ai] compareUniversities failed:', err.message);
  }
  if (!data) return { ...deterministic, verdict: 'Не удалось получить ответ модели.', ranking: [], matrixHighlights: [], strategy: '', risks: [], nextSteps: [], model };
  const output = {
    ...deterministic,
    ...data,
    ranking: (data.ranking || []).filter((r) => ids.includes(r.id)).map((r) => ({ ...r, name: UNIVERSITY_BY_ID.get(r.id).name, chance: chances.find((c) => c.id === r.id)?.probability ?? null })),
    model,
  };
  await persistAnalysis(userId, 'comparison', { universityIds: ids, language }, output);
  return output;
}

// ---------------------------------------------------------------------------
// Olympiad advice (narrative on top of the deterministic recommender)
// ---------------------------------------------------------------------------

export async function olympiadAdvice({ userId, profile, language = 'ru', uiState, limit = 8 }) {
  const ctx = await buildUserContext({ userId, profile, uiState });
  const p = ctx.profile || profile;
  const picks = recommendOlympiads(p, { limit: Math.max(limit, 10) });
  const base = { recommendations: picks.map((r) => ({ id: r.olympiad.id, fit: r.fit, reasons: r.reasons, nextActiveInMonths: r.nextActiveInMonths })) };
  if (!isLlmConfigured()) return { ...base, summary: '', picks: [], yearPlan: '', warnings: [], model: 'offline-rules' };

  const system = `${persona(language)}
Ты — тренер олимпиадников и куратор внеучебных достижений. Составь персональную стратегию участия в олимпиадах и конкурсах на ближайшие 12 месяцев. Верни СТРОГО JSON (строки — на ${langName(language)} языке):
{
  "summary": string,          // 3–5 предложений: где абитуриент сейчас, куда реально дойти за год, что даст максимум для целевых вузов
  "picks": [ { "id": string /* id из каталога */, "why": string, "whenToRegister": string, "prepPlan": string /* 2–3 предложения: ресурсы, часы в неделю, промежуточные цели */, "targetResult": string } ], // 4–${limit}, приоритетные первыми
  "yearPlan": string,         // помесячный план одной связной строкой или короткими абзацами
  "warnings": string[]        // перегруз, конфликты дат с экзаменами/дедлайнами, нереалистичные цели
}`;
  const user = `# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'full', language })}

# ПРЕДВАРИТЕЛЬНЫЙ ОТБОР СИСТЕМЫ (по предметам, классу, целям, уровню)
${picks.map((r) => `${summarizeOlympiadCompact(r.olympiad)}\n  соответствие ${r.fit}%: ${r.reasons.join('; ')}; следующий активный месяц через ${r.nextActiveInMonths} мес.\n  Отбор: ${r.olympiad.eligibility} Этапы: ${r.olympiad.timeline.stages}. Совет: ${r.olympiad.tips}`).join('\n')}

# ЦЕЛЕВЫЕ УНИВЕРСИТЕТЫ — что ценят
${(p?.targetUniversityIds || []).map((id) => UNIVERSITY_BY_ID.get(id)).filter(Boolean).map((u) => `- ${u.name}: ${u.admissions?.likes.join('; ')}`).join('\n') || '—'}`;
  const fallbackPrompt = { system, messages: [{ role: 'user', content: `${describeProfile(p)}\n\n${picks.slice(0, 6).map((r) => `${r.olympiad.id}: ${r.olympiad.shortName} (${r.fit}%)`).join('\n')}` }] };

  let data = null;
  let model = 'offline-rules';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'smart', maxTokens: 4000, temperature: 0.4, fallback: fallbackPrompt });
    data = res.data;
    model = `${res.provider}:${res.model}`;
  } catch (err) {
    console.warn('[ai] olympiadAdvice failed:', err.message);
  }
  if (!data) return { ...base, summary: '', picks: [], yearPlan: '', warnings: [], model };
  const output = {
    ...base,
    ...data,
    picks: (data.picks || []).filter((x) => OLYMPIAD_BY_ID.has(x.id)).slice(0, limit).map((x) => ({ ...x, name: OLYMPIAD_BY_ID.get(x.id).shortName, url: OLYMPIAD_BY_ID.get(x.id).officialUrl })),
    model,
  };
  await persistAnalysis(userId, 'olympiads', { language }, output);
  return output;
}

// ---------------------------------------------------------------------------
// Document understanding (Gemini reads the uploaded scan)
// ---------------------------------------------------------------------------

export async function summarizeDocument({ buffer, mimeType, kind, fileName }) {
  if (!isGeminiConfigured() || !GEMINI_READABLE_MIME.has(mimeType) || buffer.length > 12 * 1024 * 1024) return null;
  const prompt = `Это документ абитуриента типа «${kind}» (файл ${fileName}). Извлеки только факты, важные для поступления: тип документа, на чьё имя, даты выдачи и действия, баллы/оценки по разделам, учебное заведение/организация, язык документа, есть ли печать/подпись/апостиль, что вызывает сомнение (нечитаемо, истёк срок, несоответствие). Ответь на русском 2–4 предложениями без вступлений. Если файл не является таким документом — напиши, что это на самом деле.`;
  try {
    const parts = mimeType === 'text/plain' ? [{ text: `${prompt}\n\nСодержимое:\n${buffer.toString('utf8').slice(0, 20_000)}` }] : [{ text: prompt }, inlineFilePart(buffer, mimeType)];
    const res = await complete({ messages: [{ role: 'user', parts }], tier: 'fast', temperature: 0.1, maxTokens: 400, geminiOnly: true, timeoutMs: 40_000 });
    return res.content.slice(0, 1200);
  } catch (err) {
    console.warn('[ai] summarizeDocument failed:', err.message?.slice(0, 120));
    return null;
  }
}

// ---------------------------------------------------------------------------
// News & social analysis for a single university
// ---------------------------------------------------------------------------

export async function analyzeUniversityNews(uni, { language = 'ru' } = {}) {
  const cacheKey = `ai:news:${uni.id}:${language}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const news = await getUniversityNews(uni, { limit: 12 });
  if (!isLlmConfigured()) {
    return { universityId: uni.id, headlines: news.items, summary: 'AI не настроен — показаны только заголовки.', implications: [], sources: news.items.map((n) => n.link), model: 'offline' };
  }
  const headlines = news.items.slice(0, 10).map((n) => `- ${n.title.slice(0, 140)} (${n.source || 'news'}, ${n.pubDate?.slice(0, 10) || ''}) ${n.link}`).join('\n') || '— заголовков нет —';
  const system = `${persona(language)}\nТы — аналитик приёмных кампаний. По заголовкам новостей сделай выжимку для абитуриента из Казахстана. Не выдумывай факты, которых нет в заголовках и базе; если данных мало — скажи об этом.`;
  const user = `Университет: ${summarizeUniversity(uni)}\n\nЗаголовки за последние месяцы:\n${headlines}\n\nВерни строго JSON: {"summary": string /*5–7 предложений*/, "implications": string[] /*3–5 пунктов: что это значит для абитуриента 2026/27*/, "sentiment": "positive"|"neutral"|"negative", "sources": string[] /*URL из заголовков*/}`;

  let data = null;
  let model = 'offline';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'smart', temperature: 0.3, maxTokens: 1800, fallback: { system, messages: [{ role: 'user', content: user.slice(0, 5000) }] } });
    data = res.data;
    model = `${res.provider}:${res.model}`;
  } catch (err) {
    data = { summary: `Не удалось выполнить AI-анализ (${err.message}). Ниже — свежие заголовки.`, implications: [], sentiment: 'neutral', sources: [] };
  }
  data = data && typeof data.summary === 'string' ? data : { summary: 'Модель вернула нечитаемый ответ. Ниже — свежие заголовки.', implications: [], sentiment: 'neutral', sources: [] };
  const payload = {
    universityId: uni.id,
    headlines: news.items,
    fetchedAt: news.fetchedAt,
    ...data,
    sources: [...new Set([...(data.sources || []), ...news.items.map((n) => n.link)])].filter(Boolean).slice(0, 15),
    model,
    cached: false,
  };
  if (Array.isArray(data.implications) && !data.summary.trim().startsWith('{') && !data.summary.startsWith('Не удалось')) await cacheSet(cacheKey, payload, config.cache.newsMs);
  return payload;
}

export async function analyzeUniversitySocial(uni, { language = 'ru' } = {}) {
  const cacheKey = `ai:social:${uni.id}:${language}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const signals = await getSocialSignals(uni);
  if (!isLlmConfigured()) return { universityId: uni.id, signals, summary: 'AI не настроен — показаны только собранные сигналы.', model: 'offline' };

  const compactSignals = signals.platforms.map((p) => ({
    platform: p.platform,
    available: p.available,
    title: p.title?.slice(0, 80),
    description: p.description?.slice(0, 200),
    followers: p.followers ?? p.subscribers ?? null,
    posts: p.posts ?? null,
    recentVideos: (p.recentVideos || []).slice(0, 6).map((v) => `${v.title.slice(0, 80)} (${v.published?.slice(0, 10)}, ${v.views} views)`),
  }));
  const links = Object.entries(uni.links || {}).filter(([k]) => ['instagram', 'tiktok', 'youtube'].includes(k)).map(([k, v]) => `${k}: ${v}`).join('; ');
  const system = `${persona(language)}\nТы — медиа-аналитик. По публичным сигналам оцени соцсети университета для абитуриента из Казахстана. Где данных нет — честно пиши «данные недоступны», не выдумывай цифры.`;
  const user = `Университет: ${uni.name} (${uni.country}). Страницы: ${links}.\nСигналы: ${JSON.stringify(compactSignals)}\n\nВерни строго JSON: {"summary": string, "presence": {"instagram": string, "tiktok": string, "youtube": string}, "whatTheyHighlight": string[], "tone": string, "forInternationalStudents": string, "redFlags": string[], "verdict": string /*1–2 предложения*/, "sources": string[]}`;

  let data = null;
  let model = 'offline';
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'smart', temperature: 0.3, maxTokens: 1800, fallback: { system, messages: [{ role: 'user', content: user.slice(0, 4000) }] } });
    data = res.data;
    model = `${res.provider}:${res.model}`;
  } catch (err) {
    data = { summary: `Не удалось выполнить AI-анализ (${err.message}).` };
  }
  data = data && typeof data.summary === 'string' ? data : { summary: 'Модель вернула нечитаемый ответ.' };
  const payload = { universityId: uni.id, signals, ...data, model, cached: false };
  if (data.verdict && !data.summary.trim().startsWith('{')) await cacheSet(cacheKey, payload, config.cache.socialMs);
  return payload;
}

// ---------------------------------------------------------------------------
// Essay feedback — grounded in the applicant's real profile and portfolio
// ---------------------------------------------------------------------------

export async function reviewEssay({ userId, essay, universityId, profile, language = 'ru', uiState }) {
  const uni = universityId ? UNIVERSITY_BY_ID.get(universityId) : null;
  if (!isLlmConfigured()) return { score: null, strengths: [], weaknesses: ['AI не настроен'], suggestions: [], model: 'offline' };
  const ctx = await buildUserContext({ userId, profile, uiState });
  const system = `${persona(language)}
Ты — опытный ридер приёмной комиссии. Оцени эссе честно и конкретно, сверяя его с реальным профилем и портфолио абитуриента (замечай несоответствия и упущенные сильные истории). Верни СТРОГО JSON (строки — на ${langName(language)} языке):
{"score": number /*1–10*/, "verdict": string, "strengths": string[], "weaknesses": string[], "suggestions": string[] /*конкретные правки с примерами формулировок*/, "redFlags": string[] /*что комиссия не любит*/, "missedStories": string[] /*факты из портфолио/профиля, которые стоило бы использовать*/, "rewriteOpening": string /*улучшенный вариант первого абзаца в стиле автора*/}`;
  const user = `# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'compact', language })}

${uni ? `# УНИВЕРСИТЕТ\n${summarizeUniversity(uni)}\n` : ''}
Универсальные красные флаги: ${UNIVERSAL_DISLIKES.map((d) => d.title).join('; ')}.

# ЭССЕ
"""
${essay.slice(0, 12_000)}
"""`;
  const fallbackPrompt = { system, messages: [{ role: 'user', content: `${describeProfile(ctx.profile)}\n\n${uni ? `Университет: ${uni.name}. Ценят: ${uni.admissions?.likes.join('; ')}.\n` : ''}Эссе:\n${essay.slice(0, 6000)}` }] };
  const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'smart', maxTokens: 3000, temperature: 0.35, fallback: fallbackPrompt });
  const output = { ...(res.data || {}), model: `${res.provider}:${res.model}` };
  await persistAnalysis(userId, 'essay', { universityId, length: essay.length, language }, { ...output, verdict: output.verdict });
  return output;
}

// ---------------------------------------------------------------------------
// Translation (batched, cached)
// ---------------------------------------------------------------------------

export async function translateTexts(texts, targetLang) {
  if (!['kk', 'en', 'ru'].includes(targetLang)) targetLang = 'ru';
  const out = new Array(texts.length);
  const pending = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (!t || !t.trim()) {
      out[i] = t;
      continue;
    }
    const key = `tr:${targetLang}:${crypto.createHash('sha1').update(t).digest('hex')}`;
    const hit = await cacheGet(key);
    if (hit) out[i] = hit;
    else pending.push({ i, t, key });
  }
  if (!pending.length) return out;
  if (!isLlmConfigured()) {
    pending.forEach(({ i, t }) => (out[i] = t));
    return out;
  }
  const langRule = targetLang === 'kk' ? 'Таза әдеби қазақ тілі, орыс сөздерінсіз; терминдерді (IELTS, SAT, GPA, ҰБТ) өзгертпе.' : targetLang === 'en' ? 'Natural, concise English as used on a modern education product.' : 'Естественный литературный русский.';
  const CHUNK = 40;
  for (let c = 0; c < pending.length; c += CHUNK) {
    const chunk = pending.slice(c, c + CHUNK);
    const system = `Ты — профессиональный переводчик интерфейсов и образовательных текстов. Переведи каждый элемент массива на ${langName(targetLang)} язык, сохраняя смысл, цифры, названия университетов, Markdown-разметку и плейсхолдеры вида {name}. ${langRule} Верни JSON {"items": string[]} той же длины и в том же порядке. Никаких пояснений.`;
    try {
      const res = await completeJson({ system, messages: [{ role: 'user', content: JSON.stringify({ items: chunk.map((x) => x.t) }) }], tier: 'fast', maxTokens: 8000, temperature: 0.1, fallback: { system, messages: [{ role: 'user', content: JSON.stringify({ items: chunk.slice(0, 15).map((x) => x.t) }) }] } });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      chunk.forEach(({ i, t, key }, j) => {
        const translated = typeof items[j] === 'string' && items[j].trim() ? items[j] : t;
        out[i] = translated;
        if (translated !== t) cacheSet(key, translated, config.cache.translationMs).catch(() => {});
      });
    } catch {
      chunk.forEach(({ i, t }) => (out[i] = t));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Offline fallback (no API key at all)
// ---------------------------------------------------------------------------

export function localAdvisorFallback(userMessage, language = 'ru') {
  const q = (userMessage || '').toLowerCase();
  const ru = {
    competition:
      '**Олимпиады и конкурсы, которые реально усиливают заявку:**\n\n' +
      '1. [Республиканская олимпиада (Дарын)](https://daryn.kz) — диплом даёт госгрант вне конкурса и приоритет в [Nazarbayev University](https://nu.edu.kz).\n' +
      '2. [Жаутыковская олимпиада (IZhO)](https://izho.kz) — международный уровень по математике, физике и информатике.\n' +
      '3. [Конкурс научных проектов «Дарын»](https://daryn.kz) — путь на Regeneron ISEF.\n' +
      '4. [Хакатоны Astana Hub](https://astanahub.com) и [nFactorial](https://nfactorial.school) — продуктовое портфолио для CS.\n' +
      '5. [John Locke Essay Prize](https://www.johnlockeinstitute.com/essay-competition) — для гуманитариев и экономистов.\n' +
      '6. [Codeforces](https://codeforces.com) — рейтинг как объективная метрика для CS-программ.',
    grant: 'Основные 100% гранты: госгрант МНВО РК (ЕНТ, подача 13–20 июля на eGov), грант [Nazarbayev University](https://nu.edu.kz), [KAIST KISS](https://www.kaist.ac.kr), [Stipendium Hungaricum](https://stipendiumhungaricum.hu), GKS (Корея), CSC (Китай), MEXT (Япония), need-blind колледжи США ([MIT](https://www.mit.edu), [Harvard](https://www.harvard.edu), [Princeton](https://www.princeton.edu)).',
    essay: 'Сильное эссе: 1) крючок из личного кейса, 2) 1–2 измеримых проекта, 3) конкретное «почему этот университет», 4) цель. Избегайте цитат и «с детства мечтал».',
    tests: 'Ориентиры: IELTS 6.5 (секции ≥ 6.0) для [NU](https://nu.edu.kz)/Европы, 7.5+ для топ-США/Азии. SAT 1240 минимум NU, 1450+ для грантов за рубежом. ЕНТ 105+ на IT-грант, 120+ — уверенно.',
    deadline: 'США Early: 1 ноября 2026; Regular: 1–5 января 2027. [NU](https://nu.edu.kz): документы до 12 февраля 2027. KAIST — 12 января. Hungaricum — 15 января. Грант РК — 13–20 июля 2027.',
    portfolio: 'Портфолио читают по семи критериям: академическая база, глубина в области, достижения, инициатива, вклад в сообщество, подтверждения, международная готовность. Заполните раздел «Портфолио» — и запустите AI-оценку.',
    default: 'Я помогу с грантами, тестами, эссе, дедлайнами, олимпиадами и оценкой портфолио. AI-режим появится, когда сервер получит ключ Gemini.',
  };
  const en = {
    competition: ru.competition,
    grant: 'Main full-funding routes: Kazakhstan state grant, [Nazarbayev University](https://nu.edu.kz), [KAIST KISS](https://www.kaist.ac.kr), [Stipendium Hungaricum](https://stipendiumhungaricum.hu), and US need-blind colleges.',
    essay: 'Strong essay: a hook from a personal moment, 1–2 measurable projects, a specific “why this university”, a goal.',
    tests: 'Benchmarks: IELTS 6.5 for NU/Europe, 7.5+ for top US/Asia. SAT 1240 minimum at NU, 1450+ for scholarships abroad.',
    deadline: 'US Early: 1 Nov 2026; Regular: 1–5 Jan 2027. NU: documents by 12 Feb 2027. KAIST — 12 Jan. Hungaricum — 15 Jan.',
    portfolio: 'Committees read a portfolio on seven criteria: academics, depth, achievements, initiative, impact, evidence, international readiness. Fill in the Portfolio section and run the AI review.',
    default: 'I can help with grants, tests, essays, deadlines, competitions and portfolio review.',
  };
  const kk = {
    competition:
      '**Түсуге нақты көмектесетін олимпиадалар мен байқаулар:**\n\n' +
      '1. [«Дарын» республикалық олимпиадасы](https://daryn.kz) — диплом мемлекеттік грантты конкурссыз береді.\n' +
      '2. [Жәутіков олимпиадасы (IZhO)](https://izho.kz) — математика, физика, информатика бойынша халықаралық деңгей.\n' +
      '3. [«Дарын» ғылыми жобалар байқауы](https://daryn.kz) — Regeneron ISEF-ке жол.\n' +
      '4. [Astana Hub хакатондары](https://astanahub.com) — IT портфолио үшін.',
    grant: 'Негізгі 100% гранттар: ҚР мемлекеттік гранты, [NU](https://nu.edu.kz) гранты, [KAIST KISS](https://www.kaist.ac.kr), [Stipendium Hungaricum](https://stipendiumhungaricum.hu).',
    essay: 'Күшті эссе: жеке оқиғадан «ілмек», 1–2 өлшенетін жоба, нақты «неге осы университет», мақсат.',
    tests: 'Бағдарлар: NU/Еуропа үшін IELTS 6.5, үздік АҚШ/Азия үшін 7.5+. NU-де SAT минимум 1240, шетелдік гранттар үшін 1450+.',
    deadline: 'АҚШ Early: 2026 ж. 1 қараша; Regular: 2027 ж. 1–5 қаңтар. NU: 2027 ж. 12 ақпанға дейін. KAIST — 12 қаңтар.',
    portfolio: 'Портфолионы жеті критерий бойынша оқиды. «Портфолио» бөлімін толтырып, AI-бағалауды іске қосыңыз.',
    default: 'Гранттар, тесттер, эссе, мерзімдер, олимпиадалар және портфолио бағалау бойынша көмектесемін.',
  };
  const t = language === 'en' ? en : language === 'kk' ? kk : ru;
  if (/портфолио|portfolio/.test(q)) return t.portfolio;
  if (/соревнован|олимпиад|конкурс|хакатон|competition|olympiad|hackathon|жарыс|сайыс/.test(q)) return t.competition;
  if (/грант|стипенд|бесплат|grant|scholarship|free|тегін/.test(q)) return t.grant;
  if (/эссе|мотивац|statement|essay/.test(q)) return t.essay;
  if (/ielts|toefl|sat|ент|ұбт|unt|test|тест/.test(q)) return t.tests;
  if (/дедлайн|срок|когда|deadline|when|мерзім|қашан/.test(q)) return t.deadline;
  return t.default;
}
