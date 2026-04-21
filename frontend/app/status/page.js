'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import StatusCard from '@/components/StatusCard';
import { Loader2, ArrowLeft, Search, FileQuestion } from 'lucide-react';

function StatusContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { transaction, fetchTransaction, loading, error } = useExchange();
  const [notFound, setNotFound] = useState(false);

  const txId = searchParams.get('id');
  const ticker = searchParams.get('ticker');

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        if (txId) {
          await fetchTransaction(txId);
        } else if (ticker) {
          await fetchTransaction(ticker);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setNotFound(true);
      }
    };
    loadTransaction();
  }, [txId, ticker, fetchTransaction]);

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto text-center animate-scale-in">
        <div className="card p-10">
          <div className="w-16 h-16 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-3">{t.transactionDetails}</h2>
          <p className="text-gray-400 mb-8">No transaction found with this ID</p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToSwap}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>{t.backToSwap}</span>
      </Link>

      {/* Loading State */}
      {loading && !transaction && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <p className="text-gray-400 text-sm">Loading transaction...</p>
        </div>
      )}

      {/* Error State */}
      {error && !transaction && (
        <div className="text-center py-12 animate-scale-in">
          <div className="card p-8">
            <p className="text-red-400 mb-6">{error}</p>
            <Link
              href="/"
              className="btn-primary inline-flex items-center gap-2"
            >
              {t.backToSwap}
            </Link>
          </div>
        </div>
      )}

      {/* Transaction Card */}
      {transaction && !error && (
        <StatusCard transaction={transaction} />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center animate-pulse">
          <Search className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm mt-4">Loading...</p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">{t.status}</h1>
        <p className="text-gray-400">Track your transaction status</p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
