import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface HoldingData {
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
}

interface HoldingsRowProps {
  holding: HoldingData;
}

const HoldingsRow = ({ holding }: HoldingsRowProps) => {
  const navigate = useNavigate();
  
  // Add safety checks for undefined values
  if (!holding) {
    return null;
  }
  
  const isDayPositive = (holding.dayChangePercent || 0) >= 0;
  const isProfitPositive = (holding.profitLoss || 0) >= 0;

  return (
    <tr 
      onClick={() => navigate(`/stock/${holding.company}`)}
      className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
    >
      <td className="py-4 pl-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-semibold text-foreground">
              {holding.company ? holding.company.substring(0, 2).toUpperCase() : '--'}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{holding.company || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {holding.shares || 0} shares · Avg ₹{(holding.avgPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div>
          <p className="font-medium text-foreground">₹{(holding.marketPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className={`flex items-center gap-1 text-sm ${
            isDayPositive ? "text-success" : "text-destructive"
          }`}>
            {isDayPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{isDayPositive ? "+" : ""}{Math.abs(holding.dayChangePercent || 0).toFixed(2)}%</span>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className={`font-medium ${
          isProfitPositive ? "text-success" : "text-destructive"
        }`}>
          <p>₹{Math.abs(holding.profitLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm">
            {isProfitPositive ? "+" : "-"}{Math.abs(holding.profitLossPercent || 0).toFixed(2)}%
          </p>
        </div>
      </td>
      <td className="py-4 pr-6">
        <div className="text-right">
          <div className="space-y-1">
            <div>
              <p className="font-medium text-foreground">₹{(holding.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">₹{(holding.investedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default HoldingsRow;
