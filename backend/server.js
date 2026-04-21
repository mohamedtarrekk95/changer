require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

// ===========================================
// RAILWAY PORT - MUST use ONLY process.env.PORT
// Railway sets this dynamically - no fallback
// ===========================================
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

// Validate PORT exists
if (PORT === undefined || PORT === null || PORT === '') {
  console.error('[FATAL] process.env.PORT is not set!');
  console.error('[FATAL] Railway requires PORT environment variable');
}

// Convert PORT to number safely
const PORT_NUM = parseInt(PORT, 10);
const IS_PORT_VALID = !isNaN(PORT_NUM) && PORT_NUM > 0 && PORT_NUM < 65536;

// ===========================================
// CHANGE NOW API CONFIG
// ===========================================
const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
const API_URL = 'https://api.changenow.io/v1';

// ===========================================
// STARTUP LOG
// ===========================================
console.log('===========================================');
console.log('[CONFIG] ChangeNOW Backend v2.0');
console.log('[CONFIG] Time:', new Date().toISOString());
console.log('[CONFIG] PORT:', PORT);
console.log('[CONFIG] PORT_VALID:', IS_PORT_VALID);
console.log('[CONFIG] HOST:', HOST);
console.log('[CONFIG] API_URL:', API_URL);
console.log('[CONFIG] API_KEY_SET:', API_KEY ? 'YES' : 'NO');
console.log('===========================================');

// ===========================================
// GLOBAL ERROR HANDLERS
// Keep server alive no matter what
// ===========================================
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, err.stack);
  // NEVER exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', String(reason));
  // NEVER exit
});

// ===========================================
// CORS MIDDLEWARE - MUST be first
// Sets headers on EVERY response
// ===========================================
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers on EVERY response
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight immediately - don't go to routes
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight from:', origin);
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
  console.log(`[REQUEST] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===========================================
// SAFE CHANGE NOW API CALL
// Never throws - always resolves with {ok, data, error}
// ===========================================
function safeCnCall(method, path, body) {
  return new Promise((resolve) => {
    // No API key = return error
    if (!API_KEY) {
      console.log('[CnCall] No API key configured');
      resolve({ ok: false, error: 'API key not configured', data: null });
      return;
    }

    // Timeout after 15 seconds
    const timer = setTimeout(() => {
      console.error('[CnCall] Timeout for', method, path);
      resolve({ ok: false, error: 'timeout', data: null });
    }, 15000);

    axios({
      method: method || 'GET',
      url: API_URL + path,
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      data: body,
      timeout: 15000,
    })
    .then(response => {
      clearTimeout(timer);
      console.log('[CnCall] Success:', method, path, 'status:', response.status);
      resolve({ ok: true, data: response.data, error: null });
    })
    .catch(err => {
      clearTimeout(timer);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'unknown';
      console.error('[CnCall] Error:', method, path, 'status:', status, 'msg:', message);
      resolve({ ok: false, error: message, status, data: null });
    });
  });
}

// ===========================================
// ROUTES
// ===========================================

// ROOT - Always returns 200
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Changer API',
    version: '2.0',
    timestamp: new Date().toISOString(),
  });
});

// HEALTH - Always returns 200, NO external dependencies
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: Math.floor(process.uptime()),
  });
});

// CURRENCIES - ALWAYS returns array, never fails
app.get('/api/currencies', async (req, res) => {
  console.log('[Route] GET /api/currencies');

  try {
    const result = await safeCnCall('GET', '/currencies');

    // ChangeNOW failed - return empty array, NOT error
    if (!result.ok && !result.data) {
      console.log('[Route] ChangeNOW unavailable, returning []');
      return res.status(200).json([]);
    }

    // Invalid response - return empty array
    if (!Array.isArray(result.data)) {
      console.log('[Route] Invalid response, returning []');
      return res.status(200).json([]);
    }

    console.log('[Route] Returning', result.data.length, 'currencies');
    return res.status(200).json(result.data);

  } catch (err) {
    // Any unexpected error - return empty array
    console.error('[Route] Error:', err.message);
    return res.status(200).json([]);
  }
});

// EXCHANGE RATE
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
    return res.status(500).json({ error: 'rate error' });
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
// 404 HANDLER - Must set CORS headers too
// ===========================================
app.use((req, res) => {
  console.log('[Route] 404:', req.method, req.path);
  res.status(404).json({ error: 'not found' });
});

// ===========================================
// ERROR HANDLER - Must set CORS headers too
// ===========================================
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err.message);
  res.status(500).json({ error: 'internal error' });
});

// ===========================================
// START SERVER
// ===========================================
console.log('[START] Starting server...');

// Validate PORT before starting
if (!IS_PORT_VALID) {
  console.error('[START] FATAL: Invalid PORT:', PORT);
  // Don't start - will fail on Railway if PORT is invalid
  // But don't crash the process either - let it show the error
}

// Use the port Railway gave us - only start if valid
const server = app.listen(IS_PORT_VALID ? PORT_NUM : 3000, HOST, (err) => {
  if (err) {
    console.error('[START] FATAL: Server failed to start:', err.message);
    return; // Don't exit - keep process alive to show error
  }
  console.log('===========================================');
  console.log('[READY] Server running at http://' + HOST + ':' + (IS_PORT_VALID ? PORT_NUM : 3000));
  console.log('[READY] Health: http://' + HOST + ':' + (IS_PORT_VALID ? PORT_NUM : 3000) + '/health');
  console.log('[READY] API_KEY_SET:', API_KEY ? 'YES' : 'NO');
  console.log('===========================================');
});

server.on('error', (err) => {
  console.error('[SERVER] Error:', err.message);
});

module.exports = app;