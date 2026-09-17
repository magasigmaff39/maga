import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, ListChecks, Plus, Loader2, Trash2, CheckCircle2, Circle, Clock, Sparkles, CalendarDays, AlertCircle } from 'lucide-react';
import type { ApplicantProfile, TaskCategory, TaskStatus, UserTask } from '../types';
import { tasksApi, ApiError, type TaskStats } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../context/ToastContext';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  profile: ApplicantProfile;
}

const CATEGORIES: TaskCategory[] = ['sat', 'ielts', 'unt', 'documents', 'essay', 'application', 'olympiad', 'portfolio', 'other'];

export const TasksModal: React.FC<TasksModalProps> = ({ isOpen, onClose, isAuthenticated, onOpenAuth, profile }) => {
  const { t } = useI18n();
  const { notify } = useToast();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('ielts');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const describeError = useCallback(
    (err: unknown) => (err instanceof ApiError ? (err.code === 'NETWORK' ? t('common.backendOffline') : err.message) : t('common.error')),
    [t],
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list();
      setTasks(res.items);
      setStats(res.stats);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, describeError]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const visible = useMemo(
    () => tasks.filter((x) => (filter === 'all' ? true : filter === 'done' ? x.status === 'done' : x.status !== 'done')),
    [tasks, filter],
  );

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await tasksApi.create({ title: title.trim(), category, dueDate: dueDate || null });
      setTitle('');
      setDueDate('');
      await load();
    } catch (err) {
      notify(describeError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (task: UserTask) => {
    const next: TaskStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    try {
      const updated = await tasksApi.update(task.id, { status: next });
      setTasks((prev) => prev.map((x) => (x.id === task.id ? updated : x)));
      const res = await tasksApi.list();
      setStats(res.stats);
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const remove = async (task: UserTask) => {
    try {
      await tasksApi.remove(task.id);
      await load();
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await tasksApi.generate(profile);
      setTasks(res.items);
      setStats(res.stats);
      notify(`+${res.created.length}`, 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const timelinessBadge = (task: UserTask) => {
    const map: Record<UserTask['timeliness'], string> = {
      done_on_time: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      done_late: 'bg-amber-50 text-amber-800 border-amber-200',
      overdue: 'bg-rose-50 text-rose-800 border-rose-200',
      upcoming: 'bg-blue-50 text-blue-800 border-blue-200',
      no_deadline: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${map[task.timeliness]}`}>{t(`tasks.timeliness.${task.timeliness}`)}</span>;
  };

  const StatusIcon = ({ status }: { status: TaskStatus }) =>
    status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : status === 'in_progress' ? <Clock className="w-5 h-5 text-blue-600" /> : <Circle className="w-5 h-5 text-slate-300" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('tasks.title')}</h3>
              <p className="text-[11px] text-slate-500">{t('tasks.subtitle')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-10 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600">{t('common.loginRequired')}</p>
            <button onClick={() => { onClose(); onOpenAuth(); }} className="ar-btn ar-btn-primary px-6 py-2.5">
              {t('header.loginRegister')}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  ['total', stats.total, 'text-slate-900'],
                  ['done', stats.done, 'text-emerald-700'],
                  ['onTime', stats.doneOnTime, 'text-emerald-700'],
                  ['late', stats.doneLate, 'text-amber-700'],
                  ['overdue', stats.overdue, 'text-rose-700'],
                  ['onTimeRate', stats.onTimeRate === null ? '—' : `${stats.onTimeRate}%`, 'text-blue-700'],
                ].map(([key, value, cls]) => (
                  <div key={key as string} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className={`text-lg font-bold font-mono ${cls}`}>{value as React.ReactNode}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{t(`tasks.stats.${key}`)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* New task */}
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-[1fr_140px_150px_auto] gap-2 items-end">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('tasks.new')}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('tasks.titlePlaceholder')} className="ar-input w-full text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('tasks.category')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className="ar-input w-full text-xs">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`tasks.cat.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{t('tasks.dueDate')}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="ar-input w-full text-xs" />
              </div>
              <button type="submit" disabled={saving || !title.trim()} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t('common.add')}
              </button>
            </form>

            {/* Filters + generate */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {(['all', 'open', 'done'] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {t(`tasks.filter.${f}`)}
                  </button>
                ))}
              </div>
              <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t('tasks.generate')}
              </button>
            </div>

            {/* List */}
            {error && <p className="text-xs text-rose-600">{error}</p>}
            {loading && <div className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>}
            {!loading && visible.length === 0 && <p className="text-xs text-slate-500 text-center py-6">{t('tasks.empty')}</p>}
            <div className="space-y-2">
              {visible.map((task) => (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition ${task.status === 'done' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <button onClick={() => cycleStatus(task)} className="mt-0.5 shrink-0" title={t(`tasks.status.${task.status}`)}>
                    <StatusIcon status={task.status} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</div>
                    {task.description && <div className="text-[11px] text-slate-500 truncate">{task.description}</div>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">{t(`tasks.cat.${task.category}`)}</span>
                      {timelinessBadge(task)}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <CalendarDays className="w-3 h-3" /> {task.dueDate}
                        </span>
                      )}
                      {task.completedAt && <span className="text-[10px] text-slate-400">✓ {task.completedAt.slice(0, 10)}</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(task)} className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50" title={t('common.delete')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
