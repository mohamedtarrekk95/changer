require('dotenv').config();

const express = require('express');
const http = require('http');

// Pre-load axios at top level - NOT inside async functions
const axios = require('axios');

const app = express();

// ===========================================
// RAILWAY PORT CONFIGURATION
// Railway sets process.env.PORT at runtime
// MUST use ONLY this - no fallback ports
// ===========================================
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

if (!PORT) {
  console.error('[FATAL] process.env.PORT is not set');
  console.error('[FATAL] Railway must provide PORT environment variable');
  // Don't exit - let Railway show the error in logs
  // Railway will mark deployment as failed anyway
}

// ===========================================
// API CONFIGURATION
// ===========================================
const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
const API_URL = 'https://api.changenow.io/v2';

console.log('===========================================');
console.log('[CONFIG] ChangeNOW Backend Starting');
console.log('[CONFIG] Timestamp:', new Date().toISOString());
console.log('[CONFIG] PORT:', PORT || 'NOT SET');
console.log('[CONFIG] API_KEY:', API_KEY ? 'SET' : 'NOT SET');
console.log('===========================================');

// ===========================================
// GLOBAL ERROR HANDLERS
// Keep server alive despite errors
// ===========================================
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, err.stack);
  // Don't exit - try to keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', String(reason));
  // Don't exit
});

// ===========================================
// CORS MIDDLEWARE
// Must be FIRST - runs on EVERY request
// ===========================================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';

  // ALWAYS set these headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight - respond immediately without going to routes
  if (req.method === 'OPTIONS') {
    console.log('[CORS Preflight]', origin);
    return res.status(204).end();
  }

  next();
});

// ===========================================
// BODY PARSING
// ===========================================
app.use(express.json({ limit: '1mb' }));

// ===========================================
// REQUEST LOGGING
// ===========================================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================================
// HEALTH CHECK - Always returns 200
// ===========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT || 'not set'
  });
});

// ===========================================
// ROOT - Always returns 200
// ===========================================
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Changer API',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
});

// ===========================================
// ChangeNOW API CALL WRAPPER
// Never throws - always returns {error, data}
// ===========================================
function safeChangeNowCall(method, path, body) {
  return new Promise((resolve) => {
    if (!API_KEY) {
      resolve({ error: 'API key not configured', data: null });
      return;
    }

    const timeoutId = setTimeout(() => {
      console.error('[ChangeNOW] Timeout:', path);
      resolve({ error: 'timeout', data: null });
    }, 15000);

    axios({
      method: method || 'GET',
      url: API_URL + path,
      headers: {
        'x-changenow-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      data: body,
      timeout: 15000,
    })
    .then(response => {
      clearTimeout(timeoutId);
      resolve({ error: null, data: response.data });
    })
    .catch(err => {
      clearTimeout(timeoutId);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Unknown';
      console.error(`[ChangeNOW Error] ${status}: ${message}`);
      resolve({ error: message, status, data: null });
    });
  });
}

// ===========================================
// API: CURRENCIES
// ===========================================
app.get('/api/currencies', async (req, res) => {
  console.log('[Route] GET /api/currencies');

  try {
    const result = await safeChangeNowCall('GET', '/currencies');

    if (result.error && !result.data) {
      // ChangeNOW failed - return empty array, NOT error
      console.log('[Route] ChangeNOW unavailable, returning empty array');
      return res.status(200).json([]);
    }

    const data = result.data;
    if (!Array.isArray(data)) {
      console.log('[Route] Invalid response type, returning empty array');
      return res.status(200).json([]);
    }

    console.log(`[Route] Returning ${data.length} currencies`);
    return res.status(200).json(data);

  } catch (err) {
    // Any unexpected error - return empty array
    console.error('[Route] Unexpected error:', err.message);
    return res.status(200).json([]);
  }
});

// ===========================================
// API: EXCHANGE RATE
// ===========================================
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be positive' });
    }

    const result = await safeChangeNowCall(
      'GET',
      `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`
    );

    if (result.error && !result.data) {
      return res.status(500).json({ error: 'Failed to fetch rate', message: result.error });
    }

    return res.status(200).json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: result.data?.toAmount || result.data?.amount,
      rate: result.data?.rate,
      transactionSpeed: result.data?.transactionSpeed,
    });

  } catch (err) {
    console.error('[Route] /api/exchange-rate error:', err.message);
    return res.status(500).json({ error: 'rate error', message: err.message });
  }
});

// ===========================================
// API: CREATE TRANSACTION
// ===========================================
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

    const result = await safeChangeNowCall('POST', '/exchange', payload);

    if (result.error && !result.data) {
      return res.status(500).json({ error: 'Failed to create transaction', message: result.error });
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

  } catch (err) {
    console.error('[Route] /api/create-transaction error:', err.message);
    return res.status(500).json({ error: 'transaction error', message: err.message });
  }
});

// ===========================================
// API: TRANSACTION STATUS
// ===========================================
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const result = await safeChangeNowCall('GET', `/exchange/${req.params.id}`);

    if (result.error && !result.data) {
      return res.status(500).json({ error: 'Failed to fetch transaction', message: result.error });
    }

    return res.status(200).json({
      id: result.data?.id || req.params.id,
      status: result.data?.status || 'unknown',
      fromCurrency: result.data?.fromCurrency?.toUpperCase(),
      toCurrency: result.data?.toCurrency?.toUpperCase(),
      fromAmount: result.data?.fromAmount,
      toAmount: result.data?.toAmount,
    });

  } catch (err) {
    console.error('[Route] /api/transaction error:', err.message);
    return res.status(500).json({ error: 'transaction error', message: err.message });
  }
});

// ===========================================
// 404 HANDLER - Must exist after all routes
// ===========================================
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// ===========================================
// ERROR HANDLER - Catches all errors
// ===========================================
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err.message);
  res.status(500).json({ error: 'internal error' });
});

// ===========================================
// START SERVER
// Railway requires binding to 0.0.0.0
// ===========================================
if (!PORT) {
  console.error('[STARTUP] PORT is not set - Railway should provide this');
  console.error('[STARTUP] Waiting 5 seconds before starting...');
}

const ACTUAL_PORT = PORT ? parseInt(PORT, 10) : undefined;

const server = app.listen(ACTUAL_PORT, HOST, (err) => {
  if (err) {
    console.error('[FATAL] Server failed to start:', err.message);
    process.exit(1);
  }
  console.log('===========================================');
  console.log('[READY] Server running at http://' + HOST + ':' + (PORT || 'unknown'));
  console.log('[READY] Health: http://' + HOST + ':' + (PORT || '') + '/health');
  console.log('[READY] API Key: ' + (API_KEY ? 'SET' : 'NOT SET'));
  console.log('===========================================');
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]', err.message);
  process.exit(1);
});

module.exports = app;