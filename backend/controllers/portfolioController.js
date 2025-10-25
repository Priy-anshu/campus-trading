import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';
import { validateNumber, validateRequired } from '../utils/validation.js';
import portfolioService from '../services/portfolioService.js';

class PortfolioController {
  static async getPortfolio(req, res) {
    try {
      const userId = req.user.id;
      const portfolio = await portfolioService.getPortfolio(userId);
      
      return sendSuccess(res, portfolio, 'Portfolio retrieved successfully');
    } catch (error) {
      console.error('Get portfolio error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async buyStock(req, res) {
    try {
      const { symbol, quantity } = req.body;
      const userId = req.user.id;

      // Validation
      const errors = [];
      
      const symbolError = validateRequired(symbol, 'Stock symbol');
      if (symbolError) errors.push(symbolError);
      
      const quantityError = validateRequired(quantity, 'Quantity');
      if (quantityError) errors.push(quantityError);
      else {
        const numberError = validateNumber(quantity, 'Quantity');
        if (numberError) errors.push(numberError);
      }

      if (errors.length > 0) {
        return sendValidationError(res, errors);
      }

      const result = await portfolioService.buyStock(userId, symbol, parseInt(quantity));
      
      return sendSuccess(res, result, 'Stock purchased successfully');
    } catch (error) {
      console.error('Buy stock error:', error);
      return sendError(res, error.message, 400, error);
    }
  }

  static async sellStock(req, res) {
    try {
      const { symbol, quantity } = req.body;
      const userId = req.user.id;

      // Validation
      const errors = [];
      
      const symbolError = validateRequired(symbol, 'Stock symbol');
      if (symbolError) errors.push(symbolError);
      
      const quantityError = validateRequired(quantity, 'Quantity');
      if (quantityError) errors.push(quantityError);
      else {
        const numberError = validateNumber(quantity, 'Quantity');
        if (numberError) errors.push(numberError);
      }

      if (errors.length > 0) {
        return sendValidationError(res, errors);
      }

      const result = await portfolioService.sellStock(userId, symbol, parseInt(quantity));
      
      return sendSuccess(res, result, 'Stock sold successfully');
    } catch (error) {
      console.error('Sell stock error:', error);
      return sendError(res, error.message, 400, error);
    }
  }

  static async getDailyProfit(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'day', limit = 30 } = req.query;
      
      const data = await portfolioService.getDailyProfit(userId, period, parseInt(limit));
      
      return sendSuccess(res, data, 'Daily profit data retrieved successfully');
    } catch (error) {
      console.error('Get daily profit error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async recalculateDailyProfits(req, res) {
    try {
      await portfolioService.recalculateDailyProfits();
      
      return sendSuccess(res, null, 'Daily profits recalculated successfully');
    } catch (error) {
      console.error('Recalculate daily profits error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async forceDailyReset(req, res) {
    try {
      await portfolioService.forceDailyReset();
      
      return sendSuccess(res, null, 'Daily profits reset to 0 for all users');
    } catch (error) {
      console.error('Force daily reset error:', error);
      return sendError(res, error.message, 500, error);
    }
  }
}

export default PortfolioController;
