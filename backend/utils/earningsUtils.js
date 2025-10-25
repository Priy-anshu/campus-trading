import earningsCache from '../services/EarningsCache.js';

/**
 * Simple utility functions for updating earnings across the backend
 */

/**
 * Update earnings for a user when a transaction occurs
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add to earnings (positive for profit, negative for loss)
 */
export function updateEarnings(userId, amount) {
  try {
    earningsCache.updateEarnings(userId, amount);
    console.log(`💰 Earnings updated: User ${userId}, Amount: ${amount}`);
  } catch (error) {
    console.error('Error updating earnings:', error);
  }
}

/**
 * Get current earnings for a user
 * @param {string} userId - User ID
 * @returns {Object|null} - Earnings object or null if not found
 */
export function getEarnings(userId) {
  try {
    return earningsCache.getEarnings(userId);
  } catch (error) {
    console.error('Error getting earnings:', error);
    return null;
  }
}

/**
 * Add a new user to the earnings system
 * @param {string} userId - User ID
 * @param {string} name - User name
 */
export function addUserToEarnings(userId, name) {
  try {
    earningsCache.addUser(userId, name);
    console.log(`👤 Added user to earnings system: ${name}`);
  } catch (error) {
    console.error('Error adding user to earnings:', error);
  }
}

/**
 * Force update database with current cache values
 * (Useful for manual database sync)
 */
export async function forceUpdateDatabase() {
  try {
    await earningsCache.forceUpdateDatabase();
    console.log('💾 Database updated with current earnings cache');
  } catch (error) {
    console.error('Error force updating database:', error);
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export function getCacheStats() {
  try {
    return earningsCache.getStats();
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Example usage in transaction handlers:
 * 
 * // When a user makes a profitable trade
 * updateEarnings(userId, 150.50);
 * 
 * // When a user makes a losing trade
 * updateEarnings(userId, -75.25);
 * 
 * // Get user's current earnings
 * const earnings = getEarnings(userId);
 * console.log(earnings.dailyEarning, earnings.monthlyEarning, earnings.overallEarning);
 */
