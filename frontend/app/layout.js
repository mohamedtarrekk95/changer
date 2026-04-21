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
            <div className="min-h-screen bg-dark-300">
              <Header />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="border-t border-gray-800 py-6 mt-8">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                  © 2026 Changer. All rights reserved.
                </div>
              </footer>
            </div>
          </ExchangeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
