import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2, Trash2, ExternalLink, ListPlus, AlertTriangle, Square, ThumbsUp, ThumbsDown, ShieldCheck } from 'lucide-react';
import type { ApplicantProfile, ChatMessage, TaskCategory } from '../types';
import { aiApi, tasksApi, feedbackApi, chatStream, ApiError, type ApplicantAnalysis, type EssayReview } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../context/ToastContext';
import { UNIVERSITY_DATABASE } from '../data/universities';
import { Markdown } from './ui/Markdown';
import { useProgressCaptions } from '../hooks/useProgressCaptions';

interface AIAssistantWidgetProps {
  profile: ApplicantProfile | null;
  isAuthenticated: boolean;
}

type Tab = 'chat' | 'analyze' | 'essay';

interface UiMessage extends ChatMessage {
  id?: string;
  streaming?: boolean;
  verified?: boolean;
  model?: string;
  feedback?: 'up' | 'down';
  question?: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ profile, isAuthenticated }) => {
  const { t, lang } = useI18n();
  const { notify } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Analysis tab
  const [freeText, setFreeText] = useState('');
  const [analysis, setAnalysis] = useState<ApplicantAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Essay tab
  const [essay, setEssay] = useState('');
  const [essayUni, setEssayUni] = useState('');
  const [essayResult, setEssayResult] = useState<EssayReview | null>(null);
  const [essayLoading, setEssayLoading] = useState(false);
  const [essayError, setEssayError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const analyzeCaption = useProgressCaptions(analyzing, [t('progress.reading'), t('progress.universities'), t('progress.chances'), t('progress.plan'), t('progress.finishing')]);

  const greeting: UiMessage = { role: 'assistant', content: t('ai.greeting') };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isOpen, tab]);

  // Load status + history once the widget is opened for the first time.
  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    (async () => {
      try {
        const st = await aiApi.status();
        setAiConfigured(st.primary !== 'none');
      } catch {
        setAiConfigured(false);
      }
      try {
        const h = await aiApi.history();
        setMessages(h.messages.length ? h.messages.map((m) => ({ ...m, id: (m as UiMessage).id })) : [greeting]);
      } catch {
        setMessages([greeting]);
      }
      setHistoryLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, historyLoaded]);

  // Reload history when the account changes (guest ↔ user).
  useEffect(() => {
    setHistoryLoaded(false);
    setMessages([]);
  }, [isAuthenticated]);

  const describeError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) return err.code === 'NETWORK' ? t('common.backendOffline') : err.message;
      return err instanceof Error ? err.message : t('common.error');
    },
    [t],
  );

  const sendMessage = async (userMessage: string) => {
    if (!userMessage || isTyping) return;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '', streaming: true, question: userMessage }]);
    setInput('');
    setSuggestions([]);
    setIsTyping(true);
    setStatus(t('ai.status.context'));
    const controller = new AbortController();
    abortRef.current = controller;
    const patchLast = (patch: Partial<UiMessage> | ((m: UiMessage) => UiMessage)) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        next[next.length - 1] = typeof patch === 'function' ? patch(last) : { ...last, ...patch };
        return next;
      });
    try {
      await chatStream(
        userMessage,
        profile,
        lang,
        (ev) => {
          switch (ev.type) {
            case 'status':
              setStatus(ev.text === 'context' ? t('ai.status.context') : ev.text === 'thinking' ? t('ai.status.thinking') : ev.text === 'verifying' ? t('ai.status.verifying') : t('ai.status.fallback'));
              break;
            case 'token':
              setStatus(null);
              patchLast((m) => ({ ...m, content: m.content + ev.text }));
              break;
            case 'revision':
              patchLast({ content: ev.text, verified: true });
              break;
            case 'sources':
              patchLast({ sources: ev.items.map((x) => x.url) });
              break;
            case 'done':
              patchLast({ streaming: false, id: ev.messageId || undefined, model: ev.model, sources: ev.sources.map((x) => x.url) });
              setStatus(null);
              break;
            case 'suggestions':
              setSuggestions(ev.items);
              break;
            case 'error':
              patchLast((m) => ({ ...m, streaming: false, content: m.content || `⚠️ ${ev.message}` }));
              break;
          }
        },
        controller.signal,
      );
    } catch (err) {
      patchLast((m) => ({ ...m, streaming: false, content: m.content || `⚠️ ${describeError(err)}` }));
    } finally {
      patchLast((m) => ({ ...m, streaming: false }));
      setIsTyping(false);
      setStatus(null);
      abortRef.current = null;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input.trim());
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const sendFeedback = async (idx: number, rating: 'up' | 'down') => {
    const m = messages[idx];
    if (!m || m.role !== 'assistant') return;
    setMessages((prev) => prev.map((x, i) => (i === idx ? { ...x, feedback: rating } : x)));
    try {
      await feedbackApi.send({ messageId: m.id || null, rating, question: m.question, answer: m.content });
      notify(t('ai.feedback.thanks'), 'success');
    } catch {
      /* feedback is best-effort */
    }
  };

  const handleClear = async () => {
    try {
      await aiApi.clearHistory();
    } catch {
      /* ignore */
    }
    setMessages([greeting]);
  };

  const runAnalysis = async () => {
    if (!profile) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      setAnalysis(await aiApi.analyze(profile, freeText, lang, 6));
    } catch (err) {
      setAnalysisError(describeError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const addStepsToTasks = async () => {
    if (!analysis?.nextSteps?.length) return;
    if (!isAuthenticated) {
      notify(t('common.loginRequired'), 'info');
      return;
    }
    try {
      const res = await tasksApi.bulkCreate(
        analysis.nextSteps.map((step) => ({
          title: step.title.slice(0, 200),
          category: (step.category || 'other') as TaskCategory,
          dueDate: /^\d{4}-\d{2}(-\d{2})?/.test(step.deadline) ? step.deadline.slice(0, 10) : null,
          source: 'ai-analysis',
        })),
      );
      notify(`${t('ai.analyze.addTasks')}: ${res.created.length}`, 'success');
    } catch (err) {
      notify(describeError(err), 'error');
    }
  };

  const runEssayReview = async () => {
    if (essay.trim().length < 80) return;
    setEssayLoading(true);
    setEssayError(null);
    try {
      setEssayResult(await aiApi.essayReview(essay, essayUni || undefined, lang, profile));
    } catch (err) {
      setEssayError(describeError(err));
    } finally {
      setEssayLoading(false);
    }
  };

  const tierClass = (tier: string) =>
    tier === 'Dream' ? 'bg-slate-100 text-slate-800 border-slate-300' : tier === 'Target' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-slate-800 transition-all duration-300 animate-fadeInUp ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}`}
        aria-label={t('ai.title')}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[min(100vw-1.5rem,460px)] h-[640px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 rounded-t-3xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('ai.title')}</div>
              <div className="text-[10px] text-blue-200">{aiConfigured === false ? t('ai.offline') : t('ai.subtitle')}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {tab === 'chat' && (
              <button onClick={handleClear} className="p-1.5 hover:bg-white/10 rounded-full transition" title={t('ai.clear')}>
                <Trash2 className="w-4 h-4 text-slate-300" />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-3 pt-2 flex gap-1 bg-slate-50/50 border-b border-slate-100">
          {(['chat', 'analyze', 'essay'] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-t-lg text-[11px] font-semibold transition ${tab === k ? 'bg-white text-slate-900 border border-b-0 border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t(`ai.tab.${k}`)}
            </button>
          ))}
        </div>

        {/* CHAT */}
        {tab === 'chat' && (
          <>
            <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200' : 'bg-slate-900'}`}>
                    {m.role === 'user' ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'}`}>
                    {m.role === 'user' ? m.content : m.content ? <Markdown text={m.content} compact /> : null}
                    {m.role === 'assistant' && m.streaming && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                        {status || t('ai.status.thinking')}
                      </span>
                    )}
                    {m.role === 'assistant' && !m.streaming && m.content && idx > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
                        {m.verified && (
                          <span className="inline-flex items-center gap-1 text-emerald-700" title={t('ai.verifiedHint')}>
                            <ShieldCheck className="w-3 h-3" /> {t('ai.verified')}
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-0.5">
                          <button type="button" onClick={() => sendFeedback(idx, 'up')} className={`p-1 rounded hover:bg-slate-100 ${m.feedback === 'up' ? 'text-emerald-600' : ''}`} title={t('ai.feedback.up')}>
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => sendFeedback(idx, 'down')} className={`p-1 rounded hover:bg-slate-100 ${m.feedback === 'down' ? 'text-rose-600' : ''}`} title={t('ai.feedback.down')}>
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-slate-400 font-medium">{t('ai.sources')}:</span>
                        {m.sources.slice(0, 5).map((s) => {
                          const uni = UNIVERSITY_DATABASE.find(
                            (u) =>
                              u.officialPortalUrl === s ||
                              u.links?.website === s ||
                              (u.links?.admissions && u.links.admissions === s) ||
                              s.toLowerCase().includes(u.id.toLowerCase()),
                          );
                          const label = uni ? uni.shortName || uni.name : s.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                          return (
                            <a
                              key={s}
                              href={s}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50/80 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200/60 font-medium transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            </div>

            <div className="p-3 bg-white border-t border-slate-100 rounded-b-3xl space-y-2">
              {suggestions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button key={sug} type="button" onClick={() => void sendMessage(sug)} className="px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition text-left">
                      {sug}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('ai.placeholder')}
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                />
                {isTyping ? (
                  <button type="button" onClick={handleStop} className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300 transition" title={t('ai.stop')}>
                    <Square className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button type="submit" disabled={!input.trim()} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </>
        )}

        {/* ANALYZE */}
        {tab === 'analyze' && (
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs rounded-b-3xl">
            {!analysis && (
              <>
                <p className="text-slate-600 leading-relaxed">{t('ai.analyze.intro')}</p>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={t('ai.analyze.freeText')}
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <button
                  onClick={runAnalysis}
                  disabled={analyzing || !profile}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> {analyzeCaption || t('ai.analyze.running')}</> : <><Sparkles className="w-4 h-4" /> {t('ai.analyze.run')}</>}
                </button>
                {analysisError && <p className="text-rose-600">{analysisError}</p>}
              </>
            )}

            {analysis && (
              <>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">{t('ai.analyze.summary')}</div>
                  <Markdown text={analysis.summary} compact />
                  <div className="text-[10px] text-slate-400 mt-1">model: {analysis.model}</div>
                </div>

                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{t('ai.analyze.ranked')}</div>
                {analysis.ranked.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${tierClass(r.tier)}`}>{r.tier}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-slate-600">
                      <span>{t('ai.analyze.fit')}: <strong className="text-slate-900">{r.fitScore}%</strong></span>
                      <span>{t('ai.analyze.chance')}: <strong className="text-slate-900">{r.chance}%</strong></span>
                    </div>
                    {r.reasons?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-700">{t('ai.analyze.reasons')}</div>
                        <ul className="list-disc pl-4 text-slate-700 space-y-0.5">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                    )}
                    {r.risks?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-rose-700">{t('ai.analyze.risks')}</div>
                        <ul className="list-disc pl-4 text-slate-700 space-y-0.5">{r.risks.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                    )}
                    {r.healthAndLifestyle && (
                      <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                        <span className="font-semibold">{t('ai.analyze.health')}:</span> {r.healthAndLifestyle}
                      </div>
                    )}
                    {r.links?.website && (
                      <a href={r.links.admissions || r.links.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline">
                        <ExternalLink className="w-3 h-3" /> {t('common.officialPortal')}
                      </a>
                    )}
                  </div>
                ))}

                {analysis.redFlags?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('ai.analyze.redFlags')}</div>
                    <ul className="list-disc pl-4 text-amber-900 space-y-0.5">{analysis.redFlags.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                )}

                {analysis.nextSteps?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{t('ai.analyze.nextSteps')}</div>
                      <button onClick={addStepsToTasks} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:underline">
                        <ListPlus className="w-3 h-3" /> {t('ai.analyze.addTasks')}
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {analysis.nextSteps.map((s, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-slate-700">
                          <span>{s.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{s.deadline}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.testStrategy && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">{t('ai.analyze.testStrategy')}</div>
                    <Markdown text={analysis.testStrategy} compact />
                  </div>
                )}

                <button onClick={() => setAnalysis(null)} className="w-full py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50">
                  {t('common.retry')}
                </button>
              </>
            )}
          </div>
        )}

        {/* ESSAY */}
        {tab === 'essay' && (
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs rounded-b-3xl">
            <p className="text-slate-600 leading-relaxed">{t('ai.essay.intro')}</p>
            <select value={essayUni} onChange={(e) => setEssayUni(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none">
              <option value="">{t('ai.essay.university')}</option>
              {UNIVERSITY_DATABASE.map((u) => (
                <option key={u.id} value={u.id}>{u.shortName} — {u.country}</option>
              ))}
            </select>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={t('ai.essay.placeholder')}
              rows={7}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
            />
            <button
              onClick={runEssayReview}
              disabled={essayLoading || essay.trim().length < 80}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {essayLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('ai.analyze.running')}</> : t('ai.essay.run')}
            </button>
            {essayError && <p className="text-rose-600">{essayError}</p>}
            {essayResult && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{t('ai.essay.score')}</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{essayResult.score ?? '—'}/10</span>
                </div>
                {essayResult.verdict && <p className="text-slate-700 px-1">{essayResult.verdict}</p>}
                {[
                  ['strengths', 'text-emerald-700', essayResult.strengths],
                  ['weaknesses', 'text-rose-700', essayResult.weaknesses],
                  ['suggestions', 'text-blue-700', essayResult.suggestions],
                  ['missedStories', 'text-violet-700', essayResult.missedStories || []],
                  ['redFlags', 'text-amber-700', essayResult.redFlags || []],
                ].map(([key, cls, items]) =>
                  (items as string[])?.length ? (
                    <div key={key as string} className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${cls}`}>{t(`ai.essay.${key}`)}</div>
                      <ul className="list-disc pl-4 text-slate-700 space-y-0.5">{(items as string[]).map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  ) : null,
                )}
                {essayResult.rewriteOpening && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-slate-600">{t('ai.essay.rewriteOpening')}</div>
                    <p className="text-slate-700 leading-relaxed italic">{essayResult.rewriteOpening}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
