import { Card } from "@/components/ui/card";
import HoldingsRow from "./HoldingsRow";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface HoldingsTableProps {
  holdings: HoldingData[];
}

const HoldingsTable = ({ holdings }: HoldingsTableProps) => {
  const isMobile = useIsMobile();

  if (holdings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No holdings yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your investments will appear here once you make your first purchase
        </p>
      </Card>
    );
  }

  // Mobile horizontal scroll view
  if (isMobile) {
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {holdings.map((holding, index) => (
              <div key={holding.id || `holding-${index}`} className="min-w-[280px] flex-shrink-0">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm">{holding.company}</p>
                        <p className="text-xs text-muted-foreground">{holding.shares} shares</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Market Price</span>
                      <span className="text-sm font-medium">₹{holding.marketPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Returns</span>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.profitLoss >= 0 ? '+' : ''}₹{holding.profitLoss.toFixed(2)}
                        </p>
                        <p className={`text-xs ${holding.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Current Value</span>
                      <span className="text-sm font-medium">₹{holding.currentValue.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Invested</span>
                      <span className="text-sm font-medium">₹{holding.investedValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Desktop table view
  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="py-3 pl-6 text-left text-sm font-medium text-muted-foreground">
              Company
            </th>
            <th className="py-3 text-left text-sm font-medium text-muted-foreground">
              Market Price
            </th>
            <th className="py-3 text-left text-sm font-medium text-muted-foreground">
              Returns
            </th>
            <th className="py-3 pr-6 text-right text-sm font-medium text-muted-foreground">
              Current / Invested
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, index) => (
            <HoldingsRow key={holding.id || `holding-${index}`} holding={holding} />
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default HoldingsTable;
