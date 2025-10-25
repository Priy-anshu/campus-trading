import StockCache from './StockCache.js';
import { fetchStockByName } from './ExternalAPIServices.js';

class StockService {
  static async getAllStocks() {
    try {
      const stocks = await StockCache.getAllStocks();
      return stocks;
    } catch (error) {
      console.error('Get all stocks error:', error);
      throw error;
    }
  }

  static async getStockPrice(symbol) {
    try {
      const price = await StockCache.getStockPrice(symbol);
      if (!price) {
        throw new Error('Stock price not found');
      }
      return { symbol, price };
    } catch (error) {
      console.error('Get stock price error:', error);
      throw error;
    }
  }

  static async searchStocks(query) {
    try {
      // First try to search in cache
      const cacheResults = await StockCache.searchBySymbol(query);
      
      if (cacheResults && cacheResults.length > 0) {
        return cacheResults;
      }

      // If not found in cache, try external API
      const externalResults = await fetchStockByName(query);
      if (externalResults.success && externalResults.data) {
        return [externalResults.data];
      }

      return [];
    } catch (error) {
      console.error('Search stocks error:', error);
      throw error;
    }
  }

  static async getGainers() {
    try {
      const gainers = await StockCache.getGainers();
      return gainers;
    } catch (error) {
      console.error('Get gainers error:', error);
      throw error;
    }
  }

  static async getLosers() {
    try {
      const losers = await StockCache.getLosers();
      return losers;
    } catch (error) {
      console.error('Get losers error:', error);
      throw error;
    }
  }
}

export default StockService;
