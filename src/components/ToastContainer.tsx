import { useToastStore } from '../lib/toast';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <span>{t.message}</span>
          <button type="button" className="toast__dismiss" onClick={() => dismiss(t.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
