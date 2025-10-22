import { fetchAllStockInsiderTrades } from './ExternalAPIServices.js';

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
    // Single external call (Yahoo fallback inside service) to fetch a broad set of stocks
    const allRes = await fetchAllStockInsiderTrades();
    if (allRes.success) cache.all = (allRes.data || []).map(normalize);

    // Compute gainers/losers locally from the cached universe
    const sortedByChange = [...cache.all].sort((a, b) => b.pChange - a.pChange);
    cache.gainers = sortedByChange.slice(0, 300);
    cache.losers = sortedByChange.reverse().slice(0, 300);

    cache.lastUpdated = Date.now();
    cache.error = null;
  } catch (e) {
    cache.error = e?.message || 'refresh failed';
  }
}

// Start periodic refresh: 1 call per 5 minutes
const INTERVAL_MS = 5 * 60 * 1000;
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
