'use client';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'ar', label: 'العربية', flag: 'AR' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleSelect = (code) => {
    if (code !== language) {
      toggleLanguage();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-100 border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
        aria-label="Toggle language"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span>{currentLang.flag}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-dark-100 border border-white/10 shadow-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={
                lang.code === language
                  ? 'w-full px-4 py-2.5 text-left flex items-center justify-between bg-primary-500/10 text-primary-500'
                  : 'w-full px-4 py-2.5 text-left flex items-center justify-between text-gray-300 hover:bg-dark-200 transition-colors'
              }
            >
              <span className="text-sm font-medium">{lang.flag} {lang.label}</span>
              {lang.code === language && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
