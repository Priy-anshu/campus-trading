import User from '../models/User.js';
import DailyProfitService from './DailyProfitService.js';

class LeaderboardService {
  static async getLeaderboard(period) {
    try {
      const users = await User.find({}).select('name username dailyProfit monthlyProfit totalProfit');
      
      const leaderboardData = await Promise.all(
        users.map(async (user) => {
          const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(user._id);
          
          let profit = 0;
          if (period === 'day') {
            profit = await DailyProfitService.getOneDayReturn(user._id);
          } else if (period === 'month') {
            profit = await DailyProfitService.getMonthlyReturn(user._id);
          } else if (period === 'overall') {
            profit = currentPortfolioValue - 100000; // Initial investment
          }

          return {
            id: user._id,
            name: user.name,
            username: user.username,
            profit: profit || 0
          };
        })
      );

      // Sort by profit (descending)
      leaderboardData.sort((a, b) => b.profit - a.profit);

      // Add rank
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboardData.slice(0, 20); // Top 20 users
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }

  static async getUserRank(userId, period) {
    try {
      const leaderboard = await this.getLeaderboard(period);
      const userRank = leaderboard.find(entry => entry.id.toString() === userId.toString());
      
      if (!userRank) {
        return {
          rank: null,
          profit: 0,
          message: 'User not found in leaderboard'
        };
      }

      return {
        rank: userRank.rank,
        profit: userRank.profit,
        period: period
      };
    } catch (error) {
      console.error('Get user rank error:', error);
      throw error;
    }
  }
}

// Initialize leaderboard for all users
export async function initializeLeaderboard() {
  try {
    console.log('🔄 Initializing leaderboard for all users...');
    
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to initialize leaderboard`);
    
    // This function can be used to set up initial leaderboard data if needed
    // For now, it just logs the initialization
    console.log('✅ Leaderboard initialization completed');
  } catch (error) {
    console.error('❌ Error initializing leaderboard:', error.message);
    throw error;
  }
}

export default LeaderboardService;

// Get user's rank
export async function getUserRank(userId, period = 'overall') {
  try {
    return await Leaderboard.getUserRank(userId, period);
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
}

// Ensure all users have leaderboard entries
async function ensureAllUsersHaveLeaderboardEntries() {
  try {
    const users = await User.find({});
    
    for (const user of users) {
      try {
        const existingEntry = await Leaderboard.findOne({ user: user._id });
        
        if (!existingEntry) {
          await Leaderboard.create({
            user: user._id,
            username: user.username || 'user',
            name: user.name,
            dailyEarnings: 0,
            monthlyEarnings: 0,
            overallEarnings: user.totalProfit || 0,
            currentPortfolioValue: 0,
            totalTrades: 0,
            winRate: 0
          });
        }
      } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
          console.log(`Leaderboard entry already exists for user ${user._id}`);
        } else {
          console.error(`Error creating leaderboard entry for user ${user._id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring leaderboard entries:', error);
  }
}

// Reset earnings if needed
async function resetEarningsIfNeeded() {
  try {
    const today = getISTDate();
    const thisMonth = getStartOfMonthIST();
    
    // Reset daily earnings
    await Leaderboard.updateMany(
      { 
        lastDailyReset: { $lt: today }
      },
      { 
        $set: { 
          dailyEarnings: 0,
          lastDailyReset: today
        }
      }
    );
    
    // Reset monthly earnings
    await Leaderboard.updateMany(
      { 
        lastMonthlyReset: { $lt: thisMonth }
      },
      { 
        $set: { 
          monthlyEarnings: 0,
          lastMonthlyReset: thisMonth
        }
      }
    );
  } catch (error) {
    console.error('Error resetting earnings:', error);
  }
}

// Update portfolio value for a user
export async function updatePortfolioValue(userId, portfolioValue) {
  try {
    const leaderboardEntry = await Leaderboard.findOne({ user: userId });
    
    if (leaderboardEntry) {
      leaderboardEntry.currentPortfolioValue = portfolioValue;
      await leaderboardEntry.save();
    }
  } catch (error) {
    console.error('Error updating portfolio value:', error);
  }
}

// Initialize leaderboard for all users (run once)
export async function initializeLeaderboard() {
  try {
    console.log('Initializing leaderboard for all users...');
    await ensureAllUsersHaveLeaderboardEntries();
    console.log('Leaderboard initialization completed');
  } catch (error) {
    console.error('Error initializing leaderboard:', error);
  }
}
