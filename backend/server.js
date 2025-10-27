import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import earningsRoutes from './routes/earningsRoutes.js';
import { loadStocksFromDatabase } from './services/StockCache.js';
import { initializeLeaderboard } from './services/LeaderboardService.js';
import { startCronJobs } from './services/CronService.js';
import DailyProfitService from './services/DailyProfitService.js';
import earningsCache from './services/EarningsCache.js';
import earningsService from './services/EarningsService.js';

dotenv.config();

const app = express();

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

// Logging middleware - disabled for clean output
// if (process.env.NODE_ENV === 'production') {
//   app.use(morgan('combined'));
// } else {
//   app.use(morgan('dev'));
// }

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://campus-trading.vercel.app',  // New Vercel deployment
      'https://campus-trading.netlify.app', // Keep for future Netlify use
      'https://campus-trading-app.netlify.app',
      'https://campus-trading-frontend.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ]
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

// CORS middleware - Simplified for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log but allow for production - can be strict in development
      console.log(`⚠️ Unlisted origin: ${origin}`);
      if (process.env.NODE_ENV === 'production') {
        // In production, be more lenient
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api/earnings', earningsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';
  
  res.status(status).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Port and MongoDB URI
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

// Start server
async function start() {
  try {
    // MongoDB connection with production-ready options
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    // Deprecated options removed - no longer needed in modern MongoDB driver

           await mongoose.connect(MONGO_URI, mongooseOptions);
    
    // Wait for connection to be ready and ensure it's established
    await new Promise(resolve => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    // Load stock data from database on startup
    await loadStocksFromDatabase();
    
    // Initialize leaderboard for all users
    await initializeLeaderboard();
    
    // Initialize comprehensive earnings system
    await earningsService.initialize();
    
    // Initialize legacy earnings cache (for backward compatibility)
    await earningsCache.initialize();
    
    // Start cron jobs for daily/monthly resets
    startCronJobs();
    
    // Start periodic daily profit updates (every 5 minutes)
    setInterval(async () => {
      try {
        await DailyProfitService.updateAllUsersDailyProfits();
      } catch (error) {
        console.error('Error in periodic daily profit update:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
           app.listen(PORT, '0.0.0.0', () => {
             console.log(`✅ Server running on http://localhost:${PORT}`);
             console.log(`✅ Health check available at http://localhost:${PORT}/health`);
             console.log(`✅ CORS enabled for Vercel: https://campus-trading.vercel.app`);
             if (mongoose.connection.readyState !== 1) {
               console.log('⚠️ Note: Database features are disabled due to connection issues');
             }
           });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

start();