require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const API_KEY = process.env.CHANGE_NOW_API_KEY || '';
const API_URL = 'https://api.changenow.io/v1';

process.on('uncaughtException', e => console.error('[UNCATCHED]', e.message));
process.on('unhandledRejection', e => console.error('[UNHANDLED]', String(e)));

console.log('[START] PORT:', PORT, 'HOST:', HOST, 'API_KEY_SET:', API_KEY ? 'YES' : 'NO');

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

function safeCnCall(method, path, body) {
  return new Promise((resolve) => {
    if (!API_KEY) return resolve({ ok: false, error: 'no api key' });
    const timer = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 15000);
    axios({ method, url: API_URL + path, headers: { 'x-api-key': API_KEY }, data: body, timeout: 15000 })
      .then(r => { clearTimeout(timer); resolve({ ok: true, data: r.data }); })
      .catch(e => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

app.get('/api/currencies', async (req, res) => {
  const r = await safeCnCall('GET', '/currencies');
  res.json(Array.isArray(r.data) ? r.data : []);
});

app.get('/api/exchange-rate', async (req, res) => {
  const { fromCurrency, toCurrency, fromAmount } = req.query;
  if (!fromCurrency || !toCurrency) return res.status(400).json({ error: 'missing params' });
  const r = await safeCnCall('GET', `/exchange/estimate?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`);
  res.json(r.ok ? r.data : { error: r.error });
});

app.post('/api/create-transaction', async (req, res) => {
  const { fromCurrency, toCurrency, fromAmount, address } = req.body;
  if (!fromCurrency || !toCurrency || !fromAmount || !address) return res.status(400).json({ error: 'missing fields' });
  const r = await safeCnCall('POST', '/exchange', { from: fromCurrency, to: toCurrency, address, amount: fromAmount });
  res.json(r.ok ? r.data : { error: r.error });
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));

const server = app.listen(PORT, HOST, () => {
  console.log('[READY] http://' + HOST + ':' + PORT);
});

server.on('error', e => console.error('[SERVER_ERROR]', e.message));

module.exports = app;