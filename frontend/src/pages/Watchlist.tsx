import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, TrendingUp, TrendingDown, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { formatVolume } from '@/utils/formatVolume';
import { useIsMobile } from '@/hooks/use-mobile';

interface WatchlistStock {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  change: number;
  totalTradedVolume: number;
}

interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistStock[];
}

const WatchlistPage: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<string>('');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load watchlists from localStorage on component mount
  useEffect(() => {
    const savedWatchlists = localStorage.getItem('watchlists');
    if (savedWatchlists) {
      const parsed = JSON.parse(savedWatchlists);
      setWatchlists(parsed);
      if (parsed.length > 0) {
        setActiveWatchlist(parsed[0].id);
      }
    }
  }, []);

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    if (watchlists.length > 0) {
      localStorage.setItem('watchlists', JSON.stringify(watchlists));
    }
  }, [watchlists]);

  const createNewWatchlist = () => {
    if (!newWatchlistName.trim()) {
      alert('Please enter a watchlist name');
      return;
    }
    
    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      stocks: []
    };
    setWatchlists([...watchlists, newWatchlist]);
    setActiveWatchlist(newWatchlist.id);
    setNewWatchlistName('');
    setShowCreateForm(false);
  };

  const deleteWatchlist = (watchlistId: string) => {
    const updated = watchlists.filter(w => w.id !== watchlistId);
    setWatchlists(updated);
    if (activeWatchlist === watchlistId && updated.length > 0) {
      setActiveWatchlist(updated[0].id);
    } else if (updated.length === 0) {
      setActiveWatchlist('');
    }
  };

  const removeStockFromWatchlist = (watchlistId: string, stockSymbol: string) => {
    setWatchlists(prev => prev.map(watchlist => 
      watchlist.id === watchlistId 
        ? { ...watchlist, stocks: watchlist.stocks.filter(stock => stock.symbol !== stockSymbol) }
        : watchlist
    ));
  };

  const getCurrentWatchlist = () => {
    return watchlists.find(w => w.id === activeWatchlist);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) {
      return '0.00';
    }
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const getChangeColor = (change: number | undefined) => {
    if (change === undefined || change === null) {
      return 'text-gray-600';
    }
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number | undefined) => {
    if (change === undefined || change === null) {
      return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const handleStockClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
        <div className="container mx-auto px-4 py-8 pb-bottom-nav">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Watchlists</h1>
        </div>

      {/* Watchlist Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {watchlists.map((watchlist) => (
            <Button
              key={watchlist.id}
              variant={activeWatchlist === watchlist.id ? "default" : "outline"}
              onClick={() => setActiveWatchlist(watchlist.id)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {watchlist.name}
              <Badge variant="secondary" className="ml-1">
                {watchlist.stocks.length}
              </Badge>
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Watchlist
          </Button>
        </div>
        
        {/* Create Watchlist Form */}
        {showCreateForm && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-4">
              <div>
                <Label htmlFor="watchlist-name">Watchlist Name</Label>
                <Input
                  id="watchlist-name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="Enter watchlist name..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createNewWatchlist} disabled={!newWatchlistName.trim()}>
                  Create Watchlist
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setNewWatchlistName('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Watchlist Content */}
      {activeWatchlist && getCurrentWatchlist() ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {getCurrentWatchlist()?.name}
              <Badge variant="outline">
                {getCurrentWatchlist()?.stocks.length} stocks
              </Badge>
            </CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteWatchlist(activeWatchlist)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {getCurrentWatchlist()?.stocks.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No stocks in this watchlist</h3>
                <p className="text-muted-foreground mb-4">
                  Add stocks to this watchlist by visiting their stock pages
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Browse Stocks
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getCurrentWatchlist()?.stocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className={`${isMobile ? 'p-4' : 'flex items-center justify-between p-4'} border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors`}
                    onClick={() => handleStockClick(stock.symbol)}
                  >
                    {isMobile ? (
                      // Mobile vertical layout
                      <div className="space-y-3">
                        {/* Stock name at top */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                            <Badge variant="outline" className="text-xs">
                              {formatVolume(stock.totalTradedVolume)} vol
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStockFromWatchlist(activeWatchlist, stock.symbol);
                            }}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Price in middle */}
                        <div className="text-center">
                          <div className="text-xl font-bold">
                            {formatPrice(stock.lastPrice)}
                          </div>
                        </div>
                        
                        {/* Change at bottom */}
                        <div className={`flex items-center justify-center gap-1 ${getChangeColor(stock.changePercent)}`}>
                          {getChangeIcon(stock.changePercent)}
                          <span className="text-sm font-medium">
                            {formatChange(stock.change)} ({formatChange(stock.changePercent)}%)
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Desktop horizontal layout
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                            <Badge variant="outline">
                              {formatVolume(stock.totalTradedVolume)} volume
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {formatPrice(stock.lastPrice)}
                            </div>
                            <div className={`flex items-center gap-1 ${getChangeColor(stock.changePercent)}`}>
                              {getChangeIcon(stock.changePercent)}
                              <span className="text-sm">
                                {formatChange(stock.change)} ({formatChange(stock.changePercent)}%)
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStockFromWatchlist(activeWatchlist, stock.symbol);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No watchlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first watchlist to start tracking stocks
            </p>
            <Button onClick={createNewWatchlist}>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default WatchlistPage;
