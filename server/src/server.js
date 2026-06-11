require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

app.use(helmet());

// CORS restringido al frontend conocido (no abierto a cualquier origen).
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({ origin: allowedOrigin }));

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  require('./routes/payment').handleWebhook(req, res);
});

app.use(express.json());

// Límite estricto en autenticación para frenar fuerza bruta / credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
});
app.use('/api/auth', authLimiter);

// Límite general para el resto de la API.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error de conexión MongoDB:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/payment', require('./routes/payment'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
