import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ENDPOINTS, apiClient } from "@/api/config";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface TradedStock {
  symbol: string;
  companyName: string;
  logoUrl: string;
  price: number;
  changePercent: number;
}

const MostTraded = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<TradedStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const toNumber = (val: any) => {
      const s = String(val ?? '').replace(/,/g, '').trim();
      const n = parseFloat(s);
      return Number.isNaN(n) ? 0 : n;
    };

    const fetchMostTraded = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.allStocks);
        
        // Handle different response structures
        let stockData = [];
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          stockData = response.data.data;
        } else if (Array.isArray(response.data)) {
          stockData = response.data;
        } else {
          throw new Error('Invalid API response structure');
        }
        
        // Choose "most traded" by volume; map fields consistently
        const normalized = stockData.map((it: any) => ({
          symbol: it.symbol,
          companyName: it.companyName || it.name || it.symbol,
          logoUrl: "",
          price: toNumber(it.price ?? it.lastPrice ?? it.ltp),
          changePercent: toNumber(it.changePercent ?? it.pChange),
          volume: toNumber(it.totalTradedVolume ?? it.volume),
        }));
        
        const topByVolume = normalized
          .filter((s: any) => s.symbol && s.volume > 0)
          .sort((a: any, b: any) => b.volume - a.volume)
          .slice(0, 8)
          .map(({ volume, ...rest }: any) => rest);

        setStocks(topByVolume);
        setIsLoading(false);
        setError(false);
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMostTraded();

    // Auto-refresh every 1 minute (60 seconds)
    const interval = setInterval(() => {
      fetchMostTraded();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Failed to load most traded stocks" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Most Traded Stocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trading volume data available</p>
            <p className="text-sm text-muted-foreground mt-2">Stocks will appear here based on trading volume</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="p-3 sm:p-4 rounded-lg border border-border hover:shadow-md transition-all hover:scale-105 cursor-pointer bg-card"
                >
                  <div className="flex items-center justify-center mb-2 sm:mb-3">
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-foreground mb-1 text-sm sm:text-base truncate">{stock.symbol}</p>
                    <p className="text-base sm:text-lg font-bold text-foreground">
                      ₹{stock.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MostTraded;
