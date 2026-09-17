// The conversational advisor. One turn = intent detection → computed facts (deadlines, chances, timing) →
// full applicant context + knowledge base → streamed answer → grounding check (numbers must come from the
// context) with an automatic revision → follow-up suggestions → memory update.
import crypto from 'node:crypto';
import { UNIVERSITY_DATABASE, UNIVERSITY_BY_ID } from '../../shared/data/universities/index.js';
import { OLYMPIAD_DATABASE } from '../../shared/data/olympiads.js';
import { ADMISSIONS_CALENDAR, PREP_PLANS } from '../../shared/data/admissionsKnowledge.js';
import { estimateWithProjections } from '../../shared/logic/chance.js';
import { parseRuDeadline, daysUntil } from '../../shared/logic/dates.js';
import { complete, completeJson, stream, isLlmConfigured } from './llm.js';
import { getStore, nowIso } from '../db/store.js';
import { buildUserContext, renderContext } from './context.service.js';
import { getMemory, updateMemory, renderMemory } from './memory.service.js';
import { getSectorNews } from './news.service.js';
import { persona, knowledgeBase, selectRelevantUniversities, summarizeUniversityCompact, langName, localAdvisorFallback } from './ai.service.js';
import { config } from '../config.js';

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Conversation storage
// ---------------------------------------------------------------------------

export async function loadHistory({ userId, guestId, limit = 12 }) {
  if (!userId && !guestId) return [];
  const store = await getStore();
  const where = userId ? [['userId', '==', userId]] : [['guestId', '==', guestId]];
  const rows = await store.find('chat_messages', { where, orderBy: [['seq', 'desc']], limit });
  return rows.reverse().map((r) => ({ id: r.id, role: r.role, content: r.content, createdAt: r.createdAt, sources: r.sources || undefined, model: r.model || undefined }));
}

export async function clearHistory({ userId, guestId }) {
  const store = await getStore();
  if (userId) await store.removeWhere('chat_messages', { where: [['userId', '==', userId]] });
  else if (guestId) await store.removeWhere('chat_messages', { where: [['guestId', '==', guestId]] });
}

async function persistMessage({ userId, guestId, role, content, mode, extra = {} }) {
  if (!userId && !guestId) return null;
  const store = await getStore();
  const id = `msg_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  await store.set('chat_messages', id, {
    userId: userId || null,
    guestId: userId ? null : guestId || null,
    role,
    content: String(content).slice(0, 14_000),
    mode,
    seq: Date.now(),
    createdAt: nowIso(),
    ...extra,
  });
  return id;
}

export async function saveFeedback({ userId, guestId, messageId, rating, comment, question, answer }) {
  const store = await getStore();
  const id = `fb_${crypto.randomUUID()}`;
  await store.set('ai_feedback', id, {
    userId: userId || null,
    guestId: userId ? null : guestId || null,
    messageId: messageId || null,
    rating: rating === 'up' ? 'up' : 'down',
    comment: comment ? String(comment).slice(0, 1000) : null,
    question: question ? String(question).slice(0, 2000) : null,
    answer: answer ? String(answer).slice(0, 6000) : null,
    createdAt: nowIso(),
  });
  return id;
}

// ---------------------------------------------------------------------------
// Intent detection → answer contract
// ---------------------------------------------------------------------------

const INTENTS = [
  { id: 'deadline', re: /дедлайн|срок|когда подав|до какого|deadline|when (is|do|should)|мерзім|қашан|дата подачи|раунд/i },
  { id: 'chance', re: /шанс|вероятн|поступлю|пройду|chance|odds|likely|мүмкіндік|өтем бе|реально ли/i },
  { id: 'compare', re: /сравни|или|vs|versus|что лучше|compare|which is better|салыстыр|қайсысы жақсы/i },
  { id: 'essay', re: /эссе|мотивац|personal statement|essay|statement of purpose|письмо|рекомендац/i },
  { id: 'olympiad', re: /олимпиад|конкурс|хакатон|соревнован|olympiad|competition|hackathon|isef|izho|дарын|codeforces|жарыс|байқау/i },
  { id: 'portfolio', re: /портфолио|достижен|активност|внеучеб|extracurricular|portfolio|activities|волонт|лидерств/i },
  { id: 'finance', re: /грант|стипенд|бесплатн|стоимост|деньги|бюджет|дорого|оплат|grant|scholarship|tuition|cost|afford|ақы|тегін|стипендия/i },
  { id: 'tests', re: /ielts|toefl|sat|act|ент|ұбт|nuet|экзамен|тест|балл|score|band|exam/i },
  { id: 'documents', re: /документ|транскрипт|аттестат|апостиль|виза|перевод документ|справк|document|transcript|visa|apostille|құжат/i },
  { id: 'lifestyle', re: /климат|погод|общежит|еда|халяль|аллерг|безопасн|здоров|город|жить|climate|dorm|food|halal|allerg|safe|health|weather|тұрғын|жатақхана/i },
  { id: 'plan', re: /план|стратег|что делать|с чего начать|шаги|roadmap|strategy|what should i do|next step|жоспар|не істеу керек|қалай бастау/i },
  { id: 'emotional', re: /боюсь|страшно|не уверен|переживаю|устал|стресс|паник|не получается|сомнева|afraid|anxious|scared|stress|worried|қорқам|уайымда/i },
];

/** Language of the user's message when it is unambiguous; otherwise the interface language. */
export function detectMessageLanguage(message, fallback = 'ru') {
  const text = String(message || '');
  const words = (text.match(/\p{L}{2,}/gu) || []).length;
  if (words < 4) return fallback;
  const kaz = (text.match(/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g) || []).length;
  const cyr = (text.match(/[А-Яа-яЁё]/g) || []).length;
  const lat = (text.match(/[A-Za-z]/g) || []).length;
  if (kaz >= 2 && kaz > cyr * 0.04) return 'kk';
  if (cyr > lat * 2) return 'ru';
  if (lat > cyr * 2) return 'en';
  return fallback;
}

export function detectIntents(message) {
  const found = INTENTS.filter((i) => i.re.test(message)).map((i) => i.id);
  return found.length ? found : ['general'];
}

const CONTRACTS = {
  deadline:
    'Формат: таблица «Университет | Раунд | Дата | Осталось дней | Где подавать» строго по блоку «Вычисленные факты» (дни не пересчитывай сам). Потом 1–2 строки, что сделать до ближайшей даты.',
  chance:
    'Назови расчётную вероятность из блока «Вычисленные факты» как есть (не завышай и не занижай), объясни 2–3 главных фактора и покажи, какой шаг сильнее всего поднимет шанс (с цифрой цели).',
  compare:
    'Сравнивай только по данным базы и профиля: короткая таблица по 4–6 критериям, затем вывод «что выбрать при каких условиях». Не ставь оценки, которых нет в данных.',
  essay:
    'Опирайся на реальные факты из портфолио и анкеты — предлагай конкретные сюжеты и формулировки, отмечай, чего в эссе быть не должно. Если просят написать текст — пиши в голосе абитуриента, без клише.',
  olympiad:
    'Рекомендуй только конкурсы из каталога (со ссылками), по приоритету для целевых вузов; укажи месяцы регистрации, уровень сложности и что даст победа. Учитывай класс и текущий уровень.',
  portfolio:
    'Оценивай как ридер приёмной комиссии: что сильно, чего не хватает для целевых вузов, 3–5 конкретных действий с дедлайнами. Ссылайся на конкретные записи портфолио.',
  finance:
    'Дай точные условия финансирования из базы (что покрывается, пороги, дедлайны стипендии) и итоговую сумму в год после стипендии; отдельно — что нужно сделать, чтобы получить грант.',
  tests:
    'Назови целевые баллы под конкретные вузы из базы, реалистичные сроки подготовки (используй планы подготовки) и порядок сдачи; учитывай уже имеющиеся результаты.',
  documents:
    'Дай чек-лист по пунктам с указанием, что уже загружено, чего не хватает, где и как получить, сколько времени занимает; предупреди о типичных ошибках (апостиль, 11-летний аттестат, онлайн-IELTS).',
  lifestyle:
    'Отвечай по данным о кампусе, климате, аллергенах, питании и безопасности из базы; соотнеси с указанными в профиле здоровьем, аллергиями и предпочтениями.',
  plan:
    'Дай план по неделям/месяцам с датами, привязанными к дедлайнам из «Вычисленных фактов»; каждый шаг — глагол + результат + срок. Учитывай уже выполненные задачи.',
  emotional:
    'Сначала коротко поддержи по-человечески (1–2 предложения, без пафоса), затем переведи в конкретику: покажи, что уже сделано хорошо, и один посильный шаг на эту неделю.',
  general: 'Ответь по существу, опираясь на данные абитуриента и базу; если вопрос выходит за рамки поступления — кратко скажи об этом и предложи, чем можешь помочь.',
};

// ---------------------------------------------------------------------------
// Computed facts (never let the model do arithmetic it can get wrong)
// ---------------------------------------------------------------------------

function computedFacts({ profile, focus, intents, message }) {
  const lines = [`Сегодня: ${today()}.`];
  const targetIds = new Set([...(profile?.targetUniversityIds || []), ...focus.map((u) => u.id)]);
  const unis = [...targetIds].map((id) => UNIVERSITY_BY_ID.get(id)).filter(Boolean).slice(0, 10);

  if (unis.length) {
    lines.push('Дедлайны и дни до них:');
    for (const u of unis) {
      const parts = [];
      if (u.earlyDeadline) {
        const d = parseRuDeadline(u.earlyDeadline);
        parts.push(`ранний ${u.earlyDeadline}${d ? ` (${fmtDays(daysUntil(d))})` : ''}`);
      }
      const rd = parseRuDeadline(u.regularDeadline);
      parts.push(`основной ${u.regularDeadline}${rd ? ` (${fmtDays(daysUntil(rd))})` : ''}`);
      lines.push(`- ${u.name} [${u.id}]: ${parts.join('; ')}. Подача: ${u.officialPortalUrl}`);
    }
  }
  if (profile && unis.length) {
    lines.push('Расчётные шансы (детерминированная модель платформы):');
    for (const u of unis) {
      const c = estimateWithProjections(profile, u);
      const proj = [];
      for (const [k, arr] of Object.entries(c.projections || {})) {
        if (Array.isArray(arr) && arr.length) proj.push(`${k.replace('if', '')}: ${arr.map((p) => `${p.score}→${p.probability}%`).join(', ')}`);
      }
      lines.push(`- ${u.shortName}: ${c.probability}% (${c.tier}); факторы: ${c.factors.slice(0, 4).map((f) => `${f.impact > 0 ? '+' : ''}${f.impact} ${f.note}`).join('; ')}${proj.length ? `; если сдать: ${proj.join(' | ')}` : ''}`);
      if (c.prepPlan?.length) lines.push(`  план подготовки: ${c.prepPlan.map((p) => `${p.exam} до ${p.targetScore}: ${p.weeks} нед × ${p.hoursPerWeek} ч`).join('; ')}`);
    }
  }
  const money = unis.map((u) => `- ${u.shortName}: обучение $${u.tuitionUSDPerYear}/год + проживание $${u.livingCostUSDPerYear}/год${u.hasFullGrantOrScholarship ? ' — есть 100% финансирование' : ''}`);
  if (money.length && (intents.includes('finance') || intents.includes('compare'))) lines.push('Стоимость (из базы):', ...money);

  if (intents.includes('olympiad') || intents.includes('plan') || intents.includes('portfolio')) {
    const month = new Date().getMonth() + 1;
    const soon = OLYMPIAD_DATABASE.filter((o) => o.monthsActive.includes(month) || o.monthsActive.includes((month % 12) + 1)).slice(0, 12);
    if (soon.length) lines.push('Конкурсы, активные в ближайшие 2 месяца:', ...soon.map((o) => `- ${o.shortName} [${o.id}]: ${o.timeline.registration}; финал ${o.timeline.finals}; ${o.officialUrl}`));
  }
  if (intents.includes('deadline') || intents.includes('plan')) {
    const upcoming = ADMISSIONS_CALENDAR.filter((e) => e.date >= today()).slice(0, 10);
    if (upcoming.length) lines.push('Общий календарь приёмной кампании:', ...upcoming.map((e) => `- ${e.date} (${fmtDays(daysUntil(new Date(e.date)))}): ${e.label}`));
  }
  if (intents.includes('tests')) {
    lines.push('Планы подготовки (нормативы платформы):', ...Object.values(PREP_PLANS).map((p) => `- ${p.exam}: ~${p.weeksPerHalfBand || p.weeksPer100 || p.weeksPer10 || '—'} нед. на шаг, ${p.hoursPerWeek} ч/нед`));
  }
  // Numbers the user typed themselves are legitimate to reuse.
  void message;
  return lines.join('\n');
}

function fmtDays(n) {
  if (n === null || n === undefined) return 'дата уточняется';
  if (n < 0) return `прошёл ${Math.abs(n)} дн. назад`;
  if (n === 0) return 'сегодня';
  return `через ${n} дн.`;
}

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

function fewShot(language) {
  if (language === 'en') {
    return `## Example of the expected quality
Question: "Do I have a chance at KAIST with IELTS 7.0 and no SAT?"
Good answer:
**Right now your chance is 31% (Dream) — the missing SAT is the single biggest factor.**
- [KAIST](https://admission.kaist.ac.kr/intl-undergraduate) requires SAT/ACT; admitted students score **1480–1560**, Math **780–800**.
- IELTS 7.0 already clears the language bar (6.5+), so English is not the problem.
- The platform's model: with SAT 1450 your chance rises to ~52%, with 1520 to ~64%.
**Next step:** register for the Digital SAT in December (deadline 12 January 2027 leaves one attempt) and start the Math section this week — 8 h/week for 10 weeks is a realistic path to 750+.`;
  }
  if (language === 'kk') {
    return `## Күтілетін сапа үлгісі
Сұрақ: «IELTS 7.0 бар, SAT жоқ — KAIST-ке мүмкіндігім бар ма?»
Жақсы жауап:
**Қазір мүмкіндігіңіз 31% (Dream) — ең үлкен кедергі SAT-тың жоқтығы.**
- [KAIST](https://admission.kaist.ac.kr/intl-undergraduate) SAT/ACT талап етеді; қабылданғандардың балы **1480–1560**, Math **780–800**.
- IELTS 7.0 тіл шегінен (6.5+) асады, ағылшын тілі мәселе емес.
- Платформа моделі бойынша: SAT 1450 болса мүмкіндік ~52%-ға, 1520 болса ~64%-ға өседі.
**Келесі қадам:** желтоқсандағы Digital SAT-қа тіркеліңіз (12 қаңтар 2027 мерзіміне дейін бір мүмкіндік қалады) және осы аптада Math бөлімін бастаңыз — 10 апта бойы аптасына 8 сағат 750+ үшін шынайы жол.`;
  }
  return `## Пример ожидаемого качества
Вопрос: «Есть ли у меня шанс в KAIST с IELTS 7.0 без SAT?»
Хороший ответ:
**Сейчас ваш шанс — 31% (Dream), и главный фактор — отсутствие SAT.**
- [KAIST](https://admission.kaist.ac.kr/intl-undergraduate) требует SAT/ACT; у зачисленных **1480–1560**, Math **780–800**.
- IELTS 7.0 уже выше порога (6.5+) — язык не проблема.
- По модели платформы: с SAT 1450 шанс вырастет до ~52%, с 1520 — до ~64%.
**Следующий шаг:** регистрация на Digital SAT в декабре (до дедлайна 12 января 2027 остаётся одна попытка) и Math-секция с этой недели — 8 ч/нед × 10 недель реально дают 750+.`;
}

async function prepare({ userId, guestId, message, profile, uiState, language, includeNews }) {
  const [ctx, memory, history] = await Promise.all([buildUserContext({ userId, profile, uiState }), getMemory({ userId, guestId }), loadHistory({ userId, guestId, limit: 12 })]);
  const intents = detectIntents(message);
  const focus = selectRelevantUniversities(ctx.profile, message, { limit: 8, extraIds: [...(uiState?.selectedForCompare || []), ...(uiState?.viewingUniversityId ? [uiState.viewingUniversityId] : [])] });
  const facts = computedFacts({ profile: ctx.profile, focus, intents, message });

  let newsBlock = '';
  if (includeNews && (intents.includes('general') || intents.includes('finance') || intents.includes('deadline'))) {
    try {
      // Optional and bounded: a slow RSS fetch must never delay the answer.
      const sector = await Promise.race([getSectorNews(ctx.profile?.targetRegions?.[0] || 'all', language), new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 2500))]);
      if (sector.items.length) newsBlock = `\n\n## Свежие новости отрасли (контекст, цитируй только при прямом отношении к вопросу)\n${sector.items.slice(0, 5).map((n) => `- ${n.title.slice(0, 120)} (${n.pubDate?.slice(0, 10) || ''}) ${n.link}`).join('\n')}`;
    } catch {
      /* optional */
    }
  }

  // Compact cards only for universities in the applicant's target regions (all 77 when regions are unset or
  // the question names another region) — halves the prompt and keeps the model focused.
  const regions = new Set(ctx.profile?.targetRegions || []);
  const mentionsOther = /сша|америк|usa|europe|европ|азия|asia|корея|герман|итал|канад|велик|британ|\buk\b/i.test(message);
  const universe = regions.size && !mentionsOther ? UNIVERSITY_DATABASE.filter((u) => regions.has(u.region) || focus.some((f) => f.id === u.id)) : null;
  const contract = intents.map((i) => CONTRACTS[i]).filter(Boolean).slice(0, 3).join('\n');
  const memoryBlock = renderMemory(memory);
  const system = `${persona(language)}

# КОНТРАКТ ОТВЕТА (тип вопроса: ${intents.join(', ')})
${contract}
Если для точного ответа не хватает одного ключевого факта о человеке — задай ОДИН уточняющий вопрос в конце, но сначала дай максимум пользы из того, что известно.

${fewShot(language)}

# ВЫЧИСЛЕННЫЕ ФАКТЫ (истина в последней инстанции для чисел, дат и дней)
${facts}

# ДАННЫЕ АБИТУРИЕНТА
${renderContext(ctx, { detail: 'full', language })}
${memoryBlock ? `\n${memoryBlock}\n` : ''}
# БАЗА ЗНАНИЙ
${knowledgeBase({ focusIds: focus.map((u) => u.id), universe })}${newsBlock}`;

  const messages = [...history.slice(-10).map((h) => ({ role: h.role, content: h.content.slice(0, 3000) })), { role: 'user', content: message }];
  const fallback = {
    system: `${persona(language)}\n\n# ВЫЧИСЛЕННЫЕ ФАКТЫ\n${facts.slice(0, 2500)}\n\n# ДАННЫЕ АБИТУРИЕНТА\n${renderContext(ctx, { detail: 'compact', language })}\n\n# БАЗА ЗНАНИЙ\n${focus.slice(0, 3).map(summarizeUniversityCompact).join('\n')}`,
    messages: [...history.slice(-2).map((h) => ({ role: h.role, content: h.content.slice(0, 800) })), { role: 'user', content: message }],
  };
  const tier = intents.some((i) => ['plan', 'compare', 'portfolio', 'essay'].includes(i)) ? 'deep' : 'smart';
  return { ctx, intents, focus, system, messages, fallback, tier, groundingText: `${facts}\n${renderContext(ctx, { detail: 'full', language })}\n${knowledgeBase({ focusIds: focus.map((u) => u.id) })}\n${history.map((h) => h.content).join('\n')}\n${message}` };
}

// ---------------------------------------------------------------------------
// Grounding check + revision
// ---------------------------------------------------------------------------

const NUMBER_RE = /(?:\$|€|₸)?\b(?:19|20)\d{2}\b|\b\d{1,3}(?:[ ,]\d{3})+\b|\b\d{3,4}\b|\b\d+(?:[.,]\d+)?\s?%|\b\d+(?:[.,]\d+)?\s?(?:\$|usd|тенге|₸|тг)/gi;

/** Numbers/dates in the answer that do not appear anywhere in the allowed context. */
export function unsupportedNumbers(answer, contextText) {
  const ctx = contextText.replace(/\s+/g, ' ');
  const out = new Set();
  for (const raw of answer.match(NUMBER_RE) || []) {
    const token = raw.replace(/\s+/g, ' ').trim();
    const digits = token.replace(/[^\d.,]/g, '');
    if (!digits || Number(digits.replace(',', '.')) < 30) continue; // small counts are fine
    if (ctx.includes(digits) || ctx.includes(digits.replace(/[ ,]/g, ''))) continue;
    out.add(token);
  }
  return [...out];
}

/** Share of words that look Russian rather than Kazakh (letters ё ц щ ъ ь є are rare outside loanwords). */
export function russianWordShare(text) {
  const words = String(text).match(/[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]{3,}/g) || [];
  if (words.length < 12) return 0;
  const kazakhLetters = /[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/;
  const russianOnly = /[ЁёЦцЩщЪъЬь]|(ый|ого|ему|ться|ение|ость|ать|ить)$/;
  let ru = 0;
  for (const w of words) if (!kazakhLetters.test(w) && russianOnly.test(w)) ru++;
  return ru / words.length;
}

async function reviseAnswer({ answer, unsupported, language, system, languageSlip = false }) {
  const instruction = `Ты — редактор-фактчекер. Ниже ответ консультанта и список чисел/дат, которых НЕТ в исходных данных: ${unsupported.join(', ')}.${languageSlip ? ' Кроме того, в ответе слишком много русских слов — весь текст должен быть на чистом казахском языке.' : ''}
Перепиши ответ так, чтобы:
1) каждое неподтверждённое число либо убрано вместе с зависимой от него частью фразы, либо заменено числом из данных, если оно там очевидно есть; если факт важен, перепиши предложение естественно: «точный порог смотрите на официальном портале» со ссылкой из ответа. Никаких вставок вида «набрать [уточните…]» посреди фразы;
2) всё остальное сохранилось дословно по смыслу, структура и Markdown — как были;
3) язык ответа — ${langName(language)}, без грамматических ошибок${language === 'kk' ? ', без русских слов и калек' : ''}.
Верни только исправленный ответ, без комментариев.`;
  const res = await complete({ system: system.slice(0, 60_000), messages: [{ role: 'user', content: `${instruction}\n\nОТВЕТ:\n"""\n${answer}\n"""` }], tier: 'fast', temperature: 0.1, maxTokens: 2500, timeoutMs: 40_000 });
  return res.content.trim();
}

async function suggestFollowUps({ message, answer, language }) {
  try {
    const res = await completeJson({
      system: `Предложи 3 коротких (до 60 символов) вопроса, которые абитуриент логично задаст следующими после этого ответа. Пиши на ${langName(language)} языке от первого лица, конкретно (с названиями вузов/тестов из ответа). Верни JSON {"items": string[]}.`,
      messages: [{ role: 'user', content: `Вопрос: ${message.slice(0, 600)}\n\nОтвет: ${answer.slice(0, 2500)}` }],
      tier: 'fast',
      temperature: 0.5,
      maxTokens: 300,
      timeoutMs: 20_000,
    });
    return (Array.isArray(res.data?.items) ? res.data.items : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Non-streaming turn (kept for clients that cannot read SSE). */
export async function chat(params) {
  const collected = { reply: '', model: 'offline-rules', provider: null, sources: [], suggestions: [], revised: false, messageId: null };
  for await (const ev of chatStream(params)) {
    if (ev.type === 'token') collected.reply += ev.text;
    else if (ev.type === 'revision') {
      collected.reply = ev.text;
      collected.revised = true;
    } else if (ev.type === 'done') {
      collected.model = ev.model;
      collected.provider = ev.provider;
      collected.sources = ev.sources;
      collected.messageId = ev.messageId;
    } else if (ev.type === 'suggestions') collected.suggestions = ev.items;
  }
  return collected;
}

/**
 * Streamed turn. Events: status, token, revision, sources, done, suggestions, error.
 */
export async function* chatStream({ userId, guestId, message, profile, uiState, language = 'ru', includeNews = true, signal }) {
  const who = { userId, guestId };
  // Answer in the language the person actually wrote in (a Kazakh question in a Russian UI gets a Kazakh answer).
  language = detectMessageLanguage(message, language);
  await persistMessage({ ...who, role: 'user', content: message, mode: 'chat' });

  if (!isLlmConfigured()) {
    const reply = localAdvisorFallback(message, language);
    const messageId = await persistMessage({ ...who, role: 'assistant', content: reply, mode: 'chat', extra: { model: 'offline-rules' } });
    yield { type: 'token', text: reply };
    yield { type: 'done', model: 'offline-rules', provider: null, sources: [], messageId };
    return;
  }

  yield { type: 'status', text: 'context' };
  const prepared = await prepare({ userId, guestId, message, profile, uiState, language, includeNews });
  const sources = prepared.focus.slice(0, 6).map((u) => ({ id: u.id, name: u.name, url: u.officialPortalUrl }));
  yield { type: 'status', text: 'thinking', intents: prepared.intents };

  let answer = '';
  let model = 'unknown';
  let provider = 'gemini';
  for await (const ev of stream({ system: prepared.system, messages: prepared.messages, tier: prepared.tier, temperature: 0.4, maxTokens: 3000, fallback: prepared.fallback, signal })) {
    if (ev.type === 'token') {
      answer += ev.text;
      yield ev;
    } else if (ev.type === 'done') {
      model = ev.model;
      provider = ev.provider;
      answer = ev.text || answer;
    } else if (ev.type === 'fallback') yield { type: 'status', text: 'fallback' };
  }
  if (signal?.aborted) return;

  // Quality gate: numbers/dates must be traceable to the context; otherwise a fast editor pass fixes them.
  let finalAnswer = answer.trim();
  const unsupported = unsupportedNumbers(finalAnswer, prepared.groundingText);
  const languageSlip = language === 'kk' && russianWordShare(finalAnswer) > 0.1;
  if ((unsupported.length && unsupported.length <= 12) || languageSlip) {
    try {
      yield { type: 'status', text: 'verifying', unsupported };
      const revised = await reviseAnswer({ answer: finalAnswer, unsupported: unsupported.length ? unsupported : ['—'], language, system: prepared.system, languageSlip });
      if (revised && revised.length > finalAnswer.length * 0.5) {
        finalAnswer = revised;
        yield { type: 'revision', text: finalAnswer, unsupported };
      }
    } catch (err) {
      console.warn('[chat] revision skipped:', err.message?.slice(0, 100));
    }
  }

  const messageId = await persistMessage({ ...who, role: 'assistant', content: finalAnswer, mode: 'chat', extra: { model: `${provider}:${model}`, sources: sources.map((s) => s.url), intents: prepared.intents } });
  yield { type: 'sources', items: sources };
  yield { type: 'done', model, provider, sources, messageId, intents: prepared.intents };

  // Post-answer enrichment (cheap, fast tier). In serverless we must finish before the response closes.
  const [suggestions] = await Promise.all([
    suggestFollowUps({ message, answer: finalAnswer, language }),
    updateMemory(who, { userMessage: message, assistantReply: finalAnswer, language }),
  ]);
  if (suggestions.length) yield { type: 'suggestions', items: suggestions };
}

export { config as _config };
