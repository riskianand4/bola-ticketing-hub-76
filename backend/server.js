require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;