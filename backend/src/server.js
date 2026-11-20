const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const connectDB = require('./config/db');
const { sanitizeBody } = require('./utils/sanitize');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1); // behind Next.js rewrite proxy / load balancer
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeBody);
if (!env.isProd) app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '30d' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many attempts, please try again later' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] });
});

app.use('/api', apiLimiter);
app.use('/api/auth/otp', authLimiter);
app.use('/api/auth/admin', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/store', require('./routes/store'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/account', require('./routes/account'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => console.log(`✓ ClickMart API listening on http://localhost:${env.PORT}`));

// Keep the API up even if Mongo isn't reachable yet; retry in the background.
(function connectWithRetry() {
  connectDB().catch((err) => {
    console.error(`✗ MongoDB connection failed: ${err.message}. Retrying in 15s…`);
    setTimeout(connectWithRetry, 15000);
  });
})();
