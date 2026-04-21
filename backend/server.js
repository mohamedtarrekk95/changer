require('dotenv').config();

const express = require('express');
const http = require('http');
const axios = require('axios');

const app = express();

// ===========================================
// RAILWAY PORT - ONLY from process.env.PORT
// ===========================================
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

// ===========================================
// CHANGE NOW API CONFIG
// ===========================================
const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
const API_URL = 'https://api.changenow.io/v1';
const API_HEADER = 'x-api-key'; // Official header per ChangeNOW docs

// ===========================================
// STARTUP LOG
// ===========================================
console.log('===========================================');
console.log('[START] ChangeNOW Backend Starting');
console.log('[START] Time:', new Date().toISOString());
console.log('[START] PORT:', PORT || 'NOT SET');
console.log('[START] HOST:', HOST);
console.log('[START] API_URL:', API_URL);
console.log('[START] API_KEY_SET:', API_KEY ? 'YES' : 'NO');
console.log('===========================================');

// ===========================================
// GLOBAL ERROR HANDLERS
// NEVER exit process - keep server running
// ===========================================
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', String(reason));
});

// ===========================================
// CORS MIDDLEWARE
// MUST be first - sets headers on EVERY response
// Handles preflight (OPTIONS) immediately
// ===========================================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';

  // ALWAYS set these headers on every response
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight - respond NOW without going to routes
  if (req.method === 'OPTIONS') {
    console.log('[CORS Preflight]', origin);
    return res.status(204).end();
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

// ===========================================
// REQUEST LOGGING
// ===========================================
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===========================================
// SAFE CHANGE NOW API CALL
// Wraps axios - never throws, always resolves
// Returns: {ok: boolean, data: any, error: string|null}
// ===========================================
function safeCnCall(method, path, body) {
  return new Promise((resolve) => {
    // Check API key first
    if (!API_KEY) {
      console.log('[safeCnCall] API_KEY not set');
      resolve({ ok: false, error: 'API_KEY not configured', data: null });
      return;
    }

    // Timeout protection - 15 seconds
    const timer = setTimeout(() => {
      console.error('[safeCnCall] TIMEOUT:', method, path);
      resolve({ ok: false, error: 'timeout', data: null });
    }, 15000);

    // Make the API call
    axios({
      method: method || 'GET',
      url: API_URL + path,
      headers: {
        [API_HEADER]: API_KEY,
        'Content-Type': 'application/json'
      },
      data: body,
      timeout: 15000,
    })
    .then(response => {
      clearTimeout(timer);
      console.log('[safeCnCall] SUCCESS:', method, path, 'status:', response.status);
      resolve({ ok: true, data: response.data, error: null });
    })
    .catch(err => {
      clearTimeout(timer);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'unknown_error';
      console.error('[safeCnCall] ERROR:', method, path, 'status:', status, 'msg:', message);
      resolve({ ok: false, error: message, status, data: null });
    });
  });
}

// ===========================================
// ROUTES
// ===========================================

// ROOT - Always returns 200
app.get('/', (req, res) => {
  console.log('[Route] GET /');
  res.status(200).json({
    status: 'ok',
    service: 'Changer API',
    version: '2.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// HEALTH - Always returns 200, NO external dependencies
app.get('/health', (req, res) => {
  console.log('[Route] GET /health');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: Math.floor(process.uptime())
  });
});

// CURRENCIES - Returns array ALWAYS, never fails
app.get('/api/currencies', async (req, res) => {
  console.log('[Route] GET /api/currencies');

  try {
    const result = await safeCnCall('GET', '/currencies');

    // External API failed - return empty array (not error)
    if (!result.ok && !result.data) {
      console.log('[Route] ChangeNOW unavailable, returning []');
      return res.status(200).json([]);
    }

    // Invalid response - return empty array
    if (!Array.isArray(result.data)) {
      console.log('[Route] Invalid response type, returning []');
      return res.status(200).json([]);
    }

    console.log('[Route] Returning', result.data.length, 'currencies');
    return res.status(200).json(result.data);

  } catch (err) {
    // Any unexpected error - return empty array
    console.error('[Route] Unexpected error:', err.message);
    return res.status(200).json([]);
  }
});

// EXCHANGE RATE - Returns rate or error JSON
app.get('/api/exchange-rate', async (req, res) => {
  console.log('[Route] GET /api/exchange-rate');

  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'fromCurrency and toCurrency required' });
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return res.status(400).json({ error: 'fromAmount must be positive' });
    }

    const result = await safeCnCall(
      'GET',
      `/exchange/estimate?from=${fromCurrency.toLowerCase()}&to=${toCurrency.toLowerCase()}&amount=${fromAmount}`
    );

    if (!result.ok && !result.data) {
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

// CREATE TRANSACTION
app.post('/api/create-transaction', async (req, res) => {
  console.log('[Route] POST /api/create-transaction');

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

    const result = await safeCnCall('POST', '/exchange', payload);

    if (!result.ok && !result.data) {
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
    return res.status(500).json({ error: 'transaction error' });
  }
});

// TRANSACTION STATUS
app.get('/api/transaction/:id', async (req, res) => {
  console.log('[Route] GET /api/transaction/', req.params.id);

  try {
    const result = await safeCnCall('GET', `/transaction/${req.params.id}`);

    if (!result.ok && !result.data) {
      return res.status(500).json({ error: 'Failed to fetch transaction', message: result.error });
    }

    return res.status(200).json({
      id: result.data?.id || req.params.id,
      status: result.data?.status || 'unknown',
      fromCurrency: result.data?.fromCurrency?.toUpperCase(),
      toCurrency: result.data?.toCurrency?.toUpperCase(),
      fromAmount: result.data?.fromAmount,
      toAmount: result.data?.toAmount,
      payinAddress: result.data?.payinAddress,
    });

  } catch (err) {
    console.error('[Route] /api/transaction error:', err.message);
    return res.status(500).json({ error: 'transaction error' });
  }
});

// ===========================================
// 404 HANDLER
// ===========================================
app.use((req, res) => {
  console.log('[Route] 404:', req.method, req.path);
  res.status(404).json({ error: 'not found' });
});

// ===========================================
// ERROR HANDLER
// ===========================================
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err.message);
  res.status(500).json({ error: 'internal error' });
});

// ===========================================
// START SERVER
// ===========================================
if (!PORT) {
  console.error('[START] WARNING: PORT not set, Railway should provide this');
}

const ACTUAL_PORT = PORT ? parseInt(PORT, 10) : undefined;

const server = app.listen(ACTUAL_PORT, HOST, (err) => {
  if (err) {
    console.error('[FATAL] Server failed:', err.message);
    process.exit(1);
  }
  console.log('===========================================');
  console.log('[READY] Server running');
  console.log('[READY] URL: http://' + HOST + ':' + (PORT || '?'));
  console.log('[READY] Health: http://' + HOST + ':' + (PORT || '') + '/health');
  console.log('[READY] Currencies: http://' + HOST + ':' + (PORT || '') + '/api/currencies');
  console.log('===========================================');
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]', err.message);
});

module.exports = app;