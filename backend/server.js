import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { loadStocksFromDatabase } from './services/StockCache.js';
import { initializeLeaderboard } from './services/LeaderboardService.js';
import { startCronJobs } from './services/CronService.js';
import DailyProfitService from './services/DailyProfitService.js';

dotenv.config();

const app = express();

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://campus-trading.netlify.app'] // production frontend
  : ['http://localhost:3000']; // local development frontend

// CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', leaderboardRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// Port and MongoDB URI
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_exchange';

// Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Load stock data from database on startup
    await loadStocksFromDatabase();
    
    // Initialize leaderboard for all users
    await initializeLeaderboard();
    
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
    
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

start();