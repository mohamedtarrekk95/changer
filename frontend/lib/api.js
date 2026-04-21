const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function getCurrencies() {
  const res = await fetch(`${API_BASE}/api/currencies`);
  if (!res.ok) throw new Error('Failed to fetch currencies');
  return res.json();
}

export async function getExchangeRate(fromCurrency, toCurrency, fromAmount) {
  const params = new URLSearchParams({
    fromCurrency,
    toCurrency,
    fromAmount: fromAmount.toString(),
  });
  const res = await fetch(`${API_BASE}/api/exchange-rate?${params}`);
  if (!res.ok) throw new Error('Failed to fetch exchange rate');
  return res.json();
}

export async function createTransaction(payload) {
  const res = await fetch(`${API_BASE}/api/create-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create transaction');
  }
  return res.json();
}

export async function getTransaction(id) {
  const res = await fetch(`${API_BASE}/api/transaction/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.json();
}

export async function getTransactionByTicker(ticker) {
  const res = await fetch(`${API_BASE}/api/transaction/ticker/${ticker}`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.json();
}
