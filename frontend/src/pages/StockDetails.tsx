import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Plus, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import StockOverview from "@/components/Stock/StockOverview";
import StockChart from "@/components/Stock/StockChart";
import TradePanel from "@/components/Stock/TradePanel";
import Loader from "@/components/Dashboard/Loader";
import ErrorCard from "@/components/Dashboard/ErrorCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENDPOINTS, apiClient } from "@/api/config";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useToast } from "@/hooks/use-toast";

/**
 * StockDetails Page Component
 * 
 * A comprehensive stock details page that displays:
 * - Stock overview with current price, change, and company information
 * - Interactive price chart with historical data
 * - Trading panel for buying/selling stocks
 * - Watchlist management functionality
 * - Auto-refresh capabilities for real-time data
 * 
 * Features:
 * - Real-time stock data fetching
 * - Error handling and loading states
 * - Watchlist integration
 * - Responsive design for mobile and desktop
 * - Data refresh after successful trades
 */

const StockDetails = () => {
  // Get stock symbol from URL parameters
  const { symbol } = useParams<{ symbol: string }>();
  
  // Navigation hook for programmatic routing
  const navigate = useNavigate();
  
  // Toast notification hook for user feedback
  const { toast } = useToast();
  
  // State for stock data fetched from API
  const [stockData, setStockData] = useState<any | null>(null);
  
  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);
  
  // Error state for handling API failures
  const [error, setError] = useState<string | null>(null);
  
  // Loading state for manual refresh operations
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for user's watchlists (stored in localStorage)
  const [watchlists, setWatchlists] = useState<any[]>([]);
  
  // State for currently selected watchlist in the add-to-watchlist dialog
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
  
  // State to control watchlist dialog visibility
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);

  /**
   * Load user's watchlists from localStorage on component mount
   * Sets the first watchlist as selected by default
   */
  useEffect(() => {
    const savedWatchlists = localStorage.getItem('watchlists');
    if (savedWatchlists) {
      const parsed = JSON.parse(savedWatchlists);
      setWatchlists(parsed);
      if (parsed.length > 0) {
        setSelectedWatchlist(parsed[0].id);
      }
    }
  }, []);

  /**
   * Utility function to safely convert string/number values to numbers
   * Handles commas, whitespace, and invalid values gracefully
   * @param {any} value - The value to convert to number
   * @returns {number} The converted number or 0 if invalid
   */
  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(/,/g, "").trim();
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? 0 : num;
  };

  /**
   * Add the current stock to the selected watchlist
   * Validates that the stock isn't already in the watchlist
   * Updates localStorage and shows success/error feedback
   */
  const addToWatchlist = () => {
    if (!stockData || !selectedWatchlist) return;

    // Find the selected watchlist by ID
    const targetWatchlist = watchlists.find(w => w.id === selectedWatchlist);
    if (!targetWatchlist) return;
    
    // Check if stock is already in the watchlist to prevent duplicates
    const stockExists = targetWatchlist.stocks.some((stock: any) => stock.symbol === stockData.symbol);
    
    if (stockExists) {
      toast({
        title: "Already in watchlist",
        description: `${stockData.symbol} is already in ${targetWatchlist.name}.`,
        variant: "default",
      });
      return;
    }

    // Create stock object with normalized data for watchlist storage
    const stockToAdd = {
      symbol: stockData.symbol,
      lastPrice: toNumber(stockData.price ?? stockData.lastPrice ?? stockData.ltp),
      pChange: toNumber(stockData.changePercent ?? stockData.pChange),
      change: toNumber(stockData.change ?? stockData.netChange),
      totalTradedVolume: toNumber(stockData.totalTradedVolume ?? stockData.volume ?? 0)
    };

    // Add stock to the target watchlist
    targetWatchlist.stocks.push(stockToAdd);
    
    // Update state and persist to localStorage
    const updatedWatchlists = watchlists.map(w => 
      w.id === selectedWatchlist ? targetWatchlist : w
    );
    setWatchlists(updatedWatchlists);
    localStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
    
    // Show success notification
    toast({
      title: "Added to watchlist",
      description: `${stockData.symbol} has been added to ${targetWatchlist.name}.`,
      variant: "default",
    });
    
    // Close the watchlist dialog
    setShowWatchlistDialog(false);
  };

  /**
   * Fetch stock data from the API
   * Handles both initial load and refresh scenarios
   * @param {boolean} isRefresh - Whether this is a refresh operation (affects loading state)
   */
  const fetchStockData = async (isRefresh = false) => {
    // Set appropriate loading state based on operation type
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    // Clear any previous errors
    setError(null);
    
    try {
      // Fetch stock data from API using the symbol from URL params
      const { data } = await apiClient.get(ENDPOINTS.stockSearch, { params: { symbol } });
      const item = (data && data[0]) || null;
      
      // Validate that we received valid stock data
      if (!item) throw new Error('Not found');
      
      // Update state with fetched stock data
      setStockData(item);
    } catch (err) {
      // Set user-friendly error message for API failures
      setError("Stock data is temporarily unavailable. Please wait for one minute and try again.");
    } finally {
      // Always reset loading states
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Fetch stock data when component mounts or symbol changes
   */
  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  /**
   * Auto-refresh configuration for real-time data updates
   * Refreshes stock data every 30 seconds when data is available and no errors exist
   */
  useAutoRefresh({
    interval: 30000, // 30 seconds
    enabled: !!stockData && !error, // Only refresh when we have data and no errors
    onRefresh: () => fetchStockData(true) // Use refresh mode for auto-refresh
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8 sm:px-6 lg:px-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8 sm:px-6 lg:px-8">
          <ErrorCard message={error || "Stock not found"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8 sm:px-6 lg:px-8">
        {/* Back Button and Actions */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4 font-bold" />
          </Button>
          <div className="flex items-center gap-2">
            <Dialog open={showWatchlistDialog} onOpenChange={setShowWatchlistDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Watchlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Watchlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="watchlist-select">Select Watchlist</Label>
                    <Select value={selectedWatchlist} onValueChange={setSelectedWatchlist}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a watchlist" />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlists.map((watchlist) => (
                          <SelectItem key={watchlist.id} value={watchlist.id}>
                            {watchlist.name} ({watchlist.stocks.length} stocks)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowWatchlistDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addToWatchlist} disabled={!selectedWatchlist}>
                      Add to Watchlist
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => fetchStockData(true)}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Stock Info & Chart */}
          <div className="space-y-6 lg:col-span-2">
            <StockOverview
              name={stockData.companyName || stockData.name || stockData.symbol || symbol || '—'}
              symbol={stockData.symbol || symbol || '—'}
              exchange={stockData.exchange || 'NSE'}
              currentPrice={toNumber(stockData.price ?? stockData.lastPrice ?? stockData.ltp)}
              change={toNumber(stockData.change ?? stockData.netChange)}
              changePercent={toNumber(stockData.changePercent ?? stockData.pChange)}
            />
            {/* Chart requires real series; until we have a backend timeseries endpoint, hide chart */}
            {/* <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
              Intraday chart will appear when timeseries API is available.
            </div> */}
          </div>

          {/* Right Column - Trade Panel */}
          <div className="lg:col-span-1">
            <TradePanel
              symbol={stockData.symbol || symbol || '—'}
              currentPrice={toNumber(stockData.price ?? stockData.lastPrice ?? stockData.ltp)}
              onTradeSuccess={() => {
                // Refresh stock data and portfolio data after successful trade
                fetchStockData(true);
                // Also refresh portfolio data by triggering a page reload
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
