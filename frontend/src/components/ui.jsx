import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2, X } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type) => {
    const id = Math.random();
    setItems((i) => [...i, { id, message, type }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 3500);
  }, []);
  const toast = useMemo(() => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }), [push]);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="card flex items-center gap-2 px-4 py-3 text-sm shadow-lg">
            {t.type === 'success' ? <CheckCircle2 size={18} className="text-sea" /> : <AlertCircle size={18} className="text-coral" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1500] grid place-items-center bg-black/50 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`card max-h-[90vh] w-full overflow-y-auto p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:text-ink"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export const Spinner = ({ size = 28 }) => <Loader2 size={size} className="animate-spin text-sea" aria-label="Loading" />;
export const Skeleton = ({ className = 'h-24' }) => <div className={`animate-pulse rounded-2xl bg-line ${className}`} />;
export const CardSkeletons = ({ n = 6 }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: n }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>
);
export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sea/10 text-sea"><Icon size={26} /></div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export const ErrorState = ({ message, onRetry }) => (
  <div className="card flex items-center gap-3 border-coral/40 p-4 text-sm" role="alert">
    <AlertCircle className="shrink-0 text-coral" size={20} />
    <span className="flex-1">{message}</span>
    {onRetry && <button className="btn-ghost py-1.5" onClick={onRetry}>Try again</button>}
  </div>
);
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-3xl font-bold">{title}</h1>{subtitle && <p className="mt-1 text-muted">{subtitle}</p>}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
export const Badge = ({ children, tone = 'sea' }) => {
  const c = { sea: 'bg-sea/10 text-sea', sun: 'bg-sun/20 text-[#9a6200]', coral: 'bg-coral/10 text-coral', muted: 'bg-line text-muted' }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${c}`}>{children}</span>;
};
