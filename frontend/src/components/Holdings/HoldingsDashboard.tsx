import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import HoldingsSummaryCard from "./HoldingsSummaryCard";
import HoldingsTable from "./HoldingsTable";
import Loader from "../Dashboard/Loader";
import ErrorCard from "../Dashboard/ErrorCard";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/usePortfolio";
import { fetchMultipleStockPrices, StockPrice } from "@/services/stockService";

// type HoldingRow = {
//   id: string;
//   company: string;
//   shares: number;
//   avgPrice: number;
//   marketPrice: number;
//   dayChangePercent?: number;
//   profitLoss?: number;
//   profitLossPercent?: number;
//   investedValue?: number;
//   currentValue?: number;
// };


type HoldingRow = {
  id: string;
  company: string;
  shares: number;
  avgPrice: number;
  marketPrice: number;
  dayChangePercent: number;
  profitLoss: number;
  profitLossPercent: number;
  investedValue: number;
  currentValue: number;
};

const HoldingsDashboard = () => {
  const [showValues, setShowValues] = useState(true);
  const { portfolioData, loading, error, refreshPortfolio } = usePortfolio();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPortfolio();
    // Also refresh stock prices
    if (portfolioData?.holdings) {
      await fetchStockPrices(portfolioData.holdings);
    }
    setIsRefreshing(false);
  };

  const fetchStockPrices = async (holdings: any[]) => {
    if (holdings.length === 0) return;
    
    setPricesLoading(true);
    try {
      const symbols = holdings.map(h => h.symbol || h.company).filter(Boolean);
      const prices = await fetchMultipleStockPrices(symbols);
      setStockPrices(prices);
    } catch (error) {
      // Silently handle errors
    } finally {
      setPricesLoading(false);
    }
  };

  // Fetch stock prices when portfolio data changes
  useEffect(() => {
    if (portfolioData?.holdings) {
      fetchStockPrices(portfolioData.holdings);
    }
  }, [portfolioData]);

  // Set up periodic refresh for stock prices every 15 seconds
  useEffect(() => {
    if (portfolioData?.holdings && portfolioData.holdings.length > 0) {
      const interval = setInterval(() => {
        fetchStockPrices(portfolioData.holdings);
      }, 15000); // 15 seconds

      return () => clearInterval(interval);
    }
  }, [portfolioData]);

  if (loading) return <Loader />;
  if (error) return <ErrorCard message={error} />;

  // Transform portfolio data to match expected format
  const holdings = (portfolioData?.holdings || []).map((holding: any, index: number) => {
    const shares = Number(holding.quantity || holding.shares || 0);
    const avgPrice = Number(holding.avgPrice || 0);
    const symbol = holding.symbol || holding.company || 'Unknown';
    
    // Get real-time market price from stock cache
    const stockPrice = stockPrices[symbol];
    const marketPrice = stockPrice ? stockPrice.price : Number(holding.currentPrice || holding.marketPrice || holding.avgPrice || 0);
    
    const investedValue = shares * avgPrice;
    const currentValue = shares * marketPrice;
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;
    
    // Calculate 1-day return percentage based on stock's day change applied to invested value
    const stockDayChangePercent = stockPrice ? stockPrice.changePercent : 0;
    const dayChangePercent = stockDayChangePercent;

    return {
      id: holding._id || holding.id || `holding-${index}`,
      company: symbol,
      shares: shares,
      avgPrice: avgPrice,
      marketPrice: marketPrice,
      dayChangePercent: dayChangePercent,
      profitLoss: profitLoss,
      profitLossPercent: profitLossPercent,
      investedValue: investedValue,
      currentValue: currentValue,
    };
  });

  // Calculate summary from holdings
  const totalInvestedValue = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalReturn = totalCurrentValue - totalInvestedValue;
  const totalReturnPercent = totalInvestedValue > 0 ? (totalReturn / totalInvestedValue) * 100 : 0;

  const summary = {
    currentValue: totalCurrentValue,
    investedValue: totalInvestedValue,
    totalReturn: totalReturn,
    totalReturnPercent: totalReturnPercent,
    oneDayReturn: 0, // We don't have 1D data
    oneDayReturnPercent: 0,
  };

  // If no portfolio data, show empty state
  if (!portfolioData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Holdings</h1>
            <span className="text-sm text-muted-foreground">(0)</span>
          </div>
        </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <HoldingsSummaryCard title="Current Value" value="₹0.00" />
              <HoldingsSummaryCard title="Invested Value" value="₹0.00" />
              <HoldingsSummaryCard title="Total Returns" value="₹0.00" />
            </div>
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">No holdings yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your investments will appear here once you make your first purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Holdings</h1>
          <span className="text-sm text-muted-foreground">({holdings.length})</span>
          {pricesLoading && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Updating prices...</span>
              <span className="sm:hidden">Updating...</span>
            </div>
          )}
        </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || pricesLoading}
                className="gap-2 text-xs sm:text-sm hidden sm:flex"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing || pricesLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing || pricesLoading ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">{isRefreshing || pricesLoading ? '...' : '↻'}</span>
              </Button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {showValues ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">{showValues ? "Hide" : "Show"} Values</span>
            <span className="sm:hidden">{showValues ? "Hide" : "Show"}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - API integration point */}
      {/* TODO: Replace with API call to /user/holdings/summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HoldingsSummaryCard
          title="Current Value"
          value={showValues ? `₹${Number(summary?.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "••••••"}
        />
        <HoldingsSummaryCard
          title="Invested Value"
          value={showValues ? `₹${Number(summary?.investedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "••••••"}
        />
        <HoldingsSummaryCard
          title="1D Returns"
          value={showValues ? `₹${Number(portfolioData?.oneDayReturn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "••••••"}
          change={
            showValues && portfolioData && summary?.investedValue > 0
              ? {
                  amount: `₹${Number(portfolioData.oneDayReturn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                  percent: `${((Number(portfolioData.oneDayReturn || 0) / summary.investedValue) * 100).toFixed(2)}%`,
                  isPositive: Number(portfolioData.oneDayReturn || 0) >= 0,
                }
              : undefined
          }
        />
        <HoldingsSummaryCard
          title="Total Returns"
          value={showValues ? `₹${Number(summary?.totalReturn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "••••••"}
          change={
            showValues && summary
              ? {
                  amount: `₹${Number(summary.totalReturn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                  percent: `${Number(summary.totalReturnPercent || 0).toFixed(2)}%`,
                  isPositive: Number(summary.totalReturn || 0) >= 0,
                }
              : undefined
          }
        />
      </div>

      {/* Holdings Table */}
      <HoldingsTable holdings={showValues ? holdings : []} />
    </div>
  );
};

export default HoldingsDashboard;
