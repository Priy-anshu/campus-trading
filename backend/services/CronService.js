import cron from 'node-cron';
import Leaderboard from '../models/Leaderboard.js';
import { DailyProfitService } from './DailyProfitService.js';

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

// Daily reset function (runs at 12:00 AM IST)
async function dailyReset() {
  console.log(`[${new Date().toISOString()}] Starting daily reset for all users at IST midnight`);
  
  try {
    const today = getISTDate();
    
    // Reset leaderboard daily earnings
    const leaderboardResult = await Leaderboard.updateMany(
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
    console.log(`[${new Date().toISOString()}] Leaderboard daily reset completed for ${leaderboardResult.modifiedCount} entries`);
    
    // Update all users' daily profits (includes daily and monthly resets)
    await DailyProfitService.updateAllUsersDailyProfits(true); // true = isScheduledReset
    console.log(`[${new Date().toISOString()}] All users' daily profits updated successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily reset error:`, error);
  }
}

// Monthly reset function (runs on 1st of month at 12:00 AM IST)
async function monthlyReset() {
  console.log(`[${new Date().toISOString()}] Starting monthly reset for all users at IST midnight`);
  
  try {
    const thisMonth = getStartOfMonthIST();
    
    // Reset leaderboard monthly earnings
    const leaderboardResult = await Leaderboard.updateMany(
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
    console.log(`[${new Date().toISOString()}] Leaderboard monthly reset completed for ${leaderboardResult.modifiedCount} entries`);
    
    // Note: User model monthly resets are handled by daily cron job calling DailyProfitService.updateAllUsersDailyProfits()
    // This ensures all users get proper monthly resets regardless of activity
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Monthly reset error:`, error);
  }
}

// Start cron jobs
export function startCronJobs() {
  console.log(`[${new Date().toISOString()}] Starting cron jobs for automated daily/monthly resets at IST midnight`);
  
  // Daily reset at 12:00 AM IST (6:30 PM UTC)
  // This will update ALL users' daily/monthly earnings automatically
  cron.schedule('30 18 * * *', async () => {
    await dailyReset();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Monthly reset on 1st of month at 12:00 AM IST (6:30 PM UTC on last day of previous month)
  cron.schedule('30 18 28-31 * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDate() === 1) {
      await monthlyReset();
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log(`[${new Date().toISOString()}] Cron jobs scheduled successfully - Daily reset at 12:00 AM IST (6:30 PM UTC)`);
}

// Manual reset functions for testing
export async function manualDailyReset() {
  console.log(`[${new Date().toISOString()}] Manual daily reset triggered`);
  await dailyReset();
}

export async function manualMonthlyReset() {
  console.log(`[${new Date().toISOString()}] Manual monthly reset triggered`);
  await monthlyReset();
}
