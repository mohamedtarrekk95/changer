'use client';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, RefreshCw, ExternalLink, Clock, Hash, Wallet, ArrowUpRight, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  'waiting': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  'verifying': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'confirming': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'sending': 'text-accent-500 bg-accent-500/10 border-accent-500/20',
  'completed': 'text-success-500 bg-success-500/10 border-success-500/20',
  'failed': 'text-error-500 bg-error-500/10 border-error-500/20',
  'refunded': 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const STATUS_ICONS = {
  'waiting': Clock,
  'verifying': Hash,
  'confirming': Hash,
  'sending': ArrowUpRight,
  'completed': Wallet,
  'failed': AlertCircle,
  'refunded': RefreshCw,
};

export default function StatusCard({ transaction }) {
  const { t } = useLanguage();
  const { fetchTransaction, loading } = useExchange();

  if (!transaction) return null;

  const statusClass = STATUS_STYLES[transaction.status] || STATUS_STYLES['waiting'];
  const StatusIcon = STATUS_ICONS[transaction.status] || Clock;
  const statusText = t[transaction.status] || transaction.status;

  const handleRefresh = () => {
    if (transaction.id) {
      fetchTransaction(transaction.id);
    }
  };

  const explorerUrl = transaction.id && `https://changenow.io/exchange/tx/${transaction.id}`;

  const DetailRow = ({ label, value, mono = false, copyable = false }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-200/50 border border-white/5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs text-primary-400' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="card p-5 lg:p-6 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center">
            <StatusIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t.transactionDetails}</h3>
            <p className="text-xs text-gray-500">ID: {transaction.id?.slice(0, 8)}...</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-100 border border-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${statusClass} mb-6`}>
        <StatusIcon className="w-4 h-4" />
        <span>{statusText}</span>
      </div>

      {/* Transaction Details */}
      <div className="space-y-3">
        <DetailRow
          label={t.transactionId}
          value={transaction.id}
          mono
        />

        <DetailRow
          label={t.depositAmount}
          value={`${transaction.fromAmount} ${transaction.fromCurrency}`}
        />

        <DetailRow
          label={t.youWillReceive}
          value={`${transaction.toAmount} ${transaction.toCurrency}`}
        />

        {transaction.payoutHash && (
          <DetailRow
            label="Payout Hash"
            value={transaction.payoutHash}
            mono
          />
        )}

        {transaction.depositHash && (
          <DetailRow
            label="Deposit Hash"
            value={transaction.depositHash}
            mono
          />
        )}

        {transaction.address && (
          <div className="p-4 rounded-xl bg-surface-200/50 border border-white/5">
            <span className="text-sm text-gray-400 block mb-2">{t.depositAddress}</span>
            <code className="text-sm break-all text-primary-400 font-mono">{transaction.address}</code>
          </div>
        )}
      </div>

      {/* Track Transaction Button */}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          <span>{t.trackTransaction}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
