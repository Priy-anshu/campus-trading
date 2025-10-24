import cron from 'node-cron';
import Leaderboard from '../models/Leaderboard.js';

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
function dailyReset() {
  console.log(`[${new Date().toISOString()}] Starting daily leaderboard reset...`);
  
  const today = getISTDate();
  
  Leaderboard.updateMany(
    { 
      lastDailyReset: { $lt: today }
    },
    { 
      $set: { 
        dailyEarnings: 0,
        lastDailyReset: today
      }
    }
  ).then(result => {
    console.log(`[${new Date().toISOString()}] Daily reset completed. Updated ${result.modifiedCount} users.`);
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] Daily reset error:`, error);
  });
}

// Monthly reset function (runs on 1st of month at 12:00 AM IST)
function monthlyReset() {
  console.log(`[${new Date().toISOString()}] Starting monthly leaderboard reset...`);
  
  const thisMonth = getStartOfMonthIST();
  
  Leaderboard.updateMany(
    { 
      lastMonthlyReset: { $lt: thisMonth }
    },
    { 
      $set: { 
        monthlyEarnings: 0,
        lastMonthlyReset: thisMonth
      }
    }
  ).then(result => {
    console.log(`[${new Date().toISOString()}] Monthly reset completed. Updated ${result.modifiedCount} users.`);
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] Monthly reset error:`, error);
  });
}

// Start cron jobs
export function startCronJobs() {
  console.log('🕐 Starting cron jobs for leaderboard resets...');
  
  // Daily reset at 12:00 AM IST (6:30 PM UTC)
  cron.schedule('30 18 * * *', () => {
    dailyReset();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Monthly reset on 1st of month at 12:00 AM IST (6:30 PM UTC on last day of previous month)
  cron.schedule('30 18 28-31 * *', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDate() === 1) {
      monthlyReset();
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ Cron jobs started successfully');
}

// Manual reset functions for testing
export function manualDailyReset() {
  console.log('Manual daily reset triggered');
  dailyReset();
}

export function manualMonthlyReset() {
  console.log('Manual monthly reset triggered');
  monthlyReset();
}
