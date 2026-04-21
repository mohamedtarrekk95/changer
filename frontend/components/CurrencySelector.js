'use client';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, Search, X } from 'lucide-react';

export default function CurrencySelector({ value, onChange, currencies, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCurrencies = currencies.filter(
    c => c.ticker?.toLowerCase().includes(search.toLowerCase()) ||
         c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (ticker) => {
    onChange(ticker);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="label">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
          ${isOpen
            ? 'border-primary/50 bg-surface-200 ring-2 ring-primary/20'
            : 'border-white/10 bg-surface-200 hover:border-white/20'
          }
        `}
      >
        {value ? (
          <span className="font-medium">{value}</span>
        ) : (
          <span className="text-gray-500">{t.selectCurrency}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-xl bg-surface-100 border border-white/10 shadow-xl overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchCurrency}
                className="w-full pl-10 pr-10 py-2.5 bg-surface-200 border border-white/10 rounded-lg text-sm outline-none placeholder:text-gray-500 focus:border-primary/50"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Currency list */}
          <div className="max-h-64 overflow-y-auto py-2">
            {filteredCurrencies.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No currencies found
              </div>
            ) : (
              filteredCurrencies.slice(0, 100).map((currency) => (
                <button
                  key={currency.ticker}
                  onClick={() => handleSelect(currency.ticker)}
                  className={`
                    w-full px-4 py-2.5 flex items-center gap-3 transition-colors
                    ${currency.ticker === value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-surface-200'
                    }
                  `}
                >
                  {currency.image && (
                    <img src={currency.image} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{currency.ticker}</span>
                    <span className="text-gray-500 text-sm ml-2">{currency.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
