import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ENDPOINTS, apiClient } from '@/api/config';

interface StockData {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  change: number;
  totalTradedVolume: number;
}

interface StockDataContextType {
  stockData: StockData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getStockBySymbol: (symbol: string) => StockData | undefined;
}

const StockDataContext = createContext<StockDataContextType | undefined>(undefined);

export const useStockData = () => {
  const context = useContext(StockDataContext);
  if (!context) {
    throw new Error('useStockData must be used within a StockDataProvider');
  }
  return context;
};

interface StockDataProviderProps {
  children: ReactNode;
}

export const StockDataProvider = ({ children }: StockDataProviderProps) => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async () => {
    try {
      setError(null);
      const { data } = await apiClient.get(ENDPOINTS.allStocks);
      setStockData(data || []);
    } catch (err) {
      // Silently handle errors
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchStockData();
  };

  const getStockBySymbol = (symbol: string): StockData | undefined => {
    return stockData.find(stock => 
      stock.symbol.toLowerCase() === symbol.toLowerCase()
    );
  };

  useEffect(() => {
    fetchStockData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStockData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value: StockDataContextType = {
    stockData,
    loading,
    error,
    refreshData,
    getStockBySymbol
  };

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  );
};
