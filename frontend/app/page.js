'use client';
import { useEffect } from 'react';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import SwapForm from '@/components/SwapForm';
import TransactionForm from '@/components/TransactionForm';
import ErrorMessage from '@/components/ErrorMessage';

export default function HomePage() {
  const { t } = useLanguage();
  const { fetchCurrencies } = useExchange();

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 lg:pt-12 pb-8">
        {/* Error Alert */}
        <div className="w-full max-w-xl mb-6 animate-fade-in">
          <ErrorMessage />
        </div>

        {/* Rate Calculator */}
        <div className="w-full max-w-xl animate-slide-up">
          <SwapForm />
        </div>

        {/* Transaction Form */}
        <div className="w-full max-w-xl mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">{t.swapNow}</h2>
            <TransactionForm />
          </div>
        </div>
      </div>
    </div>
  );
}
