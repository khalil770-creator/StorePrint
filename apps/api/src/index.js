require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const { connect: connectRedis } = require('./config/redis');
const { ensureBucket } = require('./config/minio');

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',           require('./modules/admin/system/auth.routes'));
app.use('/api/brand',          require('./modules/admin/system/brand.routes'));
app.use('/api/users',          require('./modules/admin/users/users.routes'));
app.use('/api/roles',          require('./modules/admin/roles/roles.routes'));
app.use('/api/stores',         require('./modules/admin/stores/stores.routes'));
app.use('/api/auditing',       require('./modules/auditing/auditing.routes'));
app.use('/api/field',          require('./modules/field-presence/field.routes'));

// Phase 2 routes
app.use('/api/campaigns',      require('./modules/campaigns/campaigns.routes'));
app.use('/api/vm',             require('./modules/vm/vm.routes'));
app.use('/api/signage',        require('./modules/signage/signage.routes'));

// Phase 3 routes
app.use('/api/training/courses', require('./modules/training/training.routes'));
app.use('/api/environment',    require('./modules/environment/environment.routes'));
app.use('/api/cx',             require('./modules/cx/cx.routes'));

// Brand Hub
app.use('/api/brand-hub',      require('./modules/brand-hub/brand-hub.routes'));

// Phase 4 routes
app.use('/api/analytics',      require('./modules/analytics/analytics.routes'));

// ── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectRedis();
    await ensureBucket();
    app.listen(PORT, () => {
      console.log(`StorePrint API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
