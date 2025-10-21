import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Stock {
  symbol: string;
  companyName: string;
  price: number;
  percentChange: number;
}

interface WatchlistCardProps {
  id: string;
  name: string;
  stocks: Stock[];
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onAddStock: (id: string) => void;
  onRemoveStock: (watchlistId: string, symbol: string) => void;
}

const WatchlistCard = ({
  id,
  name,
  stocks,
  onRename,
  onDelete,
  onAddStock,
  onRemoveStock,
}: WatchlistCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-2 transition-colors hover:bg-muted">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 bg-popover">
            <DropdownMenuItem onClick={() => onRename(id)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(id)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {stocks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No stocks added yet
          </p>
        ) : (
          stocks.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{stock.companyName}</p>
                <p className="text-sm text-muted-foreground">{stock.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">₹{stock.price.toFixed(2)}</p>
                <div
                  className={`flex items-center justify-end gap-1 text-sm ${
                    stock.percentChange >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {stock.percentChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(stock.percentChange).toFixed(2)}%</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveStock(id, stock.symbol);
                }}
                className="ml-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => onAddStock(id)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Add Stock
      </button>
    </Card>
  );
};

export default WatchlistCard;
