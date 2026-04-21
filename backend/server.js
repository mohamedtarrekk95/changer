require('dotenv').config();

const express = require('express');
const http = require('http');

const app = express();

// Railway provides PORT as environment variable
// Must use String - Railway sets PORT as string like "3000"
const PORT = process.env.PORT || '';
const HOST = '0.0.0.0';

// Validate PORT exists
if (!PORT) {
  console.error('[FATAL] process.env.PORT is not set');
  console.error('[FATAL] Railway requires PORT environment variable');
  process.exit(1);
}

// Convert to number for listening
const PORT_NUM = parseInt(PORT, 10);
if (isNaN(PORT_NUM) || PORT_NUM < 1 || PORT_NUM > 65535) {
  console.error('[FATAL] Invalid PORT:', PORT);
  process.exit(1);
}

console.log('[CONFIG] PORT:', PORT);
console.log('[CONFIG] HOST:', HOST);

const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY not set');
  process.exit(1);
}

const API_URL = 'https://api.changenow.io/v2';
console.log('[CONFIG] ChangeNOW API:', API_URL);

// CORS - Set headers on EVERY response for all Vercel domains
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';

  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight - respond immediately
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight:', origin);
    return res.status(204).end();
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Changer API',
    version: '2.0',
    port: PORT
  });
});

// ChangeNOW API helper
const axios = require('axios');

async function cn(method, path, body) {
  console.log(`[ChangeNOW] ${method} ${path}`);
  try {
    const config = {
      method,
      url: API_URL + path,
      headers: {
        'x-changenow-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    };
    if (body) config.data = body;

    const response = await axios(config);
    console.log(`[ChangeNOW] Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`[ChangeNOW] Error: ${status} - ${message}`);
    throw { status, message };
  }
}

// API Routes

app.get('/api/currencies', async (req, res) => {
  try {
    const data = await cn('GET', '/currencies');
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    res.status(500).json({ error: 'currencies error', message: error.message });
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

    const est = await cn('GET', `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`);

    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: est.toAmount || est.amount,
      rate: est.rate,
      transactionSpeed: est.transactionSpeed,
    });
  } catch (error) {
    res.status(500).json({ error: 'rate error', message: error.message });
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

    const tx = await cn('POST', '/exchange', payload);

    res.json({
      id: tx.id,
      fromCurrency: tx.fromCurrency?.toUpperCase() || fromCurrency.toUpperCase(),
      toCurrency: tx.toCurrency?.toUpperCase() || toCurrency.toUpperCase(),
      fromAmount: tx.fromAmount || parseFloat(fromAmount),
      toAmount: tx.toAmount || tx.expectedReceiveAmount,
      payinAddress: tx.payinAddress,
      status: tx.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'transaction error', message: error.message });
  }
});

app.get('/api/transaction/:id', async (req, res) => {
  try {
    const tx = await cn('GET', `/exchange/${req.params.id}`);
    res.json({
      id: tx.id,
      status: tx.status,
      fromCurrency: tx.fromCurrency?.toUpperCase(),
      toCurrency: tx.toCurrency?.toUpperCase(),
      fromAmount: tx.fromAmount,
      toAmount: tx.toAmount,
      payinAddress: tx.payinAddress,
      payoutAddress: tx.payoutAddress,
    });
  } catch (error) {
    res.status(500).json({ error: 'transaction error', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'internal error' });
});

// START SERVER
console.log('[START] Starting server on', HOST + ':' + PORT);

const server = app.listen(PORT_NUM, HOST, (err) => {
  if (err) {
    console.error('[FATAL] Server failed to start:', err);
    process.exit(1);
  }
  console.log('===========================================');
  console.log('[READY] Server running at http://' + HOST + ':' + PORT);
  console.log('[READY] Health: http://' + HOST + ':' + PORT + '/health');
  console.log('===========================================');
});

// Handle server errors
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

module.exports = app;