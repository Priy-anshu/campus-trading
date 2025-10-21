import { Card } from "@/components/ui/card";
import HoldingsRow from "./HoldingsRow";

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
          {holdings.map((holding) => (
            <HoldingsRow key={holding.id} holding={holding} />
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default HoldingsTable;
