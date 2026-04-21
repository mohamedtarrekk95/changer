require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

app.use(helmet());

// CORS configuration - must be before all routes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://changer-cbha.vercel.app',
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ChangeNOW API v2 request helper
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

    console.log(`[ChangeNOW v2 Request] ${method} ${config.url}`);
    if (data) console.log(`[ChangeNOW v2 Request] Body:`, JSON.stringify(data, null, 2));

    const response = await axios(config);
    console.log(`[ChangeNOW v2 Response] Status: ${response.status}`);
    console.log(`[ChangeNOW v2 Response] Data:`, JSON.stringify(response.data, null, 2).substring(0, 500));

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[ChangeNOW v2 Error] Status: ${status}`);
    console.error(`[ChangeNOW v2 Error] Data:`, JSON.stringify(data, null, 2));
    throw {
      message: data?.message || data?.error || error.message,
      status: status || 500
    };
  }
}

// GET /api/currencies - Get all available currencies
app.get('/api/currencies', async (req, res) => {
  try {
    const currencies = await changeNowRequest('/currencies');
    const activeCurrencies = Array.isArray(currencies)
      ? currencies.filter(c => c.ticker && c.name)
      : [];
    res.json(activeCurrencies);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
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

    res.json({
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
    res.status(error.status || 500).json({ error: error.message });
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
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/transaction/:id - Get transaction status
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await changeNowRequest(`/exchange/${id}`);

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
    res.status(error.status || 500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`ChangeNOW API v2: ${API_URL}`);
});

module.exports = app;