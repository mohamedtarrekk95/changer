require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

// ===========================================
// RAILWAY PORT - Only from environment
// ===========================================
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

console.log('===========================================');
console.log('[CONFIG] ChangeNOW Backend Starting');
console.log('[CONFIG] Time:', new Date().toISOString());
console.log('[CONFIG] PORT from Railway:', PORT || 'NOT SET');
console.log('===========================================');

// ===========================================
// API CONFIG
// ===========================================
const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
const API_URL = 'https://api.changenow.io/v1'; // v1 is documented, not v2

console.log('[CONFIG] API_KEY:', API_KEY ? 'SET' : 'NOT SET');
console.log('[CONFIG] API_URL:', API_URL);

// ===========================================
// GLOBAL ERROR HANDLERS
// ===========================================
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED]', String(reason));
});

// ===========================================
// CORS - Set on EVERY response
// ===========================================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================================
// ChangeNOW API WRAPPER - Never throws
// ===========================================
function cnRequest(method, path, body) {
  return new Promise((resolve) => {
    if (!API_KEY) {
      resolve({ ok: false, error: 'API key not set' });
      return;
    }

    const timer = setTimeout(() => {
      console.error('[ChangeNOW] Timeout:', path);
      resolve({ ok: false, error: 'timeout' });
    }, 15000);

    axios({
      method: method || 'GET',
      url: API_URL + path,
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      data: body,
      timeout: 15000,
    })
    .then(r => {
      clearTimeout(timer);
      resolve({ ok: true, data: r.data });
    })
    .catch(err => {
      clearTimeout(timer);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      console.error(`[ChangeNOW Error] ${status}: ${msg}`);
      resolve({ ok: false, error: msg, status });
    });
  });
}

// ===========================================
// ROUTES
// ===========================================

// Health - always 200
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT, time: new Date().toISOString() });
});

// Root - always 200
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Changer API', v: '1.0' });
});

// Currencies - always returns JSON array
app.get('/api/currencies', async (req, res) => {
  console.log('[Route] GET /api/currencies');
  try {
    const result = await cnRequest('GET', '/currencies');
    if (!result.ok && !result.data) {
      console.log('[Route] ChangeNOW failed, returning []');
      return res.status(200).json([]);
    }
    const arr = Array.isArray(result.data) ? result.data : [];
    console.log(`[Route] Returning ${arr.length} currencies`);
    return res.status(200).json(arr);
  } catch (e) {
    console.error('[Route] Error:', e.message);
    return res.status(200).json([]);
  }
});

// Exchange Rate
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be positive' });
    }
    const result = await cnRequest('GET', `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`);
    if (!result.ok && !result.data) {
      return res.status(500).json({ error: 'rate fetch failed', message: result.error });
    }
    return res.status(200).json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: result.data?.toAmount || result.data?.amount,
      rate: result.data?.rate,
      transactionSpeed: result.data?.transactionSpeed,
    });
  } catch (e) {
    return res.status(500).json({ error: 'rate error' });
  }
});

// Create Transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, refundAddress } = req.body;
    if (!fromCurrency || !toCurrency || !fromAmount || !address) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const payload = {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address,
      amount: parseFloat(fromAmount),
    };
    if (refundAddress) payload.refundAddress = refundAddress;

    const result = await cnRequest('POST', '/exchange', payload);
    if (!result.ok && !result.data) {
      return res.status(500).json({ error: 'transaction failed', message: result.error });
    }
    return res.status(200).json({
      id: result.data?.id || 'unknown',
      fromCurrency: (result.data?.fromCurrency || fromCurrency).toUpperCase(),
      toCurrency: (result.data?.toCurrency || toCurrency).toUpperCase(),
      fromAmount: result.data?.fromAmount || parseFloat(fromAmount),
      toAmount: result.data?.toAmount,
      payinAddress: result.data?.payinAddress,
      status: result.data?.status || 'unknown',
    });
  } catch (e) {
    return res.status(500).json({ error: 'transaction error' });
  }
});

// Transaction Status
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const result = await cnRequest('GET', `/transaction/${req.params.id}`);
    if (!result.ok && !result.data) {
      return res.status(500).json({ error: 'transaction fetch failed', message: result.error });
    }
    return res.status(200).json({
      id: result.data?.id || req.params.id,
      status: result.data?.status || 'unknown',
      fromCurrency: result.data?.fromCurrency?.toUpperCase(),
      toCurrency: result.data?.toCurrency?.toUpperCase(),
      fromAmount: result.data?.fromAmount,
      toAmount: result.data?.toAmount,
    });
  } catch (e) {
    return res.status(500).json({ error: 'transaction error' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'internal error' });
});

// ===========================================
// START SERVER
// ===========================================
const ACTUAL_PORT = PORT ? parseInt(PORT, 10) : undefined;

app.listen(ACTUAL_PORT, HOST, (err) => {
  if (err) {
    console.error('[FATAL]', err.message);
    process.exit(1);
  }
  console.log('===========================================');
  console.log('[READY] http://' + HOST + ':' + (PORT || '?'));
  console.log('[READY] /health endpoint available');
  console.log('===========================================');
});

module.exports = app;