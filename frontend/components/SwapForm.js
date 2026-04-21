'use client';
import { useState } from 'react';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { useExchange } from '@/context/ExchangeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SwapForm() {
  const { t } = useLanguage();
  const { currencies, rate, loading, fetchRate } = useExchange();
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  const handleAmountChange = async (value, isFrom) => {
    if (isFrom) {
      setFromAmount(value);
      if (value && fromCurrency && toCurrency) {
        const newRate = await fetchRate(fromCurrency, toCurrency, value);
        if (newRate?.toAmount) {
          setToAmount(newRate.toAmount);
        }
      }
    } else {
      setToAmount(value);
    }
  };

  const handleCurrencySwitch = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;

    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);

    if (tempAmount && toCurrency && fromCurrency) {
      const newRate = await fetchRate(toCurrency, fromCurrency, tempAmount);
      if (newRate?.toAmount) {
        setFromAmount(newRate.fromAmount || tempAmount);
        setToAmount(newRate.toAmount);
      } else {
        setFromAmount('');
        setToAmount('');
      }
    }

    setTimeout(() => setIsSwitching(false), 300);
  };

  const handleCurrencySelect = (field, value) => {
    if (field === 'from') {
      setFromCurrency(value);
      if (value && toCurrency && fromAmount) {
        fetchRate(value, toCurrency, fromAmount).then(newRate => {
          if (newRate?.toAmount) setToAmount(newRate.toAmount);
        });
      }
    } else {
      setToCurrency(value);
      if (fromCurrency && value && fromAmount) {
        fetchRate(fromCurrency, value, fromAmount).then(newRate => {
          if (newRate?.toAmount) setToAmount(newRate.toAmount);
        });
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Main Swap Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t.swap}</h2>
          <div className="badge">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span>
            <span className="text-[10px]">Best Rate</span>
          </div>
        </div>

        {/* Exchange Interface */}
        <div className="space-y-0">
          {/* From Section */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{t.from}</span>
              {fromCurrency && (
                <span className="text-xs text-[var(--text-muted)]">
                  {t.amount}: <span className="text-[var(--text-secondary)]">{fromAmount || '0'}</span>
                </span>
              )}
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl p-5 transition-all duration-200 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value, true)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl lg:text-[32px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />

                <select
                  value={fromCurrency}
                  onChange={(e) => handleCurrencySelect('from', e.target.value)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer transition-all duration-200 hover:border-[var(--border-light)] outline-none min-w-[120px]"
                >
                  <option value="">{t.selectCurrency}</option>
                  {currencies.map(c => (
                    <option key={c.ticker} value={c.ticker}>{c.ticker}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="relative flex justify-center -my-2 z-10">
            <button
              onClick={handleCurrencySwitch}
              disabled={!fromCurrency && !toCurrency}
              className={`
                relative p-3 rounded-xl border-4 transition-all duration-300
                ${isSwitching
                  ? 'rotate-180 bg-[var(--bg-elevated)] border-[var(--primary)]'
                  : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--primary)]'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
              `}
            >
              <ArrowDownUp className={`w-5 h-5 ${isSwitching ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`} />
            </button>
          </div>

          {/* To Section */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{t.to}</span>
              {toCurrency && (
                <span className="text-xs text-[var(--text-muted)]">
                  {t.youWillReceive}
                </span>
              )}
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl p-5 transition-all duration-200 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => handleAmountChange(e.target.value, false)}
                  placeholder="0.00"
                  readOnly
                  className="flex-1 bg-transparent text-2xl lg:text-[32px] font-semibold text-[var(--primary-light)] outline-none placeholder:text-[var(--text-muted)]"
                />

                <select
                  value={toCurrency}
                  onChange={(e) => handleCurrencySelect('to', e.target.value)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer transition-all duration-200 hover:border-[var(--border-light)] outline-none min-w-[120px]"
                >
                  <option value="">{t.selectCurrency}</option>
                  {currencies.map(c => (
                    <option key={c.ticker} value={c.ticker}>{c.ticker}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Info */}
        {loading && (
          <div className="mt-6 flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
          </div>
        )}

        {rate && !loading && (
          <div className="mt-6 bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">{t.exchangeRate}</span>
              <span className="font-medium text-[var(--text-primary)]">
                1 {fromCurrency} = {rate.fromCurrency === fromCurrency ? rate.rate : (1/rate.rate).toFixed(6)} {toCurrency}
              </span>
            </div>

            {rate.minAmount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t.minAmount}</span>
                <span className="font-medium text-[var(--text-secondary)]">{parseFloat(rate.minAmount).toFixed(6)} {fromCurrency}</span>
              </div>
            )}

            {rate.maxAmount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t.maxAmount}</span>
                <span className="font-medium text-[var(--text-secondary)]">{parseFloat(rate.maxAmount).toFixed(6)} {fromCurrency}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
