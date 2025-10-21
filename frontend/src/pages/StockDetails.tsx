import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import StockOverview from "@/components/Stock/StockOverview";
import StockChart from "@/components/Stock/StockChart";
import TradePanel from "@/components/Stock/TradePanel";
import Loader from "@/components/Dashboard/Loader";
import ErrorCard from "@/components/Dashboard/ErrorCard";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, apiClient } from "@/api/config";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

// Removed mock data; the page will render only server data.

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(/,/g, "").trim();
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? 0 : num;
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorCard message={error || "Stock not found"} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button and Refresh */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
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
