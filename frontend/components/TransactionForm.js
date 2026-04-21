'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function TransactionForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const { createExchange, loading, error, clearError, fromCurrency, toCurrency } = useExchange();
  const [formData, setFormData] = useState({
    fromCurrency: '',
    toCurrency: '',
    fromAmount: '',
    address: '',
    refundAddress: '',
  });
  const [txError, setTxError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTxError(null);
    clearError();

    if (!formData.fromCurrency || !formData.toCurrency || !formData.fromAmount || !formData.address) {
      setTxError(t.currencyRequired);
      return;
    }

    try {
      const result = await createExchange(formData);
      router.push(`/status?id=${result.id}`);
    } catch (err) {
      setTxError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {txError && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">{txError}</span>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-2">From Currency</label>
        <input
          type="text"
          value={formData.fromCurrency}
          onChange={(e) => setFormData({ ...formData, fromCurrency: e.target.value.toUpperCase() })}
          placeholder="BTC"
          className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">To Currency</label>
        <input
          type="text"
          value={formData.toCurrency}
          onChange={(e) => setFormData({ ...formData, toCurrency: e.target.value.toUpperCase() })}
          placeholder="ETH"
          className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Amount</label>
        <input
          type="number"
          value={formData.fromAmount}
          onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
          placeholder="0.00"
          className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          required
          step="any"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Deposit Address (Your {formData.toCurrency || 'target'}-wallet address)</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="0x..."
          className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Refund Address (Optional)</label>
        <input
          type="text"
          value={formData.refundAddress}
          onChange={(e) => setFormData({ ...formData, refundAddress: e.target.value })}
          placeholder="0x..."
          className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.processing}
          </>
        ) : (
          t.swapNow
        )}
      </button>
    </form>
  );
}
