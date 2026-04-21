'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import StatusCard from '@/components/StatusCard';
import { Loader2, ArrowLeft } from 'lucide-react';

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
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">{t.transactionDetails}</h2>
          <p className="text-gray-400 mb-6">No transaction found</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
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
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSwap}
        </Link>
      </div>

      {loading && !transaction ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
          >
            {t.backToSwap}
          </Link>
        </div>
      ) : (
        <StatusCard transaction={transaction} />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StatusContent />
    </Suspense>
  );
}
