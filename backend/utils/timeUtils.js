/**
 * Utility functions for handling Indian Standard Time (IST)
 */

/**
 * Get the start of the current day in IST
 * @returns {Date} Start of day in IST
 */
export function getStartOfDayIST() {
  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (istOffset * 60000));
  
  // Set to start of day (00:00:00)
  ist.setHours(0, 0, 0, 0);
  
  return ist;
}

/**
 * Get the start of the current month in IST
 * @returns {Date} Start of month in IST
 */
export function getStartOfMonthIST() {
  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (istOffset * 60000));
  
  // Set to start of month (1st day, 00:00:00)
  ist.setDate(1);
  ist.setHours(0, 0, 0, 0);
  
  return ist;
}

/**
 * Check if a date is today in IST
 * @param {Date} date - Date to check
 * @returns {boolean} True if the date is today in IST
 */
export function isTodayIST(date) {
  const today = getStartOfDayIST();
  const checkDate = new Date(date);
  
  return checkDate.getTime() === today.getTime();
}

/**
 * Get the number of days between two dates in IST
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days
 */
export function getDaysDifferenceIST(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to start of day for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date to IST string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string in IST
 */
export function formatDateIST(date) {
  const istDate = new Date(date);
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const utc = istDate.getTime() + (istDate.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (istOffset * 60000));
  
  return ist.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
