'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, Search, X } from 'lucide-react';

export default function CurrencySelector({ value, onChange, currencies, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

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
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-dark-100 border border-gray-700 rounded-lg flex justify-between items-center hover:border-primary-500 transition-colors"
      >
        {value ? (
          <span className="font-medium">{value}</span>
        ) : (
          <span className="text-gray-500">{t.selectCurrency}</span>
        )}
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-2 absolute z-50 w-72 max-h-80 overflow-hidden bg-dark-100 border border-gray-700 rounded-lg shadow-xl">
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchCurrency}
                className="w-full pl-10 pr-10 py-2 bg-dark-200 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredCurrencies.slice(0, 100).map((currency) => (
              <button
                key={currency.ticker}
                onClick={() => handleSelect(currency.ticker)}
                className="w-full p-3 flex items-center gap-3 hover:bg-dark-200 text-left transition-colors"
              >
                {currency.image && (
                  <img src={currency.image} alt="" className="w-6 h-6 rounded-full" />
                )}
                <div>
                  <span className="font-medium">{currency.ticker}</span>
                  <span className="text-gray-500 text-sm ml-2">{currency.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
