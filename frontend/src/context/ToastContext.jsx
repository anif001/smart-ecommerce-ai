import React, { createContext, useState, useCallback, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold min-w-[280px] max-w-sm animate-slide-up backdrop-blur-sm border ${
              toast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-red-600/95 text-white border-red-500'
                : toast.type === 'info'
                ? 'bg-blue-600/95 text-white border-blue-500'
                : 'bg-amber-600/95 text-white border-amber-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> :
             toast.type === 'error' ? <XCircle size={18} /> :
             toast.type === 'info' ? <Info size={18} /> :
             <AlertCircle size={18} />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
