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
  res.json(data);
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

router.get('/status', (req, res) => {
  res.json(getStatus());
});

export default router;

