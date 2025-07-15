import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationBannerProps {
  type?: NotificationType;
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function NotificationBanner({
  type = 'info',
  message,
  onClose,
  className = '',
}: NotificationBannerProps) {
  const Icon = icons[type];
  return (
    <div
      className={`flex items-center border px-4 py-3 rounded-lg shadow-md mb-4 ${colors[type]} ${className}`}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
