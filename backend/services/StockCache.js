import { fetchAllStockInsiderTrades } from './ExternalAPIServices.js';
import Stock from '../models/Stock.js';

// In-memory cache for stock data
const cache = {
  lastUpdated: 0,
  gainers: [],
  losers: [],
  all: [],
  error: null,
};

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return Number.isNaN(num) ? 0 : num;
}

function normalize(item) {
  return {
    symbol: item.symbol || item.tradingsymbol || item.symbolName || '',
    lastPrice: toNumber(item.lastPrice ?? item.ltp ?? item.price),
    pChange: toNumber(item.pChange ?? item.changePercent),
    change: toNumber(item.change ?? item.netChange),
    totalTradedVolume: toNumber(item.totalTradedVolume ?? item.volume),
  };
}

export async function refreshCache() {
  try {
    const allRes = await fetchAllStockInsiderTrades();
    
    // If API fails, use fallback sample data for MarketTicker
    if (!allRes.success || !Array.isArray(allRes.data) || allRes.data.length === 0) {
      console.log('[StockCache] Using fallback sample data for MarketTicker');
      const fallbackData = [
        { symbol: 'NIFTY 50', lastPrice: 25795.15, pChange: -0.37, change: -96.25, totalTradedVolume: 284913477 },
        { symbol: 'RELIANCE', lastPrice: 1451.1, pChange: 0.19, change: 2.7, totalTradedVolume: 9700837 },
        { symbol: 'TCS', lastPrice: 3060.6, pChange: -0.41, change: -12.6, totalTradedVolume: 2684318 },
        { symbol: 'HDFCBANK', lastPrice: 995.9, pChange: -1.28, change: -12.9, totalTradedVolume: 17707768 },
        { symbol: 'ICICIBANK', lastPrice: 1378, pChange: 1.05, change: 14.3, totalTradedVolume: 10570263 }
      ];
      cache.all = fallbackData.map(normalize);
      cache.lastUpdated = Date.now();
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
          console.warn(
            `[${new Date().toISOString()}] Warning: API returned invalid/empty data for ${symbol}, retaining previous cache values.`
          );
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

      // Add any missing stocks from previous cache that were not in API response
      Object.keys(prevCacheMap).forEach(symbol => {
        if (!newCacheMap[symbol]) newCacheMap[symbol] = prevCacheMap[symbol];
      });

      // Update cache arrays
      cache.all = Object.values(newCacheMap);
      const sortedByChange = [...cache.all].sort((a, b) => b.pChange - a.pChange);
      cache.gainers = sortedByChange.slice(0, 1000);
      cache.losers = sortedByChange.reverse().slice(0, 1000);
      cache.lastUpdated = Date.now();
      cache.error = null;

      // Update database with new stock data
      if (stocksToUpdate.length > 0) {
        try {
          await Promise.all(
            stocksToUpdate.map(stockData =>
              Stock.findOneAndUpdate(
                { symbol: stockData.symbol },
                stockData,
                { upsert: true, new: true }
              )
            )
          );
          console.log(`[${new Date().toISOString()}] Updated ${stocksToUpdate.length} stocks in database`);
        } catch (dbError) {
          console.error(`[${new Date().toISOString()}] Database update error:`, dbError.message);
        }
      }

      console.log(
        `[${new Date().toISOString()}] Sample stock after cache refresh:`,
        cache.all[0]
      );
    } else {
      console.warn(
        `[${new Date().toISOString()}] Warning: No data received from external API, retaining previous cache.`
      );
    }
  } catch (e) {
    cache.error = e?.message || 'refresh failed';
    console.error(`[${new Date().toISOString()}] refreshCache error:`, cache.error);
  }
}

// Load stock data from database on startup
export async function loadStocksFromDatabase() {
  try {
    const stocks = await Stock.find({ isActive: true }).sort({ lastUpdated: -1 });
    if (stocks.length > 0) {
      cache.all = stocks.map(stock => ({
        symbol: stock.symbol,
        lastPrice: stock.price,
        pChange: stock.changePercent,
        change: stock.change,
        totalTradedVolume: stock.volume,
      }));
      
      const sortedByChange = [...cache.all].sort((a, b) => b.pChange - a.pChange);
      cache.gainers = sortedByChange.slice(0, 300);
      cache.losers = sortedByChange.reverse().slice(0, 300);
      cache.lastUpdated = Date.now();
      
      console.log(`[${new Date().toISOString()}] Loaded ${stocks.length} stocks from database`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error loading stocks from database:`, error.message);
  }
}

// Start periodic refresh: 1 call per 1 minute
const INTERVAL_MS = 60 * 1000; 
loadStocksFromDatabase();
refreshCache();
setInterval(refreshCache, INTERVAL_MS).unref?.();

export function getGainers(limit = 10) {
  return cache.gainers.slice(0, limit);
}

export function getLosers(limit = 10) {
  return cache.losers.slice(0, limit);
}

export function getAll() {
  return cache.all;
}

export function searchBySymbol(query) {
  if (!query) return [];
  const q = String(query).toLowerCase();
  return cache.all.filter((s) => s.symbol && s.symbol.toLowerCase().includes(q));
}

export function getStatus() {
  return {
    lastUpdated: cache.lastUpdated,
    sizes: { gainers: cache.gainers.length, losers: cache.losers.length, all: cache.all.length },
    error: cache.error,
  };
}
