import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Toast = () => {
  const { toasts, removeToast } = useAppContext();

  const icons = {
    success: <CheckCircle2 size={20} className="text-teal-600 shrink-0" />,
    error: <XCircle size={20} className="text-red-600 shrink-0" />,
    warning: <AlertCircle size={20} className="text-amber-600 shrink-0" />,
    info: <Info size={20} className="text-blue-600 shrink-0" />,
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 bg-white rounded-xl shadow-lg border border-slate-200 animate-slide-up min-w-[320px] max-w-[400px]"
          role="alert"
        >
          {icons[toast.type]}
          <p className="text-sm font-medium text-slate-800 flex-1 leading-snug pt-0.5">
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;