import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StockOverviewProps {
  name: string;
  symbol: string;
  exchange: string;
  currentPrice: number;
  change?: number;
  changePercent?: number;
  logoUrl?: string;
}

const StockOverview = ({
  name,
  symbol,
  exchange,
  currentPrice,
  change,
  changePercent,
  logoUrl,
}: StockOverviewProps) => {
  const safeChange = change ?? 0;
  const safeChangePercent = changePercent ?? 0;
  const isPositive = safeChange >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="h-12 w-12 rounded-lg" />
          ) : (
            <TrendingUp className="h-8 w-8 text-primary" />
          )}
        </div>

        {/* Stock Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {exchange}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{symbol}</p>

          {/* Price Info */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              ₹{currentPrice.toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {safeChange.toFixed(2)} ({isPositive ? "+" : ""}
                {safeChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StockOverview;
