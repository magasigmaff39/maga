// Admission documents: binaries go to the file storage driver (disk / Cloud Storage / Firestore blobs),
// metadata to the document store. The checklist merges the knowledge-base template with what the user
// has already uploaded. Uploads arrive as base64 JSON so the same code runs on Cloud Functions.
import path from 'node:path';
import crypto from 'node:crypto';
import { getStore, nowIso } from '../db/store.js';
import { config } from '../config.js';
import { badRequest, notFound } from '../utils/errors.js';
import { putFile, getFile, deleteFile } from '../storage/files.js';
import { DOCUMENT_CHECKLIST } from '../../shared/data/admissionsKnowledge.js';

export const DOCUMENT_KINDS = DOCUMENT_CHECKLIST.map((d) => d.kind).concat(['portfolio_proof', 'other']);

export const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

/** Magic-byte sniffing — the declared MIME type is only trusted when the bytes agree. */
export function sniffMime(buffer) {
  if (!buffer || buffer.length < 4) return null;
  const b = buffer;
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'application/msword';
  // Plain text: no NUL bytes in the first KB and valid UTF-8.
  const head = b.subarray(0, 1024);
  if (!head.includes(0)) {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(head);
      return 'text/plain';
    } catch {
      return null;
    }
  }
  return null;
}

export function toPublicDocument(doc) {
  return {
    id: doc.id,
    userId: doc.userId,
    kind: doc.kind,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt,
    note: doc.note || undefined,
    aiSummary: doc.aiSummary || undefined,
    downloadUrl: `/api/documents/${doc.id}/download`,
  };
}

export async function listDocuments(userId) {
  const store = await getStore();
  const docs = await store.find('documents', { where: [['userId', '==', userId]], orderBy: [['uploadedAt', 'desc']] });
  return docs.map(toPublicDocument);
}

export async function getDocumentMeta(userId, docId) {
  const store = await getStore();
  const doc = await store.get('documents', docId);
  if (!doc || doc.userId !== userId) throw notFound('Документ не найден', 'DOC_NOT_FOUND');
  return doc;
}

/**
 * @param {string} userId
 * @param {{ fileName: string, mimeType: string, dataBase64: string }} file
 */
export async function saveDocument(userId, file, { kind, note }) {
  if (!file || typeof file.dataBase64 !== 'string' || !file.dataBase64) throw badRequest('Файл не получен', 'NO_FILE');
  const base64 = file.dataBase64.replace(/^data:[^;]+;base64,/, '');
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > config.files.maxUploadBytes) {
    throw badRequest(`Файл больше ${Math.round(config.files.maxUploadBytes / 1048576)} МБ`, 'FILE_TOO_LARGE');
  }
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw badRequest('Пустой файл', 'NO_FILE');

  // The bytes decide the type; the declared MIME only has to agree with them.
  const sniffed = sniffMime(buffer);
  const declared = String(file.mimeType || '').toLowerCase();
  const mimeType = sniffed;
  const agrees = !declared || declared === sniffed || declared === 'application/octet-stream' || (sniffed === 'text/plain' && declared.startsWith('text/')) || (sniffed === 'image/jpeg' && declared === 'image/jpg');
  if (!sniffed || !ALLOWED_MIME.has(sniffed) || !agrees) {
    throw badRequest('Допустимы PDF, JPG, PNG, WEBP, DOC/DOCX и TXT — содержимое файла не соответствует формату', 'BAD_MIME', { mimeType: declared, detected: sniffed });
  }
  if (!DOCUMENT_KINDS.includes(kind)) kind = 'other';

  const id = `doc_${crypto.randomUUID()}`;
  const ext = path.extname(file.fileName || '').toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10) || '';
  const storagePath = `documents/${userId.replace(/[^a-zA-Z0-9_-]/g, '')}/${id}${ext}`;
  await putFile(storagePath, buffer, mimeType);

  const store = await getStore();
  const doc = await store.set('documents', id, {
    userId,
    kind,
    originalName: String(file.fileName || 'document').replace(/[\r\n]/g, ' ').slice(0, 200),
    storagePath,
    mimeType,
    sizeBytes: buffer.length,
    note: note ? String(note).slice(0, 500) : null,
    aiSummary: null,
    uploadedAt: nowIso(),
  });
  return { doc: toPublicDocument(doc), buffer, mimeType };
}

export async function attachSummary(docId, aiSummary) {
  const store = await getStore();
  await store.update('documents', docId, { aiSummary: String(aiSummary).slice(0, 1500) });
}

export async function getDocumentFile(userId, docId) {
  const doc = await getDocumentMeta(userId, docId);
  const buffer = await getFile(doc.storagePath);
  if (!buffer) throw notFound('Файл документа отсутствует в хранилище', 'DOC_FILE_MISSING');
  return { doc, buffer };
}

export async function deleteDocument(userId, docId) {
  const doc = await getDocumentMeta(userId, docId);
  await deleteFile(doc.storagePath).catch(() => false);
  const store = await getStore();
  await store.remove('documents', docId);
}

/** Checklist tailored to the applicant's target regions, with upload status per document kind. */
export async function buildChecklist(userId, targetRegions = []) {
  const docs = userId ? await listDocuments(userId) : [];
  const byKind = new Map();
  for (const d of docs) if (!byKind.has(d.kind)) byKind.set(d.kind, d);

  const regions = targetRegions.length ? targetRegions : ['kazakhstan', 'europe', 'asia', 'usa_canada'];
  return DOCUMENT_CHECKLIST.filter((t) => t.regions.some((r) => regions.includes(r))).map((t) => ({
    kind: t.kind,
    title: t.title,
    description: t.description,
    required: t.required,
    uploaded: byKind.get(t.kind) || null,
  }));
}

export function checklistProgress(items) {
  const required = items.filter((i) => i.required);
  const done = required.filter((i) => i.uploaded).length;
  return {
    required: required.length,
    uploadedRequired: done,
    uploadedTotal: items.filter((i) => i.uploaded).length,
    percent: required.length ? Math.round((done / required.length) * 100) : 0,
  };
}
