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

// Removed mock data; the page will render only server data.

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stockData, setStockData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);

  // Load watchlists from localStorage
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

  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(/,/g, "").trim();
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? 0 : num;
  };

  const addToWatchlist = () => {
    if (!stockData || !selectedWatchlist) return;

    // Find the selected watchlist
    const targetWatchlist = watchlists.find(w => w.id === selectedWatchlist);
    if (!targetWatchlist) return;
    
    // Check if stock is already in the watchlist
    const stockExists = targetWatchlist.stocks.some((stock: any) => stock.symbol === stockData.symbol);
    
    if (stockExists) {
      toast({
        title: "Already in watchlist",
        description: `${stockData.symbol} is already in ${targetWatchlist.name}.`,
        variant: "default",
      });
      return;
    }

    // Add stock to watchlist
    const stockToAdd = {
      symbol: stockData.symbol,
      lastPrice: toNumber(stockData.price ?? stockData.lastPrice ?? stockData.ltp),
      pChange: toNumber(stockData.changePercent ?? stockData.pChange),
      change: toNumber(stockData.change ?? stockData.netChange),
      totalTradedVolume: toNumber(stockData.totalTradedVolume ?? stockData.volume ?? 0)
    };

    targetWatchlist.stocks.push(stockToAdd);
    
    // Update state and save to localStorage
    const updatedWatchlists = watchlists.map(w => 
      w.id === selectedWatchlist ? targetWatchlist : w
    );
    setWatchlists(updatedWatchlists);
    localStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
    
    toast({
      title: "Added to watchlist",
      description: `${stockData.symbol} has been added to ${targetWatchlist.name}.`,
      variant: "default",
    });
    
    setShowWatchlistDialog(false);
  };

  const fetchStockData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINTS.stockSearch, { params: { symbol } });
      const item = (data && data[0]) || null;
      if (!item) throw new Error('Not found');
      setStockData(item);
    } catch (err) {
      setError("Stock data is temporarily unavailable. Please wait for one minute and try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  // Auto refresh every 30 seconds
  useAutoRefresh({
    interval: 30000,
    enabled: !!stockData && !error,
    onRefresh: () => fetchStockData(true)
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
            <ArrowLeft className="h-4 w-4" />
            Back
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
            <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
              Intraday chart will appear when timeseries API is available.
            </div>
          </div>

          {/* Right Column - Trade Panel */}
          <div className="lg:col-span-1">
            <TradePanel
              symbol={stockData.symbol || symbol || '—'}
              currentPrice={toNumber(stockData.price ?? stockData.lastPrice ?? stockData.ltp)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
