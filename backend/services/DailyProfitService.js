import User from '../models/User.js';
import DailyEarnings from '../models/DailyEarnings.js';
import DailyProfit from '../models/DailyProfit.js';
import { getStartOfDayIST, getStartOfMonthIST } from '../utils/timeUtils.js';

/**
 * Service to track and calculate daily profits for users
 */
export class DailyProfitService {
  /**
   * Calculate and update daily profit for a user
   * @param {string} userId - User ID
   * @param {number} currentPortfolioValue - Current total portfolio value
   * @param {number} previousPortfolioValue - Previous portfolio value (from last calculation)
   */
  static async updateDailyProfit(userId, currentPortfolioValue, previousPortfolioValue = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found for daily profit update`);
        return;
      }

      const today = getStartOfDayIST();
      const startOfMonth = getStartOfMonthIST();
      
      // Check if it's a new day
      const isNewDay = user.lastDailyReset < today;
      const isNewMonth = user.lastMonthlyReset < startOfMonth;

      // If it's a new day, reset daily profit and store yesterday's earnings
      if (isNewDay) {
        // Store yesterday's total earnings for 1-day return calculation
        user.yesterdayTotalEarnings = user.lastPortfolioValue || currentPortfolioValue;
        user.dailyProfit = 0;
        user.lastDailyReset = today;
      }

      // If it's a new month, reset monthly profit and store last month's earnings
      if (isNewMonth) {
        user.lastMonthTotalEarnings = user.lastPortfolioValue || currentPortfolioValue;
        user.monthlyProfit = 0;
        user.lastMonthlyReset = startOfMonth;
      }

      // Calculate daily earnings (current value - initial investment)
      const initialInvestment = 100000; // Initial wallet balance
      const dailyEarnings = currentPortfolioValue - initialInvestment;
      
      // Calculate the change in portfolio value for tracking
      let profitChange = 0;
      if (previousPortfolioValue !== null) {
        profitChange = currentPortfolioValue - previousPortfolioValue;
      }

      // Update daily and monthly profits with earnings
      if (isNewDay) {
        user.dailyProfit = dailyEarnings; // Set daily profit to total earnings for new day
      } else {
        user.dailyProfit = dailyEarnings; // Update to current total earnings
      }
      
      if (isNewMonth) {
        user.monthlyProfit = dailyEarnings; // Set monthly profit to total earnings for new month
      } else {
        user.monthlyProfit = dailyEarnings; // Update to current total earnings
      }
      
      user.totalProfit = dailyEarnings;
      user.lastPortfolioValue = currentPortfolioValue;
      
      await user.save();

      // Store daily earnings record
      await this.storeDailyEarningsRecord(userId, currentPortfolioValue);
      
      // Store daily profit record
      await this.storeDailyProfitRecord(userId, dailyEarnings, currentPortfolioValue);

      console.log(`[${new Date().toISOString()}] Updated daily profit for user ${userId}: ${dailyEarnings.toFixed(2)}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error updating daily profit for user ${userId}:`, error.message);
    }
  }

  /**
   * Store daily earnings record in DailyEarnings collection
   */
  static async storeDailyEarningsRecord(userId, totalEarnings) {
    try {
      const today = getStartOfDayIST();
      
      // Find or create today's record
      let dailyRecord = await DailyEarnings.findOne({ 
        user: userId, 
        date: today 
      });

      if (!dailyRecord) {
        // Get yesterday's record for daily return calculation
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayRecord = await DailyEarnings.findOne({ 
          user: userId, 
          date: yesterday 
        }).sort({ date: -1 });

        // Get start of month record for monthly return calculation
        const startOfMonth = getStartOfMonthIST();
        const monthStartRecord = await DailyEarnings.findOne({ 
          user: userId, 
          date: startOfMonth 
        }).sort({ date: -1 });

        const dailyReturn = yesterdayRecord ? totalEarnings - yesterdayRecord.totalEarnings : 0;
        const monthlyReturn = monthStartRecord ? totalEarnings - monthStartRecord.totalEarnings : 0;

        dailyRecord = new DailyEarnings({
          user: userId,
          date: today,
          totalEarnings, // Store total portfolio value
          dailyReturn,
          monthlyReturn
        });
      } else {
        // Update existing record
        dailyRecord.totalEarnings = totalEarnings;
        
        // Recalculate returns
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayRecord = await DailyEarnings.findOne({ 
          user: userId, 
          date: yesterday 
        }).sort({ date: -1 });

        const startOfMonth = getStartOfMonthIST();
        const monthStartRecord = await DailyEarnings.findOne({ 
          user: userId, 
          date: startOfMonth 
        }).sort({ date: -1 });

        dailyRecord.dailyReturn = yesterdayRecord ? totalEarnings - yesterdayRecord.totalEarnings : 0;
        dailyRecord.monthlyReturn = monthStartRecord ? totalEarnings - monthStartRecord.totalEarnings : 0;
      }

      await dailyRecord.save();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error storing daily earnings record:`, error.message);
    }
  }

  /**
   * Store daily profit record in DailyProfit collection
   */
  static async storeDailyProfitRecord(userId, dailyProfitChange, totalValue) {
    try {
      const today = getStartOfDayIST();
      
      // Find or create today's record
      let dailyRecord = await DailyProfit.findOne({ 
        userId: userId, 
        date: today 
      });
      
      if (!dailyRecord) {
        dailyRecord = new DailyProfit({
          userId: userId,
          date: today,
          profit: dailyProfitChange, // Store daily profit change
          totalValue: totalValue,
          trades: 0
        });
      } else {
        // Update existing record with cumulative daily profit
        dailyRecord.profit = dailyProfitChange; // Store the cumulative daily profit
        dailyRecord.totalValue = totalValue;
      }
      
      await dailyRecord.save();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error storing daily profit record:`, error.message);
    }
  }

  /**
   * Get daily profit for a user
   */
  static async getDailyProfit(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const today = getStartOfDayIST();
      const isNewDay = user.lastDailyReset < today;

      if (isNewDay) {
        return 0; // New day, no profit yet
      }

      return user.dailyProfit || 0;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error getting daily profit for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Get 1-day return for a user (today's total earnings - yesterday's total earnings)
   */
  static async getOneDayReturn(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const currentPortfolioValue = await this.calculatePortfolioValue(userId);
      const yesterdayTotalEarnings = user.yesterdayTotalEarnings || 0;
      
      return currentPortfolioValue - yesterdayTotalEarnings;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error getting 1-day return for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Get monthly return for a user (today's total earnings - start of month total earnings)
   */
  static async getMonthlyReturn(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const currentPortfolioValue = await this.calculatePortfolioValue(userId);
      const lastMonthTotalEarnings = user.lastMonthTotalEarnings || 0;
      
      return currentPortfolioValue - lastMonthTotalEarnings;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error getting monthly return for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate portfolio value for a user
   */
  static async calculatePortfolioValue(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      // Get user's holdings from portfolio
      const Portfolio = (await import('../models/Portfolio.js')).default;
      const portfolio = await Portfolio.findOne({ user: userId });
      
      if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        return user.walletBalance;
      }

      // Calculate total portfolio value
      let totalValue = user.walletBalance;

      // Import stock cache to get current prices
      const { getAll } = await import('./StockCache.js');
      const stockCache = getAll();

      for (const holding of portfolio.holdings) {
        const stock = stockCache.find(s => s.symbol === holding.symbol);
        if (stock) {
          totalValue += holding.quantity * stock.lastPrice;
        }
      }

      return totalValue;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error calculating portfolio value for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Update daily profits for all users (called periodically)
   */
  static async updateAllUsersDailyProfits() {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const currentValue = await this.calculatePortfolioValue(user._id);
        
        // Get previous value from last calculation (stored in user's lastPortfolioValue or calculate)
        const previousValue = user.lastPortfolioValue || currentValue;
        
        // Update daily profit
        await this.updateDailyProfit(user._id, currentValue, previousValue);
        
        // Store current value for next calculation
        user.lastPortfolioValue = currentValue;
        await user.save();
      }

      console.log(`[${new Date().toISOString()}] Updated daily profits for ${users.length} users`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error updating all users daily profits:`, error.message);
    }
  }
}

export default DailyProfitService;
