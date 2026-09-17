// Persistence facade. Services talk to a tiny document-store interface so the same code runs on
// SQLite (laptop / `npm run dev`) and on Cloud Firestore (Firebase Functions). Every document is a plain
// JSON object with a string `id`; collections are flat.
//
//   store.get(col, id)                 → doc | null
//   store.set(col, id, doc)            → doc        (create or replace)
//   store.update(col, id, patch)       → doc | null (shallow merge; null if missing)
//   store.remove(col, id)              → boolean
//   store.find(col, query)             → doc[]      query = { where: [[field, op, value]], orderBy: [[field, 'asc'|'desc']], limit }
//   store.count(col, query)            → number
//   store.removeWhere(col, query)      → number
//
// Supported operators: '==', '!=', '<', '<=', '>', '>=', 'in', 'array-contains'.
import { config } from '../config.js';

export const nowIso = () => new Date().toISOString();

let storePromise = null;

export async function getStore() {
  if (!storePromise) {
    storePromise = (async () => {
      if (config.db.driver === 'firestore') {
        const { createFirestoreStore } = await import('./firestoreStore.js');
        return createFirestoreStore();
      }
      const { createSqliteStore } = await import('./sqliteStore.js');
      return createSqliteStore();
    })();
  }
  return storePromise;
}

/** Apply `where` clauses in memory (used by both drivers for parts the backend cannot filter natively). */
export function matchesWhere(doc, where = []) {
  for (const [field, op, value] of where) {
    const v = doc?.[field];
    switch (op) {
      case '==':
        if (!(v === value || (v == null && value == null))) return false;
        break;
      case '!=':
        if (v === value) return false;
        break;
      case '<':
        if (!(v != null && v < value)) return false;
        break;
      case '<=':
        if (!(v != null && v <= value)) return false;
        break;
      case '>':
        if (!(v != null && v > value)) return false;
        break;
      case '>=':
        if (!(v != null && v >= value)) return false;
        break;
      case 'in':
        if (!Array.isArray(value) || !value.includes(v)) return false;
        break;
      case 'array-contains':
        if (!Array.isArray(v) || !v.includes(value)) return false;
        break;
      default:
        throw new Error(`Unsupported operator ${op}`);
    }
  }
  return true;
}

export function sortDocs(docs, orderBy = []) {
  if (!orderBy.length) return docs;
  return [...docs].sort((a, b) => {
    for (const [field, dir] of orderBy) {
      const av = a?.[field];
      const bv = b?.[field];
      if (av === bv) continue;
      if (av == null) return 1; // nulls last regardless of direction
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : 1;
      return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Cache helpers (collection `cache`: { id, value, expiresAt })
// ---------------------------------------------------------------------------

export async function cacheGet(key) {
  const store = await getStore();
  const row = await store.get('cache', cacheId(key));
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    store.remove('cache', cacheId(key)).catch(() => {});
    return null;
  }
  return row.value ?? null;
}

export async function cacheSet(key, value, ttlMs) {
  const store = await getStore();
  await store.set('cache', cacheId(key), { id: cacheId(key), key, value, expiresAt: Date.now() + ttlMs });
}

// Firestore document ids cannot contain '/', so cache keys are hashed to a safe id.
function cacheId(key) {
  return String(key).replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0, 900);
}

/** Housekeeping: expired sessions, OTP codes and cache rows. Safe to call from a timer or a cron function. */
export async function runMaintenance() {
  const store = await getStore();
  const now = nowIso();
  const results = await Promise.allSettled([
    store.removeWhere('sessions', { where: [['expiresAt', '<', now]] }),
    store.removeWhere('otp_codes', { where: [['expiresAt', '<', now]] }),
    store.removeWhere('cache', { where: [['expiresAt', '<', Date.now()]] }),
  ]);
  return results.map((r) => (r.status === 'fulfilled' ? r.value : 0));
}
