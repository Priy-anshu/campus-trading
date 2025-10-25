import User from '../models/User.js';
import DailyProfit from '../models/DailyProfit.js';

class EarningsCache {
  constructor() {
    // In-memory cache for fast access
    this.cache = new Map();
    this.isInitialized = false;
    this.updateInterval = null;
  }

  /**
   * Initialize the cache by loading data from database
   */
  async initialize() {
    try {
      console.log('🔄 Initializing earnings cache...');
      
      // Load all users and their current earnings
      const users = await User.find({}).select('_id name dailyProfit monthlyProfit totalProfit lastDailyReset lastMonthlyReset');
      
      for (const user of users) {
        // Calculate monthly earnings from historical daily profit records
        const monthlyEarning = await this.calculateMonthlyEarnings(user._id);
        
        this.cache.set(user._id.toString(), {
          userId: user._id,
          name: user.name,
          dailyEarning: user.dailyProfit || 0,
          monthlyEarning: monthlyEarning,
          overallEarning: user.totalProfit || 0,
          lastDailyReset: user.lastDailyReset,
          lastMonthlyReset: user.lastMonthlyReset
        });
      }
      
      this.isInitialized = true;
      console.log(`✅ Earnings cache initialized with ${this.cache.size} users`);
      
      // Start the 14-minute update interval
      this.startUpdateInterval();
      
    } catch (error) {
      console.error('❌ Error initializing earnings cache:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly earnings from historical daily profit records
   */
  async calculateMonthlyEarnings(userId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Get all daily profit records for this month
      const dailyProfits = await DailyProfit.find({
        userId: userId,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }).sort({ date: 1 });
      
      // Sum up all daily profits for the month
      const monthlyEarning = dailyProfits.reduce((sum, record) => sum + (record.profit || 0), 0);
      
      console.log(`📊 Calculated monthly earnings for user ${userId}: ${monthlyEarning} (from ${dailyProfits.length} daily records)`);
      return monthlyEarning;
      
    } catch (error) {
      console.error('❌ Error calculating monthly earnings:', error);
      return 0;
    }
  }

  /**
   * Start the 14-minute interval for database updates
   */
  startUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Update database every 14 minutes (14 * 60 * 1000 ms)
    this.updateInterval = setInterval(async () => {
      await this.updateDatabase();
    }, 14 * 60 * 1000);
    
    console.log('⏰ Started 14-minute earnings update interval');
  }

  /**
   * Update earnings for a user (called when transactions occur)
   */
  updateEarnings(userId, amount) {
    if (!this.isInitialized) {
      console.warn('⚠️ Earnings cache not initialized');
      return;
    }

    const userKey = userId.toString();
    let userData = this.cache.get(userKey);
    
    if (!userData) {
      // Create new user entry if not exists
      userData = {
        userId: userId,
        name: 'Unknown User',
        dailyEarning: 0,
        monthlyEarning: 0,
        overallEarning: 0,
        lastDailyReset: null,
        lastMonthlyReset: null
      };
      this.cache.set(userKey, userData);
    }

    // Check if we need to reset daily/monthly earnings
    this.checkAndResetEarnings(userData);

    // Update earnings
    userData.dailyEarning += amount;
    userData.monthlyEarning += amount;
    userData.overallEarning += amount;

    console.log(`💰 Updated earnings for user ${userData.name}: +${amount} (Daily: ${userData.dailyEarning}, Monthly: ${userData.monthlyEarning}, Overall: ${userData.overallEarning})`);
  }

  /**
   * Check if daily/monthly earnings need to be reset
   */
  checkAndResetEarnings(userData) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check daily reset (12:00 AM IST)
    const lastDailyReset = userData.lastDailyReset ? new Date(userData.lastDailyReset) : null;
    const isNewDay = !lastDailyReset || lastDailyReset.toDateString() !== today.toDateString();

    if (isNewDay) {
      console.log(`🔄 Daily reset for user ${userData.name}: ${userData.dailyEarning} → 0`);
      userData.dailyEarning = 0;
      userData.lastDailyReset = today;
    }

    // Check monthly reset (start of month)
    const lastMonthlyReset = userData.lastMonthlyReset ? new Date(userData.lastMonthlyReset) : null;
    const isNewMonth = !lastMonthlyReset || 
      lastMonthlyReset.getFullYear() !== startOfMonth.getFullYear() || 
      lastMonthlyReset.getMonth() !== startOfMonth.getMonth();

    if (isNewMonth) {
      console.log(`🔄 Monthly reset for user ${userData.name}: ${userData.monthlyEarning} → 0`);
      userData.monthlyEarning = 0;
      userData.lastMonthlyReset = startOfMonth;
    }
  }

  /**
   * Get earnings for a user
   */
  getEarnings(userId) {
    if (!this.isInitialized) {
      return null;
    }

    const userData = this.cache.get(userId.toString());
    if (!userData) {
      return null;
    }

    // Check for resets before returning
    this.checkAndResetEarnings(userData);

    return {
      dailyEarning: userData.dailyEarning,
      monthlyEarning: userData.monthlyEarning,
      overallEarning: userData.overallEarning
    };
  }

  /**
   * Get all users' earnings (for leaderboard)
   */
  async getAllEarnings() {
    if (!this.isInitialized) {
      return [];
    }

    const earnings = [];
    for (const [userId, userData] of this.cache) {
      this.checkAndResetEarnings(userData);
      
      // Recalculate monthly earnings from historical data
      const monthlyEarning = await this.calculateMonthlyEarnings(userData.userId);
      
      earnings.push({
        userId: userData.userId,
        name: userData.name,
        dailyEarning: userData.dailyEarning,
        monthlyEarning: monthlyEarning,
        overallEarning: userData.overallEarning
      });
    }

    return earnings;
  }

  /**
   * Update database with current cache values
   */
  async updateDatabase() {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('💾 Updating earnings in database...');
      
      const updatePromises = [];
      
      for (const [userId, userData] of this.cache) {
        const updatePromise = User.findByIdAndUpdate(
          userData.userId,
          {
            dailyProfit: userData.dailyEarning,
            monthlyProfit: userData.monthlyEarning,
            totalProfit: userData.overallEarning,
            lastDailyReset: userData.lastDailyReset,
            lastMonthlyReset: userData.lastMonthlyReset
          },
          { new: true }
        );
        updatePromises.push(updatePromise);
      }

      await Promise.all(updatePromises);
      console.log(`✅ Updated earnings for ${this.cache.size} users in database`);
      
    } catch (error) {
      console.error('❌ Error updating earnings in database:', error);
    }
  }

  /**
   * Force update database (can be called manually)
   */
  async forceUpdateDatabase() {
    await this.updateDatabase();
  }

  /**
   * Add a new user to cache
   */
  addUser(userId, name) {
    const userData = {
      userId: userId,
      name: name,
      dailyEarning: 0,
      monthlyEarning: 0,
      overallEarning: 0,
      lastDailyReset: null,
      lastMonthlyReset: null
    };
    
    this.cache.set(userId.toString(), userData);
    console.log(`👤 Added new user to earnings cache: ${name}`);
  }

  /**
   * Stop the update interval
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Stopped earnings update interval');
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      userCount: this.cache.size,
      hasUpdateInterval: !!this.updateInterval
    };
  }
}

// Create singleton instance
const earningsCache = new EarningsCache();

export default earningsCache;
