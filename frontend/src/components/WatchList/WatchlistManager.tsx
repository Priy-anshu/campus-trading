import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, Search, X } from "lucide-react";
import { fetchStockPrice } from "@/services/stockService";
import { useNavigate } from "react-router-dom";
import { apiClient, ENDPOINTS } from "@/api/config";

interface WatchlistItem {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  addedAt: string;
}

interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistItem[];
  createdAt: string;
}

const WatchlistManager = () => {
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<string | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load watchlists from localStorage on component mount
  useEffect(() => {
    const savedWatchlists = localStorage.getItem('userWatchlists');
    if (savedWatchlists) {
      const parsedWatchlists: Watchlist[] = JSON.parse(savedWatchlists);
      setWatchlists(parsedWatchlists);
      if (parsedWatchlists.length > 0) {
        setActiveWatchlist(parsedWatchlists[0].id);
      }
    }
  }, []);

  // Load all stocks for autocomplete on component mount
  useEffect(() => {
    const loadAllStocks = async () => {
      try {
        const { data } = await apiClient.get(ENDPOINTS.allStocks);
        const stocks = Array.isArray(data) ? data : (data.data || []);
        setAllStocks(stocks);
      } catch (error) {
        // Silently handle errors
      }
    };
    loadAllStocks();
  }, []);

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userWatchlists', JSON.stringify(watchlists));
  }, [watchlists]);

  // Fetch stock prices for active watchlist
  useEffect(() => {
    if (activeWatchlist) {
      fetchStockPrices();
    }
  }, [activeWatchlist, watchlists]);

  // Auto-refresh stock prices every 15 seconds
  useEffect(() => {
    if (!activeWatchlist) return;

    const interval = setInterval(() => {
      fetchStockPrices();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [activeWatchlist, watchlists]);

  const fetchStockPrices = async () => {
    if (!activeWatchlist) return;
    
    const watchlist = watchlists.find(w => w.id === activeWatchlist);
    if (!watchlist || watchlist.stocks.length === 0) return;

    setLoading(true);
    try {
      const updatedStocks = await Promise.all(
        watchlist.stocks.map(async (stock) => {
          try {
            const stockData = await fetchStockPrice(stock.symbol);
            return {
              ...stock,
              price: stockData?.price || stock.price,
              change: stockData?.change || stock.change,
              changePercent: stockData?.changePercent || stock.changePercent,
            };
          } catch (error) {
            // Silently handle price fetch errors
            return stock; // Return original stock data if fetch fails
          }
        })
      );

      setWatchlists(prev => prev.map(w => 
        w.id === activeWatchlist 
          ? { ...w, stocks: updatedStocks }
          : w
      ));
      setLastUpdated(new Date());
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const createWatchlist = () => {
    if (!newWatchlistName.trim()) return;

    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      stocks: [],
      createdAt: new Date().toISOString(),
    };

    setWatchlists(prev => [...prev, newWatchlist]);
    setActiveWatchlist(newWatchlist.id);
    setNewWatchlistName("");
    setIsCreatingWatchlist(false);
  };

  // Autocomplete search for stocks
  const searchStocks = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    
    // Use local stocks data for instant autocomplete
    const filtered = allStocks.filter((stock: any) => {
      if (!stock || !stock.symbol) return false;
      
      // Only search by symbol since the API doesn't provide company names
      return stock.symbol.toLowerCase().includes(query.toLowerCase());
    });
    
    setSearchResults(filtered.slice(0, 8)); // Limit to 8 results for better UX
    setShowSearchResults(true);
  };

  const addStockToWatchlist = async (stockSymbol?: string) => {
    const symbol = stockSymbol || searchQuery.trim();
    if (!symbol || !activeWatchlist) return;

    setLoading(true);
    try {
      const stockData = await fetchStockPrice(symbol.toUpperCase());
      
      if (!stockData) {
        alert('Stock not found. Please check the symbol.');
        return;
      }

      const newStock: WatchlistItem = {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(), // You might want to fetch the actual company name
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        addedAt: new Date().toISOString(),
      };

      setWatchlists(prev => prev.map(w => 
        w.id === activeWatchlist 
          ? { ...w, stocks: [...w.stocks, newStock] }
          : w
      ));

      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      setIsAddingStock(false);
    } catch (error) {
      // Silently handle errors
      alert('Error adding stock to watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeStockFromWatchlist = (stockSymbol: string) => {
    if (!activeWatchlist) return;

    setWatchlists(prev => prev.map(w => 
      w.id === activeWatchlist 
        ? { ...w, stocks: w.stocks.filter(s => s.symbol !== stockSymbol) }
        : w
    ));
  };

  const deleteWatchlist = (watchlistId: string) => {
    setWatchlists(prev => prev.filter(w => w.id !== watchlistId));
    if (activeWatchlist === watchlistId) {
      const remaining = watchlists.filter(w => w.id !== watchlistId);
      setActiveWatchlist(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const currentWatchlist = watchlists.find(w => w.id === activeWatchlist);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Watchlists</CardTitle>
          <div className="flex gap-2">
            {currentWatchlist && currentWatchlist.stocks.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchStockPrices}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <Dialog open={isCreatingWatchlist} onOpenChange={setIsCreatingWatchlist}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Watchlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter watchlist name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createWatchlist} className="flex-1">
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreatingWatchlist(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Watchlist Tabs */}
        {watchlists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {watchlists.map((watchlist) => (
              <Badge
                key={watchlist.id}
                variant={activeWatchlist === watchlist.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveWatchlist(watchlist.id)}
              >
                {watchlist.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWatchlist(watchlist.id);
                  }}
                  className="ml-2 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Active Watchlist Content */}
        {currentWatchlist ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{currentWatchlist.name}</h3>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Dialog open={isAddingStock} onOpenChange={(open) => {
                setIsAddingStock(open);
                if (!open) {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Stock to {currentWatchlist.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type to search stocks (e.g., RELIANCE, TCS, HDFCBANK)..."
                        value={searchQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setSearchQuery(query);
                          setSelectedIndex(-1);
                          // Instant autocomplete as user types
                          searchStocks(query);
                        }}
                        onKeyDown={(e) => {
                          if (!showSearchResults || searchResults.length === 0) return;
                          
                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault();
                              setSelectedIndex(prev => 
                                prev < searchResults.length - 1 ? prev + 1 : 0
                              );
                              break;
                            case 'ArrowUp':
                              e.preventDefault();
                              setSelectedIndex(prev => 
                                prev > 0 ? prev - 1 : searchResults.length - 1
                              );
                              break;
                            case 'Enter':
                              e.preventDefault();
                              if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                                addStockToWatchlist(searchResults[selectedIndex].symbol);
                              }
                              break;
                            case 'Escape':
                              setShowSearchResults(false);
                              setSelectedIndex(-1);
                              break;
                          }
                        }}
                        className="pl-10"
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                            setShowSearchResults(false);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSearchResults && searchQuery && (
                      <div className="border rounded-md bg-background shadow-lg">
                        {searchResults.length > 0 ? (
                          <div className="space-y-1 p-2">
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                              Suggestions ({searchResults.length})
                            </div>
                            {searchResults.map((stock, index) => (
                              <div
                                key={stock.symbol}
                                className={`flex items-center justify-between p-2 sm:p-3 rounded cursor-pointer transition-colors ${
                                  index === selectedIndex 
                                    ? 'bg-primary/10 border border-primary/20' 
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => addStockToWatchlist(stock.symbol)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">{stock.symbol}</span>
                                    {stock.changePercent !== undefined && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                        stock.changePercent >= 0 
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                      }`}>
                                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {stock.symbol} Stock
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p className="text-sm font-medium">
                                    ₹{stock.lastPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Click to add
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No stocks found</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Try searching with different keywords
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Search Instructions */}
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">
                        💡 Start typing to see stock suggestions with real-time prices
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => addStockToWatchlist()} 
                        disabled={loading || !searchQuery.trim()} 
                        className="flex-1"
                      >
                        {loading ? "Adding..." : "Add Stock"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingStock(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stock List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading && currentWatchlist.stocks.length > 0 ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Updating prices...</p>
                </div>
              ) : currentWatchlist.stocks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stocks in this watchlist
                </p>
              ) : (
                currentWatchlist.stocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{stock.symbol}</span>
                        {stock.changePercent !== undefined && (
                          <div className={`flex items-center gap-1 text-xs ${
                            stock.changePercent >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {stock.changePercent >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </div>
                        )}
                      </div>
                      {stock.price && (
                        <p className="text-xs text-muted-foreground">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs hover:text-destructive"
                        onClick={() => removeStockFromWatchlist(stock.symbol)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Create your first watchlist to track stocks
            </p>
            <Button onClick={() => setIsCreatingWatchlist(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WatchlistManager;