# Changer - Crypto Exchange Platform

A full-stack crypto exchange application using the ChangeNOW API.

## Project Structure

```
changer/
├── backend/           # Express.js API server
│   ├── server.js      # Main server with all API endpoints
│   ├── .env           # Environment variables (API key)
│   └── package.json
├── frontend/          # Next.js React application
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── context/       # React context providers
│   ├── lib/           # API client functions
│   └── package.json
└── README.md
```

## Features

- **Currency Swap**: Exchange crypto-to-crypto with real-time rates
- **Multi-Currency Support**: Access all ChangeNOW supported currencies
- **Transaction Tracking**: Track your exchange transactions
- **RTL Support**: Full Arabic and English language support
- **Responsive Design**: Works on mobile and desktop
- **Secure**: API key kept on backend only

## Tech Stack

- **Frontend**: React (Next.js 16), Tailwind CSS
- **Backend**: Node.js, Express
- **API**: ChangeNOW Exchange API

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd changer/backend
npm install
```

Create a `.env` file in the backend folder with your ChangeNOW API key:

```
CHANGE_NOW_API_KEY=your_api_key_here
CHANGE_NOW_API_URL=https://api.changenow.io/v1
PORT=3002
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
# or
node server.js
```

The backend will run on `http://localhost:3002`

### 2. Frontend Setup

```bash
cd changer/frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/currencies` | Get all available currencies |
| GET | `/api/exchange-rate` | Get exchange rate estimate |
| POST | `/api/create-transaction` | Create new exchange |
| GET | `/api/transaction/:id` | Get transaction status |

### Example API Usage

```bash
# Get currencies
curl http://localhost:3002/api/currencies

# Get exchange rate
curl "http://localhost:3002/api/exchange-rate?fromCurrency=BTC&toCurrency=ETH&fromAmount=1"

# Create transaction
curl -X POST http://localhost:3002/api/create-transaction \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency":"BTC","toCurrency":"ETH","fromAmount":1,"address":"0x..."}'
```

## Deployment

### Backend (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables:
   - `CHANGE_NOW_API_KEY`: Your API key
   - `CHANGE_NOW_API_URL`: `https://api.changenow.io/v1`
   - `PORT`: `3002`
   - `NODE_ENV`: `production`
3. Deploy

### Frontend (Vercel)

1. Connect your GitHub repository
2. Deploy (environment variables are optional for local dev)

> **Note**: Update `next.config.js` proxy to point to your production backend URL when deploying.

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `CHANGE_NOW_API_KEY` | Your ChangeNOW API key | Yes |
| `CHANGE_NOW_API_URL` | ChangeNOW API URL | No (default provided) |
| `PORT` | Server port | No (default: 3002) |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `NODE_ENV` | Environment mode | No |

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | No (uses proxy in dev) |

## Security Notes

- Never commit your `.env` file or API key to version control
- The API key is stored only in the backend environment
- All API requests from the frontend go through the backend proxy

## Pages

- `/` - Swap interface (home page)
- `/status?id=xxx` - Transaction status page

## Language Support

Toggle between English (EN) and Arabic (AR) using the language button in the header.

## License

MIT License
