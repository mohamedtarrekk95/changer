require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();

// RAILWAY ASSIGNMENT: process.env.PORT is set by Railway automatically
// Do NOT hardcode a port - Railway assigns the public port at runtime
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('[START] Railway Backend Starting');
console.log('[CONFIG] PORT from Railway:', process.env.PORT || 'NOT SET (using default)');
console.log('[CONFIG] Using HOST:', HOST);

const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY missing');
  process.exit(1);
}

// Trust Railway's proxy
app.set('trust proxy', 1);

// Minimal security - API compatibility
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS - Allow Vercel and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://changer-cbha.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Routes - all publicly accessible

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Changer API',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ChangeNOW API helper
async function cnApi(endpoint, method = 'POST', data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'x-changenow-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    };
    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message;
    console.error(`[CN Error] ${status}: ${msg}`);
    throw { message: msg, status: status || 500 };
  }
}

app.get('/api/currencies', async (req, res) => {
  try {
    const data = await cnApi('/currencies');
    const filtered = Array.isArray(data) ? data.filter(c => c.ticker) : [];
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be positive' });
    }

    const est = await cnApi(
      `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`
    );

    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: est.toAmount || est.amount,
      rate: est.rate,
      transactionSpeed: est.transactionSpeed,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, refundAddress } = req.body;
    if (!fromCurrency || !toCurrency || !fromAmount || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payload = {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address,
      amount: parseFloat(fromAmount),
    };
    if (refundAddress) payload.refundAddress = refundAddress;

    const tx = await cnApi('/exchange', 'POST', payload);

    res.json({
      id: tx.id,
      fromCurrency: tx.fromCurrency?.toUpperCase() || fromCurrency.toUpperCase(),
      toCurrency: tx.toCurrency?.toUpperCase() || toCurrency.toUpperCase(),
      fromAmount: tx.fromAmount || parseFloat(fromAmount),
      toAmount: tx.toAmount || tx.expectedReceiveAmount,
      payinAddress: tx.payinAddress,
      status: tx.status,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.get('/api/transaction/:id', async (req, res) => {
  try {
    const tx = await cnApi(`/exchange/${req.params.id}`);
    res.json({
      id: tx.id,
      status: tx.status,
      fromCurrency: tx.fromCurrency?.toUpperCase(),
      toCurrency: tx.toCurrency?.toUpperCase(),
      fromAmount: tx.fromAmount,
      toAmount: tx.toAmount || tx.expectedReceiveAmount,
      payinAddress: tx.payinAddress,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

// START SERVER - Railway requires binding to 0.0.0.0
console.log('[START] Binding to', HOST + ':' + PORT);

app.listen(PORT, HOST, () => {
  console.log('===========================================');
  console.log('[READY] Server is live at http://' + HOST + ':' + PORT);
  console.log('[READY] Public URL: Check Railway dashboard');
  console.log('[READY] Test: /health endpoint');
  console.log('===========================================');
});

module.exports = app;