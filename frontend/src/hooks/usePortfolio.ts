import { useState, useEffect } from 'react';
import { ENDPOINTS, apiClient } from '@/api/config';
import { useToast } from '@/hooks/use-toast';
import { addTradeNotification } from '@/components/NotificationDropdown';

/**
 * Interface defining the structure of portfolio data
 * Contains user's holdings, balance, profit metrics, and summary information
 */
interface PortfolioData {
  holdings: any[]; // Array of stock holdings with quantity, price, etc.
  walletBalance: number; // Available cash balance for trading
  // dailyProfit: number; // Commented out for future use
  totalProfit: number; // Total profit/loss across all holdings
  oneDayReturn: number; // Profit/loss for the current day
  monthlyReturn: number; // Profit/loss for the current month
  summary?: { // Optional detailed summary with calculated metrics
    currentValue: number; // Current total portfolio value
    investedValue: number; // Total amount invested
    totalReturn: number; // Absolute return amount
    totalReturnPercent: number; // Percentage return
    oneDayReturn: number; // One-day return amount
    oneDayReturnPercent: number; // One-day return percentage
  };
}

/**
 * Custom hook for managing portfolio data and trading operations
 * 
 * Features:
 * - Fetches and manages portfolio data from API
 * - Handles buy/sell stock operations
 * - Provides loading states and error handling
 * - Auto-refreshes data after successful trades
 * - Triggers page reload for data consistency
 * 
 * @returns {object} Portfolio data, loading states, and trading functions
 */
export const usePortfolio = () => {
  // State for portfolio data fetched from API
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  
  // Loading state for initial data fetch and operations
  const [loading, setLoading] = useState(true);
  
  // Error state for handling API failures
  const [error, setError] = useState<string | null>(null);
  
  // Toast notification hook for user feedback
  const { toast } = useToast();

  /**
   * Fetch portfolio data from the API
   * Handles data normalization and error fallbacks
   * Sets loading states and error handling
   */
  const fetchPortfolio = async () => {
    try {
      // Clear any previous errors
      setError(null);
      
      // Fetch portfolio data from API
      const { data } = await apiClient.get(ENDPOINTS.portfolio);
      
      // Normalize and structure the portfolio data with fallbacks
      const portfolioData = {
        holdings: data?.holdings || [], // User's stock holdings
        walletBalance: data?.walletBalance || 0, // Available cash
        // dailyProfit: data?.dailyProfit || 0, // Commented out for future use
        totalProfit: data?.totalProfit || 0, // Total profit/loss
        oneDayReturn: data?.oneDayReturn || 0, // Today's return
        monthlyReturn: data?.monthlyReturn || 0, // This month's return
        summary: data?.summary || { // Detailed summary with calculated metrics
          currentValue: 0,
          investedValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          oneDayReturn: 0,
          oneDayReturnPercent: 0,
        }
      };
      
      // Update state with fetched data
      setPortfolioData(portfolioData);
    } catch (err) {
      // Handle API errors with user-friendly messages
      setError('Failed to fetch portfolio data');
      
      // Set fallback data structure for error state
      setPortfolioData({
        holdings: [],
        walletBalance: 0,
        // dailyProfit: 0, // Commented out for future use
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
      // Always reset loading state
      setLoading(false);
    }
  };

  /**
   * Refresh portfolio data by re-fetching from API
   * Sets loading state and calls fetchPortfolio
   */
  const refreshPortfolio = async () => {
    setLoading(true);
    await fetchPortfolio();
  };

  /**
   * Execute a stock purchase order
   * Submits buy order to API, shows success/error feedback, and refreshes data
   * @param {string} symbol - Stock symbol to buy
   * @param {number} quantity - Number of shares to purchase
   * @param {number} price - Price per share
   */
  const buyStock = async (symbol: string, quantity: number, price: number) => {
    try {
      // Submit buy order to API
      await apiClient.post(ENDPOINTS.buy, {
        symbol,
        quantity,
        price
      });
      
      // Show success notification
      toast({
        title: 'Stock purchased successfully',
        description: `Bought ${quantity} shares of ${symbol} at ₹${price}`,
      });
      
      // Add trade notification
      addTradeNotification('BUY', symbol, quantity, price);
      
      // Refresh portfolio data to reflect the purchase
      await refreshPortfolio();
      
      // Trigger page reload to ensure all data is fresh and consistent
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      // Handle and display purchase errors
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.response?.data?.message || 'Failed to purchase stock',
      });
      throw error;
    }
  };

  /**
   * Execute a stock sell order
   * Submits sell order to API, shows success/error feedback, and refreshes data
   * @param {string} symbol - Stock symbol to sell
   * @param {number} quantity - Number of shares to sell
   * @param {number} price - Price per share
   */
  const sellStock = async (symbol: string, quantity: number, price: number) => {
    try {
      // Submit sell order to API
      await apiClient.post(ENDPOINTS.sell, {
        symbol,
        quantity,
        price
      });
      
      // Show success notification
      toast({
        title: 'Stock sold successfully',
        description: `Sold ${quantity} shares of ${symbol} at ₹${price}`,
      });
      
      // Add trade notification
      addTradeNotification('SELL', symbol, quantity, price);
      
      // Refresh portfolio data to reflect the sale
      await refreshPortfolio();
      
      // Trigger page reload to ensure all data is fresh and consistent
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      // Handle and display sale errors
      toast({
        variant: 'destructive',
        title: 'Sale failed',
        description: error.response?.data?.message || 'Failed to sell stock',
      });
      throw error;
    }
  };

  /**
   * Fetch portfolio data when component mounts
   */
  useEffect(() => {
    fetchPortfolio();
  }, []);

  /**
   * Return portfolio data, loading states, and trading functions
   */
  return {
    portfolioData, // Current portfolio data or null
    loading, // Loading state for operations
    error, // Error message if any
    refreshPortfolio, // Function to manually refresh data
    buyStock, // Function to buy stocks
    sellStock // Function to sell stocks
  };
};
