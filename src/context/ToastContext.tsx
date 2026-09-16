import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({
  notify: () => undefined,
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 w-[min(100%-2rem,360px)] pointer-events-none">
        {toasts.map((toast) => {
          const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md animate-fadeInUp
                ${toast.kind === 'success'
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100'
                  : toast.kind === 'error'
                    ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100'
                    : 'bg-white/95 border-slate-200 text-slate-800 dark:bg-zinc-900/95 dark:border-zinc-700 dark:text-zinc-100'}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext);
}
