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
        const { data } = await apiClient.get(ENDPOINTS.allStocks);
        // Choose "most traded" by volume; map fields consistently
        const normalized = (Array.isArray(data) ? data : []).map((it: any) => ({
          symbol: it.symbol,
          companyName: it.companyName || it.name || it.symbol,
          logoUrl: "",
          price: toNumber(it.price ?? it.lastPrice ?? it.ltp),
          changePercent: toNumber(it.changePercent ?? it.pChange),
          volume: toNumber(it.totalTradedVolume ?? it.volume),
        }));
        const topByVolume = normalized
          .filter((s: any) => s.symbol)
          .sort((a: any, b: any) => b.volume - a.volume)
          .slice(0, 8)
          .map(({ volume, ...rest }: any) => rest);

        setStocks(topByVolume);
        setIsLoading(false);
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    fetchMostTraded();
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Failed to load most traded stocks" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Traded Stocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stocks.map((stock) => {
            const isPositive = stock.changePercent >= 0;
            return (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="p-4 rounded-lg border border-border hover:shadow-md transition-all hover:scale-105 cursor-pointer bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{stock.symbol[0]}</span>
                  </div>
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
                
                <div>
                  <p className="font-semibold text-foreground mb-1">{stock.symbol}</p>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{stock.companyName}</p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{stock.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MostTraded;
