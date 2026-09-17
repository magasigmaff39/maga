// Gemini client over the Google AI Studio REST API (plain fetch, no SDK).
// The key can reach several model generations; newer, stronger models are tried first and any model that
// answers 429/503/404 is put on a short cooldown so the next request goes straight to a healthy one.
// Supports system instructions, multi-turn history, JSON mode and inline files (PDF / images) for
// document understanding.
import { config } from '../config.js';
import { HttpError, upstream } from '../utils/errors.js';

const g = config.gemini;

/** model → epoch ms until which the model is skipped */
const cooldown = new Map();
/** model → last error text (for /api/health) */
const lastErrors = new Map();
/** model → consecutive failures (cooldown doubles each time, capped at 1 h) */
const strikes = new Map();
let calls = 0;
let failures = 0;

export function isGeminiConfigured() {
  return Boolean(g.apiKey);
}

export function geminiStatus() {
  const now = Date.now();
  return {
    configured: isGeminiConfigured(),
    tiers: Object.fromEntries(Object.entries(g.models).map(([tier, models]) => [tier, models.find((m) => (cooldown.get(m) || 0) <= now) || models[0]])),
    coolingDown: [...cooldown].filter(([, until]) => until > now).map(([m, until]) => ({ model: m, seconds: Math.ceil((until - now) / 1000), reason: lastErrors.get(m) })),
    calls,
    failures,
  };
}

function healthyModels(tier) {
  const now = Date.now();
  const models = g.models[tier] || g.models.smart;
  const ready = models.filter((m) => (cooldown.get(m) || 0) <= now);
  // If everything is cooling down, still try the whole list — the cooldown is only a hint.
  return ready.length ? ready.concat(models.filter((m) => !ready.includes(m))) : models;
}

function markCooldown(model, reason, ms = g.cooldownMs) {
  const n = (strikes.get(model) || 0) + 1;
  strikes.set(model, n);
  const scaled = Math.min(3_600_000, ms * 2 ** Math.min(n - 1, 4));
  cooldown.set(model, Date.now() + scaled);
  lastErrors.set(model, String(reason).slice(0, 160));
}

function markHealthy(model) {
  strikes.delete(model);
  cooldown.delete(model);
}

/** Convert OpenAI-style messages into Gemini `contents`. `content` may be a string or an array of parts. */
function toContents(messages) {
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    const parts = Array.isArray(m.parts)
      ? m.parts
      : Array.isArray(m.content)
        ? m.content
        : [{ text: String(m.content ?? '') }];
    const normalized = parts.map((p) => (typeof p === 'string' ? { text: p } : p)).filter((p) => (p.text && p.text.length) || p.inlineData || p.fileData);
    if (!normalized.length) continue;
    // Gemini requires alternating roles; merge consecutive same-role turns.
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push(...normalized);
    else contents.push({ role, parts: normalized });
  }
  // The conversation must start with a user turn.
  while (contents.length && contents[0].role !== 'user') contents.shift();
  return contents;
}

function thinkingConfig(model, tier) {
  if (model.startsWith('gemini-2.5')) {
    // 2.5-flash: budget 0 disables hidden reasoning (fast); deep analysis gets a modest budget.
    return { thinkingBudget: tier === 'deep' ? 2048 : 0 };
  }
  if (model.startsWith('gemini-3')) return { thinkingLevel: tier === 'deep' ? 'high' : 'low' };
  return null;
}

const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map((category) => ({
  category,
  threshold: 'BLOCK_ONLY_HIGH',
}));

function classify(status, message) {
  const msg = String(message || '').toLowerCase();
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return msg.includes('per day') || msg.includes('daily') ? 'quota_day' : 'rate_limited';
  if (status === 503 || status === 500 || status === 502 || status === 504) return 'overloaded';
  if (status === 404) return 'no_model';
  if (status === 400 && (msg.includes('thinking') || msg.includes('unknown name'))) return 'bad_config';
  if (status === 400 && (msg.includes('token') || msg.includes('too large') || msg.includes('exceeds'))) return 'too_large';
  if (status === 400) return 'bad_request';
  return 'transient';
}

/**
 * @param {object} opts
 * @param {string} [opts.system]
 * @param {Array<{role: string, content?: string|Array, parts?: Array}>} opts.messages
 * @param {'fast'|'smart'|'deep'} [opts.tier]
 * @param {boolean} [opts.json]
 * @param {object} [opts.schema]  JSON schema (OpenAPI subset) enforced by the API in JSON mode
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<{content: string, model: string, usage?: object, provider: 'gemini'}>}
 */
export async function geminiGenerate(opts) {
  if (!isGeminiConfigured()) throw new HttpError(503, 'Gemini не настроен: добавьте GEMINI_API_KEY', 'AI_NOT_CONFIGURED');
  const tier = opts.tier || 'smart';
  const contents = toContents(opts.messages || []);
  if (!contents.length) throw new HttpError(400, 'Пустой запрос к модели', 'AI_EMPTY_PROMPT');

  const models = healthyModels(tier);
  let lastError = null;
  let attempts = 0;

  for (const model of models) {
    if (attempts >= 4) break;
    attempts++;
    calls++;
    let includeThinking = true;

    for (let retry = 0; retry < 2; retry++) {
      const generationConfig = {
        temperature: opts.temperature ?? 0.6,
        maxOutputTokens: opts.maxTokens ?? 4096,
        candidateCount: 1,
      };
      if (opts.json) {
        generationConfig.responseMimeType = 'application/json';
        if (opts.schema) generationConfig.responseSchema = opts.schema;
      }
      const thinking = includeThinking ? thinkingConfig(model, tier) : null;
      if (thinking) generationConfig.thinkingConfig = thinking;

      const body = { contents, generationConfig, safetySettings: SAFETY };
      if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

      try {
        const res = await fetch(`${g.baseUrl}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': g.apiKey },
          body: JSON.stringify(body),
          // The first (preferred) model gets the full budget; fallbacks must answer quickly or yield.
          signal: AbortSignal.timeout(attempts === 1 ? opts.timeoutMs || g.timeoutMs : Math.min(opts.timeoutMs || g.timeoutMs, g.fallbackTimeoutMs)),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const message = errJson?.error?.message || `HTTP ${res.status}`;
          const kind = classify(res.status, message);
          lastError = new Error(`[${model}] ${message}`);
          if (kind === 'auth') throw upstream('Ключ Gemini отклонён (401/403). Проверьте GEMINI_API_KEY.', 'AI_AUTH');
          if (kind === 'bad_config' && includeThinking) {
            includeThinking = false; // model does not accept this thinkingConfig — retry without it
            continue;
          }
          if (kind === 'too_large') throw new HttpError(413, `Слишком большой запрос для ${model}: ${message}`, 'AI_TOO_LARGE');
          if (kind === 'quota_day') markCooldown(model, message, 6 * 3_600_000);
          else if (kind === 'rate_limited') markCooldown(model, message, 90_000);
          else if (kind === 'overloaded') markCooldown(model, message);
          else if (kind === 'no_model') markCooldown(model, message, 24 * 3_600_000);
          else if (kind === 'bad_request') {
            // Most likely a schema/prompt issue that will not fix itself with another model, but the
            // fallback list is cheap to try once more.
            markCooldown(model, message, 30_000);
          }
          failures++;
          break; // next model
        }

        const json = await res.json();
        const candidate = json.candidates?.[0];
        const text = (candidate?.content?.parts || [])
          .filter((p) => typeof p.text === 'string' && !p.thought)
          .map((p) => p.text)
          .join('')
          .trim();
        if (!text) {
          const reason = candidate?.finishReason || json.promptFeedback?.blockReason || 'empty';
          lastError = new Error(`[${model}] пустой ответ (${reason})`);
          if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT') throw new HttpError(422, 'Модель отказалась отвечать по соображениям безопасности', 'AI_BLOCKED');
          if (reason === 'MAX_TOKENS') {
            // Nothing visible survived thinking — retry without thinking to leave room for output.
            if (includeThinking) {
              includeThinking = false;
              continue;
            }
          }
          failures++;
          break;
        }
        markHealthy(model);
        return {
          content: text,
          model,
          provider: 'gemini',
          usage: json.usageMetadata,
          finishReason: candidate?.finishReason,
        };
      } catch (err) {
        if (err instanceof HttpError) throw err;
        lastError = err; // network / timeout → try next model
        failures++;
        if (err?.name === 'TimeoutError') markCooldown(model, 'timeout', 60_000);
        break;
      }
    }
  }
  throw upstream(`Gemini недоступен: ${lastError?.message || 'неизвестная ошибка'}`, 'AI_UNAVAILABLE');
}

/** Build an inline-file part for PDFs / images so the model can read an uploaded document. */
export function inlineFilePart(buffer, mimeType) {
  return { inlineData: { mimeType, data: Buffer.from(buffer).toString('base64') } };
}

/** Which uploaded MIME types Gemini can read directly. */
export const GEMINI_READABLE_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']);


// ---------------------------------------------------------------------------
// Streaming with hedging
// ---------------------------------------------------------------------------

/** Minimal async queue: producer pushes, consumer iterates. */
function makeQueue() {
  const items = [];
  let waiting = null;
  let closed = false;
  let error = null;
  return {
    push(v) {
      if (closed) return;
      items.push(v);
      if (waiting) {
        const w = waiting;
        waiting = null;
        w();
      }
    },
    close(err) {
      closed = true;
      error = err || null;
      if (waiting) {
        const w = waiting;
        waiting = null;
        w();
      }
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (items.length) {
          yield items.shift();
          continue;
        }
        if (closed) {
          if (error) throw error;
          return;
        }
        await new Promise((r) => {
          waiting = r;
        });
      }
    },
  };
}

/**
 * Opens one streaming request. Returns immediately with:
 *   first  — resolves when the first text chunk arrives, rejects on any failure before that;
 *   tokens — async iterable of text chunks (after `first`);
 *   result — resolves with { text, finishReason } when the stream ends;
 *   abort()
 */
function openStream(model, opts, body, ttftMs) {
  const controller = new AbortController();
  const queue = makeQueue();
  let firstResolve;
  let firstReject;
  const first = new Promise((res, rej) => {
    firstResolve = res;
    firstReject = rej;
  });
  first.catch(() => {}); // avoid unhandled rejection when nobody awaits the loser
  let emitted = '';
  let finishReason = null;
  let timer = setTimeout(() => controller.abort(new Error('ttft-timeout')), ttftMs);
  opts.signal?.addEventListener('abort', () => controller.abort(new Error('client-abort')));

  const result = (async () => {
    try {
      const res = await fetch(`${g.baseUrl}/models/${model}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': g.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        const message = errJson?.error?.message || `HTTP ${res.status}`;
        const kind = classify(res.status, message);
        if (kind === 'auth') throw upstream('Ключ Gemini отклонён (401/403). Проверьте GEMINI_API_KEY.', 'AI_AUTH');
        if (kind === 'too_large') throw new HttpError(413, `Слишком большой запрос для ${model}: ${message}`, 'AI_TOO_LARGE');
        if (kind === 'quota_day') markCooldown(model, message, 6 * 3_600_000);
        else if (kind === 'rate_limited') markCooldown(model, message, 90_000);
        else if (kind === 'no_model') markCooldown(model, message, 24 * 3_600_000);
        else markCooldown(model, message);
        throw new Error(`[${model}] ${message}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          let json;
          try {
            json = JSON.parse(payload);
          } catch {
            continue;
          }
          const candidate = json.candidates?.[0];
          if (json.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
            throw new HttpError(422, 'Модель отказалась отвечать по соображениям безопасности', 'AI_BLOCKED');
          }
          const text = (candidate?.content?.parts || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('');
          if (text) {
            if (!emitted) {
              clearTimeout(timer);
              timer = setTimeout(() => controller.abort(new Error('idle-timeout')), 120_000);
              firstResolve();
            }
            emitted += text;
            queue.push(text);
          }
          if (candidate?.finishReason) finishReason = candidate.finishReason;
        }
      }
      clearTimeout(timer);
      if (!emitted.trim()) throw new Error(`[${model}] пустой ответ (${finishReason || 'empty'})`);
      markHealthy(model);
      queue.close();
      return { text: emitted, finishReason };
    } catch (err) {
      clearTimeout(timer);
      const reason = controller.signal.reason?.message || err?.message || 'error';
      if (!emitted) {
        if (reason === 'ttft-timeout') markCooldown(model, 'timeout', 60_000);
        failures++;
        firstReject(err instanceof HttpError ? err : new Error(`[${model}] ${reason}`));
        queue.close(err);
        throw err;
      }
      // Broke mid-answer: deliver what we have.
      queue.close();
      return { text: emitted, finishReason: 'INTERRUPTED' };
    }
  })();
  result.catch(() => {});
  return { model, first, tokens: queue, result, abort: () => controller.abort(new Error('hedge-loser')) };
}

const LITE = /lite/;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Streamed generation with hedging: the preferred model starts first; if it has not produced a token after
 * `hedgeAfterMs`, a fast "lite" model is started in parallel and whichever answers first wins (the other is
 * aborted). Remaining models are tried sequentially if both fail. Yields `{type:'token'}` then `{type:'done'}`.
 */
export async function* geminiStream(opts) {
  if (!isGeminiConfigured()) throw new HttpError(503, 'Gemini не настроен: добавьте GEMINI_API_KEY', 'AI_NOT_CONFIGURED');
  const tier = opts.tier || 'smart';
  const contents = toContents(opts.messages || []);
  if (!contents.length) throw new HttpError(400, 'Пустой запрос к модели', 'AI_EMPTY_PROMPT');

  const bodyFor = (model) => {
    const generationConfig = { temperature: opts.temperature ?? 0.6, maxOutputTokens: opts.maxTokens ?? 4096, candidateCount: 1 };
    const thinking = thinkingConfig(model, tier);
    if (thinking) generationConfig.thinkingConfig = thinking;
    const body = { contents, generationConfig, safetySettings: SAFETY };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    return body;
  };

  const models = healthyModels(tier);
  const primary = models[0];
  const hedge = models.find((m) => m !== primary && LITE.test(m)) || models[1];
  const ttft = Math.min(opts.timeoutMs || g.timeoutMs, g.firstTokenTimeoutMs);
  const tried = new Set();
  let winner = null;
  let lastError = null;

  // Phase 1: primary with a hedge.
  calls++;
  tried.add(primary);
  const p = openStream(primary, opts, bodyFor(primary), ttft);
  const pFirst = p.first.then(() => p, (e) => { lastError = e; return null; });
  let h = null;
  winner = await Promise.race([pFirst, delay(g.hedgeAfterMs).then(() => 'hedge')]);
  if (winner === 'hedge' && hedge) {
    calls++;
    tried.add(hedge);
    h = openStream(hedge, opts, bodyFor(hedge), ttft);
    const hFirst = h.first.then(() => h, (e) => { lastError = e; return null; });
    // First stream to produce text wins; if one fails, wait for the other.
    winner = await new Promise((resolve) => {
      let pending = 2;
      const settle = (v) => {
        if (v) resolve(v);
        else if (--pending === 0) resolve(null);
      };
      pFirst.then(settle);
      hFirst.then(settle);
    });
  } else if (winner === 'hedge') {
    winner = await pFirst;
  }
  if (winner) {
    for (const s of [p, h]) if (s && s !== winner) s.abort();
  }

  // Phase 2: sequential fallbacks.
  let attempts = tried.size;
  for (const model of models) {
    if (winner || attempts >= 4) break;
    if (tried.has(model)) continue;
    tried.add(model);
    attempts++;
    calls++;
    const s = openStream(model, opts, bodyFor(model), Math.min(ttft, g.fallbackTimeoutMs));
    try {
      await s.first;
      winner = s;
    } catch (e) {
      lastError = e;
    }
  }
  if (!winner) {
    if (lastError instanceof HttpError) throw lastError;
    throw upstream(`Gemini недоступен: ${lastError?.message || 'неизвестная ошибка'}`, 'AI_UNAVAILABLE');
  }

  for await (const text of winner.tokens) yield { type: 'token', text };
  const { text, finishReason } = await winner.result;
  yield { type: 'done', model: winner.model, provider: 'gemini', text, finishReason };
}
