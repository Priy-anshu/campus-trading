import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FiltersPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  showBuyOrders: boolean;
  showSellOrders: boolean;
  showCompletedOrders: boolean;
  onBuyOrdersChange: (checked: boolean) => void;
  onSellOrdersChange: (checked: boolean) => void;
  onCompletedOrdersChange: (checked: boolean) => void;
}

const FiltersPanel = ({
  searchQuery,
  onSearchChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  showBuyOrders,
  showSellOrders,
  showCompletedOrders,
  onBuyOrdersChange,
  onSellOrdersChange,
  onCompletedOrdersChange,
}: FiltersPanelProps) => {
  return (
    <Card className="p-6 h-fit sticky top-4">
      <h2 className="text-lg font-semibold mb-6">Filters</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <Label htmlFor="search" className="mb-2 block">Search Stock</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Search by stock name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-6">
        <Label className="mb-2 block">Date Range</Label>
        <div className="space-y-3">
          <div>
            <Label htmlFor="from-date" className="text-xs text-muted-foreground mb-1 block">From</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="to-date" className="text-xs text-muted-foreground mb-1 block">To</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Order Type Filters */}
      <div className="space-y-4">
        <Label className="block">Order Type</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="buy-orders"
              checked={showBuyOrders}
              onCheckedChange={(checked) => onBuyOrdersChange(checked as boolean)}
            />
            <Label
              htmlFor="buy-orders"
              className="text-sm font-normal cursor-pointer"
            >
              Buy Orders
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sell-orders"
              checked={showSellOrders}
              onCheckedChange={(checked) => onSellOrdersChange(checked as boolean)}
            />
            <Label
              htmlFor="sell-orders"
              className="text-sm font-normal cursor-pointer"
            >
              Sell Orders
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed-orders"
              checked={showCompletedOrders}
              onCheckedChange={(checked) => onCompletedOrdersChange(checked as boolean)}
            />
            <Label
              htmlFor="completed-orders"
              className="text-sm font-normal cursor-pointer"
            >
              Completed Orders
            </Label>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FiltersPanel;
