import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'border-green-500/40 bg-green-500/10 text-green-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  info: 'border-white/15 bg-white/10 text-white',
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ type = 'info', message }) => {
    if (!message) return;
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  };

  useEffect(() => {
    const handleToast = (event) => showToast(event.detail || {});
    window.addEventListener('cineplex-toast', handleToast);
    return () => window.removeEventListener('cineplex-toast', handleToast);
  }, []);

  return (
    <>
      {children}
      <div className="fixed right-4 top-24 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
        {toasts.map((item) => {
          const Icon = iconMap[item.type] || Info;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-xl ${colorMap[item.type] || colorMap.info}`}
            >
              <Icon className="mt-0.5 h-5 w-5 flex-none" />
              <p className="flex-1 text-sm font-semibold leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}
                className="text-white/60 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ToastProvider;
