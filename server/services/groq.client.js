// Minimal Groq client over the OpenAI-compatible REST API (plain fetch, no SDK).
// Handles model discovery, automatic fallback between models, JSON-mode parsing, retries, timeouts and —
// importantly for the free tier (8 000 tokens/minute on gpt-oss) — a per-model token budget gate that
// waits for the rate-limit window instead of failing, and a distinct AI_TOO_LARGE error so callers can
// shrink their context and retry.
import { config } from '../config.js';
import { upstream, HttpError } from '../utils/errors.js';

const ai = config.ai;

/** Models the key can actually use — filled by `discoverModels()` on startup. */
let availableModels = new Set();
let discovered = false;

/** Rate-limit state per model, learned from response headers. */
const limits = new Map(); // model → { remainingTokens, resetAt(ms epoch), limitTokens }

export function isAiConfigured() {
  return Boolean(ai.apiKey);
}

/** Rough token estimate: Cyrillic-heavy text tokenises at ~2.5 chars/token, Latin at ~4. */
export function estimateTokens(text) {
  const s = String(text || '');
  const cyr = (s.match(/[Ѐ-ӿ]/g) || []).length;
  const other = s.length - cyr;
  return Math.ceil(cyr / 2.3 + other / 3.8);
}

export function estimateMessagesTokens(messages) {
  return messages.reduce((n, m) => n + estimateTokens(m.content) + 6, 0);
}

export async function discoverModels() {
  if (!isAiConfigured()) {
    console.log('[ai] GROQ_API_KEY не задан — AI-функции работают в офлайн-режиме подсказок');
    return [];
  }
  try {
    const res = await fetch(`${ai.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${ai.apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    availableModels = new Set((json.data || []).map((m) => m.id));
    discovered = true;
    console.log(`[ai] Groq подключён. Доступно моделей: ${availableModels.size}. Chat: ${pickModel('chat')}, research: ${pickModel('research')}`);
  } catch (err) {
    console.warn(`[ai] Не удалось получить список моделей Groq (${err.message}) — использую значения из конфигурации`);
  }
  return [...availableModels];
}

/**
 * Preference lists per purpose. The first model that the key can access wins; if discovery failed we
 * trust the configured default.
 */
const PREFERENCES = {
  chat: () => [ai.chatModel, 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
  fast: () => [ai.fastModel, 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'qwen/qwen3.8-27b', ai.chatModel],
  research: () => [ai.researchModel, 'groq/compound', 'groq/compound-mini'],
  transcribe: () => [ai.transcribeModel, 'whisper-large-v3-turbo', 'whisper-large-v3'],
};

export function pickModel(purpose = 'chat', exclude = new Set()) {
  const prefs = PREFERENCES[purpose]();
  if (!discovered || availableModels.size === 0) return prefs.find((m) => !exclude.has(m)) || prefs[0];
  return prefs.find((m) => availableModels.has(m) && !exclude.has(m)) || prefs.find((m) => !exclude.has(m)) || prefs[0];
}

export function aiStatus() {
  return {
    configured: isAiConfigured(),
    discovered,
    models: { chat: pickModel('chat'), fast: pickModel('fast'), research: pickModel('research') },
    availableCount: availableModels.size,
    limits: Object.fromEntries([...limits].map(([m, l]) => [m, { remainingTokens: l.remainingTokens, limitTokens: l.limitTokens, resetInMs: Math.max(0, l.resetAt - Date.now()) }])),
  };
}

// ---------------------------------------------------------------------------
// Rate-limit bookkeeping
// ---------------------------------------------------------------------------

function parseDuration(s) {
  // "1m2.5s" | "47ms" | "5m45.6s" | "2h3m"
  if (!s) return 0;
  let ms = 0;
  const re = /(\d+(?:\.\d+)?)(ms|h|m|s)/g;
  let m;
  while ((m = re.exec(s))) {
    const v = parseFloat(m[1]);
    ms += m[2] === 'ms' ? v : m[2] === 's' ? v * 1000 : m[2] === 'm' ? v * 60_000 : v * 3_600_000;
  }
  return ms;
}

function recordLimits(model, headers) {
  const remaining = Number(headers.get('x-ratelimit-remaining-tokens'));
  const limit = Number(headers.get('x-ratelimit-limit-tokens'));
  const reset = parseDuration(headers.get('x-ratelimit-reset-tokens'));
  if (!Number.isNaN(remaining)) {
    limits.set(model, { remainingTokens: remaining, limitTokens: Number.isNaN(limit) ? undefined : limit, resetAt: Date.now() + reset });
  }
}

/** If the model's minute budget is nearly spent, wait for the window to reset (bounded). */
async function waitForBudget(model, neededTokens) {
  const l = limits.get(model);
  if (!l) return;
  if (l.limitTokens && neededTokens > l.limitTokens) {
    throw new HttpError(413, `Запрос (~${neededTokens} токенов) превышает лимит модели ${model} (${l.limitTokens} токенов/мин)`, 'AI_TOO_LARGE');
  }
  const now = Date.now();
  if (l.remainingTokens >= neededTokens || l.resetAt <= now) return;
  const wait = Math.min(l.resetAt - now, 65_000);
  console.log(`[ai] Лимит токенов ${model}: осталось ${l.remainingTokens}, нужно ~${neededTokens}. Жду ${Math.ceil(wait / 1000)}с`);
  await new Promise((r) => setTimeout(r, wait));
}

function classifyError(status, message) {
  const msg = (message || '').toLowerCase();
  if (status === 413 || msg.includes('request too large') || msg.includes('request_too_large') || msg.includes('tokens per minute') || msg.includes('reduce your message size')) {
    return 'too_large';
  }
  if (status === 429) return 'rate_limited';
  if (status === 401 || status === 403) return 'auth';
  if (status === 400 || status === 404 || status === 422) return 'bad_model_request';
  return 'transient';
}

// ---------------------------------------------------------------------------
// Chat completions
// ---------------------------------------------------------------------------

/**
 * Chat completion with automatic fallback across models on transient errors.
 * Throws HttpError('AI_TOO_LARGE', 413) when the request exceeds the token budget — callers should shrink.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{purpose?: 'chat'|'fast'|'research', temperature?: number, maxTokens?: number, json?: boolean, model?: string, timeoutMs?: number, reasoning?: 'low'|'medium'|'high'}} opts
 * @returns {Promise<{content: string, model: string, usage?: object, executedTools?: unknown[]}>}
 */
export async function chatCompletion(messages, opts = {}) {
  if (!isAiConfigured()) throw new HttpError(503, 'AI не настроен: добавьте GROQ_API_KEY в .env', 'AI_NOT_CONFIGURED');

  const purpose = opts.purpose || 'chat';
  const tried = new Set();
  let lastError = null;
  const maxTokens = opts.maxTokens ?? ai.maxTokens;
  const promptTokens = estimateMessagesTokens(messages);

  for (let attempt = 0; attempt < 3; attempt++) {
    const model = opts.model && attempt === 0 ? opts.model : pickModel(purpose, tried);
    if (!model || tried.has(model)) break;
    tried.add(model);

    await waitForBudget(model, promptTokens + Math.min(maxTokens, 1200));

    const body = { model, messages, temperature: opts.temperature ?? 0.5, max_tokens: maxTokens };
    // gpt-oss models spend completion tokens on hidden reasoning; keep it low unless asked otherwise.
    if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = opts.reasoning || 'low';
    // groq/compound does not accept response_format; other models do.
    if (opts.json && !model.startsWith('groq/compound')) body.response_format = { type: 'json_object' };

    try {
      const res = await fetch(`${ai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(opts.timeoutMs || ai.timeoutMs),
      });
      recordLimits(model, res.headers);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const message = errJson?.error?.message || `HTTP ${res.status}`;
        const kind = classifyError(res.status, message);
        lastError = new Error(`[${model}] ${message}`);
        if (kind === 'auth') throw upstream('Ключ Groq отклонён (401/403). Проверьте GROQ_API_KEY.', 'AI_AUTH');
        if (kind === 'too_large') {
          // Every free-tier text model shares the same budget — switching models will not help.
          throw new HttpError(413, `Слишком большой запрос для модели ${model}: ${message}`, 'AI_TOO_LARGE');
        }
        if (kind === 'rate_limited') {
          const retryMs = parseDuration(res.headers.get('retry-after') ? `${res.headers.get('retry-after')}s` : '') || 2_000;
          if (retryMs <= 20_000 && attempt < 2) {
            await new Promise((r) => setTimeout(r, retryMs));
            tried.delete(model); // retry same model after the wait
          }
          continue;
        }
        continue; // transient / bad request → next model
      }

      const json = await res.json();
      const choice = json.choices?.[0];
      const content = (choice?.message?.content || '').trim();
      if (!content) {
        lastError = new Error(`[${model}] пустой ответ`);
        continue;
      }
      return {
        content,
        model: json.model || model,
        usage: json.usage,
        finishReason: choice?.finish_reason,
        executedTools: choice?.message?.executed_tools,
      };
    } catch (err) {
      if (err instanceof HttpError) throw err;
      lastError = err; // network / timeout → try next model
    }
  }

  throw upstream(`AI недоступен: ${lastError?.message || 'неизвестная ошибка'}`, 'AI_UNAVAILABLE');
}

/**
 * Ask for JSON and parse it robustly (strips code fences, finds the outermost object).
 */
export async function jsonCompletion(messages, opts = {}) {
  const result = await chatCompletion(messages, { ...opts, json: true, temperature: opts.temperature ?? 0.3 });
  return { ...result, data: parseJsonLoose(result.content) };
}

export function parseJsonLoose(text) {
  if (!text) return null;
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        /* fallthrough */
      }
    }
  }
  return null;
}

/**
 * Run `build(size)` → messages with progressively smaller context until the request fits the token budget.
 * `sizes` is a descending list of context sizes (e.g. number of universities to include).
 */
export async function completionWithShrink(build, sizes, opts = {}, mode = 'json') {
  let lastErr;
  for (const size of sizes) {
    const messages = build(size);
    try {
      return mode === 'json' ? await jsonCompletion(messages, opts) : await chatCompletion(messages, opts);
    } catch (err) {
      lastErr = err;
      if (err instanceof HttpError && err.code === 'AI_TOO_LARGE') {
        console.log(`[ai] Контекст из ${size} элементов слишком велик — уменьшаю`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** Whisper transcription (multipart). `buffer` is a Buffer; returns text. */
export async function transcribeAudio(buffer, filename, mimeType, language) {
  if (!isAiConfigured()) throw new HttpError(503, 'AI не настроен', 'AI_NOT_CONFIGURED');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), filename || 'audio.webm');
  form.append('model', pickModel('transcribe'));
  if (language) form.append('language', language);
  form.append('response_format', 'json');
  const res = await fetch(`${ai.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ai.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(ai.timeoutMs),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw upstream(`Whisper: ${err?.error?.message || res.status}`, 'AI_UPSTREAM');
  }
  const json = await res.json();
  return json.text || '';
}
