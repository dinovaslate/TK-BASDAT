import { CheckCircle2, CircleAlert, X } from 'lucide-react';

export default function ToastViewport({ toasts, removeToast }) {
  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          data-testid={toast.type === 'success' ? 'toast-success' : undefined}
        >
          <div className="toast-icon">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
          </div>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
          <button type="button" className="icon-button" onClick={() => removeToast(toast.id)} aria-label="Dismiss toast">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
