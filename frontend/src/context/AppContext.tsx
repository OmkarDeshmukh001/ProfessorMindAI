import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

// ==================================================
// Types & Interfaces
// ==================================================

export interface NotebookSummary {
  notebook_id: string;
  name: string;
  description?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface AppContextType {
  // API Configuration
  apiUrl: string;
  
  // Notebook State (Scoped RAG)
  activeNotebook: NotebookSummary | null;
  setActiveNotebook: (notebook: NotebookSummary | null) => void;
  
  // Theme State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Toast Notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ==================================================
// Context Creation
// ==================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================================================
// Helper Functions
// ==================================================

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers or non-secure contexts
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null; // Ignore errors (e.g., private browsing mode)
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota exceeded or private mode errors
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
};

// ==================================================
// Provider Component
// ==================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // 1. API Configuration
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // 2. Notebook State
  const [activeNotebook, setActiveNotebookState] = useState<NotebookSummary | null>(() => {
    const saved = safeLocalStorage.getItem('professormind_active_notebook');
    if (saved) {
      try {
        return JSON.parse(saved) as NotebookSummary;
      } catch {
        return null;
      }
    }
    return null;
  });

  const setActiveNotebook = useCallback((notebook: NotebookSummary | null) => {
    setActiveNotebookState(notebook);
    if (notebook) {
      safeLocalStorage.setItem('professormind_active_notebook', JSON.stringify(notebook));
    } else {
      safeLocalStorage.removeItem('professormind_active_notebook');
    }
  }, []);

  // 3. Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = safeLocalStorage.getItem('professormind_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    safeLocalStorage.setItem('professormind_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // 4. Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup timers on provider unmount to prevent memory leaks
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    
    toastTimers.current.set(id, timer);
  }, [removeToast]);

  // ==================================================
  // Memoized Context Value
  // ==================================================
  
  const value = useMemo(
    () => ({
      apiUrl,
      activeNotebook,
      setActiveNotebook,
      theme,
      toggleTheme,
      toasts,
      addToast,
      removeToast,
    }),
    [apiUrl, activeNotebook, setActiveNotebook, theme, toggleTheme, toasts, addToast, removeToast]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ==================================================
// Custom Hook
// ==================================================

// This file intentionally exports the provider and its hook as one public context API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}