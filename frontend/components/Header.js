'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-dark-200/80 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary-500">
          {t.siteTitle}
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            {t.swap}
          </Link>
          <Link
            href="/status"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            {t.status}
          </Link>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
