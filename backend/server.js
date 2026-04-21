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
    // Allow requests with no origin (mobile apps, curl, etc.)
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

// ChangeNOW API helper - makes authenticated requests to ChangeNOW
async function changeNowRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('ChangeNOW API Error:', error.response?.data || error.message);
    const errData = error.response?.data;
    throw {
      message: errData?.message || errData?.error || error.message,
      status: error.response?.status || 500
    };
  }
}

// GET /api/currencies - Get all available currencies
app.get('/api/currencies', async (req, res) => {
  try {
    const currencies = await changeNowRequest('/currencies?active=true');
    res.json(currencies);
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

    const pair = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
    const estimate = await changeNowRequest(`/exchange-amount/${fromAmount}/${pair}`);

    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: estimate.estimatedAmount,
      rate: estimate.estimatedAmount / parseFloat(fromAmount),
      transactionSpeed: estimate.transactionSpeedForecast,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// POST /api/create-transaction - Create new exchange transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address, toAddress, refundAddress } = req.body;

    // Support both 'address' and 'toAddress' from frontend
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

    const transaction = await changeNowRequest(
      `/transactions/${API_KEY}`,
      'POST',
      payload
    );

    res.json({
      id: transaction.id,
      fromCurrency: transaction.fromCurrency?.toUpperCase() || fromCurrency.toUpperCase(),
      toCurrency: transaction.toCurrency?.toUpperCase() || toCurrency.toUpperCase(),
      fromAmount: transaction.amount || parseFloat(fromAmount),
      toAmount: transaction.expectedReceiveAmount || transaction.directedAmount,
      payinAddress: transaction.payinAddress,
      payoutAddress: transaction.payoutAddress,
      status: transaction.status,
      createdAt: transaction.createdAt,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/transaction/:id - Get transaction status
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await changeNowRequest(`/transactions/${id}/${API_KEY}`);

    res.json({
      id: transaction.id,
      status: transaction.status,
      fromCurrency: transaction.fromCurrency?.toUpperCase(),
      toCurrency: transaction.toCurrency?.toUpperCase(),
      fromAmount: transaction.expectedSendAmount || transaction.amount,
      toAmount: transaction.expectedReceiveAmount,
      payinAddress: transaction.payinAddress,
      payoutAddress: transaction.payoutAddress,
      updatedAt: transaction.updatedAt,
      createdAt: transaction.createdAt,
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
