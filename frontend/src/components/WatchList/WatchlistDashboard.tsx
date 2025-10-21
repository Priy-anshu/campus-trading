import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WatchlistCard from "./WatchlistCard";
import AddStockModal from "./AddStockModal";

interface Stock {
  symbol: string;
  companyName: string;
  price: number;
  percentChange: number;
}

interface Watchlist {
  id: string;
  name: string;
  stocks: Stock[];
}

// Mock data - will be replaced with API calls
const initialWatchlists: Watchlist[] = [
  {
    id: "1",
    name: "Tech Stocks",
    stocks: [
      { symbol: "TCS", companyName: "Tata Consultancy Services", price: 3525.75, percentChange: 0.8 },
      { symbol: "INFY", companyName: "Infosys", price: 1565.50, percentChange: 1.2 },
    ],
  },
  {
    id: "2",
    name: "Banking",
    stocks: [
      { symbol: "HDFCBANK", companyName: "HDFC Bank", price: 1485.25, percentChange: -0.5 },
      { symbol: "ICICIBANK", companyName: "ICICI Bank", price: 925.30, percentChange: 0.6 },
    ],
  },
];

const STORAGE_KEY = 'watchlists_v1';

const WatchlistDashboard = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Watchlist[] : initialWatchlists;
    } catch {
      return initialWatchlists;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
    } catch {}
  }, [watchlists]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>("");
  const { toast } = useToast();

  const MAX_WATCHLISTS = 3;

  // Create new watchlist - API integration point
  // TODO: Replace with API call to POST /user/watchlists
  const handleCreateWatchlist = () => {
    if (watchlists.length >= MAX_WATCHLISTS) {
      toast({
        title: "Maximum limit reached",
        description: `You can only create up to ${MAX_WATCHLISTS} watchlists`,
        variant: "destructive",
      });
      return;
    }

    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: `Watchlist ${watchlists.length + 1}`,
      stocks: [],
    };
    setWatchlists([...watchlists, newWatchlist]);
    toast({
      title: "Watchlist created",
      description: "Your new watchlist has been created successfully",
    });
  };

  // Rename watchlist - API integration point
  // TODO: Replace with API call to PATCH /user/watchlists/:id
  const handleRenameWatchlist = (id: string) => {
    const watchlist = watchlists.find((w) => w.id === id);
    if (!watchlist) return;

    const newName = prompt("Enter new name:", watchlist.name);
    if (newName && newName.trim()) {
      setWatchlists(
        watchlists.map((w) => (w.id === id ? { ...w, name: newName.trim() } : w))
      );
      toast({
        title: "Watchlist renamed",
        description: "Your watchlist has been renamed successfully",
      });
    }
  };

  // Delete watchlist - API integration point
  // TODO: Replace with API call to DELETE /user/watchlists/:id
  const handleDeleteWatchlist = (id: string) => {
    if (confirm("Are you sure you want to delete this watchlist?")) {
      setWatchlists(watchlists.filter((w) => w.id !== id));
      toast({
        title: "Watchlist deleted",
        description: "Your watchlist has been deleted successfully",
      });
    }
  };

  // Add stock to watchlist - API integration point
  // TODO: Replace with API call to POST /user/watchlists/:id/stocks
  const handleAddStock = (watchlistId: string, stock: Stock) => {
    const watchlist = watchlists.find((w) => w.id === watchlistId);
    if (!watchlist) return;

    // Check for duplicate
    if (watchlist.stocks.some((s) => s.symbol === stock.symbol)) {
      toast({
        title: "Duplicate stock",
        description: "This stock is already in the watchlist",
        variant: "destructive",
      });
      return;
    }

    setWatchlists(
      watchlists.map((w) =>
        w.id === watchlistId ? { ...w, stocks: [...w.stocks, stock] } : w
      )
    );
    toast({
      title: "Stock added",
      description: `${stock.companyName} has been added to your watchlist`,
    });
  };

  // Remove stock from watchlist - API integration point
  // TODO: Replace with API call to DELETE /user/watchlists/:id/stocks/:symbol
  const handleRemoveStock = (watchlistId: string, symbol: string) => {
    setWatchlists(
      watchlists.map((w) =>
        w.id === watchlistId
          ? { ...w, stocks: w.stocks.filter((s) => s.symbol !== symbol) }
          : w
      )
    );
    toast({
      title: "Stock removed",
      description: "The stock has been removed from your watchlist",
    });
  };

  const openAddModal = (watchlistId: string) => {
    setSelectedWatchlistId(watchlistId);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlists</h1>
          <p className="text-sm text-muted-foreground">
            {watchlists.length} of {MAX_WATCHLISTS} watchlists
          </p>
        </div>
        <Button
          onClick={handleCreateWatchlist}
          disabled={watchlists.length >= MAX_WATCHLISTS}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Watchlist
        </Button>
      </div>

      {/* Watchlist Grid */}
      {watchlists.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No watchlists yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first watchlist to start tracking stocks
          </p>
          <Button onClick={handleCreateWatchlist} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Watchlist
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <WatchlistCard
              key={watchlist.id}
              {...watchlist}
              onRename={handleRenameWatchlist}
              onDelete={handleDeleteWatchlist}
              onAddStock={openAddModal}
              onRemoveStock={handleRemoveStock}
            />
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        watchlists={watchlists}
        onAddStock={handleAddStock}
        selectedWatchlistId={selectedWatchlistId}
      />
    </div>
  );
};

export default WatchlistDashboard;
