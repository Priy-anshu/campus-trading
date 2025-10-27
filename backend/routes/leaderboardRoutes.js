import express from 'express';
import { authRequired, optionalAuth } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to get IST date (start of day)
function getISTDate() {
  const now = new Date();
  const offset = 330; // IST is UTC+5:30 (330 minutes)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * (offset / 60)));
  ist.setHours(0, 0, 0, 0);
  return ist;
}

// Helper function to get start of month in IST
function getStartOfMonthIST() {
  const istDate = getISTDate();
  istDate.setDate(1);
  return istDate;
}

// Check if daily reset is needed
function needsDailyReset(lastReset) {
  const today = getISTDate();
  const lastResetDate = new Date(lastReset);
  lastResetDate.setHours(0, 0, 0, 0);
  
  return today.getTime() > lastResetDate.getTime();
}

// Check if monthly reset is needed
function needsMonthlyReset(lastReset) {
  const startOfMonth = getStartOfMonthIST();
  const lastResetDate = new Date(lastReset);
  lastResetDate.setHours(0, 0, 0, 0);
  
  return startOfMonth.getTime() > lastResetDate.getTime();
}

// Get leaderboard data (with optional auth to get user's position if logged in)
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { period = 'overall' } = req.query; // 'day', 'month', 'overall'
    const { limit = 100 } = req.query;
    const userId = req.userId || null; // Get userId if authenticated (optional)

    // Get all users with their profit data
    // If userId is provided, we need all users to find their actual position
    const userQuery = User.find({}, 'username name dailyProfit monthlyProfit totalProfit lastDailyReset lastMonthlyReset lastPortfolioValue');
    
    // Only limit if userId is not provided
    if (!userId) {
      userQuery.sort({ [period === 'day' ? 'dailyProfit' : period === 'month' ? 'monthlyProfit' : 'totalProfit']: -1 })
      .limit(parseInt(limit));
    } else {
      userQuery.sort({ [period === 'day' ? 'dailyProfit' : period === 'month' ? 'monthlyProfit' : 'totalProfit']: -1 });
    }
    
    const users = await userQuery;

    // Check for daily/monthly resets and update if needed
    const today = getISTDate();
    const startOfMonth = getStartOfMonthIST();

    for (const user of users) {
      let needsUpdate = false;

      // Check daily reset
      if (needsDailyReset(user.lastDailyReset)) {
        user.dailyProfit = 0;
        user.lastDailyReset = today;
        needsUpdate = true;
      }

      // Check monthly reset
      if (needsMonthlyReset(user.lastMonthlyReset)) {
        user.monthlyProfit = 0;
        user.lastMonthlyReset = startOfMonth;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
      }
    }

    // For monthly leaderboard, we need to calculate the actual monthly profit
    // which includes today's earnings (since today is part of this month)
    let leaderboard;
    if (period === 'month') {
      // Calculate monthly profit as: current total profit - profit before this month started
      const usersWithMonthlyProfit = await Promise.all(users.map(async (user) => {
        // Import DailyProfitService to calculate current portfolio value and monthly return
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const monthlyReturn = await DailyProfitService.getMonthlyReturn(user._id);
        
        return {
          ...user.toObject(),
          calculatedMonthlyProfit: monthlyReturn
        };
      }));

      // Sort by calculated monthly profit
      usersWithMonthlyProfit.sort((a, b) => b.calculatedMonthlyProfit - a.calculatedMonthlyProfit);

      leaderboard = usersWithMonthlyProfit.map((user, index) => ({
        rank: index + 1,
        username: user.username || `user${user._id.toString().slice(-4)}`,
        name: user.name,
        totalProfit: user.calculatedMonthlyProfit,
        userId: user._id.toString()
      }));
    } else if (period === 'day') {
      // For daily leaderboard, calculate the actual daily profit
      const usersWithDailyProfit = await Promise.all(users.map(async (user) => {
        // Import DailyProfitService to calculate daily return
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const dailyReturn = await DailyProfitService.getOneDayReturn(user._id);
        
        return {
          ...user.toObject(),
          calculatedDailyProfit: dailyReturn
        };
      }));

      // Sort by calculated daily profit
      usersWithDailyProfit.sort((a, b) => b.calculatedDailyProfit - a.calculatedDailyProfit);

      leaderboard = usersWithDailyProfit.map((user, index) => ({
        rank: index + 1,
        username: user.username || `user${user._id.toString().slice(-4)}`,
        name: user.name,
        totalProfit: user.calculatedDailyProfit,
        userId: user._id.toString()
      }));
    } else {
      // For overall leaderboard, calculate the actual total profit
      const usersWithTotalProfit = await Promise.all(users.map(async (user) => {
        // Import DailyProfitService to calculate current portfolio value
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(user._id);
        
        // Total profit = current portfolio value - initial wallet balance (100000)
        const totalProfit = currentPortfolioValue - 100000;
        
        return {
          ...user.toObject(),
          calculatedTotalProfit: totalProfit
        };
      }));

      // Sort by calculated total profit
      usersWithTotalProfit.sort((a, b) => b.calculatedTotalProfit - a.calculatedTotalProfit);

      leaderboard = usersWithTotalProfit.map((user, index) => ({
        rank: index + 1,
        username: user.username || `user${user._id.toString().slice(-4)}`,
        name: user.name,
        totalProfit: user.calculatedTotalProfit,
        userId: user._id.toString()
      }));
    }

    // Smart leaderboard logic: if userId provided and not in top 20, show top 19 + user
    let finalLeaderboard = leaderboard;
    if (userId && leaderboard.length >= 20) {
      const userEntry = leaderboard.find(entry => entry.userId.toString() === userId.toString());
      const top20 = leaderboard.slice(0, 20);
      const userIsInTop20 = top20.some(entry => entry.userId.toString() === userId.toString());
      
      // If user is not in top 20 and we found the user, replace 20th with user's position
      if (!userIsInTop20 && userEntry) {
        finalLeaderboard = [
          ...top20.slice(0, 19),
          userEntry // User's actual position
        ];
      }
    }

    res.json({ 
      success: true, 
      data: finalLeaderboard,
      period,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data'
    });
  }
});

// Get user's rank in leaderboard
router.get('/leaderboard/rank', authRequired, async (req, res) => {
  try {
    const { period = 'overall' } = req.query;
    const userId = req.userId;

    let users;
    if (period === 'month') {
      // For monthly leaderboard, calculate the actual monthly profit
      const allUsers = await User.find({}, 'username name dailyProfit monthlyProfit totalProfit');
      
      const usersWithMonthlyProfit = await Promise.all(allUsers.map(async (user) => {
        // Import DailyProfitService to calculate monthly return
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const monthlyReturn = await DailyProfitService.getMonthlyReturn(user._id);
        
        return {
          ...user.toObject(),
          calculatedMonthlyProfit: monthlyReturn
        };
      }));

      // Sort by calculated monthly profit
      usersWithMonthlyProfit.sort((a, b) => b.calculatedMonthlyProfit - a.calculatedMonthlyProfit);
      users = usersWithMonthlyProfit;
    } else if (period === 'day') {
      // For daily leaderboard, calculate the actual daily profit
      const allUsers = await User.find({}, 'username name dailyProfit monthlyProfit totalProfit');
      
      const usersWithDailyProfit = await Promise.all(allUsers.map(async (user) => {
        // Import DailyProfitService to calculate daily return
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const dailyReturn = await DailyProfitService.getOneDayReturn(user._id);
        
        return {
          ...user.toObject(),
          calculatedDailyProfit: dailyReturn
        };
      }));

      // Sort by calculated daily profit
      usersWithDailyProfit.sort((a, b) => b.calculatedDailyProfit - a.calculatedDailyProfit);
      users = usersWithDailyProfit;
    } else {
      // For overall leaderboard, calculate the actual total profit
      const allUsers = await User.find({}, 'username name dailyProfit monthlyProfit totalProfit');
      
      const usersWithTotalProfit = await Promise.all(allUsers.map(async (user) => {
        // Import DailyProfitService to calculate current portfolio value
        const { DailyProfitService } = await import('../services/DailyProfitService.js');
        const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(user._id);
        
        // Total profit = current portfolio value - initial wallet balance (100000)
        const totalProfit = currentPortfolioValue - 100000;
        
        return {
          ...user.toObject(),
          calculatedTotalProfit: totalProfit
        };
      }));

      // Sort by calculated total profit
      usersWithTotalProfit.sort((a, b) => b.calculatedTotalProfit - a.calculatedTotalProfit);
      users = usersWithTotalProfit;
    }

    // Find user's rank
    const userIndex = users.findIndex(user => user._id.toString() === userId);
    const rank = userIndex !== -1 ? userIndex + 1 : null;

    res.json({
      success: true,
      data: {
        rank,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank'
    });
  }
});

export default router;