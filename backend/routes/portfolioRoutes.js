import { Router } from 'express';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/authMiddleware.js';
import DailyProfitService from '../services/DailyProfitService.js';
import DailyProfit from '../models/DailyProfit.js';
import DailyEarnings from '../models/DailyEarnings.js';

const router = Router();

// Force daily reset for all users (no auth required for admin task)
router.post('/force-daily-reset', async (req, res) => {
  try {
    console.log('🔄 Forcing daily reset for all users...');
    
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to reset`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    for (const user of users) {
      try {
        // Force reset daily profit to 0 for new day
        user.dailyProfit = 0;
        user.lastDailyReset = today;
        user.yesterdayTotalEarnings = user.lastPortfolioValue || 100000;
        
        await user.save();
        
        console.log(`✅ Reset daily profit for user ${user.name || user.email}: 0`);
      } catch (error) {
        console.error(`❌ Error resetting user ${user.name || user.email}:`, error.message);
      }
    }
    
    console.log('✅ Daily reset completed for all users');
    res.status(200).json({ message: 'Daily profits reset to 0 for all users.' });
  } catch (error) {
    console.error('❌ Error during daily reset:', error.message);
    res.status(500).json({ message: 'Failed to reset daily profits.', error: error.message });
  }
});

// Recalculate daily profits for all users (no auth required for admin task)
router.post('/recalculate-daily-profits', async (req, res) => {
  try {
    console.log('🔄 Starting daily profit recalculation for all users...');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to recalculate`);
    
    for (const user of users) {
      try {
        // Calculate current portfolio value
        const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(user._id);
        
        // Update daily profit with new logic
        await DailyProfitService.updateDailyProfit(user._id, currentPortfolioValue, 0);
        
        console.log(`✅ Updated daily profit for user ${user.name || user.email}: ${currentPortfolioValue - 100000}`);
      } catch (error) {
        console.error(`❌ Error updating user ${user.name || user.email}:`, error.message);
      }
    }
    
    console.log('🎉 Daily profit recalculation completed!');
    res.json({ message: 'Daily profit recalculation completed successfully' });
  } catch (error) {
    console.error('❌ Error in daily profit recalculation:', error);
    res.status(500).json({ message: 'Error in daily profit recalculation' });
  }
});

router.use(authRequired);

// Generate sample data for testing
const generateSampleData = (period, limit) => {
  const data = [];
  const today = new Date();
  
  for (let i = limit - 1; i >= 0; i--) {
    const date = new Date(today);
    
    switch (period) {
      case 'day':
        date.setDate(date.getDate() - i);
        break;
      case 'month':
        date.setMonth(date.getMonth() - i);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - i);
        break;
      default:
        date.setDate(date.getDate() - i);
    }
    
    // Generate more realistic profit/loss data
    let profit;
    if (period === 'day') {
      // Daily: smaller variations
      profit = (Math.random() - 0.5) * 2000; // Between -1000 and 1000
    } else {
      // Monthly: larger variations
      profit = (Math.random() - 0.5) * 10000; // Between -5000 and 5000
    }
    
    const totalValue = 100000 + Math.random() * 50000; // Random between 100k and 150k
    const trades = Math.floor(Math.random() * 10) + 1; // Random between 1 and 10
    
    data.push({
      date: date.toISOString().split('T')[0],
      profit: Math.round(profit * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      trades: trades
    });
  }
  
  return data;
};

router.get('/', async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.userId });
  const user = await User.findById(req.userId).select('walletBalance dailyProfit totalProfit');
  if (!portfolio || !user) return res.status(404).json({ message: 'Portfolio not found' });
  
  // Calculate 1-day return
  const oneDayReturn = await DailyProfitService.getOneDayReturn(req.userId);
  const monthlyReturn = await DailyProfitService.getMonthlyReturn(req.userId);
  
  res.json({ 
    holdings: portfolio.holdings, 
    walletBalance: user.walletBalance,
    dailyProfit: user.dailyProfit || 0,
    totalProfit: user.totalProfit || 0,
    oneDayReturn: oneDayReturn,
    monthlyReturn: monthlyReturn
  });
});

router.put('/fund', async (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.walletBalance += amount;
  await user.save();
  res.json({ walletBalance: user.walletBalance });
});

router.post('/buy', async (req, res) => {
  const { symbol, quantity, price, orderCategory = 'delivery' } = req.body;
  if (!symbol || !quantity || !price) return res.status(400).json({ message: 'Missing fields' });
  if (quantity <= 0 || price <= 0) return res.status(400).json({ message: 'Invalid values' });

  const user = await User.findById(req.userId);
  const portfolio = await Portfolio.findOne({ user: req.userId });
  if (!user || !portfolio) return res.status(404).json({ message: 'Portfolio not found' });

  const cost = quantity * price;
  if (user.walletBalance < cost) return res.status(400).json({ message: 'Insufficient funds' });

  user.walletBalance -= cost;

  const existing = portfolio.holdings.find(h => h.symbol === symbol);
  if (existing) {
    const totalQty = existing.quantity + quantity;
    const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / totalQty;
    existing.quantity = totalQty;
    existing.avgPrice = newAvg;
  } else {
    portfolio.holdings.push({ symbol, quantity, avgPrice: price });
  }

  // Create order record
  const order = new Order({
    user: req.userId,
    symbol: symbol.toUpperCase(),
    orderType: 'buy',
    quantity,
    price,
    totalAmount: cost,
    orderCategory,
    status: 'completed'
  });

  await user.save();
  await portfolio.save();
  await order.save();
  
  // Update daily profit tracking
  try {
    const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(req.userId);
    await DailyProfitService.updateDailyProfit(req.userId, currentPortfolioValue, user.lastPortfolioValue);
    user.lastPortfolioValue = currentPortfolioValue;
    await user.save();
  } catch (error) {
    console.error('Error updating daily profit after buy:', error);
  }
  
  res.json({ 
    holdings: portfolio.holdings, 
    walletBalance: user.walletBalance,
    order: order
  });
});

router.post('/sell', async (req, res) => {
  const { symbol, quantity, price, orderCategory = 'delivery' } = req.body;
  if (!symbol || !quantity || !price) return res.status(400).json({ message: 'Missing fields' });
  if (quantity <= 0 || price <= 0) return res.status(400).json({ message: 'Invalid values' });

  const user = await User.findById(req.userId);
  const portfolio = await Portfolio.findOne({ user: req.userId });
  if (!user || !portfolio) return res.status(404).json({ message: 'Portfolio not found' });

  const existing = portfolio.holdings.find(h => h.symbol === symbol);
  if (!existing || existing.quantity < quantity) return res.status(400).json({ message: 'Not enough quantity' });

  existing.quantity -= quantity;
  if (existing.quantity === 0) {
    portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
  }

  const proceeds = quantity * price;
  user.walletBalance += proceeds;

  // Create order record
  const order = new Order({
    user: req.userId,
    symbol: symbol.toUpperCase(),
    orderType: 'sell',
    quantity,
    price,
    totalAmount: proceeds,
    orderCategory,
    status: 'completed'
  });

  await user.save();
  await portfolio.save();
  await order.save();
  
  // Update daily profit tracking
  try {
    const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(req.userId);
    await DailyProfitService.updateDailyProfit(req.userId, currentPortfolioValue, user.lastPortfolioValue);
    user.lastPortfolioValue = currentPortfolioValue;
    await user.save();
  } catch (error) {
    console.error('Error updating daily profit after sell:', error);
  }
  
  res.json({ 
    holdings: portfolio.holdings, 
    walletBalance: user.walletBalance,
    order: order
  });
});

// Get daily profit chart data
router.get('/daily-profit', async (req, res) => {
  try {
    const { period = 'day', limit = 30 } = req.query;
    const userId = req.userId;
    
    let startDate;
    const endDate = new Date();
    
    // Calculate start date based on period
    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(limit));
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(limit));
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - parseInt(limit));
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get daily profit records
    const dailyProfits = await DailyProfit.find({
      userId: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Get daily earnings records for total value
    const dailyEarnings = await DailyEarnings.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Combine the data
    const chartData = [];
    const earningsMap = new Map();
    dailyEarnings.forEach(earning => {
      const dateKey = earning.date.toISOString().split('T')[0];
      earningsMap.set(dateKey, earning);
    });
    
    dailyProfits.forEach(profit => {
      const dateKey = profit.date.toISOString().split('T')[0];
      const earnings = earningsMap.get(dateKey);
      
      chartData.push({
        date: dateKey,
        profit: profit.profit || 0,
        totalValue: earnings ? earnings.totalEarnings : profit.totalValue || 0,
        trades: profit.trades || 0
      });
    });
    
    // If no data, try to generate some initial data for the user
    if (chartData.length === 0) {
      try {
        // Calculate current portfolio value
        const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
        
        // Create today's record with actual daily profit calculation
        const user = await User.findById(userId);
        if (user && user.lastPortfolioValue) {
          const dailyProfitChange = currentPortfolioValue - user.lastPortfolioValue;
          await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, dailyProfitChange);
        } else {
          // If no previous value, assume 0 profit for today
          await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, 0);
        }
        
        // Try to fetch the data again
        const newDailyProfits = await DailyProfit.find({
          userId: userId,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });
        
        const newDailyEarnings = await DailyEarnings.find({
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });
        
        // Combine the new data
        const newChartData = [];
        const newEarningsMap = new Map();
        newDailyEarnings.forEach(earning => {
          const dateKey = earning.date.toISOString().split('T')[0];
          newEarningsMap.set(dateKey, earning);
        });
        
        newDailyProfits.forEach(profit => {
          const dateKey = profit.date.toISOString().split('T')[0];
          const earnings = newEarningsMap.get(dateKey);
          
          newChartData.push({
            date: dateKey,
            profit: profit.profit || 0,
            totalValue: earnings ? earnings.totalEarnings : profit.totalValue || 0,
            trades: profit.trades || 0
          });
        });
        
        if (newChartData.length > 0) {
          return res.json({ data: newChartData });
        }
      } catch (error) {
        console.error('Error creating initial data:', error);
      }
      
      // Return today's data even if no historical data
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate current portfolio value if not available
      let portfolioValue = currentPortfolioValue;
      if (!portfolioValue) {
        try {
          portfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
        } catch (error) {
          console.error('Error calculating portfolio value:', error);
          portfolioValue = 100000; // Default initial value
        }
      }
      
      const todayData = [{
        date: today,
        profit: 0, // Today's profit starts at 0
        totalValue: portfolioValue,
        trades: 0
      }];
      
      console.log('Returning today\'s data:', todayData);
      return res.json({ data: todayData });
    }
    
    res.json({ data: chartData });
  } catch (error) {
    console.error('Error fetching daily profit data:', error);
    res.status(500).json({ message: 'Error fetching daily profit data' });
  }
});

// Initialize historical data for existing users
router.post('/initialize-daily-data', async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calculate current portfolio value
    const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
    
    // Create records for the last 30 days
    const today = new Date();
    const records = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate some realistic daily profit/loss data
      const baseValue = currentPortfolioValue * 0.8; // Start from 80% of current value
      const dailyVariation = (Math.random() - 0.5) * (currentPortfolioValue * 0.05); // ±2.5% variation
      const dayValue = baseValue + dailyVariation + (i * currentPortfolioValue * 0.01); // Slight upward trend
      
      // Calculate daily profit change (difference from previous day)
      let dailyProfit = 0;
      if (i === 0) {
        // For today, calculate profit from yesterday
        const yesterdayValue = baseValue + (Math.random() - 0.5) * (currentPortfolioValue * 0.05) + ((i-1) * currentPortfolioValue * 0.01);
        dailyProfit = dayValue - yesterdayValue;
      } else {
        // For historical days, calculate profit from previous day
        const previousDayValue = baseValue + (Math.random() - 0.5) * (currentPortfolioValue * 0.05) + ((i-1) * currentPortfolioValue * 0.01);
        dailyProfit = dayValue - previousDayValue;
      }
      
      records.push({
        userId: userId,
        date: date,
        profit: Math.round(dailyProfit), // Store daily profit change
        totalValue: Math.round(dayValue),
        trades: Math.floor(Math.random() * 5) + 1
      });
    }
    
    // Insert records
    await DailyProfit.insertMany(records);
    
    // Also create DailyEarnings records
    const earningsRecords = records.map(record => ({
      user: userId,
      date: record.date,
      totalEarnings: record.totalValue, // Store total portfolio value
      dailyReturn: record.profit, // Store daily profit change
      monthlyReturn: record.profit // Simplified for now
    }));
    
    await DailyEarnings.insertMany(earningsRecords);
    
    res.json({ 
      message: 'Historical data initialized successfully',
      recordsCreated: records.length 
    });
  } catch (error) {
    console.error('Error initializing daily data:', error);
    res.status(500).json({ message: 'Error initializing daily data' });
  }
});

export default router;

