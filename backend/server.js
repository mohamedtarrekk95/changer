require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// RAILWAY FIX: ONLY use process.env.PORT - Railway assigns this dynamically
// Railway will NOT route traffic to hardcoded ports
const PORT = process.env.PORT;

if (!PORT) {
  console.error('[FATAL] process.env.PORT is not set!');
  console.error('[FATAL] Railway requires process.env.PORT to be used');
  process.exit(1);
}

console.log('[START] PORT assigned by Railway:', PORT);

const API_KEY = process.env.CHANGE_NOW_API_KEY;
const API_URL = 'https://api.changenow.io/v2';

if (!API_KEY) {
  console.error('[FATAL] CHANGE_NOW_API_KEY not set');
  process.exit(1);
}

// CORS - Allow all Vercel preview deployments and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://changer-cbha.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
}));

app.use(express.json());

// Simple routes

app.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// ChangeNOW API call helper
async function cn(method, path, body) {
  const { default: axios } = require('axios');
  const r = await axios({
    method,
    url: API_URL + path,
    headers: { 'x-changenow-api-key': API_KEY, 'Content-Type': 'application/json' },
    data: body,
    timeout: 20000,
  });
  return r.data;
}

app.get('/api/currencies', async (req, res) => {
  try {
    const data = await cn('GET', '/currencies');
    res.json(Array.isArray(data) ? data : []);
  } catch { res.status(500).json({ error: 'currencies error' }); }
});

app.get('/api/exchange-rate', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount } = req.query;
    if (!fromCurrency || !toCurrency || !fromAmount) {
      return res.status(400).json({ error: 'missing params' });
    }
    const est = await cn('GET', `/exchange/estimate?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`);
    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: parseFloat(fromAmount),
      toAmount: est.toAmount,
      rate: est.rate,
    });
  } catch { res.status(500).json({ error: 'rate error' }); }
});

app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, fromAmount, address } = req.body;
    if (!fromCurrency || !toCurrency || !fromAmount || !address) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const tx = await cn('POST', '/exchange', {
      from: fromCurrency.toLowerCase(),
      to: toCurrency.toLowerCase(),
      address,
      amount: parseFloat(fromAmount),
    });
    res.json({ id: tx.id, status: tx.status, fromCurrency: tx.fromCurrency, toCurrency: tx.toCurrency });
  } catch { res.status(500).json({ error: 'transaction error' }); }
});

app.get('/api/transaction/:id', async (req, res) => {
  try {
    const tx = await cn('GET', `/exchange/${req.params.id}`);
    res.json({ id: tx.id, status: tx.status, fromCurrency: tx.fromCurrency, toCurrency: tx.toCurrency });
  } catch { res.status(500).json({ error: 'transaction error' }); }
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'error' }));

// RAILWAY FIX: Bind to 0.0.0.0 with ONLY Railway's PORT
// NO fallback port - Railway controls the port
app.listen(PORT, '0.0.0.0', () => {
  console.log('[READY] Server at http://0.0.0.0:' + PORT);
  console.log('[READY] Test: /health');
});

module.exports = app;