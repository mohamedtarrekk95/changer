'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { getCurrencies, getExchangeRate, createTransaction, getTransaction } from '@/lib/api';

const ExchangeContext = createContext();

export function ExchangeProvider({ children }) {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rate, setRate] = useState(null);
  const [transaction, setTransaction] = useState(null);

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrencies();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRate = useCallback(async (fromCurrency, toCurrency, fromAmount) => {
    if (!fromCurrency || !toCurrency || !fromAmount || fromAmount <= 0) {
      setRate(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getExchangeRate(fromCurrency, toCurrency, fromAmount);
      setRate(data);
      return data;
    } catch (err) {
      setError(err.message);
      setRate(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExchange = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createTransaction(payload);
      setTransaction(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransaction = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransaction(id);
      setTransaction(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ExchangeContext.Provider value={{
      currencies,
      loading,
      error,
      rate,
      transaction,
      fetchCurrencies,
      fetchRate,
      createExchange,
      fetchTransaction,
      clearError,
    }}>
      {children}
    </ExchangeContext.Provider>
  );
}

export function useExchange() {
  const context = useContext(ExchangeContext);
  if (!context) throw new Error('useExchange must be used within ExchangeProvider');
  return context;
}
