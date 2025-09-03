require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');

// Import middleware
const { rateLimits, securityHeaders, requestLogger, mongoSanitize, hpp } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');

// Import services
const socketService = require('./services/socketService');
const cacheService = require('./services/cacheService');

const { connectDB } = require('./config/database');
const { initializeDatabase } = require('./scripts/migrate');

// Import routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const matchesRoutes = require('./routes/matches');
const ticketsRoutes = require('./routes/tickets');
const merchandiseRoutes = require('./routes/merchandise');
const playersRoutes = require('./routes/players');
const galleryRoutes = require('./routes/gallery');
const notificationsRoutes = require('./routes/notifications');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const scannerRoutes = require('./routes/scanner');
const analyticsRoutes = require('./routes/analytics');
const swaggerRoutes = require('./routes/swagger');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(securityHeaders);
app.use(compression());
app.use(cookieParser());
app.use(requestLogger);
app.use(mongoSanitize);
app.use(hpp);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', rateLimits.general);
app.use('/api/auth/', rateLimits.auth);
app.use('/api/upload/', rateLimits.upload);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Static file serving with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Health check with detailed info
app.get('/health', async (req, res) => {
  try {
    const db = getDB();
    await db.query('SELECT 1');
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      cache: cacheService.isConnected ? 'connected' : 'disconnected',
      activeConnections: socketService.getConnectedUsersCount()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/docs', swaggerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === '23505') {
    return res.status(409).json({ error: 'Data already exists' });
  }
  
  if (error.code === '23503') {
    return res.status(400).json({ error: 'Referenced data does not exist' });
  }
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Initialize database schema
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Initialize Socket.IO
    socketService.initialize(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 Socket.IO enabled`);
      console.log(`💾 Cache service: ${cacheService.isConnected ? 'connected' : 'disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;