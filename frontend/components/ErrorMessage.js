'use client';
import { useExchange } from '@/context/ExchangeContext';

export default function ErrorMessage() {
  const { error, clearError } = useExchange();

  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
      <div className="flex justify-between items-start">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={clearError}
          className="text-red-400 hover:text-red-300 ml-2"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
