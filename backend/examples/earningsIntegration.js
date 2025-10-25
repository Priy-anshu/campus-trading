/**
 * Example integration of earnings system into existing routes
 * This shows how to use the earnings system in your transaction handlers
 */

import { updateEarnings, getEarnings, addUserToEarnings } from '../utils/earningsUtils.js';

/**
 * Example: Integration in buy/sell stock routes
 */
export function handleStockTransaction(userId, transactionType, amount, stockSymbol) {
  try {
    // Calculate profit/loss (this is just an example calculation)
    let earningsAmount = 0;
    
    if (transactionType === 'buy') {
      // For buy transactions, you might want to track the investment
      // or calculate profit based on current vs purchase price
      earningsAmount = 0; // No immediate earnings on purchase
    } else if (transactionType === 'sell') {
      // For sell transactions, calculate profit/loss
      // This is a simplified example - you'd calculate based on:
      // (current_price - purchase_price) * quantity
      earningsAmount = amount; // Assuming amount is the profit/loss
    }
    
    // Update earnings in cache
    if (earningsAmount !== 0) {
      updateEarnings(userId, earningsAmount);
    }
    
    // Stock transaction processed successfully
    
    return {
      success: true,
      earnings: getEarnings(userId),
      transactionAmount: earningsAmount
    };
    
  } catch (error) {
    console.error('Error processing stock transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Integration in user registration
 */
export function handleUserRegistration(userId, name) {
  try {
    // Add new user to earnings system
    addUserToEarnings(userId, name);
    
    // New user added to earnings system
    
    return {
      success: true,
      message: 'User added to earnings system'
    };
    
  } catch (error) {
    console.error('Error adding user to earnings system:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Integration in portfolio routes
 */
export function getPortfolioWithEarnings(userId) {
  try {
    // Get current earnings
    const earnings = getEarnings(userId);
    
    if (!earnings) {
      return {
        success: false,
        message: 'User earnings not found'
      };
    }
    
    return {
      success: true,
      data: {
        userId: userId,
        dailyEarning: earnings.dailyEarning,
        monthlyEarning: earnings.monthlyEarning,
        overallEarning: earnings.overallEarning,
        // Add other portfolio data here
      }
    };
    
  } catch (error) {
    console.error('Error getting portfolio with earnings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example: Integration in leaderboard routes
 */
export function getLeaderboardWithEarnings(period = 'overall') {
  try {
    // This would typically be handled by the earningsRoutes.js
    // But here's how you might use it in other contexts
    
    const earnings = getEarnings(); // This would need to be modified to return all users
    
    return {
      success: true,
      data: earnings,
      period: period
    };
    
  } catch (error) {
    console.error('Error getting leaderboard with earnings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example usage in your existing routes:
 * 
 * // In portfolioRoutes.js or orderRoutes.js:
 * import { updateEarnings } from '../utils/earningsUtils.js';
 * 
 * // When processing a buy/sell order:
 * const profit = calculateProfit(purchasePrice, currentPrice, quantity);
 * updateEarnings(userId, profit);
 * 
 * // In authRoutes.js:
 * import { addUserToEarnings } from '../utils/earningsUtils.js';
 * 
 * // After successful user registration:
 * addUserToEarnings(user._id, user.name);
 */
