import { useState, useEffect } from "react";
import { ENDPOINTS, apiClient } from "@/api/config";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatCurrency";

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
}

const TradePanel = ({ symbol, currentPrice }: TradePanelProps) => {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("delivery");
  const [priceType, setPriceType] = useState("market");
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const { toast } = useToast();

  const calculateTotal = () => {
    const price = priceType === "market" ? currentPrice : limitPrice;
    return (price * quantity).toFixed(2);
  };

  // Fetch portfolio data to get wallet balance and available quantity
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const { data } = await apiClient.get(ENDPOINTS.portfolio);
        setWalletBalance(data.walletBalance || 0);
        
        // Find available quantity for this symbol
        const holding = data.holdings?.find((h: any) => h.symbol === symbol);
        setAvailableQuantity(holding?.quantity || 0);
      } catch (err) {
        // Silently handle errors
      }
    };
    
    fetchPortfolioData();
  }, [symbol]);

  const handleBuy = async () => {
    try {
      setIsSubmitting(true);
      const effectivePrice = priceType === "market" ? currentPrice : limitPrice;
      
      if (!effectivePrice || effectivePrice <= 0) {
        toast({ title: "Invalid Price", description: "Please check the stock price and try again" });
        return;
      }
      
      await apiClient.post(ENDPOINTS.buy, {
        symbol,
        quantity,
        price: effectivePrice,
        orderCategory: orderType
      });
      toast({ title: "Order placed", description: `Bought ${quantity} ${symbol}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Order failed";
      toast({ title: "Order failed", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSell = async () => {
    try {
      setIsSubmitting(true);
      const effectivePrice = priceType === "market" ? currentPrice : limitPrice;
      
      if (!effectivePrice || effectivePrice <= 0) {
        toast({ title: "Invalid Price", description: "Please check the stock price and try again" });
        return;
      }
      
      await apiClient.post(ENDPOINTS.sell, {
        symbol,
        quantity,
        price: effectivePrice,
        orderCategory: orderType
      });
      toast({ title: "Order placed", description: `Sold ${quantity} ${symbol}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Order failed";
      toast({ title: "Order failed", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 pt-4">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <div className="flex gap-2">
              {["delivery", "intraday", "mtf"].map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className="flex-1 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <Select defaultValue="nse">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nse">NSE</SelectItem>
                  <SelectItem value="bse">BSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Type</Label>
            <div className="flex gap-2">
              <Button
                variant={priceType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("market")}
                className="flex-1 text-xs"
              >
                Market
              </Button>
              <Button
                variant={priceType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("limit")}
                className="flex-1 text-xs"
              >
                Limit
              </Button>
            </div>
          </div>

          {/* Limit Price */}
          {priceType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="limitPrice" className="text-sm font-medium">
                Limit Price
              </Label>
              <Input
                id="limitPrice"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Available</span>
              <span className="font-medium">{formatCurrency(walletBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approx. Required</span>
              <span className="font-medium">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={isSubmitting}
            className="w-full bg-success text-white hover:bg-success/90"
          >
            Buy
          </Button>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 pt-4">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <div className="flex gap-2">
              {["delivery", "intraday", "mtf"].map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className="flex-1 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="sell-quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <div className="flex gap-2">
              <Input
                id="sell-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <Select defaultValue="nse">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nse">NSE</SelectItem>
                  <SelectItem value="bse">BSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Type</Label>
            <div className="flex gap-2">
              <Button
                variant={priceType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("market")}
                className="flex-1 text-xs"
              >
                Market
              </Button>
              <Button
                variant={priceType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("limit")}
                className="flex-1 text-xs"
              >
                Limit
              </Button>
            </div>
          </div>

          {/* Limit Price */}
          {priceType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="sell-limitPrice" className="text-sm font-medium">
                Limit Price
              </Label>
              <Input
                id="sell-limitPrice"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Qty</span>
              <span className="font-medium">{availableQuantity} shares</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approx. Returns</span>
              <span className="font-medium">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Sell Button */}
          <Button
            onClick={handleSell}
            disabled={isSubmitting}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sell
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradePanel;
