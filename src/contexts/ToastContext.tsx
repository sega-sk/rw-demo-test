import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastProps } from '../components/UI/Toast';

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (options: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toastHook = useToast();

  return (
    <ToastContext.Provider value={toastHook}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}