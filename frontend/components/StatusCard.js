'use client';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';

const STATUS_STYLES = {
  'waiting': 'text-yellow-400 bg-yellow-400/20',
  'verifying': 'text-blue-400 bg-blue-400/20',
  'confirming': 'text-blue-400 bg-blue-400/20',
  'sending': 'text-purple-400 bg-purple-400/20',
  'completed': 'text-green-400 bg-green-400/20',
  'failed': 'text-red-400 bg-red-400/20',
  'refunded': 'text-gray-400 bg-gray-400/20',
};

export default function StatusCard({ transaction }) {
  const { t } = useLanguage();
  const { fetchTransaction, loading } = useExchange();

  if (!transaction) return null;

  const statusClass = STATUS_STYLES[transaction.status] || STATUS_STYLES['waiting'];
  const statusText = t[transaction.status] || transaction.status;

  const handleRefresh = () => {
    if (transaction.id) {
      fetchTransaction(transaction.id);
    }
  };

  const explorerUrl = transaction.id && `https://changenow.io/exchange/tx/${transaction.id}`;

  return (
    <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-semibold">{t.transactionDetails}</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
          <span className="text-gray-400">{t.transactionId}</span>
          <span className="font-mono text-sm">{transaction.id}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
          <span className="text-gray-400">{t.statusLabel}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}>
            {statusText}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
          <span className="text-gray-400">{t.depositAmount}</span>
          <span>{transaction.fromAmount} {transaction.fromCurrency}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
          <span className="text-gray-400">{t.youWillReceive}</span>
          <span className="text-green-400">{transaction.toAmount} {transaction.toCurrency}</span>
        </div>

        {transaction.payoutHash && (
          <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
            <span className="text-gray-400">Payout Hash</span>
            <span className="font-mono text-sm truncate">{transaction.payoutHash}</span>
          </div>
        )}

        {transaction.depositHash && (
          <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
            <span className="text-gray-400">Deposit Hash</span>
            <span className="font-mono text-sm truncate">{transaction.depositHash}</span>
          </div>
        )}

        {transaction.address && (
          <div className="p-3 bg-dark-200 rounded-lg">
            <span className="text-gray-400 block mb-2">{t.depositAddress}</span>
            <code className="text-sm break-all text-primary-400">{transaction.address}</code>
          </div>
        )}

        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
          >
            {t.trackTransaction}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
