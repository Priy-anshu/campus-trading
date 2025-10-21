import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import HoldingsSummaryCard from "./HoldingsSummaryCard";
import HoldingsTable from "./HoldingsTable";
import Loader from "../Dashboard/Loader";
import ErrorCard from "../Dashboard/ErrorCard";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, apiClient } from "@/api/config";

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
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceCache, setPriceCache] = useState<Record<string, number>>({});

  const fetchPortfolio = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
        const token = localStorage.getItem("token");
        const { data } = await apiClient.get(ENDPOINTS.portfolio, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        const holdings = data?.holdings || [];
        const holdingsWithPrices: HoldingRow[] = [];
        
        // First, create holdings with invested values (immediate display)
        for (const holding of holdings) {
          const quantity = Number(holding.quantity || 0);
          const avgPrice = Number(holding.avgPrice || 0);
          const investedValue = quantity * avgPrice;
          
          holdingsWithPrices.push({
            id: String(holding._id || holding.symbol || Math.random()),
            company: holding.symbol || "—",
            shares: quantity,
            avgPrice: avgPrice,
            marketPrice: avgPrice, // Start with avg price
            dayChangePercent: 0,
            investedValue: investedValue,
            currentValue: investedValue, // Start with invested value
            profitLoss: 0,
            profitLossPercent: 0,
          });
        }
        
        // Set initial data immediately
        setHoldings(holdingsWithPrices);
        
        // Then fetch current prices in parallel
        const pricePromises = holdings.map(async (holding) => {
          const symbol = holding.symbol;
          
          // Check cache first (valid for 30 seconds)
          const cachedPrice = priceCache[symbol];
          const cacheTime = localStorage.getItem(`price_${symbol}_time`);
          const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < 30000;
          
          if (cachedPrice && isCacheValid) {
            return { symbol, price: cachedPrice };
          }
          
          try {
            const { data: stockData } = await apiClient.get(ENDPOINTS.stockSearch, { 
              params: { symbol } 
            });
            const currentPrice = stockData?.[0]?.lastPrice || stockData?.[0]?.price || 0;
            
            // Cache the price
            setPriceCache(prev => ({ ...prev, [symbol]: currentPrice }));
            localStorage.setItem(`price_${symbol}_time`, Date.now().toString());
            
            return { symbol, price: Number(currentPrice) };
          } catch (err) {
            return { symbol, price: Number(holding.avgPrice || 0) };
          }
        });
        
        // Wait for all price fetches to complete
        const priceResults = await Promise.all(pricePromises);
        
        // Update holdings with current prices
        const updatedHoldings = holdingsWithPrices.map(holding => {
          const priceResult = priceResults.find(p => p.symbol === holding.company);
          const currentPrice = priceResult?.price || holding.avgPrice;
          const currentValue = holding.shares * currentPrice;
          const profitLoss = currentValue - holding.investedValue;
          const profitLossPercent = holding.investedValue > 0 ? (profitLoss / holding.investedValue) * 100 : 0;
          
          return {
            ...holding,
            marketPrice: currentPrice,
            currentValue: currentValue,
            profitLoss: profitLoss,
            profitLossPercent: profitLossPercent,
          };
        });
        
        setHoldings(updatedHoldings);
        
        // Calculate summary with updated holdings
        const totalInvestedValue = updatedHoldings.reduce((sum, h) => sum + h.investedValue, 0);
        const totalCurrentValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvestedValue;
        const totalProfitLossPercent = totalInvestedValue > 0 ? (totalProfitLoss / totalInvestedValue) * 100 : 0;
        
        const summaryData = {
          currentValue: totalCurrentValue,
          investedValue: totalInvestedValue,
          totalReturn: totalProfitLoss,
          totalReturnPercent: totalProfitLossPercent,
          oneDayReturn: 0, // We don't have 1D data
          oneDayReturnPercent: 0,
        };
        
        setSummary(summaryData);
      } catch (e) {
        setError("Failed to load portfolio");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Holdings</h1>
          <span className="text-sm text-muted-foreground">({holdings.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPortfolio(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showValues ? "Hide" : "Show"} Values
          </button>
        </div>
      </div>

      {/* Summary Cards - API integration point */}
      {/* TODO: Replace with API call to /user/holdings/summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HoldingsSummaryCard
          title="Current Value"
          value={showValues ? `₹${Number(summary?.currentValue || 0).toLocaleString()}` : "••••••"}
        />
        <HoldingsSummaryCard
          title="Invested Value"
          value={showValues ? `₹${Number(summary?.investedValue || 0).toLocaleString()}` : "••••••"}
        />
        <HoldingsSummaryCard
          title="1D Returns"
          value={showValues ? `₹${Number(summary?.oneDayReturn || 0).toLocaleString()}` : "••••••"}
          change={
            showValues && summary
              ? {
                  amount: `₹${Number(summary.oneDayReturn || 0).toFixed(2)}`,
                  percent: `${Number(summary.oneDayReturnPercent || 0).toFixed(2)}%`,
                  isPositive: Number(summary.oneDayReturn || 0) >= 0,
                }
              : undefined
          }
        />
        <HoldingsSummaryCard
          title="Total Returns"
          value={showValues ? `₹${Number(summary?.totalReturn || 0).toLocaleString()}` : "••••••"}
          change={
            showValues && summary
              ? {
                  amount: `₹${Number(summary.totalReturn || 0).toFixed(2)}`,
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
