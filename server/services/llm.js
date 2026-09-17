// Provider-agnostic text generation. Gemini is the primary provider (large context, strong multilingual
// output); Groq is the fallback when Gemini is unavailable or not configured. Callers never see provider
// details beyond the `model`/`provider` fields returned for transparency.
import { geminiGenerate, isGeminiConfigured } from './gemini.client.js';
import { chatCompletion, isAiConfigured as isGroqConfigured, parseJsonLoose } from './groq.client.js';
import { HttpError } from '../utils/errors.js';

export function isLlmConfigured() {
  return isGeminiConfigured() || isGroqConfigured();
}

export function llmStatus() {
  return { primary: isGeminiConfigured() ? 'gemini' : isGroqConfigured() ? 'groq' : 'none', gemini: isGeminiConfigured(), groq: isGroqConfigured() };
}

const TIER_TO_GROQ = { fast: 'fast', smart: 'chat', deep: 'chat' };

/**
 * @param {object} opts
 * @param {string} [opts.system]
 * @param {Array<{role: string, content?: string|Array, parts?: Array}>} opts.messages
 * @param {'fast'|'smart'|'deep'} [opts.tier]
 * @param {boolean} [opts.json]
 * @param {object} [opts.schema]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.timeoutMs]
 * @param {boolean} [opts.geminiOnly]  set when the prompt contains inline files Groq cannot read
 * @param {{system?: string, messages: Array}} [opts.fallback]  compact prompt used when falling back to Groq (8k-token budget)
 */
export async function complete(opts) {
  if (!isLlmConfigured()) throw new HttpError(503, 'AI не настроен: добавьте GEMINI_API_KEY (или GROQ_API_KEY) в .env', 'AI_NOT_CONFIGURED');
  let geminiError = null;
  if (isGeminiConfigured() && !opts._skipGemini) {
    try {
      return await geminiGenerate(opts);
    } catch (err) {
      if (err instanceof HttpError && ['AI_BLOCKED', 'AI_EMPTY_PROMPT'].includes(err.code)) throw err;
      geminiError = err;
      if (opts.geminiOnly || !isGroqConfigured()) throw err;
      console.warn(`[llm] Gemini недоступен (${err.message?.slice(0, 140)}) — переключаюсь на Groq`);
    }
  }
  // Groq fallback: prefer the compact prompt the caller prepared; flatten any multimodal parts to text.
  const src = opts.fallback || opts;
  const messages = [];
  if (src.system) messages.push({ role: 'system', content: src.system });
  for (const m of src.messages || []) {
    const parts = Array.isArray(m.parts) ? m.parts : Array.isArray(m.content) ? m.content : null;
    const text = parts ? parts.map((p) => (typeof p === 'string' ? p : p.text || '[файл]')).join('\n') : String(m.content ?? '');
    messages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: text });
  }
  const res = await chatCompletion(messages, {
    purpose: TIER_TO_GROQ[opts.tier || 'smart'],
    json: opts.json,
    temperature: opts.temperature,
    maxTokens: Math.min(opts.maxTokens ?? 1800, 4000),
    timeoutMs: opts.timeoutMs,
  });
  return { ...res, provider: 'groq', fallbackFrom: geminiError ? 'gemini' : undefined };
}

/** JSON-mode completion with tolerant parsing; `data` is null when the model returned garbage. */
export async function completeJson(opts) {
  const res = await complete({ ...opts, json: true, temperature: opts.temperature ?? 0.3 });
  let data = parseJsonLoose(res.content);
  if (data === null && res.content && res.content.length > 20 && !opts._repaired) {
    // Malformed JSON (truncated or with commentary): one cheap repair pass instead of failing the feature.
    try {
      const fixed = await complete({
        system: 'Ты исправляешь невалидный JSON. Верни только валидный JSON без пояснений и без Markdown, сохранив все данные; если текст обрезан — закрой структуры разумно.',
        messages: [{ role: 'user', content: res.content.slice(0, 30_000) }],
        tier: 'fast',
        json: true,
        temperature: 0,
        maxTokens: Math.min(8000, (opts.maxTokens || 4000) + 500),
        timeoutMs: 40_000,
        _repaired: true,
      });
      data = parseJsonLoose(fixed.content);
    } catch {
      data = null;
    }
  }
  return { ...res, data };
}

/**
 * Streamed completion. Yields `{type:'token'|'done'|'fallback', ...}`. Gemini streams natively; if it fails
 * before producing text, the compact prompt is answered by Groq in one piece.
 */
export async function* stream(opts) {
  if (!isLlmConfigured()) throw new HttpError(503, 'AI не настроен: добавьте GEMINI_API_KEY (или GROQ_API_KEY) в .env', 'AI_NOT_CONFIGURED');
  if (isGeminiConfigured()) {
    try {
      const { geminiStream } = await import('./gemini.client.js');
      for await (const ev of geminiStream(opts)) yield ev;
      return;
    } catch (err) {
      if (err instanceof HttpError && ['AI_BLOCKED', 'AI_EMPTY_PROMPT'].includes(err.code)) throw err;
      if (opts.geminiOnly || !isGroqConfigured()) throw err;
      console.warn(`[llm] Gemini stream недоступен (${err.message?.slice(0, 140)}) — переключаюсь на Groq`);
      yield { type: 'fallback', provider: 'groq' };
    }
  }
  const res = await complete({ ...opts, geminiOnly: false, _skipGemini: true });
  yield { type: 'token', text: res.content };
  yield { type: 'done', model: res.model, provider: res.provider, text: res.content };
}
