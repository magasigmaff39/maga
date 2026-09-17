// Cloud Firestore implementation of the document store (Admin SDK — bypasses security rules).
// Equality filters run server-side (they only need Firestore's automatic single-field indexes);
// inequality filters combined with other clauses, and all sorting, run in memory so the deployment
// never depends on composite indexes. Per-user collections are small, so this stays cheap.
import { getFirestore } from './firebaseAdmin.js';
import { matchesWhere, sortDocs } from './store.js';

const NATIVE_EQUALITY = new Set(['==', 'in', 'array-contains']);

export async function createFirestoreStore() {
  const db = await getFirestore();
  // Drop undefined values and class instances so documents stay plain JSON.
  const strip = (doc) => JSON.parse(JSON.stringify(doc));

  function buildQuery(col, query = {}) {
    const where = query.where || [];
    const equality = where.filter(([, op]) => NATIVE_EQUALITY.has(op));
    const inequality = where.filter(([, op]) => !NATIVE_EQUALITY.has(op));
    let ref = db.collection(col);
    const residual = [];
    if (equality.length) {
      for (const [f, op, v] of equality) ref = ref.where(f, op, v);
      residual.push(...inequality); // mixing with inequality would need a composite index
    } else if (inequality.length) {
      // Several inequality clauses on the same field are fine natively.
      const field = inequality[0][0];
      for (const clause of inequality) {
        if (clause[0] === field) ref = ref.where(clause[0], clause[1], clause[2]);
        else residual.push(clause);
      }
    }
    return { ref, residual };
  }

  return {
    driver: 'firestore',

    async get(col, id) {
      const snap = await db.collection(col).doc(String(id)).get();
      return snap.exists ? { ...snap.data(), id: snap.id } : null;
    },

    async set(col, id, doc) {
      const data = strip({ ...doc, id: String(id) });
      await db.collection(col).doc(String(id)).set(data);
      return data;
    },

    async update(col, id, patch) {
      const ref = db.collection(col).doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = strip({ ...snap.data(), ...patch, id: String(id) });
      await ref.set(data);
      return data;
    },

    async remove(col, id) {
      const ref = db.collection(col).doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return false;
      await ref.delete();
      return true;
    },

    async find(col, query = {}) {
      const { ref, residual } = buildQuery(col, query);
      const snap = await ref.get();
      let docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      if (residual.length) docs = docs.filter((d) => matchesWhere(d, residual));
      docs = sortDocs(docs, query.orderBy || []);
      if (query.limit) docs = docs.slice(0, query.limit);
      return docs;
    },

    async count(col, query = {}) {
      return (await this.find(col, query)).length;
    },

    async removeWhere(col, query = {}) {
      const docs = await this.find(col, query);
      let n = 0;
      // Firestore batches are limited to 500 writes.
      for (let i = 0; i < docs.length; i += 400) {
        const batch = db.batch();
        for (const d of docs.slice(i, i + 400)) {
          batch.delete(db.collection(col).doc(d.id));
          n++;
        }
        await batch.commit();
      }
      return n;
    },
  };
}
