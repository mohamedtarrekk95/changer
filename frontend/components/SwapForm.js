'use client';
import { useState } from 'react';
import { ArrowDownUp, Loader2, ChevronDown, Search, X } from 'lucide-react';
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
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  const handleAmountChange = async (value, isFrom) => {
    if (isFrom) {
      setFromAmount(value);
      if (value && fromCurrency && toCurrency) {
        const newRate = await fetchRate(fromCurrency, toCurrency, value);
        if (newRate?.toAmount) {
          setToAmount(newRate.toAmount);
        }
      }
    }
  };

  const handleCurrencySwitch = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;

    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);

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

  const handleCurrencySelect = (field, ticker) => {
    if (field === 'from') {
      setFromCurrency(ticker);
      setShowFromDropdown(false);
      setFromSearch('');
      if (ticker && toCurrency && fromAmount) {
        fetchRate(ticker, toCurrency, fromAmount).then(newRate => {
          if (newRate?.toAmount) setToAmount(newRate.toAmount);
        });
      }
    } else {
      setToCurrency(ticker);
      setShowToDropdown(false);
      setToSearch('');
      if (fromCurrency && ticker && fromAmount) {
        fetchRate(fromCurrency, ticker, fromAmount).then(newRate => {
          if (newRate?.toAmount) setToAmount(newRate.toAmount);
        });
      }
    }
  };

  const filteredFromCurrencies = currencies.filter(
    c => c.ticker?.toLowerCase().includes(fromSearch.toLowerCase()) ||
         c.name?.toLowerCase().includes(fromSearch.toLowerCase())
  ).slice(0, 50);

  const filteredToCurrencies = currencies.filter(
    c => c.ticker?.toLowerCase().includes(toSearch.toLowerCase()) ||
         c.name?.toLowerCase().includes(toSearch.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Swap Card */}
      <div className="bg-[#1c2530] border border-[#2a3544] rounded-3xl p-6 lg:p-8 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">{t.swap}</h2>
          <div className="badge">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-slow"></span>
            <span className="text-xs font-medium">Best Rate</span>
          </div>
        </div>

        {/* Exchange Interface */}
        <div className="space-y-0">
          {/* From Section */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{t.from}</span>
              {fromCurrency && (
                <span className="text-xs text-[#64748b]">
                  {t.amount}: <span className="text-[#94a3b8]">{fromAmount || '0'}</span>
                </span>
              )}
            </div>

            <div className="bg-[#0f1419] border border-[#2a3544] rounded-2xl p-4 transition-all duration-200 focus-within:border-[#0ea5e9] focus-within:ring-4 focus-within:ring-[#0ea5e9]/10">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value, true)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl lg:text-[28px] font-bold text-white outline-none placeholder:text-[#64748b]"
                />

                {/* Currency Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                    className="flex items-center gap-2 bg-[#1c2530] border border-[#2a3544] rounded-xl px-4 py-3 text-sm font-semibold text-white hover:border-[#344050] transition-all"
                  >
                    {fromCurrency || t.selectCurrency}
                    <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${showFromDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showFromDropdown && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#151b23] border border-[#2a3544] rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                      <div className="p-3 border-b border-[#2a3544]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                          <input
                            type="text"
                            value={fromSearch}
                            onChange={(e) => setFromSearch(e.target.value)}
                            placeholder={t.searchCurrency}
                            className="w-full pl-10 pr-10 py-2.5 bg-[#0f1419] border border-[#2a3544] rounded-xl text-sm text-white placeholder:text-[#64748b] outline-none focus:border-[#0ea5e9]"
                            autoFocus
                          />
                          {fromSearch && (
                            <button
                              onClick={() => setFromSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-2">
                        {filteredFromCurrencies.map((currency) => (
                          <button
                            key={currency.ticker}
                            onClick={() => handleCurrencySelect('from', currency.ticker)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1c2530] transition-colors"
                          >
                            {currency.image && (
                              <img src={currency.image} alt="" className="w-8 h-8 rounded-full" />
                            )}
                            <div className="flex-1 text-left">
                              <span className="font-semibold text-white">{currency.ticker}</span>
                              <span className="text-[#64748b] text-sm ml-2">{currency.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="relative flex justify-center -my-3 z-10">
            <button
              onClick={handleCurrencySwitch}
              disabled={!fromCurrency && !toCurrency}
              className={`
                relative p-4 rounded-2xl border-2 transition-all duration-300
                ${isSwitching
                  ? 'rotate-180 bg-[#0ea5e9] border-[#0ea5e9]'
                  : 'bg-[#1c2530] border-[#2a3544] hover:border-[#0ea5e9] hover:bg-[#232f3e]'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
                group
              `}
            >
              <ArrowDownUp className={`w-5 h-5 ${isSwitching ? 'text-white' : 'text-[#64748b] group-hover:text-[#0ea5e9]'}`} />
            </button>
          </div>

          {/* To Section */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{t.to}</span>
              {toCurrency && (
                <span className="text-xs text-[#64748b]">{t.youWillReceive}</span>
              )}
            </div>

            <div className="bg-[#0f1419] border border-[#2a3544] rounded-2xl p-4 transition-all duration-200 focus-within:border-[#0ea5e9] focus-within:ring-4 focus-within:ring-[#0ea5e9]/10">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => handleAmountChange(e.target.value, false)}
                  placeholder="0.00"
                  readOnly
                  className="flex-1 bg-transparent text-2xl lg:text-[28px] font-bold text-[#38bdf8] outline-none placeholder:text-[#64748b]"
                />

                {/* Currency Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowToDropdown(!showToDropdown)}
                    className="flex items-center gap-2 bg-[#1c2530] border border-[#2a3544] rounded-xl px-4 py-3 text-sm font-semibold text-white hover:border-[#344050] transition-all"
                  >
                    {toCurrency || t.selectCurrency}
                    <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${showToDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showToDropdown && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#151b23] border border-[#2a3544] rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                      <div className="p-3 border-b border-[#2a3544]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                          <input
                            type="text"
                            value={toSearch}
                            onChange={(e) => setToSearch(e.target.value)}
                            placeholder={t.searchCurrency}
                            className="w-full pl-10 pr-10 py-2.5 bg-[#0f1419] border border-[#2a3544] rounded-xl text-sm text-white placeholder:text-[#64748b] outline-none focus:border-[#0ea5e9]"
                            autoFocus
                          />
                          {toSearch && (
                            <button
                              onClick={() => setToSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-2">
                        {filteredToCurrencies.map((currency) => (
                          <button
                            key={currency.ticker}
                            onClick={() => handleCurrencySelect('to', currency.ticker)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1c2530] transition-colors"
                          >
                            {currency.image && (
                              <img src={currency.image} alt="" className="w-8 h-8 rounded-full" />
                            )}
                            <div className="flex-1 text-left">
                              <span className="font-semibold text-white">{currency.ticker}</span>
                              <span className="text-[#64748b] text-sm ml-2">{currency.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Info */}
        {loading && (
          <div className="mt-6 flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#0ea5e9]" />
          </div>
        )}

        {rate && !loading && (
          <div className="mt-6 bg-[#0f1419] border border-[#2a3544] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748b]">{t.exchangeRate}</span>
              <span className="font-semibold text-white">
                1 {fromCurrency} = {rate.fromCurrency === fromCurrency ? rate.rate : (1/rate.rate).toFixed(6)} {toCurrency}
              </span>
            </div>

            {rate.minAmount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748b]">{t.minAmount}</span>
                <span className="font-medium text-[#94a3b8]">{parseFloat(rate.minAmount).toFixed(6)} {fromCurrency}</span>
              </div>
            )}

            {rate.maxAmount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748b]">{t.maxAmount}</span>
                <span className="font-medium text-[#94a3b8]">{parseFloat(rate.maxAmount).toFixed(6)} {fromCurrency}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}