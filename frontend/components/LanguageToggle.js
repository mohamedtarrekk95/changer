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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1c2530] border border-[#2a3544] hover:border-[#344050] transition-all text-sm font-medium text-[#94a3b8] hover:text-white"
        aria-label="Toggle language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#151b23] border border-[#2a3544] shadow-xl z-50 overflow-hidden animate-scale-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`
                w-full px-4 py-3 text-left flex items-center justify-between transition-colors
                ${lang.code === language
                  ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                  : 'text-[#94a3b8] hover:bg-[#1c2530] hover:text-white'
                }
              `}
            >
              <span className="text-sm font-medium">{lang.flag} {lang.label}</span>
              {lang.code === language && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}