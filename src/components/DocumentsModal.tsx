import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, FolderOpen, Upload, Loader2, Trash2, Download, CheckCircle2, Circle, AlertCircle, FileText } from 'lucide-react';
import type { ApplicantProfile, DocumentChecklistItem, DocumentKind, UploadedDocument } from '../types';
import { documentsApi, ApiError } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../context/ToastContext';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  profile: ApplicantProfile;
}

const formatBytes = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose, isAuthenticated, onOpenAuth, profile }) => {
  const { t } = useI18n();
  const { notify } = useToast();
  const [items, setItems] = useState<DocumentChecklistItem[]>([]);
  const [progress, setProgress] = useState<{ required: number; uploadedRequired: number; percent: number } | null>(null);
  const [files, setFiles] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<DocumentKind | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const describeError = useCallback(
    (err: unknown) => (err instanceof ApiError ? (err.code === 'NETWORK' ? t('common.backendOffline') : err.message) : t('common.error')),
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cl = await documentsApi.checklist(profile.targetRegions);
      setItems(cl.items);
      setProgress(cl.progress);
      if (isAuthenticated) {
        const f = await documentsApi.list();
        setFiles(f.items);
      } else {
        setFiles([]);
      }
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [profile.targetRegions, isAuthenticated, describeError]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const handleFile = async (kind: DocumentKind, file: File | undefined) => {
    if (!file) return;
    if (!isAuthenticated) {
      notify(t('common.loginRequired'), 'info');
      return;
    }
    setUploadingKind(kind);
    try {
      await documentsApi.upload(file, kind);
      notify(`${t('docs.uploaded')}: ${file.name}`, 'success');
      await load();
    } catch (err) {
      notify(describeError(err), 'error');
    } finally {
      setUploadingKind(null);
    }
  };

  const remove = async (doc: UploadedDocument) => {
    try {
      await documentsApi.remove(doc.id);
      await load();
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('docs.title')}</h3>
              <p className="text-[11px] text-slate-500">{t('docs.subtitle')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!isAuthenticated && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {t('common.loginRequired')}</span>
              <button onClick={() => { onClose(); onOpenAuth(); }} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-[11px]">{t('header.login')}</button>
            </div>
          )}

          {progress && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{t('docs.progress')}</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{progress.uploadedRequired}/{progress.required} · {progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {loading && <div className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>}

          <div className="space-y-2">
            {items.map((item) => {
              const busy = uploadingKind === item.kind;
              return (
                <div key={item.kind} className={`p-3.5 rounded-xl border flex items-start gap-3 ${item.uploaded ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="mt-0.5 shrink-0">
                    {item.uploaded ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${item.required ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {item.required ? t('docs.required') : t('docs.optional')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                    {item.uploaded && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[220px]">{item.uploaded.originalName}</span>
                        <span className="text-slate-400">{formatBytes(item.uploaded.sizeBytes)} · {item.uploaded.uploadedAt.slice(0, 10)}</span>
                        <button type="button" onClick={() => documentsApi.download(item.uploaded!).catch((e) => notify(e.message, 'error'))} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                          <Download className="w-3 h-3" /> {t('docs.download')}
                        </button>
                        <button onClick={() => remove(item.uploaded!)} className="inline-flex items-center gap-1 text-rose-600 hover:underline">
                          <Trash2 className="w-3 h-3" /> {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <input
                      ref={(el) => { inputRefs.current[item.kind] = el; }}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                      onChange={(e) => { handleFile(item.kind, e.target.files?.[0]); e.target.value = ''; }}
                    />
                    <button
                      onClick={() => inputRefs.current[item.kind]?.click()}
                      disabled={busy}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${item.uploaded ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}`}
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {busy ? t('docs.uploading') : item.uploaded ? t('docs.replace') : t('docs.upload')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400">{t('docs.formats')}</p>

          {files.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-2">{t('docs.myFiles')} ({files.length})</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((f) => (
                  <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{f.originalName}</div>
                      <div className="text-slate-500">{f.kind} · {formatBytes(f.sizeBytes)}</div>
                    </div>
                    <button type="button" onClick={() => documentsApi.download(f).catch((e) => notify(e.message, 'error'))} className="p-1.5 text-slate-500 hover:text-slate-900" title={t('docs.download')}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
