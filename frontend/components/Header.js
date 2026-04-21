'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { Menu, X, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.swap },
    { href: '/status', label: t.status },
  ];

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-dark-300/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              {t.siteTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? 'px-4 py-2 rounded-xl font-medium text-sm bg-white/10 text-white'
                    : 'px-4 py-2 rounded-xl font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200'
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Language + Mobile menu */}
          <div className="flex items-center gap-2">
            <LanguageToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
        <div className="md:hidden border-t border-white/5 bg-dark-300/95 backdrop-blur-xl">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  isActive(link.href)
                    ? 'block px-4 py-3 rounded-xl font-medium text-sm bg-white/10 text-white'
                    : 'block px-4 py-3 rounded-xl font-medium text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200'
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
