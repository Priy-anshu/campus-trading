import { Card } from "@/components/ui/card";
import HoldingsRow from "./HoldingsRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  // Mobile vertical cards view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {holdings.map((holding, index) => (
          <Card 
            key={holding.id || `holding-${index}`} 
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => navigate(`/stock/${holding.company}`)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{holding.company}</p>
                  <p className="text-sm text-muted-foreground">{holding.shares} shares @ ₹{holding.avgPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₹{holding.marketPrice.toFixed(2)}</p>
                  <p className={`text-sm ${holding.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Invested</p>
                  <p className="text-sm font-medium">₹{holding.investedValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-sm font-medium">₹{holding.currentValue.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profitLoss >= 0 ? '+' : ''}₹{holding.profitLoss.toFixed(2)}
                    </p>
                    <p className={`text-xs ${holding.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
