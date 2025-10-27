import { Router } from 'express';
import { fetchStockByName } from '../services/ExternalAPIServices.js';
import { getGainers, getLosers, getAll, searchBySymbol, getStatus } from '../services/StockCache.js';

const router = Router();

function fail(res, error) {
  return res.status(503).json({ message: 'Stock data is temporarily unavailable. Please wait for one minute and try again.', error });
}

router.get('/gainers', async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const data = getGainers(limit);
  if (!data || data.length === 0) return fail(res, 'no data');
  res.json(data);
});

router.get('/losers', async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const data = getLosers(limit);
  if (!data || data.length === 0) return fail(res, 'no data');
  res.json(data);
});

router.get('/all', async (req, res) => {
  const data = getAll();
  if (!data || data.length === 0) return fail(res, 'no data');
  res.json({
    success: true,
    data: data
  });
});

router.get('/search', async (req, res) => {
  const symbol = (req.query.symbol || '').toString();
  const data = searchBySymbol(symbol);
  if (data && data.length) return res.json(data);
  // fall back to direct fetch if cache empty
  const result = await fetchStockByName(symbol);
  if (!result.success) return fail(res, result.error);
  res.json(result.data);
});

router.get('/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const allStocks = getAll();
  const stock = allStocks.find(s => s.symbol === symbol);
  
  if (!stock) {
    return res.status(404).json({ 
      success: false, 
      message: `Stock ${symbol} not found in cache` 
    });
  }
  
  res.json({
    success: true,
    data: {
      symbol: stock.symbol,
      price: stock.lastPrice,
      change: stock.change,
      changePercent: stock.pChange,
      volume: stock.totalTradedVolume
    }
  });
});

router.get('/status', (req, res) => {
  res.json(getStatus());
});

// Debug endpoint to check raw external API response
router.get('/debug/raw-api', async (req, res) => {
  try {
    const { fetchAllStockInsiderTrades } = await import('../services/ExternalAPIServices.js');
    const result = await fetchAllStockInsiderTrades();
    
    // Return first 3 stocks as sample with detailed info
    const sampleData = result.success && result.data && result.data.length > 0 
      ? result.data.slice(0, 3).map(item => ({
          symbol: item.symbol,
          name: item.name,
          rawName: item.name,
          lastPrice: item.lastPrice,
          pChange: item.pChange
        }))
      : [];
    
    // Also try to fetch directly from Yahoo to see raw response
    const axios = (await import('axios')).default;
    const testUrl = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS,TCS.NS';
    let rawYahooResponse = null;
    try {
      const yahooResp = await axios.get(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      rawYahooResponse = yahooResp.data?.quoteResponse?.result?.slice(0, 2).map(q => ({
        symbol: q.symbol,
        shortName: q.shortName,
        longName: q.longName,
        regularMarketPrice: q.regularMarketPrice
      }));
    } catch (e) {
      rawYahooResponse = { error: e.message };
    }
    
    res.json({
      success: result.success,
      message: 'Comparing what we get vs Yahoo Finance raw data',
      ourData: sampleData,
      rawYahooData: rawYahooResponse,
      totalStocks: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch from external API',
      message: error.message 
    });
  }
});

export default router;

