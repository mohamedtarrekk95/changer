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

  const handleCurrencySwitch = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    if (fromAmount && toCurrency && fromCurrency) {
      fetchRate(toCurrency, fromCurrency, fromAmount).then(newRate => {
        if (newRate?.toAmount) setToAmount(newRate.toAmount);
      });
    }
  };

  return (
    <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">{t.from}</label>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => handleAmountChange(e.target.value, true)}
            placeholder="0.00"
            className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg text-lg focus:outline-none focus:border-primary-500"
          />
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full mt-2 p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="">{t.selectCurrency}</option>
            {currencies.map(c => (
              <option key={c.ticker} value={c.ticker}>{c.ticker} - {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center items-center md:items-end pb-2">
          <button
            onClick={handleCurrencySwitch}
            className="p-3 bg-dark-200 border border-gray-700 rounded-lg hover:bg-primary-500/20 hover:border-primary-500 transition-colors"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">{t.to}</label>
          <input
            type="number"
            value={toAmount}
            onChange={(e) => handleAmountChange(e.target.value, false)}
            placeholder="0.00"
            className="w-full p-3 bg-dark-200 border border-gray-700 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            readOnly
          />
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full mt-2 p-3 bg-dark-200 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="">{t.selectCurrency}</option>
            {currencies.map(c => (
              <option key={c.ticker} value={c.ticker}>{c.ticker} - {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="mt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      )}

      {rate && !loading && (
        <div className="mt-4 p-4 bg-dark-200 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">{t.exchangeRate}</span>
            <span>1 {fromCurrency} = {rate.fromCurrency === fromCurrency ? rate.rate : 1/rate.rate} {toCurrency}</span>
          </div>
          {rate.minAmount && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{t.minAmount}</span>
              <span>{rate.minAmount} {fromCurrency}</span>
            </div>
          )}
          {rate.maxAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.maxAmount}</span>
              <span>{rate.maxAmount} {fromCurrency}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
