import { useEffect, useState } from "react";
import { Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, apiClient } from "@/api/config";
import { formatCurrency, formatPercent } from "@/utils/formatCurrency";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface InvestmentData {
  currentValue: number;
  investedValue: number;
  oneDayReturn: number;
  oneDayReturnPercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  walletBalance: number;
}

const InvestmentSummary = () => {
  const [data, setData] = useState<InvestmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [priceCache, setPriceCache] = useState<Record<string, number>>({});
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  const toNumber = (v: any) => {
    const s = String(v ?? '').replace(/,/g, '').trim();
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const fetchInvestments = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt_token");
      const { data } = await apiClient.get(ENDPOINTS.portfolio, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const holdings: any[] = Array.isArray(data?.holdings) ? data.holdings : [];
      let totalInvestedValue = 0;
      let totalCurrentValue = 0;

      // First, calculate invested value and show it immediately
      for (const holding of holdings) {
        const quantity = toNumber(holding.quantity);
        const avgPrice = toNumber(holding.avgPrice);
        const investedValue = quantity * avgPrice;
        totalInvestedValue += investedValue;
      }

      // Set initial data with invested value (no delay)
      setData({
        currentValue: totalInvestedValue, // Start with invested value
        investedValue: totalInvestedValue,
        oneDayReturn: toNumber(data?.oneDayReturn || 0),
        oneDayReturnPercent: totalInvestedValue > 0 ? (toNumber(data?.oneDayReturn || 0) / totalInvestedValue) * 100 : 0,
        totalReturn: 0, // Will update when prices are fetched
        totalReturnPercent: 0,
        walletBalance: toNumber(data?.walletBalance || 0),
      });

      // Then fetch current prices in parallel for better performance
      setIsUpdatingPrices(true);
      const pricePromises = holdings.map(async (holding) => {
        const symbol = holding.symbol;
        
        // Check cache first (valid for 15 seconds)
        const cacheKey = `${symbol}_${Date.now()}`;
        const cachedPrice = priceCache[symbol];
        const cacheTime = localStorage.getItem(`price_${symbol}_time`);
        const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < 15000; // 15 seconds

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
          
          return { symbol, price: toNumber(currentPrice) };
        } catch (err) {
          // Use cached price or fallback to invested value
          return { symbol, price: cachedPrice || toNumber(holding.avgPrice) };
        }
      });

      // Wait for all price fetches to complete
      const priceResults = await Promise.all(pricePromises);
      
      // Calculate final current value with fetched prices
      totalCurrentValue = 0;
      for (const holding of holdings) {
        const quantity = toNumber(holding.quantity);
        const priceResult = priceResults.find(p => p.symbol === holding.symbol);
        const currentPrice = priceResult?.price || toNumber(holding.avgPrice);
        totalCurrentValue += quantity * currentPrice;
      }

      const totalReturn = totalCurrentValue - totalInvestedValue;
      const totalReturnPercent = totalInvestedValue > 0 ? (totalReturn / totalInvestedValue) * 100 : 0;

      // Update with final calculated values
      setData({
        currentValue: totalCurrentValue,
        investedValue: totalInvestedValue,
        oneDayReturn: toNumber(data?.oneDayReturn || 0),
        oneDayReturnPercent: totalInvestedValue > 0 ? (toNumber(data?.oneDayReturn || 0) / totalInvestedValue) * 100 : 0,
        totalReturn: totalReturn,
        totalReturnPercent: totalReturnPercent,
        walletBalance: toNumber(data?.walletBalance || 0),
      });
      setIsUpdatingPrices(false);
    } catch (err) {
      setError(true);
      setIsUpdatingPrices(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchInvestments(true);
  };

  useEffect(() => {
    fetchInvestments();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchInvestments(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Failed to load investment summary" />;
  if (!data) return null;

  const isOneDayPositive = data.oneDayReturn >= 0;
  const isTotalPositive = data.totalReturn >= 0;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Portfolio</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isUpdatingPrices}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isRefreshing || isUpdatingPrices) ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : isUpdatingPrices ? 'Updating prices...' : 'Refresh'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowValues(!showValues)}
              className="h-8 w-8"
            >
              {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold text-foreground">
            {showValues ? formatCurrency(data.walletBalance) : '••••••'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-card/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">1D Returns</p>
            <div className={`flex items-center gap-2 ${isOneDayPositive ? 'text-success' : 'text-destructive'}`}>
              {isOneDayPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <div>
                <p className="font-bold">
                  {showValues ? formatCurrency(data.oneDayReturn) : '••••'}
                </p>
                <p className="text-xs font-medium">
                  {showValues ? formatPercent(data.oneDayReturnPercent) : '••'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-card/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Returns</p>
            <div className={`flex items-center gap-2 ${isTotalPositive ? 'text-success' : 'text-destructive'}`}>
              {isTotalPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <div>
                <p className="font-bold">
                  {showValues ? formatCurrency(data.totalReturn) : '••••'}
                </p>
                <p className="text-xs font-medium">
                  {showValues ? formatPercent(data.totalReturnPercent) : '••'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Value</span>
            <span className="font-semibold text-foreground">
              {showValues ? formatCurrency(data.currentValue) : '••••••'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Invested Amount</span>
            <span className="font-semibold text-foreground">
              {showValues ? formatCurrency(data.investedValue) : '••••••'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentSummary;
