'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const translations = {
  en: {
    siteTitle: 'Changer',
    swap: 'Swap',
    dashboard: 'Dashboard',
    status: 'Status',
    from: 'From',
    to: 'To',
    amount: 'Amount',
    estimatedOutput: 'Estimated Output',
    exchangeRate: 'Exchange Rate',
    minAmount: 'Min Amount',
    maxAmount: 'Max Amount',
    depositAddress: 'Deposit Address',
    refundAddress: 'Refund Address (Optional)',
    swapNow: 'Swap Now',
    processing: 'Processing...',
    selectCurrency: 'Select Currency',
    searchCurrency: 'Search currency...',
    transactionId: 'Transaction ID',
    statusLabel: 'Status',
    youWillReceive: 'You Will Receive',
    depositAmount: 'Deposit Amount',
    errorOccurred: 'An Error Occurred',
    tryAgain: 'Try Again',
    backToSwap: 'Back to Swap',
    transactionDetails: 'Transaction Details',
    refreshStatus: 'Refresh Status',
    completed: 'Completed',
    waiting: 'Waiting for Deposit',
    verifying: 'Verifying',
    confirming: 'Confirming',
    sending: 'Sending',
    failed: 'Failed',
    refunded: 'Refunded',
    exchange: 'Exchange',
    apiError: 'API Error',
    invalidAmount: 'Please enter a valid amount',
    currencyRequired: 'Currency is required',
    addressRequired: 'Address is required',
    transactionCreated: 'Transaction Created!',
    sendFunds: 'Send the exact amount to the address below',
    trackTransaction: 'Track Transaction',
  },
  ar: {
    siteTitle: 'شانجر',
    swap: 'تبادل',
    dashboard: 'لوحة التحكم',
    status: 'الحالة',
    from: 'من',
    to: 'إلى',
    amount: 'المبلغ',
    estimatedOutput: 'المخرجات المقدرة',
    exchangeRate: 'سعر الصرف',
    minAmount: 'الحد الأدنى',
    maxAmount: 'الحد الأقصى',
    depositAddress: 'عنوان الإيداع',
    refundAddress: 'عنوان الاسترداد (اختياري)',
    swapNow: 'تبادل الآن',
    processing: 'جاري المعالجة...',
    selectCurrency: 'اختر العملة',
    searchCurrency: 'البحث عن عملة...',
    transactionId: 'رقم المعاملة',
    statusLabel: 'الحالة',
    youWillReceive: 'ستحصل على',
    depositAmount: 'مبلغ الإيداع',
    errorOccurred: 'حدث خطأ',
    tryAgain: 'حاول مرة أخرى',
    backToSwap: 'العودة للتبادل',
    transactionDetails: 'تفاصيل المعاملة',
    refreshStatus: 'تحديث الحالة',
    completed: 'مكتمل',
    waiting: 'في انتظار الإيداع',
    verifying: 'جاري التحقق',
    confirming: 'جاري التأكيد',
    sending: 'جاري الإرسال',
    failed: 'فشل',
    refunded: 'تم الاسترداد',
    exchange: 'تبادل',
    apiError: 'خطأ في API',
    invalidAmount: 'الرجاء إدخال مبلغ صالح',
    currencyRequired: 'العملة مطلوبة',
    addressRequired: 'العنوان مطلوب',
    transactionCreated: 'تم إنشاء المعاملة!',
    sendFunds: 'أرسل المبلغ المضبوط إلى العنوان أدناه',
    trackTransaction: 'تتبع المعاملة',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [t, setT] = useState(translations.en);

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) {
      setLanguage(saved);
      setT(translations[saved]);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setT(translations[newLang]);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
