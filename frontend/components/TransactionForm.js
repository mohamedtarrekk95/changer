'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function TransactionForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const { createExchange, loading, error, clearError } = useExchange();
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error alerts */}
      {(error || txError) && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-scale-in">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">{error || txError}</p>
          </div>
          <button
            type="button"
            onClick={() => { setTxError(null); clearError(); }}
            className="text-[var(--text-muted)] hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Currency Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t.from}</label>
          <input
            type="text"
            value={formData.fromCurrency}
            onChange={(e) => setFormData({ ...formData, fromCurrency: e.target.value.toUpperCase() })}
            placeholder="BTC"
            className="input-base uppercase font-medium"
            required
          />
        </div>

        <div>
          <label className="label">{t.to}</label>
          <input
            type="text"
            value={formData.toCurrency}
            onChange={(e) => setFormData({ ...formData, toCurrency: e.target.value.toUpperCase() })}
            placeholder="ETH"
            className="input-base uppercase font-medium"
            required
          />
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="label">{t.amount}</label>
        <input
          type="number"
          value={formData.fromAmount}
          onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
          placeholder="0.00"
          className="input-base font-semibold text-lg"
          required
          step="any"
        />
      </div>

      {/* Deposit Address */}
      <div>
        <label className="label">
          {t.depositAddress.replace('(Your ', `(Your ${formData.toCurrency || 'target'}-`)}
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="0x..."
          className="input-base font-mono text-sm"
          required
        />
      </div>

      {/* Refund Address */}
      <div>
        <label className="label">{t.refundAddress}</label>
        <input
          type="text"
          value={formData.refundAddress}
          onChange={(e) => setFormData({ ...formData, refundAddress: e.target.value })}
          placeholder="0x..."
          className="input-base font-mono text-sm"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.processing}</span>
          </>
        ) : (
          <>
            <span>{t.swapNow}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
