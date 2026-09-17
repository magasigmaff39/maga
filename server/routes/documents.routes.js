// /api/documents — admission document uploads (base64 JSON) and the tailored checklist.
// After a successful upload Gemini reads the scan and stores a short factual summary so the advisor
// "sees" what the applicant uploaded.
import { Router } from 'express';
import { asyncHandler, badRequest } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { config } from '../config.js';
import { listDocuments, saveDocument, getDocumentFile, deleteDocument, buildChecklist, checklistProgress, attachSummary, DOCUMENT_KINDS } from '../services/document.service.js';
import { summarizeDocument } from '../services/ai.service.js';

export const documentsRouter = Router();
const uploadLimiter = rateLimit('upload', config.rateLimit.upload);

// The checklist itself is public (works before login); upload status appears once authenticated.
documentsRouter.get(
  '/checklist',
  asyncHandler(async (req, res) => {
    const regions = String(req.query.regions || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const items = await buildChecklist(req.user?.id || null, regions);
    res.json({ items, progress: checklistProgress(items), kinds: DOCUMENT_KINDS, maxUploadMb: Math.round(config.files.maxUploadBytes / 1048576) });
  }),
);

documentsRouter.use(requireAuth);

documentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ items: await listDocuments(req.user.id) });
  }),
);

/** Body: { kind, note?, file: { fileName, mimeType, dataBase64 } } */
documentsRouter.post(
  '/',
  uploadLimiter,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const file = b.file && typeof b.file === 'object' ? b.file : null;
    if (!file) throw badRequest('Ожидается объект file { fileName, mimeType, dataBase64 }', 'NO_FILE');
    const { doc, buffer, mimeType } = await saveDocument(req.user.id, file, { kind: b.kind, note: b.note });

    // Let the AI read the document (bounded; failures never break the upload).
    let aiSummary = null;
    if (b.analyze !== false) {
      aiSummary = await Promise.race([summarizeDocument({ buffer, mimeType, kind: doc.kind, fileName: doc.originalName }), new Promise((r) => setTimeout(() => r(null), 45_000))]);
      if (aiSummary) await attachSummary(doc.id, aiSummary);
    }
    res.status(201).json({ ...doc, aiSummary: aiSummary || undefined });
  }),
);

documentsRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const { doc, buffer } = await getDocumentFile(req.user.id, req.params.id);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${req.query.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`);
    res.end(buffer);
  }),
);

documentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteDocument(req.user.id, req.params.id);
    res.json({ success: true });
  }),
);
