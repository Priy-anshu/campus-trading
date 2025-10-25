const { sendSuccess, sendError } = require('../utils/response');
const stockService = require('../services/stockService');

class StockController {
  static async getAllStocks(req, res) {
    try {
      const stocks = await stockService.getAllStocks();
      return sendSuccess(res, stocks, 'Stocks retrieved successfully');
    } catch (error) {
      console.error('Get all stocks error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async getStockPrice(req, res) {
    try {
      const { symbol } = req.params;
      const price = await stockService.getStockPrice(symbol);
      
      return sendSuccess(res, price, 'Stock price retrieved successfully');
    } catch (error) {
      console.error('Get stock price error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async searchStocks(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim() === '') {
        return sendError(res, 'Search query is required', 400);
      }

      const results = await stockService.searchStocks(q.trim());
      
      return sendSuccess(res, results, 'Search results retrieved successfully');
    } catch (error) {
      console.error('Search stocks error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async getGainers(req, res) {
    try {
      const gainers = await stockService.getGainers();
      return sendSuccess(res, gainers, 'Top gainers retrieved successfully');
    } catch (error) {
      console.error('Get gainers error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async getLosers(req, res) {
    try {
      const losers = await stockService.getLosers();
      return sendSuccess(res, losers, 'Top losers retrieved successfully');
    } catch (error) {
      console.error('Get losers error:', error);
      return sendError(res, error.message, 500, error);
    }
  }
}

module.exports = StockController;
