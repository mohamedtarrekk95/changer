'use client';
import { useExchange } from '@/context/ExchangeContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ErrorMessage() {
  const { error, clearError } = useExchange();

  if (!error) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-error-500/10 border border-error-500/20 flex items-start gap-3 animate-scale-in">
      <AlertTriangle className="w-5 h-5 text-error-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-error-500">{error}</p>
      </div>
      <button
        onClick={clearError}
        className="text-gray-400 hover:text-white transition-colors p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
