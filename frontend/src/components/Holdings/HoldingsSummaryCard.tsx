import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  change?: {
    amount: string;
    percent: string;
    isPositive: boolean;
  };
}

const HoldingsSummaryCard = ({ title, value, change }: SummaryCardProps) => {
  return (
    <Card className="p-6 transition-all hover:shadow-md">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change.isPositive ? "text-success" : "text-destructive"
          }`}>
            {change.isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{change.amount}</span>
            <span>({change.percent})</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HoldingsSummaryCard;
