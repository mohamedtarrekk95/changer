import { LanguageProvider } from '@/context/LanguageContext';
import { ExchangeProvider } from '@/context/ExchangeContext';
import Header from '@/components/Header';
import './globals.css';

export const metadata = {
  title: 'Changer - Crypto Exchange',
  description: 'Fast and secure cryptocurrency exchange',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ExchangeProvider>
            <div className="min-h-screen bg-[#0a0e14]">
              <Header />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {children}
              </main>
              <footer className="border-t border-[#2a3544]/50 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-[#64748b] text-sm">
                      © 2026 Changer. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-[#64748b]">
                      <a href="#" className="hover:text-white transition-colors">Privacy</a>
                      <a href="#" className="hover:text-white transition-colors">Terms</a>
                      <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ExchangeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}