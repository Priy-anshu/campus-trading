import User from '../models/User.js';
import DailyProfitService from './DailyProfitService.js';

class LeaderboardService {
  static async getLeaderboard(period, userId = null) {
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

      // If userId is provided, implement smart leaderboard logic
      if (userId) {
        const userEntry = leaderboardData.find(entry => entry.id.toString() === userId.toString());
        const top20 = leaderboardData.slice(0, 20);
        const userIsInTop20 = top20.some(entry => entry.id.toString() === userId.toString());
        
        // If user is in top 20, return top 20
        if (userIsInTop20) {
          return top20;
        }
        
        // If user is not in top 20, return top 19 + user's position
        if (userEntry) {
          return [
            ...top20.slice(0, 19),
            userEntry // User's position (could be #21, #50, #100, etc.)
          ];
        }
        
        // If user not found, just return top 20
        return top20;
      }

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
    
    const users = await User.find({});
    
    // This function can be used to set up initial leaderboard data if needed
    // For now, it just logs the initialization
  } catch (error) {
    console.error('❌ Error initializing leaderboard:', error.message);
    throw error;
  }
}

export default LeaderboardService;

