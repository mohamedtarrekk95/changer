require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v1';

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

// ChangeNOW API request helper with proper auth
async function changeNowRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    };
    if (data) config.data = data;

    console.log(`[ChangeNOW Request] ${method} ${config.url}`);
    if (data) console.log(`[ChangeNOW Request] Body:`, JSON.stringify(data, null, 2));

    const response = await axios(config);
    console.log(`[ChangeNOW Response] Status: ${response.status}`);
    console.log(`[ChangeNOW Response] Data:`, JSON.stringify(response.data, null, 2).substring(0, 500));

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[ChangeNOW Error] Status: ${status}`);
    console.error(`[ChangeNOW Error] Data:`, JSON.stringify(data, null, 2));
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
    // Filter to only active currencies if needed
    const activeCurrencies = Array.isArray(currencies)
      ? currencies.filter(c => c.ticker && c.name)
      : [];
    res.json(activeCurrencies);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/exchange-rate - Get exchange rate estimate
// Query params: fromCurrency, toCurrency, fromAmount
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency are required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be a positive number' });
    }

    // Correct endpoint: /v1/exchange/estimate?from=X&to=Y&amount=Z
    const estimate = await changeNowRequest(
      `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`
    );

    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: estimate.toAmount || estimate.amount || estimate.estimatedAmount,
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

    // Correct endpoint: POST /v1/exchange (NOT /transactions/{apiKey})
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
      toAmount: transaction.toAmount || transaction.expectedReceiveAmount || transaction.amount,
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

    // Correct endpoint: GET /v1/transaction/{id} (NOT /transactions/{id}/{apiKey})
    const transaction = await changeNowRequest(`/transaction/${id}`);

    res.json({
      id: transaction.id,
      status: transaction.status,
      fromCurrency: transaction.fromCurrency?.toUpperCase(),
      toCurrency: transaction.toCurrency?.toUpperCase(),
      fromAmount: transaction.fromAmount || transaction.expectedSendAmount || transaction.amount,
      toAmount: transaction.toAmount || transaction.expectedReceiveAmount,
      payinAddress: transaction.payinAddress || transaction.depositAddress,
      payoutAddress: transaction.payoutAddress,
      updatedAt: transaction.updatedAt || transaction.timestamp,
      createdAt: transaction.createdAt,
      payinHash: transaction.payinHash || transaction.depositHash,
      payoutHash: transaction.payoutHash || transaction.payoutHash,
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
  console.log(`ChangeNOW API: ${API_URL}`);
});

module.exports = app;