import User from '../models/User.js';
import Order from '../models/Order.js';
import Portfolio from '../models/Portfolio.js';
import DailyProfitService from './DailyProfitService.js';
import { searchBySymbol } from './StockCache.js';

class PortfolioService {
  static async getPortfolio(userId) {
    try {
      const user = await User.findById(userId).select('walletBalance dailyProfit totalProfit oneDayReturn monthlyReturn');
      if (!user) {
        throw new Error('User not found');
      }

      const holdings = await Portfolio.find({ userId }).populate('stockId');
      const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(10);

      // Calculate current portfolio value
      const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);

      const portfolio = {
        walletBalance: user.walletBalance,
        holdings: holdings.map(holding => ({
          id: holding._id,
          symbol: holding.symbol,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentPrice: holding.currentPrice || 0,
          totalValue: (holding.currentPrice || 0) * holding.quantity,
          profit: ((holding.currentPrice || 0) - holding.averagePrice) * holding.quantity,
          profitPercentage: holding.averagePrice > 0 ? 
            (((holding.currentPrice || 0) - holding.averagePrice) / holding.averagePrice) * 100 : 0
        })),
        recentOrders: orders,
        dailyProfit: user.dailyProfit || 0,
        totalProfit: user.totalProfit || 0,
        oneDayReturn: user.oneDayReturn || 0,
        monthlyReturn: user.monthlyReturn || 0,
        totalPortfolioValue: currentPortfolioValue
      };

      return portfolio;
    } catch (error) {
      console.error('Get portfolio error:', error);
      throw error;
    }
  }

  static async buyStock(userId, symbol, quantity) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get current stock price
      const stocks = searchBySymbol(symbol);
      const stockPrice = stocks.length > 0 ? stocks[0].lastPrice : 0;
      if (!stockPrice) {
        throw new Error('Stock not found or price unavailable');
      }

      const totalCost = stockPrice * quantity;

      // Check if user has sufficient balance
      if (user.walletBalance < totalCost) {
        throw new Error('Insufficient balance');
      }

      // Check if user already has this stock
      let portfolio = await Portfolio.findOne({ userId, symbol });
      
      if (portfolio) {
        // Update existing holding
        const newTotalQuantity = portfolio.quantity + quantity;
        const newTotalCost = (portfolio.averagePrice * portfolio.quantity) + totalCost;
        const newAveragePrice = newTotalCost / newTotalQuantity;

        portfolio.quantity = newTotalQuantity;
        portfolio.averagePrice = newAveragePrice;
        portfolio.currentPrice = stockPrice;
        await portfolio.save();
      } else {
        // Create new holding
        portfolio = new Portfolio({
          userId,
          symbol,
          quantity,
          averagePrice: stockPrice,
          currentPrice: stockPrice
        });
        await portfolio.save();
      }

      // Update user wallet balance
      user.walletBalance -= totalCost;
      await user.save();

      // Create order record
      const order = new Order({
        userId,
        symbol,
        type: 'buy',
        quantity,
        price: stockPrice,
        totalAmount: totalCost
      });
      await order.save();

      // Update daily profit
      const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
      await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, 0);

      return {
        message: 'Stock purchased successfully',
        order: {
          id: order._id,
          symbol,
          type: 'buy',
          quantity,
          price: stockPrice,
          totalAmount: totalCost,
          timestamp: order.createdAt
        },
        newBalance: user.walletBalance
      };
    } catch (error) {
      console.error('Buy stock error:', error);
      throw error;
    }
  }

  static async sellStock(userId, symbol, quantity) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has this stock
      const portfolio = await Portfolio.findOne({ userId, symbol });
      if (!portfolio) {
        throw new Error('Stock not found in portfolio');
      }

      if (portfolio.quantity < quantity) {
        throw new Error('Insufficient quantity to sell');
      }

      // Get current stock price
      const stocks = searchBySymbol(symbol);
      const stockPrice = stocks.length > 0 ? stocks[0].lastPrice : 0;
      if (!stockPrice) {
        throw new Error('Stock price unavailable');
      }

      const totalRevenue = stockPrice * quantity;

      // Update portfolio
      portfolio.quantity -= quantity;
      portfolio.currentPrice = stockPrice;
      
      if (portfolio.quantity === 0) {
        await Portfolio.findByIdAndDelete(portfolio._id);
      } else {
        await portfolio.save();
      }

      // Update user wallet balance
      user.walletBalance += totalRevenue;
      await user.save();

      // Create order record
      const order = new Order({
        userId,
        symbol,
        type: 'sell',
        quantity,
        price: stockPrice,
        totalAmount: totalRevenue
      });
      await order.save();

      // Update daily profit
      const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
      await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, 0);

      return {
        message: 'Stock sold successfully',
        order: {
          id: order._id,
          symbol,
          type: 'sell',
          quantity,
          price: stockPrice,
          totalAmount: totalRevenue,
          timestamp: order.createdAt
        },
        newBalance: user.walletBalance
      };
    } catch (error) {
      console.error('Sell stock error:', error);
      throw error;
    }
  }

  static async getDailyProfit(userId, period, limit) {
    try {
      const DailyProfit = await import('../models/DailyProfit.js');
      const DailyEarnings = await import('../models/DailyEarnings.js');
      
      let data = [];
      
      if (period === 'day') {
        data = await DailyProfit.default.find({ userId })
          .sort({ date: -1 })
          .limit(limit);
      } else {
        data = await DailyEarnings.default.find({ user: userId })
          .sort({ date: -1 })
          .limit(limit);
      }

      // If no data found, create initial data
      if (data.length === 0) {
        const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(userId);
        const user = await User.findById(userId);
        
        if (user && user.lastPortfolioValue) {
          const dailyProfitChange = currentPortfolioValue - user.lastPortfolioValue;
          await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, dailyProfitChange);
        } else {
          await DailyProfitService.updateDailyProfit(userId, currentPortfolioValue, 0);
        }
        
        // Fetch data again
        if (period === 'day') {
          data = await DailyProfit.default.find({ userId })
            .sort({ date: -1 })
            .limit(limit);
        } else {
          data = await DailyEarnings.default.find({ user: userId })
            .sort({ date: -1 })
            .limit(limit);
        }
      }

      return data;
    } catch (error) {
      console.error('Get daily profit error:', error);
      throw error;
    }
  }

  static async recalculateDailyProfits() {
    try {
      
      const users = await User.find({});
      
      for (const user of users) {
        try {
          const currentPortfolioValue = await DailyProfitService.calculatePortfolioValue(user._id);
          await DailyProfitService.updateDailyProfit(user._id, currentPortfolioValue, 0);
          
        } catch (error) {
          console.error(`❌ Error updating daily profit for user ${user.name || user.email}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in daily profit recalculation:', error.message);
      throw error;
    }
  }

  static async forceDailyReset() {
    try {
      
      const users = await User.find({});
      
      const { getStartOfDayIST } = await import('../utils/timeUtils.js');
      const today = getStartOfDayIST();
      
      for (const user of users) {
        try {
          // Force reset daily profit to 0 for new day
          user.dailyProfit = 0;
          user.lastDailyReset = today;
          user.yesterdayTotalEarnings = user.lastPortfolioValue || 100000;
          
          await user.save();
          
        } catch (error) {
          console.error(`❌ Error resetting user ${user.name || user.email}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in daily reset:', error.message);
      throw error;
    }
  }
}

export default PortfolioService;
