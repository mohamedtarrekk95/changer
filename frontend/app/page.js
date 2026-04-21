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
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{t.exchange}</h1>
        <p className="text-gray-400">Fast, secure, and easy crypto swaps</p>
      </div>

      <ErrorMessage />

      <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-semibold mb-4">{t.swap}</h2>
        <SwapForm />
      </div>

      <div className="bg-dark-200 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">{t.swapNow}</h2>
        <TransactionForm />
      </div>
    </div>
  );
}
