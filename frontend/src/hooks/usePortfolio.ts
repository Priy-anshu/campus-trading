import { useState, useEffect } from 'react';
import { ENDPOINTS, apiClient } from '@/api/config';
import { useToast } from '@/hooks/use-toast';

interface PortfolioData {
  holdings: any[];
  walletBalance: number;
  dailyProfit: number;
  totalProfit: number;
  oneDayReturn: number;
  monthlyReturn: number;
  summary?: {
    currentValue: number;
    investedValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    oneDayReturn: number;
    oneDayReturnPercent: number;
  };
}

export const usePortfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPortfolio = async () => {
    try {
      setError(null);
      const { data } = await apiClient.get(ENDPOINTS.portfolio);
      
      // Ensure we have a proper data structure
      const portfolioData = {
        holdings: data?.holdings || [],
        walletBalance: data?.walletBalance || 0,
        dailyProfit: data?.dailyProfit || 0,
        totalProfit: data?.totalProfit || 0,
        oneDayReturn: data?.oneDayReturn || 0,
        monthlyReturn: data?.monthlyReturn || 0,
        summary: data?.summary || {
          currentValue: 0,
          investedValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          oneDayReturn: 0,
          oneDayReturnPercent: 0,
        }
      };
      
      setPortfolioData(portfolioData);
    } catch (err) {
      // Silently handle errors
      setError('Failed to fetch portfolio data');
      // Set empty data on error
      setPortfolioData({
        holdings: [],
        walletBalance: 0,
        dailyProfit: 0,
        totalProfit: 0,
        oneDayReturn: 0,
        monthlyReturn: 0,
        summary: {
          currentValue: 0,
          investedValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          oneDayReturn: 0,
          oneDayReturnPercent: 0,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    setLoading(true);
    await fetchPortfolio();
  };

  const buyStock = async (symbol: string, quantity: number, price: number) => {
    try {
      await apiClient.post(ENDPOINTS.buy, {
        symbol,
        quantity,
        price
      });
      
      toast({
        title: 'Stock purchased successfully',
        description: `Bought ${quantity} shares of ${symbol} at ₹${price}`,
      });
      
      // Refresh portfolio data
      await refreshPortfolio();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.response?.data?.message || 'Failed to purchase stock',
      });
      throw error;
    }
  };

  const sellStock = async (symbol: string, quantity: number, price: number) => {
    try {
      await apiClient.post(ENDPOINTS.sell, {
        symbol,
        quantity,
        price
      });
      
      toast({
        title: 'Stock sold successfully',
        description: `Sold ${quantity} shares of ${symbol} at ₹${price}`,
      });
      
      // Refresh portfolio data
      await refreshPortfolio();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sale failed',
        description: error.response?.data?.message || 'Failed to sell stock',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return {
    portfolioData,
    loading,
    error,
    refreshPortfolio,
    buyStock,
    sellStock
  };
};
