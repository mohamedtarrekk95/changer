require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  console.error('[FATAL] process.env.PORT not set');
  process.exit(1);
}

const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY not set');
  process.exit(1);
}

// ALLOWED ORIGINS - all Vercel domains + localhost
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://changer-cbha.vercel.app',
];

// Check if origin is allowed (including all *.vercel.app)
function isOriginAllowed(origin) {
  if (!origin) return true; // Allow no-origin (curl, etc.)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  return false;
}

// CORS MIDDLEWARE - Set headers on EVERY response
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight from:', origin);
    return res.status(204).end();
  }

  // Reject non-allowed origins in production with credentials
  if (origin && !isOriginAllowed(origin)) {
    console.log('[CORS] Blocked origin:', origin);
    // Continue but don't set the origin header (browser will block)
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes

app.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// ChangeNOW API call
async function cn(method, path, body) {
  const axios = require('axios');
  const config = {
    method,
    url: API_URL + path,
    headers: { 'x-changenow-api-key': API_KEY, 'Content-Type': 'application/json' },
    timeout: 20000,
  };
  if (body) config.data = body;
  const r = await axios(config);
  return r.data;
}

app.get('/api/currencies', async (req, res) => {
  try {
    const data = await cn('GET', '/currencies');
    res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    res.status(500).json({ error: 'currencies error' });
  }
});

app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;
    if (!fromCurrency || !toCurrency || !fromAmount) {
      return res.status(400).json({ error: 'missing params' });
    }
    const est = await cn('GET', `/exchange/estimate?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`);
    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: est.toAmount,
      rate: est.rate,
      transactionSpeed: est.transactionSpeed,
    });
  } catch { res.status(500).json({ error: 'rate error' }); }
});

app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, refundAddress } = req.body;
    if (!fromCurrency || !toCurrency || !fromAmount || !address) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const tx = await cn('POST', '/exchange', {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address,
      amount: parseFloat(fromAmount),
      ...(refundAddress && { refundAddress }),
    });
    res.json({
      id: tx.id,
      fromCurrency: tx.fromCurrency,
      toCurrency: tx.toCurrency,
      fromAmount: tx.fromAmount || parseFloat(fromAmount),
      toAmount: tx.toAmount,
      payinAddress: tx.payinAddress,
      status: tx.status,
    });
  } catch { res.status(500).json({ error: 'transaction error' }); }
});

app.get('/api/transaction/:id', async (req, res) => {
  try {
    const tx = await cn('GET', `/exchange/${req.params.id}`);
    res.json({
      id: tx.id,
      status: tx.status,
      fromCurrency: tx.fromCurrency,
      toCurrency: tx.toCurrency,
      fromAmount: tx.fromAmount,
      toAmount: tx.toAmount,
    });
  } catch { res.status(500).json({ error: 'transaction error' }); }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'server error' });
});

// START - Railway requires 0.0.0.0 binding
app.listen(PORT, '0.0.0.0', () => {
  console.log('[READY] http://0.0.0.0:' + PORT);
});

module.exports = app;