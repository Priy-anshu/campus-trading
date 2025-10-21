import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const MarketTicker = () => {
  const [indexes, setIndexes] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchIndexes = async () => {
      try {
        // Use losers as a simple ticker proxy or use allStocks to compute simple index
        const { data } = await apiClient.get(ENDPOINTS.allStocks);
        const sample = (data || []).slice(0, 5);
        const mapped: IndexData[] = sample.map((s: any) => ({
          name: s.symbol || 'INDEX',
          value: Number(s.lastPrice || s.ltp || 0),
          change: Number(s.change || 0),
          changePercent: Number(s.pChange || 0),
        }));
        setIndexes(mapped);
        setIsLoading(false);
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    fetchIndexes();
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Stock data is temporarily unavailable. Please wait for one minute and try again." />;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {indexes.map((index) => {
          const isPositive = index.change >= 0;
          return (
            <div
              key={index.name}
              className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-sm border border-border min-w-[200px] hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{index.name}</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;
