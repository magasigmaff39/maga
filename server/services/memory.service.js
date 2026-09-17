// Long-term conversational memory: durable facts the applicant reveals in chat (preferences, constraints,
// decisions, worries) are extracted with a fast model after each exchange and injected into every later
// prompt, so the advisor remembers "I hate cold weather" three weeks later.
import { getStore, nowIso } from '../db/store.js';
import { completeJson, isLlmConfigured } from './llm.js';

const MAX_FACTS = 30;
const memoryId = ({ userId, guestId }) => (userId ? `u_${userId}` : guestId ? `g_${guestId}` : null);

export async function getMemory(who) {
  const id = memoryId(who);
  if (!id) return { facts: [], summary: '' };
  const store = await getStore();
  const doc = await store.get('chat_memory', id);
  return doc ? { facts: doc.facts || [], summary: doc.summary || '', updatedAt: doc.updatedAt } : { facts: [], summary: '' };
}

export async function clearMemory(who) {
  const id = memoryId(who);
  if (!id) return;
  const store = await getStore();
  await store.remove('chat_memory', id);
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Extract durable facts from one exchange and merge them into the memory. Cheap (fast tier, tiny prompt);
 * failures are swallowed — memory is an enhancement, never a dependency.
 */
export async function updateMemory(who, { userMessage, assistantReply, language = 'ru' }) {
  const id = memoryId(who);
  if (!id || !isLlmConfigured() || !userMessage || userMessage.trim().length < 12) return null;
  const current = await getMemory(who);
  const system = `Ты извлекаешь долговременные факты об абитуриенте из одного обмена репликами с консультантом по поступлению.
Верни СТРОГО JSON: {"facts": string[], "summary": string}.
- facts: 0–5 коротких утверждений на русском языке (до 120 символов каждое) о самом человеке, которые останутся верными через месяц: предпочтения, ограничения, цели, решения, семейные/финансовые обстоятельства, страхи, что уже сделано. Не включай общие вопросы, факты об университетах и то, что уже есть в списке известных фактов.
- summary: одно предложение — над чем человек сейчас работает / что решает (или пустая строка).
Если нового нет — верни {"facts": [], "summary": ""}.`;
  const user = `Известные факты:\n${current.facts.map((f) => `- ${f.text}`).join('\n') || '—'}\n\nСообщение абитуриента:\n"""${userMessage.slice(0, 2500)}"""\n\nОтвет консультанта (для контекста):\n"""${String(assistantReply || '').slice(0, 1500)}"""`;
  try {
    const res = await completeJson({ system, messages: [{ role: 'user', content: user }], tier: 'fast', temperature: 0.1, maxTokens: 600, timeoutMs: 25_000 });
    const data = res.data || {};
    const incoming = (Array.isArray(data.facts) ? data.facts : []).map((f) => String(f).trim()).filter((f) => f.length >= 6 && f.length <= 160);
    if (!incoming.length && !data.summary) return current;
    const seen = new Set(current.facts.map((f) => normalize(f.text)));
    const merged = [...current.facts];
    const now = nowIso();
    for (const text of incoming) {
      const key = normalize(text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({ text, at: now, lang: language });
    }
    const facts = merged.slice(-MAX_FACTS);
    const summary = typeof data.summary === 'string' && data.summary.trim() ? data.summary.trim().slice(0, 300) : current.summary || '';
    const store = await getStore();
    const doc = { facts, summary, userId: who.userId || null, guestId: who.userId ? null : who.guestId || null, updatedAt: now };
    await store.set('chat_memory', id, doc);
    return doc;
  } catch (err) {
    console.warn('[memory] update skipped:', err.message?.slice(0, 120));
    return current;
  }
}

export function renderMemory(memory) {
  if (!memory || (!memory.facts?.length && !memory.summary)) return '';
  const lines = [];
  if (memory.summary) lines.push(`Сейчас: ${memory.summary}`);
  for (const f of memory.facts.slice(-20)) lines.push(`- ${f.text}`);
  return `## Что абитуриент говорил раньше (память консультанта)\n${lines.join('\n')}`;
}
