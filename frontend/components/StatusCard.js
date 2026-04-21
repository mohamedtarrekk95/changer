'use client';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, RefreshCw, ExternalLink, Clock, Hash, Wallet, ArrowUpRight, AlertCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const STATUS_STYLES = {
  'waiting': 'text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20',
  'verifying': 'text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20',
  'confirming': 'text-[#0ea5e9] bg-[#0ea5e9]/10 border border-[#0ea5e9]/20',
  'sending': 'text-[#8b5cf6] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20',
  'completed': 'text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20',
  'failed': 'text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20',
  'refunded': 'text-[#94a3b8] bg-[#94a3b8]/10 border border-[#94a3b8]/20',
};

const STATUS_ICONS = {
  'waiting': Clock,
  'verifying': Hash,
  'confirming': Hash,
  'sending': ArrowUpRight,
  'completed': CheckCircle,
  'failed': XCircle,
  'refunded': RotateCcw,
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

  const DetailRow = ({ label, value, mono = false }) => (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[#0f1419] border border-[#2a3544]">
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className={`text-sm font-semibold ${mono ? 'font-mono text-xs text-[#0ea5e9] break-all' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="bg-[#1c2530] border border-[#2a3544] rounded-3xl p-6 lg:p-8 shadow-card animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0f1419] border border-[#2a3544] flex items-center justify-center">
            <StatusIcon className="w-5 h-5 text-[#64748b]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.transactionDetails}</h3>
            <p className="text-xs text-[#64748b] font-mono">ID: {transaction.id?.slice(0, 12)}...</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-3 rounded-xl bg-[#0f1419] hover:bg-[#232f3e] border border-[#2a3544] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#64748b] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold ${statusClass} mb-6`}>
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
          <div className="p-4 rounded-xl bg-[#0f1419] border border-[#2a3544]">
            <span className="text-sm text-[#64748b] block mb-2">{t.depositAddress}</span>
            <code className="text-sm break-all text-[#0ea5e9] font-mono">{transaction.address}</code>
          </div>
        )}
      </div>

      {/* Track Transaction Button */}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-6 flex items-center justify-center gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-2xl px-6 py-4 transition-all duration-200 hover:shadow-glow"
        >
          <span>{t.trackTransaction}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}