import { fetchAllStockInsiderTrades } from './ExternalAPIServices.js';
import Stock from '../models/Stock.js';

/**
 * StockCache Service
 * 
 * Manages in-memory caching of stock data for high-performance access.
 * Features:
 * - Real-time stock data caching from external APIs
 * - Automatic data refresh every minute
 * - Database persistence every 14 minutes
 * - Fallback to previous data on API failures
 * - Gainers/losers categorization
 * - Search functionality by symbol
 * 
 * Cache Structure:
 * - all: Complete list of all stocks
 * - gainers: Top performing stocks (sorted by percentage change)
 * - losers: Worst performing stocks (sorted by percentage change)
 * - lastUpdated: Timestamp of last successful update
 * - error: Any error messages from API failures
 */

// In-memory cache for stock data with categorized performance metrics
const cache = {
  lastUpdated: 0, // Timestamp of last successful cache update
  gainers: [], // Top performing stocks (highest percentage gains)
  losers: [], // Worst performing stocks (highest percentage losses)
  all: [], // Complete list of all stocks
  error: null, // Error message if API calls fail
};

// Database update tracking to prevent excessive DB writes
let lastDBUpdate = 0;
const DB_UPDATE_INTERVAL = 14 * 60 * 1000; // 14 minutes between DB updates

/**
 * Safely convert string/number values to numbers
 * Handles commas, whitespace, and invalid values gracefully
 * @param {any} value - The value to convert to number
 * @returns {number} The converted number or 0 if invalid
 */
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Normalize stock data from external API to consistent format
 * Handles different field names from various data sources
 * @param {object} item - Raw stock data from API
 * @returns {object} Normalized stock data with consistent field names
 */
function normalize(item) {
  return {
    symbol: item.symbol || item.tradingsymbol || item.symbolName || '',
    lastPrice: toNumber(item.lastPrice ?? item.ltp ?? item.price),
    pChange: toNumber(item.pChange ?? item.changePercent),
    change: toNumber(item.change ?? item.netChange),
    totalTradedVolume: toNumber(item.totalTradedVolume ?? item.volume),
  };
}

/**
 * Refresh the stock cache with latest data from external API
 * Handles API failures gracefully by retaining previous cache data
 * Updates database periodically to persist data
 */
export async function refreshCache() {
  try {
    // Fetch latest stock data from external API
    const allRes = await fetchAllStockInsiderTrades();
    
    // If API fails or returns no data, retain existing cache
    if (!allRes.success || !Array.isArray(allRes.data) || allRes.data.length === 0) {
      return;
    }
    
    if (allRes.success && Array.isArray(allRes.data) && allRes.data.length > 0) {
      // Create a map of current cache by symbol
      const prevCacheMap = {};
      cache.all.forEach(stock => {
        if (stock.symbol) prevCacheMap[stock.symbol] = stock;
      });

      // Map new API data by symbol, retaining previous cache if API data is invalid
      const newCacheMap = {};
      const stocksToUpdate = [];

      allRes.data.forEach(item => {
        const symbol = item.symbol || item.tradingsymbol || item.symbolName;
        if (!symbol) return;

        const prev = prevCacheMap[symbol] || {};
        const lastPrice = toNumber(item.lastPrice ?? item.ltp ?? item.price);
        const pChange = toNumber(item.pChange ?? item.changePercent);
        const change = toNumber(item.change ?? item.netChange);
        const totalTradedVolume = toNumber(item.totalTradedVolume ?? item.volume);

        // If all numeric fields are zero, retain previous cache
        if (lastPrice === 0 && pChange === 0 && change === 0 && totalTradedVolume === 0) {
          newCacheMap[symbol] = prev;
        } else {
          const stockData = {
            symbol,
            lastPrice,
            pChange,
            change,
            totalTradedVolume,
          };
          newCacheMap[symbol] = stockData;

          // Prepare for database update
          stocksToUpdate.push({
            symbol: symbol.toUpperCase(),
            name: item.companyName || item.name || symbol,
            price: lastPrice,
            change: change,
            changePercent: pChange,
            volume: totalTradedVolume,
            lastUpdated: new Date()
          });
        }
      });

      // Preserve stocks from previous cache that weren't in API response
      Object.keys(prevCacheMap).forEach(symbol => {
        if (!newCacheMap[symbol]) newCacheMap[symbol] = prevCacheMap[symbol];
      });

      // Update cache arrays with new data
      cache.all = Object.values(newCacheMap);
      
      // Sort stocks by percentage change and create gainers/losers lists
      const sortedByChange = [...cache.all].sort((a, b) => b.pChange - a.pChange);
      cache.gainers = sortedByChange.slice(0, 1000); // Top 1000 gainers
      cache.losers = sortedByChange.reverse().slice(0, 1000); // Top 1000 losers
      
      // Update cache metadata
      cache.lastUpdated = Date.now();
      cache.error = null;

      // Update database periodically (every 14 minutes) to persist data
      const now = Date.now();
      if (stocksToUpdate.length > 0 && now - lastDBUpdate >= DB_UPDATE_INTERVAL) {
        try {
          // Bulk update stocks in database
          await Promise.all(
            stocksToUpdate.map(stockData =>
              Stock.findOneAndUpdate(
                { symbol: stockData.symbol },
                stockData,
                { upsert: true, new: true }
              )
            )
          );
          lastDBUpdate = now;
        } catch (dbError) {
          console.error(`[${new Date().toISOString()}] Database update error:`, dbError.message);
        }
      }

    }
  } catch (e) {
    // Handle any errors during cache refresh
    cache.error = e?.message || 'refresh failed';
    console.error(`[${new Date().toISOString()}] refreshCache error:`, cache.error);
  }
}

/**
 * Load stock data from database on application startup
 * Initializes cache with existing data before API calls begin
 */
export async function loadStocksFromDatabase() {
  try {
    // Fetch active stocks from database, sorted by most recent update
    const stocks = await Stock.find({ isActive: true }).sort({ lastUpdated: -1 });
    if (stocks.length > 0) {
      // Map database records to cache format
      cache.all = stocks.map(stock => ({
        symbol: stock.symbol,
        lastPrice: stock.price,
        pChange: stock.changePercent,
        change: stock.change,
        totalTradedVolume: stock.volume,
      }));
      
      // Create gainers and losers lists from database data
      const sortedByChange = [...cache.all].sort((a, b) => b.pChange - a.pChange);
      cache.gainers = sortedByChange.slice(0, 300); // Top 300 gainers
      cache.losers = sortedByChange.reverse().slice(0, 300); // Top 300 losers
      cache.lastUpdated = Date.now();
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error loading stocks from database:`, error.message);
  }
}

// Initialize cache and start periodic refresh (every 1 minute)
const INTERVAL_MS = 60 * 1000; // 1 minute interval
loadStocksFromDatabase(); // Load initial data from database
refreshCache(); // Fetch latest data from API
setInterval(refreshCache, INTERVAL_MS).unref?.(); // Start periodic refresh

/**
 * Get top performing stocks (gainers)
 * @param {number} limit - Maximum number of stocks to return (default: 10)
 * @returns {Array} Array of top performing stocks
 */
export function getGainers(limit = 10) {
  return cache.gainers.slice(0, limit);
}

/**
 * Get worst performing stocks (losers)
 * @param {number} limit - Maximum number of stocks to return (default: 10)
 * @returns {Array} Array of worst performing stocks
 */
export function getLosers(limit = 10) {
  return cache.losers.slice(0, limit);
}

/**
 * Get all stocks in cache
 * @returns {Array} Complete array of all stocks
 */
export function getAll() {
  return cache.all;
}

/**
 * Search stocks by symbol (case-insensitive partial match)
 * @param {string} query - Search query (stock symbol)
 * @returns {Array} Array of matching stocks
 */
export function searchBySymbol(query) {
  if (!query) return [];
  const q = String(query).toLowerCase();
  return cache.all.filter((s) => s.symbol && s.symbol.toLowerCase().includes(q));
}

/**
 * Get cache status and metadata
 * @returns {object} Cache status including last update time, sizes, and errors
 */
export function getStatus() {
  return {
    lastUpdated: cache.lastUpdated,
    sizes: { 
      gainers: cache.gainers.length, 
      losers: cache.losers.length, 
      all: cache.all.length 
    },
    error: cache.error,
  };
}
