import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';

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
  const thisMonth = getStartOfMonthIST();
  const lastResetDate = new Date(lastReset);
  
  return thisMonth.getTime() > lastResetDate.getTime();
}

// Create or update leaderboard entry for a user
export async function createOrUpdateLeaderboardEntry(userId, userData = {}) {
  try {
    let leaderboardEntry = await Leaderboard.findOne({ user: userId });
    
    if (!leaderboardEntry) {
      // Create new entry
      leaderboardEntry = await Leaderboard.create({
        user: userId,
        username: userData.username || 'user',
        name: userData.name || 'User',
        dailyEarnings: 0,
        monthlyEarnings: 0,
        overallEarnings: 0,
        currentPortfolioValue: userData.currentPortfolioValue || 0,
        totalTrades: 0,
        winRate: 0
      });
    } else {
      // Update existing entry
      if (userData.username) leaderboardEntry.username = userData.username;
      if (userData.name) leaderboardEntry.name = userData.name;
      if (userData.currentPortfolioValue !== undefined) {
        leaderboardEntry.currentPortfolioValue = userData.currentPortfolioValue;
      }
      await leaderboardEntry.save();
    }
    
    return leaderboardEntry;
  } catch (error) {
    console.error('Error creating/updating leaderboard entry:', error);
    throw error;
  }
}

// Update user earnings
export async function updateUserEarnings(userId, amount, type = 'trade') {
  try {
    const leaderboardEntry = await Leaderboard.findOne({ user: userId });
    
    if (!leaderboardEntry) {
      // Create entry if it doesn't exist
      await createOrUpdateLeaderboardEntry(userId);
      return updateUserEarnings(userId, amount, type);
    }
    
    // Check if resets are needed
    if (needsDailyReset(leaderboardEntry.lastDailyReset)) {
      await leaderboardEntry.resetDailyEarnings();
    }
    
    if (needsMonthlyReset(leaderboardEntry.lastMonthlyReset)) {
      await leaderboardEntry.resetMonthlyEarnings();
    }
    
    // Update earnings
    await leaderboardEntry.updateEarnings(amount, type);
    
    return leaderboardEntry;
  } catch (error) {
    console.error('Error updating user earnings:', error);
    throw error;
  }
}

// Get leaderboard data
export async function getLeaderboard(period = 'overall', limit = 100) {
  try {
    // First, ensure all users have leaderboard entries
    await ensureAllUsersHaveLeaderboardEntries();
    
    // Reset daily/monthly earnings if needed
    await resetEarningsIfNeeded();
    
    return await Leaderboard.getLeaderboard(period, limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

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
