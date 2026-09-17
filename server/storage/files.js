// Binary file storage behind one tiny interface: putFile / getFile / deleteFile.
//   local     — files on disk under server/data/uploads (development);
//   gcs       — Cloud Storage for Firebase bucket via the Admin SDK (production, needs the Blaze plan);
//   firestore — chunked base64 blobs inside Firestore (production fallback when Storage is not enabled).
// Paths look like "documents/<userId>/<docId>.pdf" and never contain "..".
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const CHUNK_BYTES = 700 * 1024; // Firestore documents max out at 1 MiB; base64 adds ~33 %

let driverPromise = null;

export function getFileDriver() {
  if (!driverPromise) driverPromise = createDriver(config.files.driver);
  return driverPromise;
}

export function safeStoragePath(p) {
  const clean = String(p).replace(/\\/g, '/').split('/').filter((seg) => seg && seg !== '.' && seg !== '..' && /^[a-zA-Z0-9_.-]+$/.test(seg));
  if (!clean.length) throw new Error('Invalid storage path');
  return clean.join('/');
}

export async function putFile(storagePath, buffer, contentType) {
  const d = await getFileDriver();
  return d.put(safeStoragePath(storagePath), buffer, contentType);
}

export async function getFile(storagePath) {
  const d = await getFileDriver();
  return d.get(safeStoragePath(storagePath));
}

export async function deleteFile(storagePath) {
  const d = await getFileDriver();
  return d.delete(safeStoragePath(storagePath));
}

async function createDriver(name) {
  if (name === 'gcs') return gcsDriver();
  if (name === 'firestore') return firestoreDriver();
  return localDriver();
}

function localDriver() {
  const root = config.files.uploadsDir;
  fs.mkdirSync(root, { recursive: true });
  const abs = (p) => path.join(root, ...p.split('/'));
  return {
    name: 'local',
    async put(p, buffer) {
      const file = abs(p);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buffer);
      return { path: p, size: buffer.length };
    },
    async get(p) {
      const file = abs(p);
      if (!fs.existsSync(file)) return null;
      return fs.readFileSync(file);
    },
    async delete(p) {
      try {
        fs.unlinkSync(abs(p));
        return true;
      } catch {
        return false;
      }
    },
  };
}

async function gcsDriver() {
  const { getStorageBucket } = await import('../db/firebaseAdmin.js');
  const bucket = await getStorageBucket();
  return {
    name: 'gcs',
    async put(p, buffer, contentType) {
      await bucket.file(p).save(buffer, { contentType: contentType || 'application/octet-stream', resumable: false });
      return { path: p, size: buffer.length };
    },
    async get(p) {
      const file = bucket.file(p);
      const [exists] = await file.exists();
      if (!exists) return null;
      const [buf] = await file.download();
      return buf;
    },
    async delete(p) {
      try {
        await bucket.file(p).delete();
        return true;
      } catch {
        return false;
      }
    },
  };
}

async function firestoreDriver() {
  const { getFirestore } = await import('../db/firebaseAdmin.js');
  const db = await getFirestore();
  const idFor = (p) => p.replace(/\//g, '__');
  return {
    name: 'firestore',
    async put(p, buffer, contentType) {
      const id = idFor(p);
      const chunks = [];
      for (let i = 0; i < buffer.length; i += CHUNK_BYTES) chunks.push(buffer.subarray(i, i + CHUNK_BYTES).toString('base64'));
      const batch = db.batch();
      batch.set(db.collection('file_meta').doc(id), { path: p, size: buffer.length, contentType: contentType || null, chunks: chunks.length, createdAt: new Date().toISOString() });
      chunks.forEach((data, n) => batch.set(db.collection('file_blobs').doc(`${id}__${n}`), { fileId: id, n, data }));
      await batch.commit();
      return { path: p, size: buffer.length };
    },
    async get(p) {
      const id = idFor(p);
      const meta = await db.collection('file_meta').doc(id).get();
      if (!meta.exists) return null;
      const { chunks } = meta.data();
      const refs = Array.from({ length: chunks }, (_, n) => db.collection('file_blobs').doc(`${id}__${n}`));
      const snaps = await db.getAll(...refs);
      return Buffer.concat(snaps.map((s) => Buffer.from(s.data()?.data || '', 'base64')));
    },
    async delete(p) {
      const id = idFor(p);
      const meta = await db.collection('file_meta').doc(id).get();
      if (!meta.exists) return false;
      const { chunks } = meta.data();
      const batch = db.batch();
      for (let n = 0; n < chunks; n++) batch.delete(db.collection('file_blobs').doc(`${id}__${n}`));
      batch.delete(db.collection('file_meta').doc(id));
      await batch.commit();
      return true;
    },
  };
}
