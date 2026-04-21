'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, AlertCircle, ArrowRight, Wallet, Shield } from 'lucide-react';

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
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl flex items-start gap-3 animate-scale-in">
          <AlertCircle className="w-5 h-5 text-[#ef4444] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#ef4444]">{error || txError}</p>
          </div>
          <button
            type="button"
            onClick={() => { setTxError(null); clearError(); }}
            className="text-[#64748b] hover:text-white transition-colors text-lg"
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
            className="input-base uppercase font-semibold tracking-wide"
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
            className="input-base uppercase font-semibold tracking-wide"
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
          className="input-base font-bold text-xl"
          required
          step="any"
        />
      </div>

      {/* Deposit Address */}
      <div>
        <label className="label">{t.depositAddress.replace('(Your ', `(Your ${formData.toCurrency || 'target'}-`)}</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="0x..."
          className="input-base font-mono text-sm tracking-tight"
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
          className="input-base font-mono text-sm tracking-tight"
        />
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-[#0f1419] border border-[#2a3544] rounded-2xl">
        <Shield className="w-5 h-5 text-[#0ea5e9] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#64748b]">
          Your transaction is protected by ChangeNOW's secure processing system.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-2xl px-6 py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.processing}</span>
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            <span className="text-base">{t.swapNow}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}