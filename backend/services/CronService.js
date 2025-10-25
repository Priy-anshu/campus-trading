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
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] Daily reset error:`, error);
  });
}

// Monthly reset function (runs on 1st of month at 12:00 AM IST)
function monthlyReset() {
  
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
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] Monthly reset error:`, error);
  });
}

// Start cron jobs
export function startCronJobs() {
  
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
  
}

// Manual reset functions for testing
export function manualDailyReset() {
  dailyReset();
}

export function manualMonthlyReset() {
  monthlyReset();
}
