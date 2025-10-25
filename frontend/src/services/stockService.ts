import { apiClient, ENDPOINTS } from '@/api/config';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export const fetchStockPrice = async (symbol: string): Promise<StockPrice | null> => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.stockPrice}/${symbol}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // Silently handle errors
    return null;
  }
};

export const fetchMultipleStockPrices = async (symbols: string[]): Promise<Record<string, StockPrice>> => {
  const prices: Record<string, StockPrice> = {};
  
  try {
    // Fetch all prices in parallel
    const promises = symbols.map(async (symbol) => {
      const price = await fetchStockPrice(symbol);
      if (price) {
        prices[symbol] = price;
      }
    });
    
    await Promise.all(promises);
    return prices;
  } catch (error) {
    // Silently handle errors
    return prices;
  }
};
