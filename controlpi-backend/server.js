const express = require('express');
const cors = require('cors');
const app = express();

// Configuration pour Replit
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = 'https://controlpi-frontend.vercel.app';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'https://*.replit.dev', 'https://*.repl.co'],
  credentials: true
}));
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes principales
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ControlPi Backend',
    platform: 'Replit',
    url: req.protocol + '://' + req.get('host'),
    endpoints: [
      'GET /health',
      'POST /api/auth',
      'POST /api/payments/create',
      'POST /api/payments/approve',
      'POST /api/payments/complete',
      'POST /api/payments/callback'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Authentification
app.post('/api/auth', (req, res) => {
  res.json({
    success: true,
    user: {
      uid: `user_${Date.now()}`,
      username: 'controlpi_user',
      session: `sess_${Date.now()}`
    },
    message: 'Authentifié sur Replit'
  });
});

// Création de paiement
app.post('/api/payments/create', (req, res) => {
  const paymentId = `replit_${Date.now()}`;
  res.json({
    success: true,
    payment: {
      identifier: paymentId,
      amount: req.body.amount || 3.14,
      memo: req.body.memo || 'ControlPi Replit Payment',
      metadata: {
        platform: 'Replit',
        app: 'ControlPi',
        timestamp: new Date().toISOString()
      }
    }
  });
});

// Approbation
app.post('/api/payments/approve', (req, res) => {
  res.json({
    success: true,
    txid: `tx_replit_${Date.now()}`,
    message: 'Paiement approuvé sur Replit'
  });
});

// Complétion
app.post('/api/payments/complete', (req, res) => {
  res.json({
    success: true,
    message: 'Paiement complété',
    paymentId: req.body.paymentId,
    txid: req.body.txid
  });
});

// Callback
app.post('/api/payments/callback', (req, res) => {
  console.log('📞 Callback Pi reçu:', req.body);
  res.json({
    success: true,
    received: true,
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
✅ ControlPi Backend sur Replit
📍 Port: ${PORT}
📡 URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co
🔗 Frontend: ${FRONTEND_URL}

=== TEST CES URLS ===
1. https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co
2. https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/health
3. https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/payments/create
  `);
});