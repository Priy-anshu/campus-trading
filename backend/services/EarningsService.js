import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import DailyProfit from '../models/DailyProfit.js';
import { getStartOfDayIST, getStartOfMonthIST } from '../utils/timeUtils.js';

class EarningsService {
  constructor() {
    this.isInitialized = false;
    this.updateInterval = null;
    this.cache = new Map(); // In-memory cache for fast access
  }

  /**
   * Initialize the earnings system
   */
  async initialize() {
    try {
      
      // Load all users and create leaderboard entries
      const users = await User.find({});
      
      for (const user of users) {
        await this.ensureLeaderboardEntry(user);
        await this.loadUserToCache(user._id);
      }
      
      this.isInitialized = true;
      
      // Start 14-minute update interval
      this.startUpdateInterval();
      
    } catch (error) {
      console.error('❌ Error initializing earnings system:', error);
      throw error;
    }
  }

  /**
   * Ensure user has a leaderboard entry
   */
  async ensureLeaderboardEntry(user) {
    try {
      let leaderboardEntry = await Leaderboard.findOne({ userId: user._id });
      
      if (!leaderboardEntry) {
        try {
          // Create new leaderboard entry
          leaderboardEntry = await Leaderboard.create({
            userId: user._id,
            userName: user.name,
            dayEarning: user.dailyProfit || 0,
            monthEarning: user.monthlyProfit || 0,
            overallEarning: user.totalProfit || 0,
            currentPortfolioValue: await this.calculatePortfolioValue(user._id),
            lastPortfolioValue: await this.calculatePortfolioValue(user._id)
          });
          
        } catch (createError) {
          if (createError.code === 11000) {
            // Duplicate key error - entry already exists, fetch it
            leaderboardEntry = await Leaderboard.findOne({ userId: user._id });
          } else {
            throw createError;
          }
        }
      } else {
        // Update existing entry with current data
        leaderboardEntry.dayEarning = user.dailyProfit || 0;
        leaderboardEntry.monthEarning = user.monthlyProfit || 0;
        leaderboardEntry.overallEarning = user.totalProfit || 0;
        leaderboardEntry.currentPortfolioValue = await this.calculatePortfolioValue(user._id);
        await leaderboardEntry.save();
      }
      
      return leaderboardEntry;
      
    } catch (error) {
      console.error(`❌ Error ensuring leaderboard entry for user ${user._id}:`, error);
      throw error;
    }
  }

  /**
   * Load user data into cache
   */
  async loadUserToCache(userId) {
    try {
      const leaderboardEntry = await Leaderboard.findOne({ userId });
      if (!leaderboardEntry) return;

      this.cache.set(userId.toString(), {
        userId: leaderboardEntry.userId,
        userName: leaderboardEntry.userName,
        dayEarning: leaderboardEntry.dayEarning,
        monthEarning: leaderboardEntry.monthEarning,
        overallEarning: leaderboardEntry.overallEarning,
        lastDayEarning: leaderboardEntry.lastDayEarning,
        lastMonthEarning: leaderboardEntry.lastMonthEarning,
        lastDayReset: leaderboardEntry.lastDayReset,
        lastMonthReset: leaderboardEntry.lastMonthReset,
        currentPortfolioValue: leaderboardEntry.currentPortfolioValue,
        lastPortfolioValue: leaderboardEntry.lastPortfolioValue
      });
      
    } catch (error) {
      console.error(`❌ Error loading user ${userId} to cache:`, error);
    }
  }

  /**
   * Calculate current portfolio value for a user
   */
  async calculatePortfolioValue(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 100000; // Default initial value

      // For now, return wallet balance as portfolio value
      // This can be enhanced later to include actual holdings calculation
      return user.walletBalance || 100000;
      
    } catch (error) {
      console.error(`❌ Error calculating portfolio value for user ${userId}:`, error);
      return 100000; // Default initial value
    }
  }

  /**
   * Update earnings for a user (called when transactions occur)
   */
  async updateEarnings(userId, amount) {
    if (!this.isInitialized) {
      console.warn('⚠️ Earnings system not initialized');
      return;
    }

    try {
      const userKey = userId.toString();
      let userData = this.cache.get(userKey);
      
      if (!userData) {
        // Load user if not in cache
        await this.loadUserToCache(userId);
        userData = this.cache.get(userKey);
        if (!userData) {
          console.warn(`⚠️ User ${userId} not found in cache`);
          return;
        }
      }

      // Check for resets before updating
      await this.checkAndResetEarnings(userData);

      // Update earnings
      userData.dayEarning += amount;
      userData.monthEarning += amount;
      userData.overallEarning += amount;

      // Update portfolio value
      userData.currentPortfolioValue = await this.calculatePortfolioValue(userId);

      
    } catch (error) {
      console.error(`❌ Error updating earnings for user ${userId}:`, error);
    }
  }

  /**
   * Check if earnings need to be reset and handle resets
   */
  async checkAndResetEarnings(userData) {
    const today = getStartOfDayIST();
    const startOfMonth = getStartOfMonthIST();

    // Check daily reset
    const isNewDay = !userData.lastDayReset || 
      userData.lastDayReset.toISOString().split('T')[0] !== today.toISOString().split('T')[0];

    if (isNewDay) {
      
      // Save yesterday's earnings
      userData.lastDayEarning = userData.dayEarning;
      userData.dayEarning = 0;
      userData.lastDayReset = today;
    }

    // Check monthly reset
    const isNewMonth = !userData.lastMonthReset || 
      userData.lastMonthReset.toISOString().split('T')[0] !== startOfMonth.toISOString().split('T')[0];

    if (isNewMonth) {
      
      // Save last month's earnings
      userData.lastMonthEarning = userData.monthEarning;
      userData.monthEarning = 0;
      userData.lastMonthReset = startOfMonth;
    }
  }

  /**
   * Get earnings for a user
   */
  getEarnings(userId) {
    if (!this.isInitialized) return null;
    
    const userData = this.cache.get(userId.toString());
    if (!userData) return null;

    return {
      dayEarning: userData.dayEarning,
      monthEarning: userData.monthEarning,
      overallEarning: userData.overallEarning,
      lastDayEarning: userData.lastDayEarning,
      lastMonthEarning: userData.lastMonthEarning,
      currentPortfolioValue: userData.currentPortfolioValue,
      lastPortfolioValue: userData.lastPortfolioValue
    };
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(period = 'overall') {
    if (!this.isInitialized) return [];

    const leaderboardData = [];
    
    for (const [userId, userData] of this.cache) {
      // Check for resets before returning data
      await this.checkAndResetEarnings(userData);
      
      leaderboardData.push({
        userId: userData.userId,
        userName: userData.userName,
        dayEarning: userData.dayEarning,
        monthEarning: userData.monthEarning,
        overallEarning: userData.overallEarning,
        lastDayEarning: userData.lastDayEarning,
        lastMonthEarning: userData.lastMonthEarning,
        currentPortfolioValue: userData.currentPortfolioValue
      });
    }

    // Sort by requested period
    let sortedData = [];
    switch (period) {
      case 'day':
        sortedData = leaderboardData.sort((a, b) => b.dayEarning - a.dayEarning);
        break;
      case 'month':
        sortedData = leaderboardData.sort((a, b) => b.monthEarning - a.monthEarning);
        break;
      case 'overall':
      default:
        sortedData = leaderboardData.sort((a, b) => b.overallEarning - a.overallEarning);
        break;
    }

    // Add ranks
    return sortedData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /**
   * Start 14-minute update interval
   */
  startUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      await this.updateAllEarnings();
    }, 14 * 60 * 1000); // 14 minutes
    
  }

  /**
   * Update all users' earnings in database
   */
  async updateAllEarnings() {
    if (!this.isInitialized) return;

    try {
      
      const updatePromises = [];
      
      for (const [userId, userData] of this.cache) {
        // Check for resets
        await this.checkAndResetEarnings(userData);
        
        // Update database
        const updatePromise = Leaderboard.findOneAndUpdate(
          { userId: userData.userId },
          {
            dayEarning: userData.dayEarning,
            monthEarning: userData.monthEarning,
            overallEarning: userData.overallEarning,
            lastDayEarning: userData.lastDayEarning,
            lastMonthEarning: userData.lastMonthEarning,
            lastDayReset: userData.lastDayReset,
            lastMonthReset: userData.lastMonthReset,
            currentPortfolioValue: userData.currentPortfolioValue,
            lastPortfolioValue: userData.lastPortfolioValue
          },
          { new: true }
        );
        updatePromises.push(updatePromise);
      }

      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error('❌ Error updating all earnings:', error);
    }
  }

  /**
   * Force update database (manual trigger)
   */
  async forceUpdateDatabase() {
    await this.updateAllEarnings();
  }

  /**
   * Add new user to system
   */
  async addUser(userId, userName) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      await this.ensureLeaderboardEntry(user);
      await this.loadUserToCache(userId);
      
      
    } catch (error) {
      console.error(`❌ Error adding user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      userCount: this.cache.size,
      hasUpdateInterval: !!this.updateInterval
    };
  }

  /**
   * Stop the update interval
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Create singleton instance
const earningsService = new EarningsService();
export default earningsService;
