require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

// Validate API key at startup
if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY is not set in environment variables');
  console.error('[FATAL] Please set CHANGE_NOW_API_KEY in your .env file or Railway environment variables');
  process.exit(1);
}

app.use(helmet());

// CORS configuration - must be before all routes
// Supports: localhost, production Vercel, and all Vercel preview deployments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    // Environment-configured origin (for specific deployments)
    const envOrigin = process.env.FRONTEND_URL;
    if (envOrigin && origin === envOrigin) {
      return callback(null, true);
    }

    // Local development
    if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      return callback(null, true);
    }

    // All Vercel deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app') && origin.includes('vercel')) {
      console.log(`[CORS] Allowing Vercel origin: ${origin}`);
      return callback(null, true);
    }

    // Production Vercel URL (without subdomain)
    if (origin === 'https://vercel.app' || origin === 'https://changenow.io') {
      return callback(null, true);
    }

    console.log(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root test route
app.get('/', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString(), version: '2.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ChangeNOW API v2 request helper with robust error handling
async function changeNowRequest(endpoint, method = 'GET', data = null) {
  console.log(`[ChangeNOW Request] ${method} ${API_URL}${endpoint}`);

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

    if (data) {
      config.data = data;
      console.log(`[ChangeNOW Request] Body:`, JSON.stringify(data, null, 2));
    }

    const response = await axios(config);

    console.log(`[ChangeNOW Response] Status: ${response.status}`);
    console.log(`[ChangeNOW Response] Data preview:`, JSON.stringify(response.data).substring(0, 300));

    return response.data;

  } catch (error) {
    // Extract error information safely
    const status = error.response?.status || null;
    const data = error.response?.data || null;
    const errorMessage = data?.message || data?.error || error.message || 'Unknown error';

    console.error(`[ChangeNOW Error]`);
    console.error(`  Status: ${status}`);
    console.error(`  Message: ${errorMessage}`);
    if (data) console.error(`  Data:`, JSON.stringify(data));

    // Return a structured error object
    throw {
      message: errorMessage,
      status: status || 500,
      isNetworkError: !status && !data
    };
  }
}

// GET /api/currencies - Get all available currencies
app.get('/api/currencies', async (req, res) => {
  console.log('[Route] GET /api/currencies');

  try {
    console.log('[Route] Calling ChangeNOW API...');
    const currencies = await changeNowRequest('/currencies');

    console.log(`[Route] Received ${Array.isArray(currencies) ? currencies.length : 0} currencies`);

    // Always return array, even if empty or error
    const activeCurrencies = Array.isArray(currencies)
      ? currencies.filter(c => c.ticker && c.name)
      : [];

    console.log(`[Route] Returning ${activeCurrencies.length} active currencies`);
    return res.json(activeCurrencies);

  } catch (error) {
    console.error(`[Route] Error in /api/currencies:`, error.message);
    return res.status(error.status || 500).json({
      error: 'Failed to fetch currencies',
      message: error.message
    });
  }
});

// GET /api/exchange-rate - Get exchange rate estimate
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

    return res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: estimate.toAmount || estimate.amount,
      rate: estimate.rate || (estimate.toAmount ? parseFloat(estimate.toAmount) / parseFloat(fromAmount) : null),
      transactionSpeed: estimate.transactionSpeed || estimate.speed,
      minAmount: estimate.minAmount,
      maxAmount: estimate.maxAmount,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: 'Failed to fetch exchange rate',
      message: error.message
    });
  }
});

// POST /api/create-transaction - Create new exchange transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, toAddress, refundAddress } = req.body;

    const payoutAddress = toAddress || address;

    if (!fromCurrency || !toCurrency || !fromAmount || !payoutAddress) {
      return res.status(400).json({
        error: 'fromCurrency, toCurrency, fromAmount, and address are required'
      });
    }

    const payload = {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address: payoutAddress,
      amount: parseFloat(fromAmount),
    };

    if (refundAddress) payload.refundAddress = refundAddress;

    const transaction = await changeNowRequest('/exchange', 'POST', payload);

    return res.json({
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
    return res.status(error.status || 500).json({
      error: 'Failed to create transaction',
      message: error.message
    });
  }
});

// GET /api/transaction/:id - Get transaction status
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await changeNowRequest(`/exchange/${id}`);

    return res.json({
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
    return res.status(error.status || 500).json({
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
});

// 404 handler - MUST be after all routes
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler - MUST be last
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`ChangeNOW API v2: ${API_URL}`);
  console.log(`API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'NOT SET'}`);
});

module.exports = app;