import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";
import ErrorCard from "@/components/Dashboard/ErrorCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiStock {
  symbol: string;
  lastPrice?: number;
  pChange?: number;
}

interface Watchlist {
  id: string;
  name: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlists: Watchlist[];
  onAddStock: (watchlistId: string, stock: any) => void;
  selectedWatchlistId?: string;
}

const AddStockModal = ({
  isOpen,
  onClose,
  watchlists,
  onAddStock,
  selectedWatchlistId,
}: AddStockModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWatchlist, setSelectedWatchlist] = useState(selectedWatchlistId || "");
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [results, setResults] = useState<ApiStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        setErr(null);
        const { data } = await apiClient.get(ENDPOINTS.stockSearch, { params: { symbol: searchQuery } });
        setResults(data || []);
      } catch (e: any) {
        setErr("Stock data is temporarily unavailable. Please wait for one minute and try again.");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAdd = () => {
    if (selectedStock && selectedWatchlist) {
      onAddStock(selectedWatchlist, selectedStock);
      setSearchQuery("");
      setSelectedStock(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Stock to Watchlist</DialogTitle>
          <DialogDescription>
            Search for a stock and select a watchlist to add it to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {err && <ErrorCard message={err} />}
          {searchQuery && !err && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              {loading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Searching…</p>
              ) : results.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No stocks found
                </p>
              ) : (
                results.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedStock({
                        symbol: stock.symbol,
                        companyName: stock.symbol,
                        price: stock.lastPrice || 0,
                        percentChange: stock.pChange || 0,
                      });
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center justify-between border-b border-border p-3 transition-colors hover:bg-muted last:border-0"
                  >
                    <div className="text-left">
                      <p className="font-medium text-foreground">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      ₹{(stock.lastPrice || 0).toFixed(2)}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Stock */}
          {selectedStock && (
            <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3">
              <div>
                <p className="font-medium text-foreground">{selectedStock.companyName}</p>
                <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Watchlist Selection */}
          <Select value={selectedWatchlist} onValueChange={setSelectedWatchlist}>
            <SelectTrigger>
              <SelectValue placeholder="Select watchlist" />
            </SelectTrigger>
            <SelectContent>
              {watchlists.map((watchlist) => (
                <SelectItem key={watchlist.id} value={watchlist.id}>
                  {watchlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedStock || !selectedWatchlist}
              className="flex-1"
            >
              Add to Watchlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockModal;
