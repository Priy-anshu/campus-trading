import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENDPOINTS, apiClient } from "@/api/config";
import { formatVolume } from "@/utils/formatVolume";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface StockMover {
  symbol: string;
  companyName: string;
  logoUrl: string;
  price: number;
  changePercent: number;
  volume: string;
}

const TopMovers = () => {
  const navigate = useNavigate();
  const [gainers, setGainers] = useState<StockMover[]>([]);
  const [losers, setLosers] = useState<StockMover[]>([]);
  // const [volumeShockers, setVolumeShockers] = useState<StockMover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTopMovers = async () => {
      try {
        const [gainersRes, losersRes] = await Promise.all([
          apiClient.get(ENDPOINTS.gainers),
          apiClient.get(ENDPOINTS.losers),
        ]);

        const mapItem = (item: any): StockMover => ({
          symbol: item.symbol || item.tradingsymbol || item.symbolName || 'N/A',
          companyName: item.symbol || item.tradingsymbol || '—',
          logoUrl: '',
          price: Number(item.lastPrice || item.ltp || 0),
          changePercent: Number(item.changePercent || item.pChange || item.change || 0),
          volume: String(item.totalTradedVolume || item.volume || '—'),
        });

        setGainers((gainersRes.data || gainersRes || []).map(mapItem));
        setLosers((losersRes.data || losersRes || []).map(mapItem));
        // setVolumeShockers([]);
        setIsLoading(false);
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    fetchTopMovers();
  }, []);

  const renderStockList = (stocks: StockMover[]) => (
    <div className="space-y-2">
      {stocks.map((stock) => {
        const isPositive = stock.changePercent >= 0;
        return (
          <div
            key={stock.symbol}
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{stock.symbol[0]}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground">{stock.companyName}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-foreground">₹{stock.price.toLocaleString('en-IN')}</p>
              <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="ml-6 text-right">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-medium text-foreground">{formatVolume(stock.volume)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Stock data is temporarily unavailable. Please wait for one minute and try again." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Market Movers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gainers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="gainers">Gainers</TabsTrigger>
            <TabsTrigger value="losers">Losers</TabsTrigger>
            {/* <TabsTrigger value="volume">Volume Shockers</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="gainers" className="mt-6">
            {renderStockList(gainers)}
          </TabsContent>
          
          <TabsContent value="losers" className="mt-6">
            {renderStockList(losers)}
          </TabsContent>
          
          {/* <TabsContent value="volume" className="mt-6">
            {renderStockList(volumeShockers)}
          </TabsContent> */}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TopMovers;
