// Safety net for anything the dictionaries do not cover (dynamic engine texts, knowledge-base strings,
// leftover literals): unknown Russian text shown in KK/EN is queued, translated on the server in batches
// (Gemini, cached 30 days) and remembered per browser so each string is translated once.
import type { AppLanguage } from '../types';
import { aiApi } from '../lib/api';

const CYRILLIC = /[А-Яа-яЁё]/;
const STORAGE_KEY = 'admitroute_auto_tr_v1';
const MAX_CACHED = 4000;

type Lang = Exclude<AppLanguage, 'ru'>;
type Listener = () => void;

const cache: Record<Lang, Map<string, string>> = { kk: new Map(), en: new Map() };
const pending: Record<Lang, Set<string>> = { kk: new Set(), en: new Set() };
const inFlight: Record<Lang, Set<string>> = { kk: new Set(), en: new Set() };
const listeners = new Set<Listener>();
let timer: number | null = null;
let disabledUntil = 0;

(function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<Lang, [string, string][]>;
    for (const l of ['kk', 'en'] as Lang[]) for (const [k, v] of parsed[l] || []) cache[l].set(k, v);
  } catch {
    /* ignore */
  }
})();

function persist() {
  try {
    const out: Record<string, [string, string][]> = {};
    for (const l of ['kk', 'en'] as Lang[]) out[l] = [...cache[l].entries()].slice(-MAX_CACHED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* quota or private mode — fine */
  }
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Whether a string should be auto-translated at all. */
export function isTranslatable(text: string) {
  return typeof text === 'string' && text.length >= 2 && text.length <= 4000 && CYRILLIC.test(text);
}

/** Returns the cached translation, or null (and queues the text) when not yet translated. */
export function lookup(lang: AppLanguage, text: string): string | null {
  if (lang === 'ru' || !isTranslatable(text)) return null;
  const hit = cache[lang].get(text);
  if (hit) return hit;
  if (Date.now() < disabledUntil) return null;
  if (!inFlight[lang].has(text)) {
    pending[lang].add(text);
    schedule();
  }
  return null;
}

function schedule() {
  if (timer) return;
  timer = window.setTimeout(flush, 350);
}

async function flush() {
  timer = null;
  for (const lang of ['kk', 'en'] as Lang[]) {
    if (!pending[lang].size) continue;
    const batch = [...pending[lang]].slice(0, 120);
    for (const t of batch) {
      pending[lang].delete(t);
      inFlight[lang].add(t);
    }
    try {
      const res = await aiApi.translate(batch, lang);
      let changed = false;
      res.items.forEach((translated, i) => {
        const src = batch[i];
        if (typeof translated === 'string' && translated.trim() && translated !== src) {
          cache[lang].set(src, translated);
          changed = true;
        } else {
          // Keep the original so we do not retry endlessly.
          cache[lang].set(src, src);
        }
      });
      if (changed) {
        persist();
        listeners.forEach((fn) => fn());
      }
    } catch {
      // Backend offline or rate-limited: pause auto-translation for a minute, keep showing Russian.
      disabledUntil = Date.now() + 60_000;
    } finally {
      for (const t of batch) inFlight[lang].delete(t);
    }
  }
  if (pending.kk.size || pending.en.size) schedule();
}
