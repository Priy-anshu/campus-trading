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
      
      // Check if it's a new day (compare date strings to avoid timezone issues)
      const isNewDay = !user.lastDailyReset || 
        user.lastDailyReset.toISOString().split('T')[0] !== today.toISOString().split('T')[0];
      
      const isNewMonth = !user.lastMonthlyReset || 
        user.lastMonthlyReset.toISOString().split('T')[0] !== startOfMonth.toISOString().split('T')[0];

      // If it's a new day, reset daily profit and store yesterday's earnings
      if (isNewDay) {
        // Check if user was created yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const userCreatedDate = user.createdAt ? 
          new Date(user.createdAt.toISOString().split('T')[0]) : null;
        const yesterdayDate = new Date(yesterday.toISOString().split('T')[0]);
        const userCreatedYesterday = userCreatedDate && 
          userCreatedDate.getTime() === yesterdayDate.getTime();
        
        // If user was created yesterday, set yesterdayTotalEarnings to current value
        // This ensures their 1-day return will be 0 (they haven't had a baseline yet)
        // Otherwise, use lastPortfolioValue (normal case for existing users)
        if (userCreatedYesterday) {
          user.yesterdayTotalEarnings = currentPortfolioValue;
        } else {
          user.yesterdayTotalEarnings = user.lastPortfolioValue || currentPortfolioValue;
        }
        
        user.dailyProfit = 0;
        user.lastDailyReset = today;
      }

      // If it's a new month, reset monthly profit and store start of month portfolio value
      if (isNewMonth) {
        // Check if user was created this month
        const userCreatedDate = user.createdAt ? 
          new Date(user.createdAt.toISOString().split('T')[0]) : null;
        const userCreatedThisMonth = userCreatedDate && 
          userCreatedDate.getFullYear() === startOfMonth.getFullYear() &&
          userCreatedDate.getMonth() === startOfMonth.getMonth();
        
        // If user was created this month, set startOfMonthPortfolioValue to current value
        // This ensures their monthly return will be 0 (they haven't had a baseline yet)
        // Otherwise, use lastPortfolioValue (normal case for existing users)
        if (userCreatedThisMonth) {
          user.startOfMonthPortfolioValue = currentPortfolioValue;
          user.lastMonthTotalEarnings = currentPortfolioValue;
        } else {
          user.startOfMonthPortfolioValue = currentPortfolioValue;
          user.lastMonthTotalEarnings = user.lastPortfolioValue || currentPortfolioValue;
        }
        
        user.monthlyProfit = 0;
        user.lastMonthlyReset = startOfMonth;
      } else {
        // Same month - ensure we have the start of month portfolio value set
        if (!user.startOfMonthPortfolioValue) {
          user.startOfMonthPortfolioValue = 100000; // Default to initial investment
        }
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
        user.dailyProfit = 0; // Reset to 0 for new day
      } else {
        user.dailyProfit = dailyEarnings; // Update to current total earnings for same day
      }
      
      if (isNewMonth) {
        user.monthlyProfit = 0; // Reset to 0 for new month
      } else {
        user.monthlyProfit = dailyEarnings; // Update to current total earnings for same month
      }
      
      user.totalProfit = dailyEarnings;
      user.lastPortfolioValue = currentPortfolioValue;
      
      await user.save();

      // Store daily earnings record
      await this.storeDailyEarningsRecord(userId, currentPortfolioValue);
      
      // Store daily profit record (store 0 for new day, dailyEarnings for same day)
      const profitToStore = isNewDay ? 0 : dailyEarnings;
      await this.storeDailyProfitRecord(userId, profitToStore, currentPortfolioValue);

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
   * Note: Reset logic handles users created yesterday going forward, but we need to handle
   * existing users created yesterday who have incorrect data from old reset logic
   */
  static async getOneDayReturn(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const today = getStartOfDayIST();
      const currentPortfolioValue = await this.calculatePortfolioValue(userId);
      // Always show actual 1D P&L for every user, even if just created
      let yesterdayTotalEarnings = user.yesterdayTotalEarnings || 0;
      // Fallback for legacy/old user data:
      if (yesterdayTotalEarnings === 0 && user.lastPortfolioValue && user.lastPortfolioValue > 0) {
        yesterdayTotalEarnings = user.lastPortfolioValue;
      }
      return currentPortfolioValue - yesterdayTotalEarnings;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error getting 1-day return for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Get monthly return for a user (current portfolio value - start of month portfolio value)
   * Reset logic handles setting proper baselines for new users
   */
  static async getMonthlyReturn(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const currentPortfolioValue = await this.calculatePortfolioValue(userId);
      const startOfMonth = getStartOfMonthIST();
      
      // Check if we're in a new month
      const isNewMonth = !user.lastMonthlyReset || 
        user.lastMonthlyReset.toISOString().split('T')[0] !== startOfMonth.toISOString().split('T')[0];
      
      if (isNewMonth) {
        // New month - monthly return is current portfolio value - initial investment (100000)
        return currentPortfolioValue - 100000;
      } else {
        // Same month - monthly return is current portfolio value - start of month portfolio value
        // Reset logic will have set startOfMonthPortfolioValue correctly (either to current value
        // for users created this month, or to lastPortfolioValue for existing users)
        const startOfMonthValue = user.startOfMonthPortfolioValue || 100000;
        return currentPortfolioValue - startOfMonthValue;
      }
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
   * Update daily profits for all users (called periodically and at midnight)
   * This function ensures ALL users get proper daily/monthly resets regardless of activity
   */
  static async updateAllUsersDailyProfits(isScheduledReset = false) {
    try {
      const startTime = new Date();
      const users = await User.find({});
      
      let dailyResets = 0;
      let monthlyResets = 0;
      let errors = 0;
      
      // Only show initial log for scheduled resets or if verbose logging needed
      if (isScheduledReset) {
        console.log(`[${new Date().toISOString()}] Starting batch update for ${users.length} users`);
      }
      
      for (const user of users) {
        try {
          const currentValue = await this.calculatePortfolioValue(user._id);
          
          // Get previous value from last calculation (stored in user's lastPortfolioValue or calculate)
          const previousValue = user.lastPortfolioValue || currentValue;
          
          // Check what resets will happen (for logging)
          const today = getStartOfDayIST();
          const startOfMonth = getStartOfMonthIST();
          
          const isNewDay = !user.lastDailyReset || 
            user.lastDailyReset.toISOString().split('T')[0] !== today.toISOString().split('T')[0];
          
          const isNewMonth = !user.lastMonthlyReset || 
            user.lastMonthlyReset.toISOString().split('T')[0] !== startOfMonth.toISOString().split('T')[0];
          
          if (isNewDay) dailyResets++;
          if (isNewMonth) monthlyResets++;
          
          // Update daily profit (this handles both daily and monthly resets)
          await this.updateDailyProfit(user._id, currentValue, previousValue);
          
          // Store current value for next calculation
          user.lastPortfolioValue = currentValue;
          await user.save();
          
        } catch (userError) {
          console.error(`[${new Date().toISOString()}] Error updating user ${user._id}:`, userError.message);
          errors++;
        }
      }
      
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      // Only show detailed completion log if:
      // 1. It's a scheduled reset (midnight), OR
      // 2. There were actual resets, OR  
      // 3. There were errors
      if (isScheduledReset || dailyResets > 0 || monthlyResets > 0 || errors > 0) {
        console.log(`[${new Date().toISOString()}] Batch update completed in ${duration}s:`);
        console.log(`  - Users processed: ${users.length}`);
        console.log(`  - Daily resets: ${dailyResets}`);
        console.log(`  - Monthly resets: ${monthlyResets}`);
        console.log(`  - Errors: ${errors}`);
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error updating all users daily profits:`, error.message);
    }
  }
}

export default DailyProfitService;
