require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3002;
const HOST = '0.0.0.0';
const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

console.log('[STARTUP] Changer Backend v2.0');
console.log('[STARTUP] PORT:', PORT);
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV || 'not set');

if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY is not set');
  process.exit(1);
}

// Trust proxy (Railway uses proxy)
app.set('trust proxy', 1);

// Helmet - relaxed for API
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS - Allow ALL Vercel deployments and localhost
// Root cause fix: Use proper cors() middleware with array of origins
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://changer-cbha.vercel.app',
    // Allow ALL *.vercel.app domains (preview deployments)
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Changer API',
    version: '2.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ChangeNOW API helper
async function changeNowRequest(endpoint, method = 'GET', data = null) {
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
    const errData = error.response?.data;
    const message = errData?.message || errData?.error || error.message;
    console.error(`[ChangeNOW ERROR] ${status}: ${message}`);
    throw { message, status: status || 500 };
  }
}

// GET /api/currencies
app.get('/api/currencies', async (req, res) => {
  try {
    const currencies = await changeNowRequest('/currencies');
    const filtered = Array.isArray(currencies) ? currencies.filter(c => c.ticker && c.name) : [];
    res.json(filtered);
  } catch (error) {
    res.status(error.status || 500).json({ error: 'Failed to fetch currencies', message: error.message });
  }
});

// GET /api/exchange-rate
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency are required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be a positive number' });
    }

    const estimate = await changeNowRequest(
      `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`
    );

    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: estimate.toAmount || estimate.amount,
      rate: estimate.rate || (estimate.toAmount ? parseFloat(estimate.toAmount) / parseFloat(fromAmount) : null),
      transactionSpeed: estimate.transactionSpeed,
      minAmount: estimate.minAmount,
      maxAmount: estimate.maxAmount,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: 'Failed to fetch exchange rate', message: error.message });
  }
});

// POST /api/create-transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, toAddress, refundAddress } = req.body;
    const payoutAddress = toAddress || address;

    if (!fromCurrency || !toCurrency || !fromAmount || !payoutAddress) {
      return res.status(400).json({ error: 'fromCurrency, toCurrency, fromAmount, and address are required' });
    }

    const payload = {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address: payoutAddress,
      amount: parseFloat(fromAmount),
    };
    if (refundAddress) payload.refundAddress = refundAddress;

    const transaction = await changeNowRequest('/exchange', 'POST', payload);

    res.json({
      id: transaction.id,
      fromCurrency: transaction.fromCurrency?.toUpperCase() || fromCurrency.toUpperCase(),
      toCurrency: transaction.toCurrency?.toUpperCase() || toCurrency.toUpperCase(),
      fromAmount: transaction.fromAmount || transaction.amount || parseFloat(fromAmount),
      toAmount: transaction.toAmount || transaction.expectedReceiveAmount,
      payinAddress: transaction.payinAddress || transaction.depositAddress,
      payoutAddress: transaction.payoutAddress || payoutAddress,
      status: transaction.status,
      createdAt: transaction.createdAt || transaction.timestamp,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: 'Failed to create transaction', message: error.message });
  }
});

// GET /api/transaction/:id
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const transaction = await changeNowRequest(`/exchange/${req.params.id}`);
    res.json({
      id: transaction.id,
      status: transaction.status,
      fromCurrency: transaction.fromCurrency?.toUpperCase(),
      toCurrency: transaction.toCurrency?.toUpperCase(),
      fromAmount: transaction.fromAmount || transaction.expectedSendAmount,
      toAmount: transaction.toAmount || transaction.expectedReceiveAmount,
      payinAddress: transaction.payinAddress || transaction.depositAddress,
      payoutAddress: transaction.payoutAddress,
      updatedAt: transaction.updatedAt,
      createdAt: transaction.createdAt,
      payinHash: transaction.payinHash,
      payoutHash: transaction.payoutHash,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: 'Failed to fetch transaction', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('[READY] Server running on http://' + HOST + ':' + PORT);
});

process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Closing server...');
  server.close(() => process.exit(0));
});

module.exports = app;