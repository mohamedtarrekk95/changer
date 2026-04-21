'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { Menu, X, TrendingUp, Shield, Star } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.swap, icon: TrendingUp },
    { href: '/status', label: t.status, icon: Star },
  ];

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e14]/90 backdrop-blur-xl border-b border-[#2a3544]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              {t.siteTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive(link.href)
                      ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#1c2530]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Security badge + Language + Mobile menu */}
          <div className="flex items-center gap-3">
            {/* Security Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#1c2530] border border-[#2a3544] rounded-full">
              <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-xs font-medium text-[#94a3b8]">Secure</span>
            </div>

            <LanguageToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-[#64748b] hover:text-white hover:bg-[#1c2530] transition-all"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2a3544]/50 bg-[#0a0e14]/95 backdrop-blur-xl">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all
                    ${isActive(link.href)
                      ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#1c2530]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}